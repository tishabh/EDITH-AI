import React, { useState } from 'react';
import { 
  Plus, 
  MessageSquare, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  Search, 
  Crown,
  Settings
} from 'lucide-react';
import { ADMIN_EMAIL } from '../lib/supabaseClient';

export default function Sidebar({
  isOpen,
  onClose,
  chats = [],
  currentChatId,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  onUpdateTitle,
  currentUser,
  onOpenAdmin,
  onOpenUserSettings
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingChatId, setEditingChatId] = useState(null);
  const [editTitle, setEditTitle] = useState('');

  const isAdmin = currentUser?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  const filteredChats = chats.filter(chat => 
    (chat.title || 'New Conversation').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const startRename = (chat, e) => {
    e.stopPropagation();
    setEditingChatId(chat.id);
    setEditTitle(chat.title || '');
  };

  const saveRename = (chatId, e) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      onUpdateTitle(chatId, editTitle.trim());
    }
    setEditingChatId(null);
  };

  const cancelRename = (e) => {
    e.stopPropagation();
    setEditingChatId(null);
  };

  return (
    <>
      {/* Mobile Backdrop overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed md:static top-0 bottom-0 left-0 z-40
        w-64 h-full flex flex-col bg-[#0c0d12] border-r border-white/[0.08] transition-transform duration-200 ease-in-out select-none
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="flex-1 flex flex-col p-3 overflow-hidden">
          
          {/* New Chat Primary Action Button */}
          <button
            onClick={() => {
              onNewChat();
              if (window.innerWidth < 768) onClose();
            }}
            className="w-full flex items-center justify-between py-2 px-3 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-white border border-white/[0.08] text-xs font-semibold transition-colors mb-3 group"
          >
            <div className="flex items-center space-x-2">
              <Plus className="w-3.5 h-3.5 text-slate-300 group-hover:text-white" />
              <span>New Conversation</span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">⌘N</span>
          </button>

          {/* Search Conversations Input */}
          <div className="relative mb-3">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/[0.07] focus:border-white/[0.18] rounded-lg pl-8 pr-7 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Conversation History List */}
          <div className="flex-1 overflow-y-auto space-y-0.5 pr-0.5">
            <div className="px-2 py-1.5 text-[10px] font-semibold text-slate-500 tracking-wider uppercase flex items-center justify-between">
              <span>Recents</span>
              <span className="font-mono text-[10px] text-slate-500">
                {chats.length}
              </span>
            </div>

            {filteredChats.length === 0 ? (
              <div className="text-center py-10 px-4 text-xs text-slate-500">
                <MessageSquare className="w-6 h-6 mx-auto text-slate-600 mb-2 opacity-40" />
                <p>No conversations found</p>
              </div>
            ) : (
              filteredChats.map((chat) => {
                const isActive = currentChatId === chat.id;
                const isEditing = editingChatId === chat.id;

                return (
                  <div
                    key={chat.id}
                    onClick={() => {
                      onSelectChat(chat.id);
                      if (window.innerWidth < 768) onClose();
                    }}
                    className={`group relative rounded-lg px-2.5 py-2 cursor-pointer transition-colors flex items-center justify-between text-xs ${
                      isActive 
                        ? 'bg-white/[0.08] text-white font-medium border border-white/[0.08]' 
                        : 'hover:bg-white/[0.04] text-slate-400 hover:text-slate-200 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center space-x-2 min-w-0 flex-1">
                      <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                      
                      {isEditing ? (
                        <div className="flex items-center space-x-1 flex-1 min-w-0" onClick={e => e.stopPropagation()}>
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveRename(chat.id, e);
                              if (e.key === 'Escape') cancelRename(e);
                            }}
                            autoFocus
                            className="bg-black/80 border border-white/30 rounded px-1.5 py-0.5 text-xs text-white w-full outline-none"
                          />
                          <button onClick={(e) => saveRename(chat.id, e)} className="text-emerald-400 hover:text-emerald-300 p-0.5">
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={cancelRename} className="text-rose-400 hover:text-rose-300 p-0.5">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="truncate flex-1">
                          {chat.title || 'New Conversation'}
                        </span>
                      )}
                    </div>

                    {/* Action buttons (Rename / Delete) */}
                    {!isEditing && (
                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity pl-1">
                        <button
                          onClick={(e) => startRename(chat, e)}
                          className="p-1 text-slate-500 hover:text-slate-200 rounded hover:bg-white/10"
                          title="Rename"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteChat(chat.id);
                          }}
                          className="p-1 text-slate-500 hover:text-rose-400 rounded hover:bg-white/10"
                          title="Delete Chat"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Bottom Controls: User Settings & Admin */}
          <div className="mt-2 pt-2.5 border-t border-white/[0.08] space-y-1.5">
            <button
              onClick={() => {
                if (onOpenUserSettings) onOpenUserSettings();
                if (window.innerWidth < 768) onClose();
              }}
              className="w-full px-2.5 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.07] transition-colors flex items-center space-x-2"
            >
              <Settings className="w-3.5 h-3.5 text-slate-400" />
              <span>Settings</span>
            </button>

            {isAdmin && (
              <button
                onClick={onOpenAdmin}
                className="w-full px-2.5 py-2 rounded-lg text-xs font-medium text-amber-300 bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/20 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center space-x-2">
                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                  <span>Admin Panel</span>
                </div>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 font-bold">
                  Root
                </span>
              </button>
            )}
          </div>

        </div>
      </aside>
    </>
  );
}
