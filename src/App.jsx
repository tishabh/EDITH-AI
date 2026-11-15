import React, { useState, useEffect, useRef } from 'react';
import LiquidBackground from './components/LiquidBackground';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import AdminPanel from './components/AdminPanel';
import AuthModal from './components/AuthModal';
import UserSettingsModal from './components/UserSettingsModal';

import { 
  getCurrentUser, 
  fetchUserChats, 
  createChat, 
  deleteChat, 
  updateChatTitle, 
  fetchMessages, 
  saveMessage, 
  logApiUsage, 
  getSystemSettings, 
  signOut,
  ADMIN_EMAIL 
} from './lib/supabaseClient';

import { 
  streamChatCompletion, 
  AVAILABLE_MODELS,
  setNvidiaApiKey 
} from './lib/nvidiaClient';

import { 
  performWebSearch, 
  shouldPerformWebSearch, 
  formatWebSearchContext 
} from './lib/webSearch';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [chats, setChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [currentModel, setCurrentModel] = useState(AVAILABLE_MODELS[0].id);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [systemSettings, setSystemSettings] = useState(null);

  // Authentication gate state
  const [pendingPrompt, setPendingPrompt] = useState(null);

  // Modals
  const [adminOpen, setAdminOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [userSettingsOpen, setUserSettingsOpen] = useState(false);
  const [isSearchingWeb, setIsSearchingWeb] = useState(false);
  const [currentSources, setCurrentSources] = useState([]);

  const abortControllerRef = useRef(null);

  // 1. Initial Load: User, System Settings, Chats
  useEffect(() => {
    async function initApp() {
      const user = await getCurrentUser();
      setCurrentUser(user);

      // Sync master key across tabs
      const masterKey = localStorage.getItem('aether_system_master_nvidia_key') || localStorage.getItem('aether_nvidia_api_key');
      if (masterKey) {
        setNvidiaApiKey(masterKey);
      }

      const settings = await getSystemSettings();
      if (settings?.system_announcement && settings.system_announcement.includes("AETHER")) {
        settings.system_announcement = "✨ Welcome to EDITH AI // Powered by NVIDIA";
        localStorage.setItem("edith_system_announcement", settings.system_announcement);
      }
      setSystemSettings(settings);
      if (settings?.default_model && AVAILABLE_MODELS.some(m => m.id === settings.default_model)) {
        setCurrentModel(settings.default_model);
      } else {
        setCurrentModel(AVAILABLE_MODELS[0].id);
      }

      await loadChats(user?.id);
    }
    initApp();

    const handleSettingsUpdated = (e) => {
      if (e.detail) {
        setSystemSettings(e.detail);
      }
    };
    window.addEventListener("edith_settings_updated", handleSettingsUpdated);
    return () => window.removeEventListener("edith_settings_updated", handleSettingsUpdated);
  }, []);

  const loadChats = async (userId) => {
    if (!userId || userId === 'anonymous') {
      setChats([]);
      setCurrentChatId(null);
      setMessages([]);
      return;
    }
    try {
      const userChats = await fetchUserChats(userId);
      setChats(userChats);
      if (userChats.length > 0) {
        setCurrentChatId(userChats[0].id);
        const msgs = await fetchMessages(userChats[0].id);
        setMessages(msgs);
      } else {
        setCurrentChatId(null);
        setMessages([]);
      }
    } catch (e) {
      console.warn("Error loading chats:", e);
    }
  };

  // Switch chat
  const handleSelectChat = async (chatId) => {
    if (isStreaming) {
      handleStopStreaming();
    }
    setCurrentChatId(chatId);
    const msgs = await fetchMessages(chatId);
    setMessages(msgs);
  };

  // Create new chat
  const handleNewChat = async () => {
    if (isStreaming) {
      handleStopStreaming();
    }
    if (!currentUser) {
      setPendingPrompt("Hello");
      setAuthOpen(true);
      return;
    }
    const newChat = await createChat(currentUser.id, 'New Conversation', currentModel);
    setChats(prev => [newChat, ...prev]);
    setCurrentChatId(newChat.id);
    setMessages([]);
  };

  // Delete chat
  const handleDeleteChat = async (chatId) => {
    await deleteChat(chatId);
    const remaining = chats.filter(c => c.id !== chatId);
    setChats(remaining);
    if (currentChatId === chatId) {
      if (remaining.length > 0) {
        handleSelectChat(remaining[0].id);
      } else {
        setCurrentChatId(null);
        setMessages([]);
      }
    }
  };

  // Update chat title
  const handleUpdateTitle = async (chatId, title) => {
    await updateChatTitle(chatId, title);
    setChats(prev => prev.map(c => c.id === chatId ? { ...c, title } : c));
  };

  // Gate message sending if user is not signed in
  const handleRequireAuth = (promptText) => {
    setPendingPrompt(promptText);
    setAuthOpen(true);
  };

  // Send message with instant optimistic UI & zero blocking latency
  const handleSendMessage = async (text, useWebSearch = false) => {
    if (!currentUser) {
      handleRequireAuth(text);
      return;
    }

    const trimmed = text.trim();
    if (!trimmed) return;

    // 1. Instant Optimistic UI Update (0ms)
    const localId = 'msg-' + Date.now();
    const optimisticUserMsg = {
      id: localId,
      chat_id: currentChatId || 'temp',
      user_id: currentUser.id,
      role: 'user',
      content: trimmed,
      model: currentModel,
      created_at: new Date().toISOString()
    };

    const updatedMessages = [...messages, optimisticUserMsg];
    setMessages(updatedMessages);
    setIsStreaming(true);
    setStreamingMessage('');

    // 2. Prepare API messages immediately
    const apiMessages = updatedMessages.map(m => ({
      role: m.role,
      content: m.content
    }));

    // 3. Asynchronous DB persistence (Runs in background, doesn't block streaming!)
    const dbPromise = (async () => {
      let cId = currentChatId;
      try {
        if (!cId) {
          const title = trimmed.slice(0, 32) + (trimmed.length > 32 ? '...' : '');
          const newChat = await createChat(currentUser.id, title, currentModel);
          cId = newChat.id;
          setChats(prev => [newChat, ...prev]);
          setCurrentChatId(cId);
        }
        await saveMessage({
          chatId: cId,
          userId: currentUser.id,
          role: 'user',
          content: trimmed,
          model: currentModel
        });
      } catch (err) {
        console.warn("Background chat save warning:", err);
      }
      return cId;
    })();

    // 4. Background Web Search: ONLY if query explicitly requires real-time facts
    let searchResults = [];
    if (useWebSearch || shouldPerformWebSearch(trimmed)) {
      try {
        setIsSearchingWeb(true);
        searchResults = await performWebSearch(trimmed);
        if (searchResults && searchResults.length > 0) {
          setCurrentSources(searchResults);
          const webContext = formatWebSearchContext(searchResults);
          if (webContext) {
            apiMessages.unshift({
              role: "system",
              content: webContext
            });
          }
        }
      } catch (e) {
        // Continue immediately without blocking
      } finally {
        setIsSearchingWeb(false);
      }
    }

    // 5. Fire streaming to NVIDIA NIM immediately (0ms delay!)
    abortControllerRef.current = streamChatCompletion({
      messages: apiMessages,
      model: currentModel,
      temperature: 0.6,
      maxTokens: 2048,
      onChunk: (delta, accumulated) => {
        setStreamingMessage(accumulated);
      },
      onComplete: async (fullText, stats) => {
        setIsStreaming(false);
        setStreamingMessage('');
        setCurrentSources([]);

        if (fullText.trim()) {
          const activeChatId = await dbPromise;
          const assistantMsg = await saveMessage({
            chatId: activeChatId,
            userId: currentUser.id,
            role: 'assistant',
            content: fullText,
            model: stats.model || currentModel,
            tokensUsed: stats.totalTokens || 0,
            latencyMs: stats.latencyMs || 0
          });

          // Attach web research sources to message object
          assistantMsg.sources = searchResults;

          setMessages(prev => {
            const filtered = prev.filter(m => m.id !== localId);
            return [...filtered, optimisticUserMsg, assistantMsg];
          });

          // Log telemetry in background
          logApiUsage({
            userId: currentUser.id,
            model: stats.model || currentModel,
            promptTokens: stats.promptTokens || 0,
            completionTokens: stats.completionTokens || 0,
            latencyMs: stats.latencyMs || 0,
            status: stats.aborted ? 'aborted' : 'success'
          }).catch(() => {});
        }
      },
      onError: (err) => {
        setIsStreaming(false);
        setStreamingMessage('');
        console.error("AI Generation Error:", err);
      }
    });
  };

  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
    }
  };

  const handleRegenerate = (assistantMsg) => {
    const msgIndex = messages.findIndex(m => m.id === assistantMsg.id);
    if (msgIndex > 0) {
      const prevUserMsg = messages[msgIndex - 1];
      if (prevUserMsg.role === 'user') {
        handleSendMessage(prevUserMsg.content);
      }
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setCurrentUser(null);
    setChats([]);
    setCurrentChatId(null);
    setMessages([]);
  };

  // When user completes sign-in or sign-up
  const handleAuthSuccess = async (user) => {
    setCurrentUser(user);
    await loadChats(user?.id);

    // If user typed a question before signing in, send it immediately!
    if (pendingPrompt) {
      const promptToSend = pendingPrompt;
      setPendingPrompt(null);
      setTimeout(() => {
        handleSendMessage(promptToSend, true);
      }, 300);
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden flex flex-col bg-[#07090e] text-slate-100 font-sans">
      
      {/* 1. Clean, Deep Subtle Liquid Ambient Background */}
      <LiquidBackground />

      {/* 2. Sleek Floating Header (No Supabase or Dev Pills for regular users) */}
      <Header
        currentUser={currentUser}
        currentModel={currentModel}
        onSelectModel={setCurrentModel}
        onOpenAuth={() => setAuthOpen(true)}
        onOpenAdmin={() => setAdminOpen(true)}
        onOpenUserSettings={() => setUserSettingsOpen(true)}
        onSignOut={handleSignOut}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        systemSettings={systemSettings}
      />

      {/* 3. Main Workspace Area: Sidebar + Chat Area */}
      <main className="flex-1 flex overflow-hidden relative z-10">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          chats={chats}
          currentChatId={currentChatId}
          onSelectChat={handleSelectChat}
          onNewChat={handleNewChat}
          onDeleteChat={handleDeleteChat}
          onUpdateTitle={handleUpdateTitle}
          currentUser={currentUser}
          onOpenAdmin={() => setAdminOpen(true)}
          onOpenUserSettings={() => setUserSettingsOpen(true)}
        />

        <ChatArea
          currentUser={currentUser}
          currentChat={chats.find(c => c.id === currentChatId)}
          messages={messages}
          isStreaming={isStreaming}
          streamingMessage={streamingMessage}
          currentModel={currentModel}
          isSearchingWeb={isSearchingWeb}
          currentSources={currentSources}
          onSendMessage={handleSendMessage}
          onStopStreaming={handleStopStreaming}
          onRegenerate={handleRegenerate}
          onRequireAuth={handleRequireAuth}
        />
      </main>

      {/* 4. Admin Panel (Strictly guarded for sharmasrishabh157@gmail.com) */}
      <AdminPanel
        isOpen={adminOpen}
        onClose={() => setAdminOpen(false)}
        currentUser={currentUser}
        onSettingsUpdated={(newSettings) => {
          setSystemSettings(newSettings);
        }}
        onLoginAsAdmin={async () => {
          const user = await getCurrentUser();
          setCurrentUser(user);
          loadChats(user?.id);
        }}
      />

      {/* 5. Clean, Gated Authentication Modal */}
      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        onAuthSuccess={handleAuthSuccess}
        pendingPrompt={pendingPrompt}
      />

      {/* 6. User Settings Modal (ChatGPT style) */}
      <UserSettingsModal
        isOpen={userSettingsOpen}
        onClose={() => setUserSettingsOpen(false)}
        currentUser={currentUser}
        chats={chats}
        onSignOut={handleSignOut}
        onClearChats={() => {
          setChats([]);
          setCurrentChatId(null);
          setMessages([]);
          localStorage.removeItem('aether_db_chats');
          localStorage.removeItem('aether_db_messages');
        }}
      />

    </div>
  );
}
