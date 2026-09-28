import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Camera, 
  Target, 
  BookOpen, 
  User, 
  Code2, 
  Flame, 
  Trophy, 
  Zap, 
  Maximize2, 
  Minimize2,
  Download,
  Sparkles,
  ShieldCheck,
  LogOut,
  LogIn
} from 'lucide-react';
import { SignifyLogo } from './SignifyLogo';
import { downloadJavaProjectsZip } from '../utils/zipExport';
import { UserProfile } from '../types/index';
import { Database, Info } from 'lucide-react';
import { FirebaseStatusModal } from './FirebaseStatusModal';
import { AboutModal } from './AboutModal';
import { firebaseRtdbService, RtdbConnectionStatus } from '../services/firebaseRtdbService';

export type TabType = 'welcome' | 'dashboard' | 'studio' | 'practice' | 'dictionary' | 'profile' | 'code-charter' | 'admin';

interface HeaderProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  user: UserProfile | null;
  onOpenLogin: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  user,
  onOpenLogin,
  onLogout,
}) => {
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showDbModal, setShowDbModal] = useState<boolean>(false);
  const [showAboutModal, setShowAboutModal] = useState<boolean>(false);
  const [dbStatus, setDbStatus] = useState<RtdbConnectionStatus | null>(firebaseRtdbService.getLastStatus());

  useEffect(() => {
    const unsub = firebaseRtdbService.subscribeStatus((st) => setDbStatus(st));
    if (!firebaseRtdbService.getLastStatus()) {
      firebaseRtdbService.testConnection().catch(() => {});
    }
    return unsub;
  }, []);

  const streak = user?.streak ?? 0;
  const trophies = user?.trophies ?? 0;
  const xp = user?.xp ?? 0;

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const navTabs: { id: TabType; label: string; icon: React.ComponentType<{ className?: string }> }[] = user
    ? [
        { id: 'dashboard', label: 'Homepage', icon: LayoutDashboard },
        { id: 'studio', label: 'Learn', icon: Camera },
        { id: 'practice', label: 'Speed Practice', icon: Target },
        { id: 'dictionary', label: 'Dictionary & Videos', icon: BookOpen },
        { id: 'profile', label: 'Profile', icon: User },
        ...(user.role === 'admin' ? [
          { id: 'admin' as TabType, label: 'Admin Portal', icon: ShieldCheck },
          { id: 'code-charter' as TabType, label: 'Code & Charter', icon: Code2 },
        ] : []),
      ]
    : [
        { id: 'welcome', label: 'Welcome Home', icon: LayoutDashboard },
        { id: 'dictionary', label: 'Dictionary & Demos', icon: BookOpen },
      ];

  return (
    <header className="bg-[#071F15] border-b border-[#143B2B] sticky top-0 z-40 px-3 sm:px-6 py-2.5 sm:py-3 shadow-lg">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2.5 sm:gap-4">
        
        {/* Left: Brand Logo & Title */}
        <div className="flex items-center justify-between w-full md:w-auto shrink-0">
          <div 
            onClick={() => onTabChange(user ? 'dashboard' : 'welcome')}
            className="flex items-center space-x-2.5 sm:space-x-3 cursor-pointer select-none group"
            title="Signify ASL Recognition"
          >
            <SignifyLogo className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl shadow-md shadow-black/40 group-hover:scale-105 transition-all" glow />
            <span className="text-xl sm:text-2xl font-black tracking-widest text-[#FF4D26] font-signify drop-shadow-sm group-hover:text-[#FF6644] transition-colors">
              SIGNIFY
            </span>
          </div>

          {/* Mobile Status Pills (Visible on small screens) */}
          {user && (
            <div className="flex md:hidden items-center space-x-2 text-xs">
              <span className="flex items-center gap-1 font-bold text-[#F97316] bg-[#0B2A1E] px-2.5 py-1 rounded-full border border-[#164432]">
                <Flame className="w-3.5 h-3.5" />
                {streak}d
              </span>
              <span className="flex items-center gap-1 font-bold text-emerald-400 bg-[#0B2A1E] px-2.5 py-1 rounded-full border border-[#164432]">
                <Zap className="w-3.5 h-3.5" />
                {xp}
              </span>
            </div>
          )}
        </div>

        {/* Center: Navigation Tabs */}
        <nav className="flex items-center space-x-1 sm:space-x-1.5 overflow-x-auto max-w-full pb-1 md:pb-0 scrollbar-none shrink-0">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center space-x-1 sm:space-x-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-[#F97316] text-white font-bold shadow-md shadow-orange-600/25'
                    : 'bg-[#0B2A1E] hover:bg-[#123828] text-emerald-100 border border-[#164432] font-medium'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-emerald-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right: User telemetry, Fullscreen & Auth Controls */}
        <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
          {user ? (
            <div className="flex items-center space-x-2">
              {/* Telemetry badges on desktop */}
              <div className="hidden lg:flex items-center space-x-2">
                <span className="flex items-center gap-1 font-mono font-bold text-xs text-[#F97316] bg-[#0B2A1E] px-2.5 py-1.5 rounded-xl border border-[#164432]">
                  <Flame className="w-3.5 h-3.5" />
                  <span>{streak}d</span>
                </span>
                <span className="flex items-center gap-1 font-mono font-bold text-xs text-emerald-400 bg-[#0B2A1E] px-2.5 py-1.5 rounded-xl border border-[#164432]">
                  <Zap className="w-3.5 h-3.5" />
                  <span>{xp} XP</span>
                </span>
              </div>

              {/* User Avatar & Logout */}
              <div className="flex items-center space-x-1.5 bg-[#0B2A1E] border border-[#164432] rounded-xl px-2.5 py-1">
                <span className="text-base">{user.avatar || '👤'}</span>
                <span className="text-xs font-bold text-white max-w-[90px] truncate hidden sm:inline">
                  {user.displayName.split(' ')[0]}
                </span>
                <button
                  onClick={onLogout}
                  className="p-1 hover:bg-[#123828] rounded-lg text-emerald-300 hover:text-rose-400 transition-colors cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={onOpenLogin}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In / Register</span>
            </button>
          )}

          {/* Firebase Realtime Database Status Pill (ADMINISTRATORS ONLY) */}
          {user?.role === 'admin' && (
            <button
              onClick={() => setShowDbModal(true)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                dbStatus?.status === 'CONNECTED'
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25'
                  : dbStatus?.status === 'PERMISSION_DENIED'
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 hover:bg-amber-500/25'
                  : 'bg-[#0B2A1E] border-[#164432] text-emerald-300/80 hover:bg-[#123828]'
              }`}
              title="Admin Portal: Firebase Realtime Database Diagnostics & Sync"
            >
              <Database className={`w-3.5 h-3.5 ${
                dbStatus?.status === 'CONNECTED' ? 'text-emerald-400' : dbStatus?.status === 'PERMISSION_DENIED' ? 'text-amber-400' : 'text-emerald-400'
              }`} />
              <span className="hidden lg:inline">
                {dbStatus?.status === 'CONNECTED' ? 'Online RTDB' : dbStatus?.status === 'PERMISSION_DENIED' ? 'RTDB (401)' : 'Firebase RTDB'}
              </span>
              <span className={`w-2 h-2 rounded-full ${
                dbStatus?.status === 'CONNECTED' ? 'bg-emerald-400 animate-pulse' : dbStatus?.status === 'PERMISSION_DENIED' ? 'bg-amber-400' : 'bg-emerald-400/40'
              }`} />
            </button>
          )}

          {/* About Signify Button */}
          <button
            onClick={() => setShowAboutModal(true)}
            className="p-2 rounded-xl bg-[#0B2A1E] hover:bg-[#123828] border border-[#164432] text-emerald-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold"
            title="About Signify Platform & Engineering Team"
          >
            <Info className="w-4 h-4 text-emerald-400" />
            <span className="hidden xl:inline">About</span>
          </button>

          {/* Fullscreen toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-[#0B2A1E] hover:bg-[#123828] border border-[#164432] text-emerald-300 hover:text-white transition-colors cursor-pointer"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>

      </div>

      {/* Admin Firebase Database Modal */}
      {user?.role === 'admin' && (
        <FirebaseStatusModal 
          isOpen={showDbModal} 
          onClose={() => setShowDbModal(false)} 
        />
      )}

      {/* About Signify Modal */}
      <AboutModal
        isOpen={showAboutModal}
        onClose={() => setShowAboutModal(false)}
      />
    </header>
  );
};
