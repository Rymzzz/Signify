import React, { useState } from 'react';
import { 
  X, 
  User, 
  ShieldCheck, 
  Lock, 
  Mail, 
  ArrowRight, 
  Sparkles, 
  Database, 
  CheckCircle2, 
  AlertCircle,
  KeyRound
} from 'lucide-react';
import { authSyncService } from '../services/authSyncService';
import { UserProfile, UserRole } from '../types/index';
import { SignifyLogo } from './SignifyLogo';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRole?: UserRole;
  onSuccess: (user: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultRole = 'user',
  onSuccess
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'admin'>(
    defaultRole === 'admin' ? 'admin' : 'login'
  );

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      if (activeTab === 'login') {
        const user = await authSyncService.login(email, password, 'user');
        onSuccess(user);
        onClose();
      } else if (activeTab === 'register') {
        if (!displayName.trim()) throw new Error('Please enter your name.');
        const user = await authSyncService.register(displayName, email, password, 'user');
        onSuccess(user);
        onClose();
      } else if (activeTab === 'admin') {
        const user = await authSyncService.login(email, password, 'admin');
        onSuccess(user);
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div 
        className="bg-[#071F15] border border-[#164432] rounded-3xl w-full max-w-md shadow-2xl overflow-hidden my-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#0B2A1E] border-b border-[#164432] px-6 py-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <SignifyLogo className="w-10 h-10 rounded-2xl shadow-md" glow />
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">Signify Account Portal</h3>
              <p className="text-[11px] text-emerald-300/80">Cross-Device Progress Synchronization</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-[#071F15] hover:bg-[#123828] border border-[#164432] text-emerald-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher (Learner Login / Register / Admin Login) */}
        <div className="p-6 pb-2">
          <div className="grid grid-cols-3 gap-1 bg-[#05160E] border border-[#164432] rounded-2xl p-1 text-xs font-semibold">
            <button
              onClick={() => { setActiveTab('login'); setErrorMsg(null); }}
              className={`py-2 rounded-xl transition-all cursor-pointer ${
                activeTab === 'login'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm'
                  : 'text-emerald-300/70 hover:text-white'
              }`}
            >
              Learner Sign In
            </button>

            <button
              onClick={() => { setActiveTab('register'); setErrorMsg(null); }}
              className={`py-2 rounded-xl transition-all cursor-pointer ${
                activeTab === 'register'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm'
                  : 'text-emerald-300/70 hover:text-white'
              }`}
            >
              Sign Up
            </button>

            <button
              onClick={() => { setActiveTab('admin'); setErrorMsg(null); }}
              className={`py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 ${
                activeTab === 'admin'
                  ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-sm'
                  : 'text-amber-400/80 hover:text-amber-300'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin</span>
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleAuthSubmit} className="p-6 pt-3 space-y-4">
          {errorMsg && (
            errorMsg.includes('NO_ACCOUNT_FOUND') ? (
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-2.5">
                <div className="flex items-center gap-2 font-bold text-amber-300">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>Account Not Found</span>
                </div>
                <p className="text-[11px] text-emerald-100/80 leading-relaxed">
                  No registered account was found with <span className="font-mono text-white font-bold">{email}</span>. Please register to begin your ASL learning journey.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('register');
                    setErrorMsg(null);
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md hover:from-emerald-500 hover:to-teal-500 transition-all"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Create Account with {email || 'this Email'}</span>
                </button>
              </div>
            ) : errorMsg.includes('ACCOUNT_EXISTS') ? (
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 text-xs space-y-2.5">
                <div className="flex items-center gap-2 font-bold text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>Account Already Exists</span>
                </div>
                <p className="text-[11px] text-emerald-100/80 leading-relaxed">
                  An account with <span className="font-mono text-white font-bold">{email}</span> already exists.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('login');
                    setErrorMsg(null);
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md hover:from-emerald-500 hover:to-teal-500 transition-all"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>Sign In Instead</span>
                </button>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMsg.replace(/^[A-Z_]+:\s*/, '')}</span>
              </div>
            )
          )}

          {activeTab === 'register' && (
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-emerald-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Rivera"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-[#05160E] border border-[#164432] rounded-xl text-xs text-white placeholder-emerald-400/50 focus:outline-none focus:border-emerald-400"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider">
              {activeTab === 'admin' ? 'Admin Institutional Email' : 'Email Address'}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-emerald-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder={activeTab === 'admin' ? 'admin@signify.edu' : 'learner@example.com'}
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-[#05160E] border border-[#164432] rounded-xl text-xs text-white placeholder-emerald-400/50 focus:outline-none focus:border-emerald-400"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-emerald-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-[#05160E] border border-[#164432] rounded-xl text-xs text-white placeholder-emerald-400/50 focus:outline-none focus:border-emerald-400"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-xl font-bold text-xs text-white shadow-lg flex items-center justify-center space-x-2 transition-all cursor-pointer ${
              activeTab === 'admin'
                ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 shadow-amber-900/30'
                : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-900/30'
            }`}
          >
            <span>
              {loading 
                ? 'Authenticating...' 
                : activeTab === 'login' 
                  ? 'Sign In to Dashboard' 
                  : activeTab === 'register' 
                    ? 'Create My Account' 
                    : 'Access Admin Dashboard'}
            </span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          {/* Alternate Switch Link */}
          <div className="pt-3 text-center text-xs text-emerald-300/80 border-t border-[#164432]/60">
            {activeTab === 'login' ? (
              <p>
                Don't have an account yet?{' '}
                <button
                  type="button"
                  onClick={() => { setActiveTab('register'); setErrorMsg(null); }}
                  className="font-bold text-emerald-400 hover:underline cursor-pointer"
                >
                  Create an account
                </button>
              </p>
            ) : activeTab === 'register' ? (
              <p>
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => { setActiveTab('login'); setErrorMsg(null); }}
                  className="font-bold text-emerald-400 hover:underline cursor-pointer"
                >
                  Sign in to your account
                </button>
              </p>
            ) : (
              <p>
                Need learner access?{' '}
                <button
                  type="button"
                  onClick={() => { setActiveTab('login'); setErrorMsg(null); }}
                  className="font-bold text-emerald-400 hover:underline cursor-pointer"
                >
                  Switch to Learner Portal
                </button>
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
