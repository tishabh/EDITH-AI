import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  Send, 
  Square, 
  Sparkles, 
  Copy, 
  Check, 
  Volume2, 
  RotateCcw, 
  Mic, 
  MicOff, 
  Code, 
  Lightbulb, 
  ArrowDown, 
  Clock, 
  Layers, 
  Globe,
  Cpu,
  ExternalLink
} from 'lucide-react';
import NvidiaLogo from './NvidiaLogo';
import CodeArtifactViewer from './CodeArtifactViewer';
import { AVAILABLE_MODELS, filterThinkingContent } from '../lib/nvidiaClient';

const PROMPT_SUGGESTIONS = [
  {
    icon: Code,
    title: "Modern React Architecture",
    prompt: "Write a high-performance React component with custom hooks, strict TypeScript interfaces, and memoized selectors."
  },
  {
    icon: Cpu,
    title: "GPU Inference Optimization",
    prompt: "Explain how TensorRT-LLM and KV-cache quantization achieve ultra-low time-to-first-token on NVIDIA H100 clusters."
  },
  {
    icon: Layers,
    title: "PostgreSQL Database Schema",
    prompt: "Design a clean PostgreSQL schema with multi-tenant row-level security (RLS) policies and composite indexes."
  },
  {
    icon: Lightbulb,
    title: "Algorithmic Reasoning",
    prompt: "Break down the mathematical intuition behind modern transformer attention mechanisms and rotary position embeddings."
  }
];

