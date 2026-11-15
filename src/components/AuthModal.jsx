import React, { useState } from 'react';
import { 
  X, 
  User, 
  Lock, 
  Mail, 
  AlertCircle, 
  ArrowRight
} from 'lucide-react';
import NvidiaLogo from './NvidiaLogo';
import { signIn, signUp } from '../lib/supabaseClient';

export default function AuthModal({
  isOpen,
  onClose,
  onAuthSuccess,
  pendingPrompt
}) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      let user;
      if (isSignUp) {
        user = await signUp(email, password, fullName);
      } else {
        try {
          user = await signIn(email, password);
        } catch (signInErr) {
          // If user account is not found or credentials invalid, automatically register and sign up seamlessly!
          const msg = (signInErr.message || '').toLowerCase();
          if (msg.includes('invalid') || msg.includes('not found') || msg.includes('credentials')) {
            user = await signUp(email, password, fullName || email.split('@')[0]);
          } else {
            throw signInErr;
          }
        }
      }
      onAuthSuccess(user);
      onClose();
    } catch (err) {
      setErrorMessage(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      
      <div className="relative w-full max-w-sm bg-[#0e1017] rounded-2xl border border-white/[0.12] shadow-2xl p-6 sm:p-7">
        
        {/* Close Button */}
        <button 
          onClick={onClose} 
          className="absolute right-4 top-4 p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/[0.06] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl overflow-hidden mx-auto mb-3 border border-emerald-500/30 shadow-md shadow-emerald-500/20">
            <img src="/edith-logo.jpg" alt="EDITH AI" className="w-full h-full object-cover" />
          </div>
          <h3 className="text-lg font-bold text-white tracking-tight">
            {isSignUp ? 'Create your account' : 'Welcome to EDITH'}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            {pendingPrompt 
              ? 'Sign in to send your query and unlock full conversation history.'
              : 'Sign in to access NVIDIA engines and cloud sync.'}
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-4 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {isSignUp && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-white/[0.2] rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-white/[0.2] rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-white/[0.2] rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg text-xs font-semibold text-slate-950 bg-white hover:bg-slate-200 flex items-center justify-center space-x-2 transition-colors mt-4"
          >
            <span>{loading ? 'Authenticating...' : (isSignUp ? 'Create Account' : 'Sign In')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Toggle Sign Up / Sign In */}
        <div className="mt-4 text-center text-xs text-slate-500">
          {isSignUp ? (
            <p>
              Already have an account?{' '}
              <button onClick={() => setIsSignUp(false)} className="text-white hover:underline font-medium">
                Sign In
              </button>
            </p>
          ) : (
            <p>
              Don't have an account?{' '}
              <button onClick={() => setIsSignUp(true)} className="text-white hover:underline font-medium">
                Sign Up
              </button>
            </p>
          )}
        </div>

      </div>
    </div>
  );
}
