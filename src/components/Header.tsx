import React, { useState } from 'react';
import { 
  Home, 
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
  Database
} from 'lucide-react';
import { SignifyLogo } from './SignifyLogo';
import { downloadJavaProjectsZip } from '../utils/zipExport';

export type TabType = 'home' | 'practice' | 'dictionary' | 'profile' | 'code-charter';

interface HeaderProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  streak?: number;
  trophies?: number;
  xp?: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  streak = 5,
  trophies = 12,
  xp = 200,
}) => {
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [downloading, setDownloading] = useState<boolean>(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const handleDownloadAllZip = async () => {
    setDownloading(true);
    try {
      await downloadJavaProjectsZip();
    } catch {
      // ignore
    } finally {
      setDownloading(false);
    }
  };

  const navTabs: { id: TabType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'practice', label: 'Practice', icon: Target },
    { id: 'dictionary', label: 'Dictionary', icon: BookOpen },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'code-charter', label: 'Code & Charter', icon: Code2 },
  ];

  return (
    <header className="bg-[#071F15] border-b border-[#143B2B] sticky top-0 z-40 px-4 sm:px-6 py-3 shadow-md">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        
        {/* Left: Brand Logo & Title */}
        <div className="flex items-center justify-between w-full md:w-auto">
          <div 
            onClick={() => onTabChange('home')}
            className="flex items-center space-x-3 cursor-pointer select-none group"
            title="Signify ASL Recognition"
          >
            <SignifyLogo className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl shadow-md shadow-black/40 group-hover:scale-105 transition-all" glow />
            <span className="text-xl sm:text-2xl font-black tracking-widest text-[#FF4D26] font-signify drop-shadow-sm group-hover:text-[#FF6644] transition-colors">
              SIGNIFY
            </span>
          </div>

          {/* Mobile Status Pills (Visible on small screens) */}
          <div className="flex md:hidden items-center space-x-2 text-xs">
            <span className="flex items-center gap-1 font-bold text-[#F97316] bg-[#0B2A1E] px-2.5 py-1 rounded-full border border-[#164432]">
              <Flame className="w-3.5 h-3.5" />
              {streak}
            </span>
            <span className="flex items-center gap-1 font-bold text-amber-400 bg-[#0B2A1E] px-2.5 py-1 rounded-full border border-[#164432]">
              <Trophy className="w-3.5 h-3.5" />
              {trophies}
            </span>
          </div>
        </div>

        {/* Center: Navigation Tabs (Home, Practice, Dictionary, Profile, Code) */}
        <nav className="flex items-center space-x-1.5 overflow-x-auto max-w-full pb-1 md:pb-0 scrollbar-none">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-[#F97316] text-white font-bold shadow-md shadow-orange-600/25'
                    : 'bg-[#0B2A1E] hover:bg-[#123828] text-emerald-100 border border-[#164432] font-medium'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-emerald-300'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right: Gamification Badges & Fullscreen */}
        <div className="hidden md:flex items-center space-x-2.5">
          {/* 5 Day Streak */}
          <div className="flex items-center space-x-1.5 bg-[#0B2A1E] border border-[#164432] text-[#F97316] font-bold text-xs px-3 py-1.5 rounded-full shadow-xs">
            <Flame className="w-3.5 h-3.5 fill-[#F97316]" />
            <span>{streak} DAY STREAK</span>
          </div>

          {/* 12 Trophies */}
          <div className="flex items-center space-x-1.5 bg-[#0B2A1E] border border-[#164432] text-amber-400 font-bold text-xs px-3 py-1.5 rounded-full shadow-xs">
            <Trophy className="w-3.5 h-3.5" />
            <span>{trophies}</span>
          </div>

          {/* 200 XP */}
          <div className="flex items-center space-x-1.5 bg-[#0B2A1E] border border-[#164432] text-emerald-300 font-bold text-xs px-3 py-1.5 rounded-full shadow-xs">
            <Zap className="w-3.5 h-3.5 fill-emerald-400 text-emerald-400" />
            <span>{xp} XP</span>
          </div>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="flex items-center space-x-1.5 bg-[#0B2A1E] hover:bg-[#123828] border border-[#164432] text-emerald-200 hover:text-white font-semibold text-xs px-3 py-1.5 rounded-full transition-colors cursor-pointer"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span>Fullscreen</span>
          </button>
        </div>

      </div>
    </header>
  );
};