export default function ChatArea({
  currentUser,
  currentChat,
  messages = [],
  isStreaming,
  streamingMessage,
  currentModel,
  isSearchingWeb = false,
  currentSources = [],
  onSendMessage,
  onStopStreaming,
  onRegenerate,
  onRequireAuth
}) {
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [webSearchActive, setWebSearchActive] = useState(false);

  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const textareaRef = useRef(null);
  const recognitionRef = useRef(null);

  const selectedModelObj = AVAILABLE_MODELS.find(m => m.id === currentModel) || AVAILABLE_MODELS[0];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingMessage]);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    setShowScrollBottom(scrollHeight - scrollTop - clientHeight > 180);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleInputChange = (e) => {
    setInputText(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!inputText.trim() || isStreaming) return;

    if (!currentUser) {
      onRequireAuth(inputText.trim());
      return;
    }

    onSendMessage(inputText.trim(), webSearchActive);
    setInputText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSpeak = (text) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    window.speechSynthesis.speak(utterance);
  };

  const toggleSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInputText(prev => prev ? `${prev} ${transcript}` : transcript);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
  };

  // Reusable Markdown renderer with interactive Artifact Sandbox & Download capabilities
  const renderMarkdownWithArtifacts = (content, isStream = false, msgId = 'msg') => (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        code({ node, inline, className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || '');
          const codeString = String(children).replace(/\n$/, '');

          if (!inline && (match || codeString.includes('\n'))) {
            const lang = match ? match[1] : 'text';
            return (
              <CodeArtifactViewer
                language={lang}
                code={codeString}
                id={`${msgId}-${lang}`}
                isStreaming={isStream}
              />
            );
          }
          return (
            <code className="px-1.5 py-0.5 rounded bg-white/[0.08] text-emerald-300 font-mono text-[12px]" {...props}>
              {children}
            </code>
          );
        }
      }}
    >
      {filterThinkingContent(content)}
    </ReactMarkdown>
  );

  return (
    <div className="flex-1 flex flex-col h-full relative overflow-hidden bg-[#08090d]">
      
      {/* Scrollable Message History or Clean Welcome Screen */}
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-6"
      >
        {messages.length === 0 && !streamingMessage ? (
          
          /* Minimalist Studio Hero (No AI Slop) */
          <div className="max-w-2xl mx-auto min-h-[65vh] flex flex-col items-center justify-center text-center px-4 animate-in fade-in duration-300">
            
            {/* Official Brand Logo */}
            <div className="relative mb-4 group">
              <img
                src="/edith-logo.jpg"
                alt="EDITH AI"
                className="w-16 h-16 rounded-2xl object-cover border border-emerald-500/30 shadow-xl shadow-emerald-500/20"
              />
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
              What would you like to build?
            </h1>

            <p className="text-xs sm:text-sm text-slate-400 max-w-md mb-8">
              EDITH AI powered by NVIDIA intelligence engines with live interactive code sandboxes.
            </p>

            {/* Prompt Starter Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full text-left">
              {PROMPT_SUGGESTIONS.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      setInputText(item.prompt);
                      if (textareaRef.current) textareaRef.current.focus();
                    }}
                    className="p-3.5 rounded-xl bg-[#0e1017] hover:bg-[#141722] border border-white/[0.07] hover:border-white/[0.14] transition-all flex flex-col justify-between group"
                  >
                    <div className="flex items-center space-x-2 mb-1.5">
                      <Icon className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-colors" />
                      <span className="text-xs font-semibold text-white">
                        {item.title}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                      {item.prompt}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          
          /* Message List */
          <div className="max-w-3xl mx-auto space-y-6 pb-32">
            {messages.map((msg) => {
              const isUser = msg.role === 'user';

              return (
                <div 
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} group animate-in fade-in duration-150`}
                >
                  {/* Sender Header */}
                  <div className="flex items-center space-x-2 mb-1 px-1 text-[11px] text-slate-400">
                    {!isUser && (
                      <img
                        src="/edith-logo.jpg"
                        alt="EDITH"
                        className="w-4 h-4 rounded-md object-cover border border-emerald-500/30"
                      />
                    )}
                    <span className="font-semibold text-slate-300">
                      {isUser ? 'You' : 'EDITH'}
                    </span>
                    {!isUser && msg.model && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.05] border border-white/[0.08] text-emerald-400 font-mono flex items-center space-x-1">
                        <NvidiaLogo className="w-2.5 h-2.5" />
                        <span>{AVAILABLE_MODELS.find(m => m.id === msg.model)?.name || (msg.model.includes('nemotron-70b') ? 'KMP 1.0' : msg.model)}</span>
                      </span>
                    )}
                    {msg.latency_ms > 0 && (
                      <span className="flex items-center space-x-1 text-[10px] text-slate-500 font-mono">
                        <Clock className="w-2.5 h-2.5" />
                        <span>{msg.latency_ms}ms</span>
                      </span>
                    )}
                  </div>

                  {/* Message Body */}
                  <div className={`relative max-w-full ${
                    isUser 
                      ? 'bg-[#181a24] border border-white/[0.09] text-slate-100 rounded-2xl px-4 py-2.5 text-sm leading-relaxed max-w-[85%] sm:max-w-[75%]' 
                      : 'w-full text-slate-200 text-sm leading-relaxed'
                  }`}>
                    {isUser ? (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    ) : (
                      <div className="prose-liquid text-sm overflow-hidden">
                        {renderMarkdownWithArtifacts(msg.content, false, msg.id)}

                        {/* Researched Sources & Verified Links */}
                        {msg.sources && msg.sources.length > 0 && (
                          <div className="mt-3 pt-2.5 border-t border-white/[0.08]">
                            <div className="flex items-center space-x-1.5 text-[11px] font-semibold text-slate-400 mb-2">
                              <Globe className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Researched Sources ({msg.sources.length})</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {msg.sources.map((src, i) => (
                                <a
                                  key={i}
                                  href={src.source}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] hover:border-emerald-500/40 text-xs text-slate-300 hover:text-white transition-all group max-w-xs"
                                  title={src.title}
                                >
                                  <span className="w-3.5 h-3.5 rounded bg-white/[0.08] flex items-center justify-center text-[9px] font-mono text-emerald-400 font-bold shrink-0">
                                    {i + 1}
                                  </span>
                                  <span className="text-[11px] font-medium text-emerald-400 font-mono shrink-0">
                                    {src.domain || 'web'}
                                  </span>
                                  <span className="text-[11px] text-slate-400 truncate group-hover:text-slate-200">
                                    {src.title}
                                  </span>
                                  <ExternalLink className="w-2.5 h-2.5 text-slate-500 group-hover:text-white shrink-0 ml-0.5" />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Message Actions */}
                        <div className="mt-3 pt-2 border-t border-white/[0.06] flex items-center space-x-2 text-xs text-slate-500">
                          <button
                            onClick={() => handleCopy(msg.id, msg.content)}
                            className="p-1 rounded hover:bg-white/[0.06] hover:text-slate-300 flex items-center space-x-1 transition-colors"
                            title="Copy response"
                          >
                            {copiedId === msg.id ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span className="text-emerald-400 text-[11px]">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span className="text-[11px]">Copy</span>
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => handleSpeak(msg.content)}
                            className="p-1 rounded hover:bg-white/[0.06] hover:text-slate-300 flex items-center space-x-1 transition-colors"
                            title="Listen"
                          >
                            <Volume2 className="w-3 h-3" />
                            <span className="text-[11px]">Listen</span>
                          </button>

                          <button
                            onClick={() => onRegenerate(msg)}
                            className="p-1 rounded hover:bg-white/[0.06] hover:text-slate-300 flex items-center space-x-1 transition-colors"
                            title="Regenerate"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span className="text-[11px]">Regenerate</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Currently Streaming Message */}
            {isStreaming && (
              <div className="flex flex-col items-start animate-in fade-in duration-150 w-full">
                <div className="flex items-center space-x-2 mb-1 px-1 text-[11px] text-slate-400">
                  <img
                    src="/edith-logo.jpg"
                    alt="EDITH"
                    className="w-4 h-4 rounded-md object-cover border border-emerald-500/30"
                  />
                  <span className="font-semibold text-slate-300">
                    EDITH
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.05] border border-white/[0.08] text-emerald-400 font-mono">
                    {selectedModelObj.name}
                  </span>
                </div>

                <div className="w-full text-slate-200 text-sm leading-relaxed">
                  {/* Real-time search status beacon */}
                  {isSearchingWeb && (
                    <div className="flex items-center space-x-2 text-xs text-emerald-400 py-1 px-2.5 bg-emerald-500/[0.08] border border-emerald-500/20 rounded-lg mb-2 inline-flex">
                      <Globe className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                      <span className="font-medium animate-pulse">Researching verified sources on the web...</span>
                    </div>
                  )}

                  {/* Sources discovered during streaming */}
                  {currentSources && currentSources.length > 0 && (
                    <div className="mb-2.5 flex items-center flex-wrap gap-1.5">
                      <span className="text-[10px] text-slate-400 font-mono">Found {currentSources.length} sources:</span>
                      {currentSources.map((src, i) => (
                        <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.05] border border-white/[0.08] text-emerald-400 font-mono">
                          {src.domain || 'web'}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="prose-liquid text-sm">
                    {filterThinkingContent(streamingMessage) ? (
                      <>
                        {renderMarkdownWithArtifacts(streamingMessage, true, 'streaming')}
                        <span className="inline-block w-1.5 h-3.5 bg-emerald-400 ml-1 animate-pulse" />
                      </>
                    ) : (
                      <div className="flex items-center space-x-2 text-slate-400 text-xs py-1">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                        <span>Generating response...</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Scroll to Bottom Button */}
      {showScrollBottom && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-24 right-6 p-2 rounded-full bg-[#12141c] border border-white/[0.12] text-slate-300 hover:text-white shadow-xl transition-all"
        >
          <ArrowDown className="w-4 h-4" />
        </button>
      )}

      {/* Floating Bottom Input Dock */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#08090d] via-[#08090d]/90 to-transparent pointer-events-none">
        <div className="max-w-3xl mx-auto pointer-events-auto">
          
          <form 
            onSubmit={handleSubmit}
            className="bg-[#0f1118]/95 border border-white/[0.12] rounded-2xl shadow-2xl backdrop-blur-xl p-2.5 transition-all"
          >
            {/* Input Row */}
            <div className="flex items-end space-x-2">
              <textarea
                ref={textareaRef}
                value={inputText}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                rows={1}
                placeholder={`Ask ${selectedModelObj.name}... (Shift + Enter for new line)`}
                className="flex-1 bg-transparent text-white placeholder-slate-500 text-sm focus:outline-none resize-none max-h-36 py-1.5 px-2"
              />

              {/* Stop Generation or Send Action */}
              {isStreaming ? (
                <button
                  type="button"
                  onClick={onStopStreaming}
                  className="px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 hover:bg-rose-500/20 text-xs font-semibold flex items-center space-x-1.5 transition-colors"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Stop</span>
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className={`p-2 rounded-xl transition-colors flex items-center justify-center ${
                    inputText.trim() 
                      ? 'bg-white text-black hover:bg-slate-200 cursor-pointer shadow-sm' 
                      : 'bg-white/[0.05] text-slate-600 cursor-not-allowed'
                  }`}
                  title="Send message"
                >
                  <Send className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Bottom Actions Bar */}
            <div className="flex items-center justify-between px-1 pt-2 mt-1 border-t border-white/[0.06] text-xs">
              <div className="flex items-center space-x-2">
                <span className="flex items-center space-x-1.5 text-xs text-slate-300 font-medium px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.06]">
                  <NvidiaLogo className="w-3 h-3" />
                  <span>{selectedModelObj.name}</span>
                </span>
                
                {/* Real-time Web Search Toggle */}
                <button
                  type="button"
                  onClick={() => setWebSearchActive(!webSearchActive)}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium flex items-center space-x-1 transition-colors ${
                    webSearchActive
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.04]'
                  }`}
                >
                  <Globe className="w-3 h-3" />
                  <span>Web Search {webSearchActive ? 'On' : 'Off'}</span>
                </button>
              </div>

              {/* Dictation */}
              <button
                type="button"
                onClick={toggleSpeechRecognition}
                className={`p-1.5 rounded-lg transition-colors ${
                  isListening 
                    ? 'bg-rose-500 text-white animate-pulse' 
                    : 'text-slate-500 hover:text-slate-200 hover:bg-white/[0.06]'
                }`}
                title="Voice Dictation"
              >
                {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
              </button>
            </div>
          </form>

        </div>
      </div>

    </div>
  );
}
