import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Cpu, 
  User, 
  LogOut, 
  ChevronDown, 
  Zap, 
  ExternalLink,
  Crown,
  Menu,
  ShieldCheck,
  X,
  Settings
} from 'lucide-react';
import NvidiaLogo from './NvidiaLogo';
import { AVAILABLE_MODELS, fetchNvidiaModels } from '../lib/nvidiaClient';
import { ADMIN_EMAIL } from '../lib/supabaseClient';

export default function Header({
  currentUser,
  currentModel,
  onSelectModel,
  onOpenAuth,
  onOpenAdmin,
  onOpenUserSettings,
  onSignOut,
  onToggleSidebar,
  systemSettings
}) {
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [dismissAnnouncement, setDismissAnnouncement] = useState(false);
  const [modelsList, setModelsList] = useState(AVAILABLE_MODELS);

  useEffect(() => {
    setDismissAnnouncement(false);
  }, [systemSettings?.system_announcement]);

  useEffect(() => {
    async function loadAllModels() {
      const fetched = await fetchNvidiaModels();
      if (fetched && fetched.length > 0) {
        setModelsList(fetched);
      }
    }
    loadAllModels();
  }, []);

  const selectedModelObj = modelsList.find(m => m.id === currentModel) || modelsList[0] || {
    id: currentModel,
    name: "KMP 1.0",
    provider: "Powered by NVIDIA",
    tag: "Powered by NVIDIA"
  };

  const isAdmin = currentUser?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  return (
    <header className="sticky top-0 z-30 w-full flex flex-col bg-[#08090d]/90 backdrop-blur-xl border-b border-white/[0.08]">
      {/* Main Nav Bar */}
      <div className="h-14 px-3 sm:px-5 flex items-center justify-between w-full">
        
        {/* Left: Mobile Toggle & Minimalist Brand */}
        <div className="flex items-center space-x-3">
          <button 
            onClick={onToggleSidebar}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
            title="Toggle Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-3">
            {/* Brand Logo & Name */}
            <div className="flex items-center space-x-2.5">
              <img
                src="/edith-logo.jpg"
                alt="EDITH AI"
                className="w-7 h-7 rounded-lg object-cover border border-emerald-500/30 shadow-sm shadow-emerald-500/20"
              />
              <span className="font-bold text-sm tracking-tight text-white">
                EDITH
              </span>
            </div>

            {/* Subtle Provider Tag */}
            <span className="hidden sm:inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.07] text-[11px] font-medium text-slate-300">
              <NvidiaLogo className="w-3 h-3" />
              <span>Powered by NVIDIA</span>
            </span>
          </div>
        </div>

        {/* Center: Sleek Minimalist Model Switcher */}
        <div className="relative">
          <button
            onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
            className="px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/[0.14] flex items-center space-x-2 text-xs font-medium text-slate-200 transition-all"
          >
            <NvidiaLogo className="w-3 h-3" />
            <span className="font-semibold text-white">{selectedModelObj.name}</span>
            <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
              {selectedModelObj.tag}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${modelDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Model Selector Popover */}
          {modelDropdownOpen && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setModelDropdownOpen(false)}
              />
              <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-80 bg-[#0e1017] border border-white/[0.12] rounded-xl shadow-2xl p-2 z-50 animate-in fade-in duration-100">
                <div className="px-2 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between border-b border-white/[0.06] mb-1.5">
                  <span>Available Engines</span>
                  <span className="font-mono text-emerald-400 font-bold">2 Models</span>
                </div>

                <div className="space-y-1">
                  {modelsList.map((model) => {
                    const isSelected = currentModel === model.id;
                    return (
                      <button
                        key={model.id}
                        onClick={() => {
                          onSelectModel(model.id);
                          setModelDropdownOpen(false);
                        }}
                        className={`w-full text-left p-2.5 rounded-lg transition-colors flex items-start space-x-3 ${
                          isSelected
                            ? 'bg-white/[0.08] border border-white/[0.14] text-white'
                            : 'hover:bg-white/[0.05] text-slate-300 hover:text-white border border-transparent'
                        }`}
                      >
                        <div className="mt-0.5 p-1.5 rounded-md bg-white/[0.06] border border-white/[0.08] text-slate-300">
                          <NvidiaLogo className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-white">{model.name}</span>
                            <span className="text-[10px] font-mono text-emerald-400 font-medium">
                              {model.tag}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                            {model.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-2 pt-2 border-t border-white/[0.06] px-2 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center space-x-1.5 text-emerald-400">
                    <NvidiaLogo className="w-3 h-3" />
                    <span className="text-[10px] font-medium">NVIDIA NIM Infrastructure</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">128k Context</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Right: Admin Center & Profile */}
        <div className="flex items-center space-x-2">
          {isAdmin && (
            <button
              onClick={onOpenAdmin}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-amber-300 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 transition-colors"
              title="Admin Panel"
            >
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Admin Center</span>
            </button>
          )}

          {currentUser ? (
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center space-x-2 p-1 rounded-lg hover:bg-white/[0.05] transition-colors"
              >
                <img
                  src={currentUser.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.email}`}
                  alt="Avatar"
                  className="w-7 h-7 rounded-lg border border-white/[0.1] bg-[#12141c]"
                />
                <span className="text-xs font-medium text-slate-200 max-w-[100px] truncate hidden sm:inline">
                  {currentUser.full_name || currentUser.email}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400 hidden sm:inline" />
              </button>

              {userDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setUserDropdownOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-56 bg-[#0e1017] border border-white/[0.12] rounded-xl shadow-2xl p-2 z-50 animate-in fade-in duration-100">
                    <div className="p-2 border-b border-white/[0.08] mb-1">
                      <div className="text-xs font-semibold text-white truncate">
                        {currentUser.full_name || "EDITH User"}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        {currentUser.email}
                      </div>
                      {isAdmin && (
                        <div className="mt-1.5 inline-flex items-center space-x-1 text-[10px] font-medium text-amber-300 bg-amber-500/15 px-1.5 py-0.5 rounded border border-amber-500/30">
                          <Crown className="w-3 h-3" />
                          <span>Root Administrator</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-0.5">
                      {isAdmin && (
                        <button
                          onClick={() => {
                            setUserDropdownOpen(false);
                            onOpenAdmin();
                          }}
                          className="w-full text-left px-2 py-1.5 text-xs text-amber-300 hover:bg-amber-500/10 rounded-lg flex items-center space-x-2 transition-colors"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Admin Control Center</span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          if (onOpenUserSettings) onOpenUserSettings();
                        }}
                        className="w-full text-left px-2 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-white/[0.06] rounded-lg flex items-center space-x-2 transition-colors"
                      >
                        <Settings className="w-3.5 h-3.5 text-slate-400" />
                        <span>Settings</span>
                      </button>

                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onSignOut();
                        }}
                        className="w-full text-left px-2 py-1.5 text-xs text-rose-400 hover:bg-rose-500/10 rounded-lg flex items-center space-x-2 transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <button
                onClick={onOpenUserSettings}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
                title="Settings"
              >
                <Settings className="w-4 h-4" />
              </button>
              <button
                onClick={onOpenAuth}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-950 bg-white hover:bg-slate-200 transition-colors"
              >
                Sign In
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Docked Sub-Nav Broadcast Banner (Clean, Integrated, No Floating Clutter) */}
      {systemSettings?.system_announcement && !dismissAnnouncement && (
        <div className={`w-full px-4 py-1.5 border-t text-xs flex items-center justify-between transition-colors ${
          systemSettings.announcement_type === 'warning'
            ? 'bg-amber-500/[0.08] border-amber-500/20 text-amber-200'
            : systemSettings.announcement_type === 'success'
            ? 'bg-emerald-500/[0.08] border-emerald-500/20 text-emerald-200'
            : 'bg-white/[0.03] border-white/[0.06] text-slate-300'
        }`}>
          <div className="flex items-center space-x-2.5 truncate">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                systemSettings.announcement_type === 'warning'
                  ? 'bg-amber-400'
                  : 'bg-emerald-400'
              }`} />
              <span className={`relative inline-flex rounded-full h-2 w-2 ${
                systemSettings.announcement_type === 'warning'
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`} />
            </span>
            <span className="text-[10px] font-mono uppercase tracking-wider font-bold px-1.5 py-0.5 rounded bg-white/[0.08] border border-white/[0.1] text-white shrink-0">
              Broadcast
            </span>
            <span className="truncate text-xs font-normal">
              {systemSettings.system_announcement}
            </span>
          </div>
          <button
            onClick={() => setDismissAnnouncement(true)}
            className="ml-3 p-1 rounded hover:bg-white/[0.1] text-slate-400 hover:text-white transition-colors shrink-0"
            title="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </header>
  );
}
