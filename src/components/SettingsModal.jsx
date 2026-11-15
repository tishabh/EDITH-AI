import React, { useState } from 'react';
import { 
  X, 
  Key, 
  Database, 
  ExternalLink, 
  Check, 
  Eye, 
  EyeOff, 
  Sparkles, 
  RefreshCw, 
  HelpCircle,
  Palette,
  ShieldCheck
} from 'lucide-react';
import { getNvidiaApiKey, setNvidiaApiKey, testNvidiaConnection } from '../lib/nvidiaClient';
import { getSupabaseCredentials, setSupabaseCredentials, isSupabaseConnected } from '../lib/supabaseClient';

export default function SettingsModal({
  isOpen,
  onClose,
  onSettingsSaved
}) {
  const [activeTab, setActiveTab] = useState('nvidia'); // 'nvidia' | 'supabase' | 'appearance'
  
  // NVIDIA Key State
  const [nvidiaKey, setNvidiaKeyInput] = useState(getNvidiaApiKey());
  const [showKey, setShowKey] = useState(false);
  const [testingKey, setTestingKey] = useState(false);
  const [testResult, setTestResult] = useState(null);

  // Supabase State
  const initialSupabase = getSupabaseCredentials();
  const [supabaseUrl, setSupabaseUrl] = useState(initialSupabase.url);
  const [supabaseKey, setSupabaseKey] = useState(initialSupabase.key);
  const [showSupabaseKey, setShowSupabaseKey] = useState(false);

  // Feedback banner
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSaveNvidiaKey = (e) => {
    e.preventDefault();
    setNvidiaApiKey(nvidiaKey);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
    if (onSettingsSaved) onSettingsSaved();
  };

  const handleTestNvidia = async () => {
    setTestingKey(true);
    setTestResult(null);
    const res = await testNvidiaConnection(nvidiaKey);
    setTestResult(res);
    setTestingKey(false);
  };

  const handleSaveSupabase = (e) => {
    e.preventDefault();
    setSupabaseCredentials(supabaseUrl, supabaseKey);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
    if (onSettingsSaved) onSettingsSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-xl animate-in fade-in duration-200">
      
      <div className="relative w-full max-w-xl liquid-glass-panel rounded-3xl border border-white/20 shadow-2xl overflow-hidden backdrop-blur-3xl">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-400 to-purple-500 text-slate-950 font-bold">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">System Configuration</h3>
              <p className="text-xs text-slate-400">Manage your free NVIDIA NIM API key & Supabase backend</p>
            </div>
          </div>

          <button onClick={onClose} className="liquid-pill p-2 text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-white/10 px-6 pt-2 bg-white/[0.02]">
          <button
            onClick={() => setActiveTab('nvidia')}
            className={`py-2 px-4 text-xs font-semibold border-b-2 flex items-center space-x-1.5 transition-colors ${
              activeTab === 'nvidia' 
                ? 'border-cyan-400 text-cyan-300' 
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>NVIDIA API Key</span>
          </button>

          <button
            onClick={() => setActiveTab('supabase')}
            className={`py-2 px-4 text-xs font-semibold border-b-2 flex items-center space-x-1.5 transition-colors ${
              activeTab === 'supabase' 
                ? 'border-emerald-400 text-emerald-300' 
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Supabase Database</span>
          </button>
        </div>

        {/* Saved Success Banner */}
        {savedSuccess && (
          <div className="bg-emerald-500/20 border-b border-emerald-400/30 px-6 py-2 text-xs text-emerald-200 flex items-center space-x-2 animate-in slide-in-from-top duration-200">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>Settings saved successfully!</span>
          </div>
        )}

        {/* Content Area */}
        <div className="p-6 space-y-6">
          
          {/* TAB 1: NVIDIA API KEY */}
          {activeTab === 'nvidia' && (
            <form onSubmit={handleSaveNvidiaKey} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-slate-200">
                    NVIDIA API Key
                  </label>
                  <a
                    href="https://build.nvidia.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-cyan-400 hover:underline flex items-center space-x-1"
                  >
                    <span>Get Free Key (1,000 Credits)</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>

                <div className="relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    placeholder="nvapi-..."
                    value={nvidiaKey}
                    onChange={(e) => setNvidiaKeyInput(e.target.value)}
                    className="w-full liquid-glass-input rounded-xl px-3.5 py-2.5 pr-10 text-xs font-mono text-white placeholder-slate-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                  Keys are stored safely in your browser's encrypted localStorage. If left blank, EDITH AI operates in an interactive demonstration simulator.
                </p>
              </div>

              {testResult && (
                <div className={`p-3 rounded-xl border text-xs ${
                  testResult.success 
                    ? 'bg-emerald-500/10 border-emerald-400/30 text-emerald-200' 
                    : 'bg-rose-500/10 border-rose-400/30 text-rose-200'
                }`}>
                  <div className="font-bold flex items-center justify-between">
                    <span>{testResult.success ? '✓ Key Validated Successfully' : '✕ Connection Error'}</span>
                    <span className="font-mono">{testResult.latency} ms</span>
                  </div>
                  <p className="mt-1 text-[11px] opacity-90">{testResult.reply || testResult.message}</p>
                </div>
              )}

              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="submit"
                  className="liquid-glass-btn-primary px-5 py-2.5 rounded-xl text-xs font-bold text-white flex items-center space-x-2"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save NVIDIA Key</span>
                </button>

                <button
                  type="button"
                  onClick={handleTestNvidia}
                  disabled={testingKey || !nvidiaKey}
                  className="liquid-pill px-4 py-2.5 text-xs text-slate-300 hover:text-white flex items-center space-x-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testingKey ? 'animate-spin' : ''}`} />
                  <span>{testingKey ? 'Testing...' : 'Test Connection'}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: SUPABASE DATABASE */}
          {activeTab === 'supabase' && (
            <form onSubmit={handleSaveSupabase} className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 text-xs">
                <div>
                  <div className="font-semibold text-white">Database Sync Status</div>
                  <div className="text-[11px] text-slate-400">
                    {isSupabaseConnected() ? 'Connected to live Supabase Postgres Cloud' : 'Running on browser local storage fallback'}
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  isSupabaseConnected() ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                }`}>
                  {isSupabaseConnected() ? 'Live Connected' : 'Local Fallback'}
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-200 mb-1.5">
                  Supabase Project URL
                </label>
                <input
                  type="text"
                  placeholder="https://your-project.supabase.co"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  className="w-full liquid-glass-input rounded-xl px-3.5 py-2.5 text-xs font-mono text-white placeholder-slate-500 focus:outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-slate-200">
                    Supabase Anon Public Key
                  </label>
                  <a
                    href="https://supabase.com/dashboard"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-emerald-400 hover:underline flex items-center space-x-1"
                  >
                    <span>Supabase Dashboard</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>

                <div className="relative">
                  <input
                    type={showSupabaseKey ? 'text' : 'password'}
                    placeholder="eyJhbGciOi..."
                    value={supabaseKey}
                    onChange={(e) => setSupabaseKey(e.target.value)}
                    className="w-full liquid-glass-input rounded-xl px-3.5 py-2.5 pr-10 text-xs font-mono text-white placeholder-slate-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSupabaseKey(!showSupabaseKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showSupabaseKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="liquid-glass-btn-primary px-5 py-2.5 rounded-xl text-xs font-bold text-white flex items-center space-x-2"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Supabase Credentials</span>
                </button>
              </div>
            </form>
          )}

        </div>

      </div>
    </div>
  );
}
