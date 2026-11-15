import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Users, 
  MessageSquare, 
  Cpu, 
  Activity, 
  Database, 
  Settings, 
  Bell, 
  Lock, 
  Unlock, 
  X, 
  Check, 
  RefreshCw, 
  Search, 
  ExternalLink, 
  Zap, 
  Crown, 
  BarChart3, 
  Sliders, 
  Copy, 
  Terminal,
  Clock,
  Eye,
  EyeOff,
  AlertTriangle
} from 'lucide-react';
import { 
  ADMIN_EMAIL, 
  fetchAdminDashboardData, 
  updateSystemSettings, 
  quickLoginAsAdmin,
  isSupabaseConnected 
} from '../lib/supabaseClient';
import { AVAILABLE_MODELS, testNvidiaConnection, getNvidiaApiKey } from '../lib/nvidiaClient';
import NvidiaLogo from './NvidiaLogo';

export default function AdminPanel({
  isOpen,
  onClose,
  currentUser,
  onLoginAsAdmin,
  onSettingsUpdated
}) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'users' | 'chats' | 'nvidia' | 'announcements' | 'logs' | 'schema'
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [pingResult, setPingResult] = useState(null);
  const [isPinging, setIsPinging] = useState(false);
  const [selectedChatView, setSelectedChatView] = useState(null);
  const [copiedSchema, setCopiedSchema] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Form states for system settings
  const [announcement, setAnnouncement] = useState('');
  const [announcementType, setAnnouncementType] = useState('info');
  const [defaultModel, setDefaultModel] = useState('nvidia/nemotron-3-ultra-550b-a55b');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [masterApiKey, setMasterApiKey] = useState(getNvidiaApiKey());
  const [showMasterKey, setShowMasterKey] = useState(false);

  const isAuthorized = currentUser?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  const loadData = async () => {
    if (!isAuthorized) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await fetchAdminDashboardData(currentUser);
      setDashboardData(data);
      if (data.settings) {
        const customAnnounce = localStorage.getItem("edith_system_announcement");
        const customType = localStorage.getItem("edith_announcement_type");
        const initialText = customAnnounce !== null ? customAnnounce : (data.settings.system_announcement || '');
        setAnnouncement(initialText.replace(/AETHER/g, 'EDITH AI'));
        setAnnouncementType(customType || data.settings.announcement_type || 'info');
        setDefaultModel(data.settings.default_model || 'nvidia/nemotron-3-ultra-550b-a55b');
        setMaintenanceMode(Boolean(data.settings.maintenance_mode));
        if (data.settings.nvidia_api_key) {
          setMasterApiKey(data.settings.nvidia_api_key);
          localStorage.setItem('aether_system_master_nvidia_key', data.settings.nvidia_api_key);
          localStorage.setItem('aether_nvidia_api_key', data.settings.nvidia_api_key);
        }
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load admin telemetry');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && isAuthorized) {
      loadData();
    }
  }, [isOpen, isAuthorized]);

  const handleSaveMasterKey = async (e) => {
    e?.preventDefault();
    if (!masterApiKey.trim()) return;
    localStorage.setItem('aether_system_master_nvidia_key', masterApiKey.trim());
    localStorage.setItem('aether_nvidia_api_key', masterApiKey.trim());
    try {
      await updateSystemSettings(currentUser, { nvidia_api_key: masterApiKey.trim() });
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 2500);
      loadData();
    } catch (err) {
      alert("Error saving master key: " + err.message);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      const updated = await updateSystemSettings(currentUser, {
        system_announcement: announcement,
        announcement_type: announcementType,
        default_model: defaultModel,
        maintenance_mode: maintenanceMode
      });
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 2500);
      loadData();
      if (onSettingsUpdated) {
        onSettingsUpdated(updated);
      }
    } catch (err) {
      alert("Error saving settings: " + err.message);
    }
  };

  const handleTestNvidia = async () => {
    setIsPinging(true);
    setPingResult(null);
    const res = await testNvidiaConnection(masterApiKey);
    setPingResult(res);
    setIsPinging(false);
  };

  const handleCopySchema = () => {
    const schemaText = `-- Supabase SQL Schema for AETHER AI
-- Run in Supabase SQL Editor
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.chats (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT DEFAULT 'New Conversation',
  model TEXT DEFAULT 'meta/llama-3.3-70b-instruct',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.messages (
  id TEXT PRIMARY KEY,
  chat_id TEXT REFERENCES public.chats(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  model TEXT,
  tokens_used INTEGER DEFAULT 0,
  latency_ms INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.api_usage_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  model TEXT NOT NULL,
  prompt_tokens INTEGER DEFAULT 0,
  completion_tokens INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  latency_ms INTEGER DEFAULT 0,
  status TEXT DEFAULT 'success',
  created_at TIMESTAMPTZ DEFAULT NOW()
);`;
    navigator.clipboard.writeText(schemaText);
    setCopiedSchema(true);
    setTimeout(() => setCopiedSchema(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-xl animate-in fade-in duration-200">
      
      {/* Modal Backdrop Container */}
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col liquid-glass-panel rounded-3xl border border-white/20 shadow-2xl overflow-hidden backdrop-blur-3xl">
        
        {/* Top Header Bar */}
        <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center space-x-3">
            <img
              src="/edith-logo.jpg"
              alt="EDITH"
              className="w-10 h-10 rounded-xl object-cover border border-emerald-500/30 shadow-sm shadow-emerald-500/20"
            />
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  EDITH // Root Administration
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-400/15 border border-amber-400/30 text-amber-300 font-semibold uppercase">
                  Protected
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Single-tenant administrator: <span className="text-slate-300 font-medium">{ADMIN_EMAIL}</span>
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ACCESS VERIFICATION BARRIER */}
        {!isAuthorized ? (
          
          /* Strict Access Denied Screen */
          <div className="p-8 sm:p-12 flex flex-col items-center justify-center text-center space-y-5 flex-1">
            <div className="relative">
              <div className="w-20 h-20 rounded-3xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center shadow-2xl shadow-rose-500/30">
                <Lock className="w-10 h-10 text-rose-400 animate-pulse" />
              </div>
              <div className="absolute -inset-2 bg-rose-500/20 rounded-full blur-xl -z-10" />
            </div>

            <div className="max-w-md space-y-2">
              <h3 className="text-xl font-extrabold text-white">
                Access Denied: Restricted Administrative Sector
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Security Policy: Only the designated administrator account (<span className="text-amber-300 font-mono font-bold">{ADMIN_EMAIL}</span>) is granted permission to inspect users, conversations, model keys, and system telemetry.
              </p>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-400 text-left mt-3">
                <div>Current Session: <span className="text-white font-medium">{currentUser?.email || "Unauthenticated / Guest"}</span></div>
                <div>Status: <span className="text-rose-400 font-bold">Unauthorized</span></div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                onClick={async () => {
                  await quickLoginAsAdmin();
                  if (onLoginAsAdmin) onLoginAsAdmin();
                }}
                className="liquid-glass-btn-primary px-5 py-2.5 rounded-xl text-xs font-bold text-white flex items-center space-x-2"
              >
                <Unlock className="w-4 h-4" />
                <span>Log In as Rishabh ({ADMIN_EMAIL})</span>
              </button>
              <button
                onClick={onClose}
                className="liquid-glass-btn px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white"
              >
                Return to Chat
              </button>
            </div>
          </div>
        ) : (
          
          /* AUTHORIZED ADMIN CONTROL CENTER */
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            
            {/* Sidebar Navigation Tabs */}
            <div className="w-full md:w-56 border-b md:border-b-0 md:border-r border-white/10 p-3 flex md:flex-col space-x-1 md:space-x-0 md:space-y-1 overflow-x-auto bg-black/20">
              <button
                onClick={() => setActiveTab('overview')}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2.5 transition-all ${
                  activeTab === 'overview' ? 'bg-amber-500/20 text-amber-200 border border-amber-400/40' : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Activity className="w-4 h-4 text-amber-400" />
                <span>Overview & Stats</span>
              </button>

              <button
                onClick={() => setActiveTab('users')}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2.5 transition-all ${
                  activeTab === 'users' ? 'bg-amber-500/20 text-amber-200 border border-amber-400/40' : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Users className="w-4 h-4 text-cyan-400" />
                <span>User Directory</span>
              </button>

              <button
                onClick={() => setActiveTab('chats')}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2.5 transition-all ${
                  activeTab === 'chats' ? 'bg-amber-500/20 text-amber-200 border border-amber-400/40' : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <MessageSquare className="w-4 h-4 text-purple-400" />
                <span>Chat Surveillance</span>
              </button>

              <button
                onClick={() => setActiveTab('nvidia')}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2.5 transition-all ${
                  activeTab === 'nvidia' ? 'bg-amber-500/20 text-amber-200 border border-amber-400/40' : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Cpu className="w-4 h-4 text-emerald-400" />
                <span>NVIDIA Engine</span>
              </button>

              <button
                onClick={() => setActiveTab('announcements')}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2.5 transition-all ${
                  activeTab === 'announcements' ? 'bg-amber-500/20 text-amber-200 border border-amber-400/40' : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Bell className="w-4 h-4 text-pink-400" />
                <span>Announcements</span>
              </button>

              <button
                onClick={() => setActiveTab('logs')}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2.5 transition-all ${
                  activeTab === 'logs' ? 'bg-amber-500/20 text-amber-200 border border-amber-400/40' : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <BarChart3 className="w-4 h-4 text-blue-400" />
                <span>API Telemetry</span>
              </button>

              <button
                onClick={() => setActiveTab('schema')}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2.5 transition-all ${
                  activeTab === 'schema' ? 'bg-amber-500/20 text-amber-200 border border-amber-400/40' : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Database className="w-4 h-4 text-orange-400" />
                <span>Supabase Schema</span>
              </button>
            </div>

            {/* Main Content View */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
              
              {/* TAB 1: OVERVIEW METRICS */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Metric Tiles */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <div className="liquid-glass-card rounded-2xl p-4 border border-white/10">
                      <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                        <span>Total Users</span>
                        <Users className="w-4 h-4 text-cyan-400" />
                      </div>
                      <div className="text-2xl font-extrabold text-white">
                        {dashboardData?.metrics?.totalUsers || 2}
                      </div>
                      <div className="text-[10px] text-cyan-300 mt-1">Supabase Profiles</div>
                    </div>

                    <div className="liquid-glass-card rounded-2xl p-4 border border-white/10">
                      <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                        <span>Total Chats</span>
                        <MessageSquare className="w-4 h-4 text-purple-400" />
                      </div>
                      <div className="text-2xl font-extrabold text-white">
                        {dashboardData?.metrics?.totalChats || 0}
                      </div>
                      <div className="text-[10px] text-purple-300 mt-1">Live Discussions</div>
                    </div>

                    <div className="liquid-glass-card rounded-2xl p-4 border border-white/10">
                      <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                        <span>Tokens Streamed</span>
                        <Zap className="w-4 h-4 text-amber-400" />
                      </div>
                      <div className="text-2xl font-extrabold text-white">
                        {(dashboardData?.metrics?.totalTokens || 0).toLocaleString()}
                      </div>
                      <div className="text-[10px] text-amber-300 mt-1">NVIDIA NIM Credits</div>
                    </div>

                    <div className="liquid-glass-card rounded-2xl p-4 border border-white/10">
                      <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                        <span>Avg Latency</span>
                        <Clock className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div className="text-2xl font-extrabold text-white">
                        {dashboardData?.metrics?.avgLatency || 320} ms
                      </div>
                      <div className="text-[10px] text-emerald-300 mt-1">TensorRT-LLM Speed</div>
                    </div>
                  </div>

                  {/* System Health Status Grid */}
                  <div className="liquid-glass-panel rounded-2xl p-5 border border-white/15 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                        <Activity className="w-4 h-4 text-cyan-400" />
                        <span>Infrastructure Health Matrix</span>
                      </h3>
                      <button 
                        onClick={loadData}
                        className="liquid-pill px-2.5 py-1 text-xs text-slate-300 hover:text-white flex items-center space-x-1"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Refresh</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                        <span className="text-slate-300">Supabase DB</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isSupabaseConnected() ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                        }`}>
                          {isSupabaseConnected() ? 'Live Connected' : 'Local Fallback'}
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                        <span className="text-slate-300">NVIDIA NIM API</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          getNvidiaApiKey() ? 'bg-cyan-500/20 text-cyan-300' : 'bg-purple-500/20 text-purple-300'
                        }`}>
                          {getNvidiaApiKey() ? 'Key Active' : 'Demo Simulator'}
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                        <span className="text-slate-300">Admin Security</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300">
                          Verified ({ADMIN_EMAIL})
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: USER DIRECTORY */}
              {activeTab === 'users' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-white">Registered Users</h3>
                      <p className="text-xs text-slate-400">Total: {dashboardData?.users?.length || 0} registered entities</p>
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-white/15">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-white/10 uppercase text-[10px] text-slate-400 tracking-wider">
                        <tr>
                          <th className="p-3">User</th>
                          <th className="p-3">Role</th>
                          <th className="p-3">Registered</th>
                          <th className="p-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10">
                        {(dashboardData?.users || []).map((u) => (
                          <tr key={u.id} className="hover:bg-white/5 transition-colors">
                            <td className="p-3 flex items-center space-x-2.5">
                              <img 
                                src={u.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${u.email}`} 
                                alt="Avatar" 
                                className="w-7 h-7 rounded-full border border-white/20 bg-slate-800" 
                              />
                              <div>
                                <div className="font-semibold text-white">{u.full_name || u.email.split('@')[0]}</div>
                                <div className="text-[11px] text-slate-400 font-mono">{u.email}</div>
                              </div>
                            </td>
                            <td className="p-3">
                              {u.email.toLowerCase() === ADMIN_EMAIL.toLowerCase() ? (
                                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-[10px] border border-amber-400/40">
                                  <Crown className="w-3 h-3" />
                                  <span>SuperAdmin</span>
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full bg-slate-700/50 text-slate-300 text-[10px]">
                                  User
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-slate-400">
                              {new Date(u.created_at || Date.now()).toLocaleDateString()}
                            </td>
                            <td className="p-3">
                              <span className="inline-flex items-center space-x-1 text-emerald-400 font-medium">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                <span>Active</span>
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 3: CHAT SURVEILLANCE */}
              {activeTab === 'chats' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-white">Conversation Surveillance</h3>
                      <p className="text-xs text-slate-400">Inspect user prompts and AI responses across all active chats</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Chat selection list */}
                    <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                      {(dashboardData?.chats || []).length === 0 ? (
                        <div className="text-center py-10 text-xs text-slate-400">No chat sessions recorded yet.</div>
                      ) : (
                        (dashboardData?.chats || []).map((chat) => (
                          <div
                            key={chat.id}
                            onClick={() => setSelectedChatView(chat)}
                            className={`p-3 rounded-xl border cursor-pointer transition-all ${
                              selectedChatView?.id === chat.id 
                                ? 'bg-purple-500/20 border-cyan-400/50 text-white' 
                                : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-xs truncate">{chat.title || 'Untitled Conversation'}</span>
                              <span className="text-[10px] text-slate-400">{new Date(chat.created_at || Date.now()).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center space-x-2 mt-1.5 text-[11px] text-slate-400">
                              <span>Model: {chat.model || 'meta/llama-3.3-70b-instruct'}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Chat messages preview inspector */}
                    <div className="liquid-glass-card rounded-2xl p-4 border border-white/15 max-h-96 overflow-y-auto">
                      {selectedChatView ? (
                        <div className="space-y-3">
                          <div className="border-b border-white/10 pb-2">
                            <h4 className="text-xs font-bold text-white">{selectedChatView.title}</h4>
                            <span className="text-[10px] text-cyan-300 font-mono">ID: {selectedChatView.id}</span>
                          </div>
                          
                          <div className="space-y-2.5">
                            {(dashboardData?.messages || [])
                              .filter(m => m.chat_id === selectedChatView.id)
                              .map((m) => (
                                <div key={m.id} className={`p-2.5 rounded-xl text-xs ${
                                  m.role === 'user' ? 'bg-cyan-500/10 border border-cyan-400/20 text-cyan-100' : 'bg-purple-500/10 border border-purple-400/20 text-purple-100'
                                }`}>
                                  <div className="text-[10px] font-bold uppercase mb-1 opacity-70">
                                    {m.role === 'user' ? 'User' : 'Assistant (NVIDIA NIM)'}
                                  </div>
                                  <p className="whitespace-pre-wrap">{m.content}</p>
                                </div>
                              ))}
                          </div>
                        </div>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center text-xs text-slate-400 py-12">
                          <Eye className="w-8 h-8 text-slate-600 mb-2" />
                          <span>Select a conversation from the left to inspect logs</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: NVIDIA NIM CONFIG */}
              {activeTab === 'nvidia' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-bold text-white">NVIDIA NIM Neural Engine Settings</h3>
                    <p className="text-xs text-slate-400">Configure global platform API key, model routing, and latency</p>
                  </div>

                  {/* Platform Master NVIDIA API Key */}
                  <div className="liquid-glass-panel rounded-2xl p-5 border border-amber-400/30 space-y-3 bg-amber-500/[0.04]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Crown className="w-4 h-4 text-amber-400" />
                        <span className="text-xs font-bold text-white">Platform Master NVIDIA API Key</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-mono font-bold">
                        POWERS ALL USERS
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      Every visitor and registered user will chat using this master key. Normal users are never asked for an API key.
                    </p>
                    <div className="relative">
                      <input
                        type={showMasterKey ? 'text' : 'password'}
                        value={masterApiKey}
                        onChange={(e) => setMasterApiKey(e.target.value)}
                        placeholder="nvapi-..."
                        className="w-full liquid-glass-input rounded-xl px-3.5 py-2.5 pr-10 text-xs font-mono text-white placeholder-slate-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowMasterKey(!showMasterKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      >
                        {showMasterKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <div className="flex items-center space-x-3 pt-1">
                      <button
                        type="button"
                        onClick={handleSaveMasterKey}
                        className="liquid-glass-btn-primary px-4 py-2 rounded-xl text-xs font-bold text-white flex items-center space-x-1.5"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Save Master Key</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleTestNvidia}
                        disabled={isPinging || !masterApiKey}
                        className="liquid-pill px-4 py-2 text-xs text-slate-200 hover:text-white flex items-center space-x-1.5"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isPinging ? 'animate-spin' : ''}`} />
                        <span>{isPinging ? 'Pinging NIM...' : 'Test Connection'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Latency Ping Result */}
                  {pingResult && (
                    <div className={`p-3 rounded-xl border text-xs ${
                      pingResult.success 
                        ? 'bg-emerald-500/10 border-emerald-400/30 text-emerald-200' 
                        : 'bg-rose-500/10 border-rose-400/30 text-rose-200'
                    }`}>
                      <div className="font-bold flex items-center justify-between">
                        <span>{pingResult.success ? '✓ Connection Verified & Active' : '✕ Connection Error'}</span>
                        <span className="font-mono">{pingResult.latency} ms</span>
                      </div>
                      <p className="mt-1 text-[11px] opacity-90">
                        {pingResult.reply || pingResult.message}
                      </p>
                    </div>
                  )}

                  {/* Model Management Form */}
                  <form onSubmit={handleSaveSettings} className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">
                        Global Default Model
                      </label>
                      <select
                        value={defaultModel}
                        onChange={(e) => setDefaultModel(e.target.value)}
                        className="w-full liquid-glass-input rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                      >
                        {AVAILABLE_MODELS.map(m => (
                          <option key={m.id} value={m.id} className="bg-slate-900 text-white">
                            {m.name} ({m.tag})
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="submit"
                      className="liquid-glass-btn-primary px-4 py-2 rounded-xl text-xs font-bold text-white flex items-center space-x-2"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{settingsSaved ? 'Settings Updated!' : 'Save Engine Settings'}</span>
                    </button>
                  </form>
                </div>
              )}

              {/* TAB 5: ANNOUNCEMENTS */}
              {activeTab === 'announcements' && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-sm font-bold text-white">Global Broadcast Announcements</h3>
                    <p className="text-xs text-slate-400">Publish alerts visible across all user chat screens</p>
                  </div>

                  <form onSubmit={handleSaveSettings} className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">
                        Announcement Text
                      </label>
                      <textarea
                        value={announcement}
                        onChange={(e) => setAnnouncement(e.target.value)}
                        rows={3}
                        placeholder="e.g. ✨ KMP 1.0 (Powered by NVIDIA) updated to latest weights!"
                        className="w-full liquid-glass-input rounded-xl p-3 text-xs text-white placeholder-slate-400 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1.5">
                          Alert Level
                        </label>
                        <select
                          value={announcementType}
                          onChange={(e) => setAnnouncementType(e.target.value)}
                          className="w-full liquid-glass-input rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                        >
                          <option value="info" className="bg-slate-900">Info (Cyan Gradient)</option>
                          <option value="warning" className="bg-slate-900">Warning (Amber Gradient)</option>
                          <option value="success" className="bg-slate-900">Success (Emerald Gradient)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1.5">
                          Maintenance Mode
                        </label>
                        <button
                          type="button"
                          onClick={() => setMaintenanceMode(!maintenanceMode)}
                          className={`w-full py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                            maintenanceMode 
                              ? 'bg-rose-500/20 border-rose-400/50 text-rose-300' 
                              : 'bg-emerald-500/20 border-emerald-400/50 text-emerald-300'
                          }`}
                        >
                          {maintenanceMode ? 'Maintenance Mode ACTIVE' : 'System ONLINE & Healthy'}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 pt-2">
                      <button
                        type="submit"
                        className="liquid-glass-btn-primary px-5 py-2.5 rounded-xl text-xs font-bold text-white flex items-center space-x-2"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{settingsSaved ? 'Broadcast Published!' : 'Publish Broadcast'}</span>
                      </button>

                      {announcement && (
                        <button
                          type="button"
                          onClick={async () => {
                            setAnnouncement('');
                            const updated = await updateSystemSettings(currentUser, {
                              system_announcement: '',
                              announcement_type: announcementType,
                              default_model: defaultModel,
                              maintenance_mode: maintenanceMode
                            });
                            if (onSettingsUpdated) onSettingsUpdated(updated);
                            setSettingsSaved(true);
                            setTimeout(() => setSettingsSaved(false), 2000);
                          }}
                          className="px-4 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
                        >
                          Clear Broadcast
                        </button>
                      )}
                    </div>
                  </form>
                </div>
              )}

              {/* TAB 6: TELEMETRY LOGS */}
              {activeTab === 'logs' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-white">API Usage & Inference Telemetry</h3>
                      <p className="text-xs text-slate-400">Stream logs, tokens consumed, and latency audit trail</p>
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-white/15">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-white/10 uppercase text-[10px] text-slate-400 tracking-wider">
                        <tr>
                          <th className="p-3">Time</th>
                          <th className="p-3">Model</th>
                          <th className="p-3">Prompt</th>
                          <th className="p-3">Completion</th>
                          <th className="p-3">Total</th>
                          <th className="p-3">Latency</th>
                          <th className="p-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10">
                        {(dashboardData?.logs || []).slice(0, 20).map((log) => (
                          <tr key={log.id} className="hover:bg-white/5 transition-colors font-mono text-[11px]">
                            <td className="p-3 text-slate-400">{new Date(log.created_at).toLocaleTimeString()}</td>
                            <td className="p-3 text-cyan-300 truncate max-w-[140px]">{log.model}</td>
                            <td className="p-3">{log.prompt_tokens}</td>
                            <td className="p-3">{log.completion_tokens}</td>
                            <td className="p-3 font-bold text-white">{log.total_tokens}</td>
                            <td className="p-3 text-emerald-400">{log.latency_ms} ms</td>
                            <td className="p-3">
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-sans">
                                {log.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 7: SUPABASE SCHEMA COPIER */}
              {activeTab === 'schema' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-white">Supabase SQL Schema & RLS Setup</h3>
                      <p className="text-xs text-slate-400">Copy this SQL script to create tables and RLS security policies in Supabase</p>
                    </div>
                    <button
                      onClick={handleCopySchema}
                      className="liquid-glass-btn-primary px-3 py-1.5 rounded-xl text-xs font-semibold text-white flex items-center space-x-1.5"
                    >
                      {copiedSchema ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedSchema ? 'Copied to Clipboard!' : 'Copy SQL Script'}</span>
                    </button>
                  </div>

                  <div className="p-4 rounded-2xl bg-black/60 border border-white/15 text-xs font-mono text-slate-300 overflow-x-auto max-h-96">
                    <pre>
                      <code>{`-- 1. Create Profiles Table
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Chats Table
CREATE TABLE public.chats (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT DEFAULT 'New Conversation',
  model TEXT DEFAULT 'meta/llama-3.3-70b-instruct',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Messages Table
CREATE TABLE public.messages (
  id TEXT PRIMARY KEY,
  chat_id TEXT REFERENCES public.chats(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  model TEXT,
  tokens_used INTEGER DEFAULT 0,
  latency_ms INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 5. Exclusive Admin Policy for ${ADMIN_EMAIL}
CREATE POLICY "Admin full access" ON public.chats
  FOR ALL USING (auth.jwt() ->> 'email' = '${ADMIN_EMAIL}');`}</code>
                    </pre>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
