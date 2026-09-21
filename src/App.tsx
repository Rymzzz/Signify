import React, { useState } from 'react';
import { Header, TabType } from './components/Header';
import { LiveCameraRecognizer } from './components/LiveCameraRecognizer';
import { PracticeView } from './components/PracticeView';
import { DictionaryView } from './components/DictionaryView';
import { ProfileView } from './components/ProfileView';
import { CodeCharterSection } from './components/CodeCharterSection';
import { SignifyLogo } from './components/SignifyLogo';
import { downloadJavaProjectsZip } from './utils/zipExport';
import { Layers, Download, Sparkles } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [completedLetters, setCompletedLetters] = useState<string[]>([]);
  const [streak, setStreak] = useState<number>(5);
  const [trophies, setTrophies] = useState<number>(12);
  const [xp, setXp] = useState<number>(200);

  const handleLetterCompleted = (letter: string) => {
    if (!completedLetters.includes(letter)) {
      setCompletedLetters(prev => [...prev, letter]);
      setXp(x => x + 15);
      setTrophies(t => t + 1);
    }
  };

  const handleScoreEarned = (amount: number) => {
    setXp(x => x + amount);
  };

  return (
    <div className="min-h-screen bg-[#061A11] text-[#E0EBE4] flex flex-col font-sans selection:bg-[#F97316]/30 selection:text-[#F97316]">
      
      {/* Top Navigation Bar with SIGNIFY logo, tabs, streak, trophies, and XP */}
      <Header 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        streak={streak}
        trophies={trophies}
        xp={xp}
      />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5">
        {activeTab === 'home' && (
          <LiveCameraRecognizer
            completedLetters={completedLetters}
            onLetterCompleted={handleLetterCompleted}
          />
        )}

        {activeTab === 'practice' && (
          <PracticeView
            onScoreEarned={handleScoreEarned}
          />
        )}

        {activeTab === 'dictionary' && (
          <DictionaryView
            onPracticeSign={(_letter) => {
              setActiveTab('home');
            }}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileView
            completedLetters={completedLetters}
            xp={xp}
            streak={streak}
            trophies={trophies}
          />
        )}

        {activeTab === 'code-charter' && (
          <CodeCharterSection />
        )}
      </main>

      {/* Dark Forest Green Footer */}
      <footer className="border-t border-[#123828] bg-[#05160E] py-4 mt-auto text-xs text-emerald-300/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5">
            <SignifyLogo className="w-5 h-5 rounded-md shadow-sm shrink-0" />
            <span className="font-bold text-white font-signify tracking-wider text-[11px]">SIGNIFY</span>
            <span className="text-emerald-500">&bull;</span>
            <span className="text-emerald-300/70">ASL Real-Time Recognition System</span>
            <span className="text-emerald-500 hidden sm:inline">&bull;</span>
            <span className="text-emerald-300/70 hidden sm:inline">SDG 4 Target 4.5</span>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-emerald-300/70 hidden md:inline">Group #9: Barsatan, Capio, Tangalin, Venasquez</span>
            <button
              onClick={() => downloadJavaProjectsZip()}
              className="text-emerald-200 hover:text-white font-medium cursor-pointer inline-flex items-center space-x-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-[#FF4D26]" />
              <span>Export All Codebases (.zip)</span>
            </button>
          </div>
        </div>
      </footer>

    </div>
  );
}
