import React, { useState, useEffect } from 'react';
import { 
  X, 
  Settings, 
  User, 
  Sparkles, 
  Globe, 
  Sliders, 
  Database, 
  Trash2, 
  Download, 
  Check, 
  ShieldCheck, 
  LogOut,
  Moon,
  Zap,
  SlidersHorizontal,
  FileText
} from 'lucide-react';
import NvidiaLogo from './NvidiaLogo';
import { AVAILABLE_MODELS } from '../lib/nvidiaClient';
import { ADMIN_EMAIL } from '../lib/supabaseClient';

const DEFAULT_SETTINGS = {
  theme: 'dark',
  defaultModel: 'nvidia/nemotron-3-ultra-550b-a55b',
  webSearchMode: 'auto', // 'auto' | 'always' | 'off'
  showTelemetry: true,
  customPersona: '',
  responseStyle: '',
  streamSpeed: 'fast'
};

export default function UserSettingsModal({
  isOpen,
  onClose,
  currentUser,
  onSignOut,
  chats = [],
  onClearChats
}) {
  const [activeTab, setActiveTab] = useState('general'); // 'general' | 'personalization' | 'data' | 'account'
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('edith_user_settings');
      if (stored) {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(stored) });
      }
    } catch (_) {}
  }, [isOpen]);

  if (!isOpen) return null;

  const saveSettings = (newSettings) => {
    const merged = { ...settings, ...newSettings };
    setSettings(merged);
    localStorage.setItem('edith_user_settings', JSON.stringify(merged));
    window.dispatchEvent(new CustomEvent('edith_user_settings_updated', { detail: merged }));
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  const handleExportData = () => {
    const exportPayload = {
      exported_at: new Date().toISOString(),
      user: currentUser?.email || 'guest',
      conversations: chats
    };
    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `edith-conversations-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const isAdmin = currentUser?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      
      <div className="relative w-full max-w-2xl bg-[#0e1017] border border-white/[0.12] rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[85vh]">
        
        {/* Close Button */}
        <button 
          onClick={onClose} 
          className="absolute right-3.5 top-3.5 z-20 p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/[0.06] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Left Sidebar Navigation */}
        <div className="w-full md:w-52 bg-[#090a0f] border-b md:border-b-0 md:border-r border-white/[0.08] p-3 flex md:flex-col space-x-1 md:space-x-0 md:space-y-1 shrink-0 overflow-x-auto">
          
          <div className="hidden md:flex items-center space-x-2 px-2.5 py-2 mb-2">
            <Settings className="w-4 h-4 text-slate-300" />
            <span className="text-xs font-bold text-white tracking-tight">Settings</span>
          </div>

          <button
            onClick={() => setActiveTab('general')}
            className={`px-3 py-2 rounded-lg text-xs font-medium flex items-center space-x-2 transition-colors whitespace-nowrap ${
              activeTab === 'general'
                ? 'bg-white/[0.08] text-white border border-white/[0.08]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>General</span>
          </button>

          <button
            onClick={() => setActiveTab('personalization')}
            className={`px-3 py-2 rounded-lg text-xs font-medium flex items-center space-x-2 transition-colors whitespace-nowrap ${
              activeTab === 'personalization'
                ? 'bg-white/[0.08] text-white border border-white/[0.08]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Personalization</span>
          </button>

          <button
            onClick={() => setActiveTab('data')}
            className={`px-3 py-2 rounded-lg text-xs font-medium flex items-center space-x-2 transition-colors whitespace-nowrap ${
              activeTab === 'data'
                ? 'bg-white/[0.08] text-white border border-white/[0.08]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Data Controls</span>
          </button>

          <button
            onClick={() => setActiveTab('account')}
            className={`px-3 py-2 rounded-lg text-xs font-medium flex items-center space-x-2 transition-colors whitespace-nowrap ${
              activeTab === 'account'
                ? 'bg-white/[0.08] text-white border border-white/[0.08]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Account</span>
          </button>

        </div>

        {/* Right Main Settings Body */}
        <div className="flex-1 p-5 sm:p-6 overflow-y-auto">
          
          {/* TAB 1: GENERAL */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-white">General Preferences</h3>
                <p className="text-xs text-slate-400">Configure theme, models, and real-time research triggers</p>
              </div>

              {/* Default Model */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-300">
                  Default AI Engine
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {AVAILABLE_MODELS.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => saveSettings({ defaultModel: m.id })}
                      className={`p-3 rounded-xl border text-left transition-colors ${
                        settings.defaultModel === m.id
                          ? 'bg-white/[0.08] border-white/[0.2] text-white'
                          : 'bg-white/[0.02] border-white/[0.07] text-slate-400 hover:text-white hover:bg-white/[0.05]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-white">{m.name}</span>
                        <NvidiaLogo className="w-3 h-3" />
                      </div>
                      <span className="text-[10px] text-emerald-400 font-mono block mb-1">{m.tag}</span>
                      <p className="text-[11px] text-slate-400 line-clamp-1">{m.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Real-time Web Search Mode */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-slate-300 flex items-center space-x-1.5">
                    <Globe className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Real-Time Web Search & Research</span>
                  </label>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'auto', label: 'Smart Auto', desc: 'Researches when needed' },
                    { id: 'always', label: 'Always Active', desc: 'Researches every prompt' },
                    { id: 'off', label: 'Manual Only', desc: 'Only when toggled' }
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => saveSettings({ webSearchMode: opt.id })}
                      className={`p-2.5 rounded-lg border text-left transition-colors ${
                        settings.webSearchMode === opt.id
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                          : 'bg-white/[0.02] border-white/[0.07] text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="text-xs font-semibold text-white">{opt.label}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Theme Preference */}
              <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
                <div>
                  <div className="text-xs font-medium text-slate-200">Theme</div>
                  <div className="text-[11px] text-slate-400">Obsidian Studio Dark mode</div>
                </div>
                <span className="text-xs font-medium text-slate-300 px-2.5 py-1 rounded bg-white/[0.05] border border-white/[0.08]">
                  Dark (Obsidian)
                </span>
              </div>
            </div>
          )}

          {/* TAB 2: PERSONALIZATION (ChatGPT style Custom Instructions) */}
          {activeTab === 'personalization' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>Custom Instructions</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Teach EDITH your background and desired response style. These instructions are automatically injected into every conversation.
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-300">
                  What would you like EDITH to know about you to provide better responses?
                </label>
                <textarea
                  value={settings.customPersona}
                  onChange={(e) => setSettings({ ...settings, customPersona: e.target.value })}
                  placeholder="e.g. I am a software engineer building production web applications. I use React, Tailwind CSS, TypeScript, and Python. Prefer modern idioms..."
                  rows={3}
                  className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-white/[0.2] rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-300">
                  How would you like EDITH to respond?
                </label>
                <textarea
                  value={settings.responseStyle}
                  onChange={(e) => setSettings({ ...settings, responseStyle: e.target.value })}
                  placeholder="e.g. Be concise and direct. Provide clean code snippets first before deep explanations. Use Hinglish or English naturally..."
                  rows={3}
                  className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-white/[0.2] rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
                />
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => saveSettings({ 
                    customPersona: settings.customPersona, 
                    responseStyle: settings.responseStyle 
                  })}
                  className="px-4 py-2 rounded-lg bg-white text-black hover:bg-slate-200 text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Instructions</span>
                </button>
                {savedNotice && (
                  <span className="text-xs text-emerald-400 font-medium animate-in fade-in">
                    Saved successfully!
                  </span>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: DATA CONTROLS */}
          {activeTab === 'data' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-white">Chat & Data Controls</h3>
                <p className="text-xs text-slate-400">Manage conversation exports and history</p>
              </div>

              <div className="space-y-3">
                {/* Export Data */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <div>
                    <div className="text-xs font-medium text-white">Export Conversations</div>
                    <div className="text-[11px] text-slate-400">Download conversation history as a JSON file</div>
                  </div>
                  <button
                    type="button"
                    onClick={handleExportData}
                    className="px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-xs font-medium text-white flex items-center space-x-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export</span>
                  </button>
                </div>

                {/* Show Latency */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <div>
                    <div className="text-xs font-medium text-white">Show Latency & Metrics</div>
                    <div className="text-[11px] text-slate-400">Display inference response time on messages</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => saveSettings({ showTelemetry: !settings.showTelemetry })}
                    className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                      settings.showTelemetry
                        ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                        : 'bg-white/[0.05] text-slate-400'
                    }`}
                  >
                    {settings.showTelemetry ? 'Enabled' : 'Disabled'}
                  </button>
                </div>

                {/* Clear All Chats */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-rose-500/[0.04] border border-rose-500/20">
                  <div>
                    <div className="text-xs font-medium text-rose-300">Clear All Conversations</div>
                    <div className="text-[11px] text-slate-400">Delete all local chat sessions permanently</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm("Are you sure you want to delete all conversations? This cannot be undone.")) {
                        onClearChats();
                        onClose();
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 text-xs font-medium flex items-center space-x-1.5 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear All</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ACCOUNT */}
          {activeTab === 'account' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-white">Account Details</h3>
                <p className="text-xs text-slate-400">User profile and platform authentication status</p>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center space-x-4">
                <img
                  src={currentUser?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser?.email || 'guest'}`}
                  alt="Avatar"
                  className="w-12 h-12 rounded-xl border border-white/[0.1] bg-[#12141c]"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-white truncate">
                    {currentUser?.full_name || currentUser?.email?.split('@')[0] || "Guest User"}
                  </div>
                  <div className="text-xs text-slate-400 truncate">
                    {currentUser?.email || "Local Guest"}
                  </div>
                  <div className="mt-1 flex items-center space-x-2">
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-white/[0.06] border border-white/[0.08] text-slate-300">
                      {isAdmin ? 'Root Admin' : 'Standard User'}
                    </span>
                    <span className="text-[10px] text-emerald-400 flex items-center space-x-1 font-mono">
                      <NvidiaLogo className="w-2.5 h-2.5" />
                      <span>NVIDIA Free Access Active</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onSignOut();
                  }}
                  className="px-3.5 py-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold flex items-center space-x-2 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
