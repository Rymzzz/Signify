import React, { useState, useEffect } from 'react';
import { Header, TabType } from './components/Header';
import { WelcomeLandingPage } from './components/WelcomeLandingPage';
import { AuthModal } from './components/AuthModal';
import { LearningDashboard } from './components/LearningDashboard';
import { LiveCameraRecognizer } from './components/LiveCameraRecognizer';
import { PracticeView } from './components/PracticeView';
import { DictionaryView } from './components/DictionaryView';
import { ProfileView } from './components/ProfileView';
import { AdminDashboard } from './components/AdminDashboard';
import { CodeCharterSection } from './components/CodeCharterSection';
import { SignifyLogo } from './components/SignifyLogo';
import { downloadJavaProjectsZip } from './utils/zipExport';
import { authSyncService } from './services/authSyncService';
import { UserProfile, CurriculumModule } from './types/index';
import { Download, Info } from 'lucide-react';
import { AboutModal } from './components/AboutModal';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(authSyncService.getCurrentUser());
  const [activeTab, setActiveTab] = useState<TabType>(user ? 'dashboard' : 'welcome');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState<boolean>(false);
  const [authDefaultRole, setAuthDefaultRole] = useState<'user' | 'admin'>('user');

  // Active sign when transitioning between views
  const [studioInitialSign, setStudioInitialSign] = useState<string>('A');
  const [practiceInitialSign, setPracticeInitialSign] = useState<string>('A');

  // Synchronize with AuthSyncService
  useEffect(() => {
    const unsubscribe = authSyncService.subscribe((updatedUser) => {
      setUser(updatedUser);
      // Auto-navigate to dashboard on first login if currently on welcome
      if (updatedUser && activeTab === 'welcome') {
        setActiveTab('dashboard');
      }
    });
    return unsubscribe;
  }, [activeTab]);

  const handleOpenAuth = (role: 'user' | 'admin' = 'user') => {
    setAuthDefaultRole(role);
    setIsAuthModalOpen(true);
  };

  const handleLogout = async () => {
    await authSyncService.logout();
    setActiveTab('welcome');
  };

  const handleAuthSuccess = (authenticatedUser: UserProfile) => {
    setUser(authenticatedUser);
    setActiveTab('dashboard');
  };

  const handleScoreEarned = (amount: number) => {
    // Score earned via practice view
    if (user) {
      setUser({ ...user, xp: user.xp + amount });
    }
  };

  const handleLetterCompleted = (letter: string) => {
    // Letter completed in Studio
    if (user && !user.completedSigns.includes(letter)) {
      setUser({
        ...user,
        completedSigns: [...user.completedSigns, letter],
        trophies: user.trophies + 1
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#061A11] text-[#E0EBE4] flex flex-col font-sans selection:bg-[#F97316]/30 selection:text-[#F97316]">
      
      {/* Top Navigation Bar with SIGNIFY logo, tabs, streak, and authentication controls */}
      <Header 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        user={user}
        onOpenLogin={() => handleOpenAuth('user')}
        onLogout={handleLogout}
      />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5">
        
        {/* Step 1: Welcome / Landing Home Page */}
        {activeTab === 'welcome' && (
          <WelcomeLandingPage
            onOpenLogin={handleOpenAuth}
          />
        )}

        {/* Step 2: Learning Dashboard (Comment 4 & 1.1) */}
        {activeTab === 'dashboard' && user && (
          <LearningDashboard
            user={user}
            onSelectModule={(mod: CurriculumModule) => {
              setStudioInitialSign(mod.signs[0]?.letter || 'A');
              setActiveTab('studio');
            }}
            onStartPractice={(initialSign) => {
              if (initialSign) setPracticeInitialSign(initialSign);
              setActiveTab('practice');
            }}
            onOpenStudio={(initialSign) => {
              if (initialSign) setStudioInitialSign(initialSign);
              setActiveTab('studio');
            }}
            onOpenDictionary={() => setActiveTab('dictionary')}
            onOpenAdmin={() => setActiveTab('admin')}
          />
        )}

        {/* Step 3: Learn / Live Camera Recognizer with Speed Stopwatch & Video Demos */}
        {activeTab === 'studio' && (
          <LiveCameraRecognizer
            initialSign={studioInitialSign}
            completedLetters={user?.completedSigns || []}
            onLetterCompleted={handleLetterCompleted}
            onSignChange={setStudioInitialSign}
          />
        )}

        {/* Step 4: Speed Challenge & Flashcard Practice with Reaction Stopwatch */}
        {activeTab === 'practice' && (
          <PracticeView
            initialSign={practiceInitialSign}
            onScoreEarned={handleScoreEarned}
            onSignChange={setPracticeInitialSign}
          />
        )}

        {/* Step 5: Visual Dictionary with 3D Landmarks and Video Sample player */}
        {activeTab === 'dictionary' && (
          <DictionaryView
            onPracticeSign={(letter) => {
              setStudioInitialSign(letter);
              setActiveTab('studio');
            }}
          />
        )}

        {/* Step 6: User Profile with Anti-Duplicate XP ledger and speed records */}
        {activeTab === 'profile' && (
          <ProfileView
            completedLetters={user?.completedSigns || []}
            xp={user?.xp || 0}
            streak={user?.streak || 1}
            trophies={user?.trophies || 0}
          />
        )}

        {/* Step 7: Admin Control Panel (Comment 1) */}
        {activeTab === 'admin' && (
          <AdminDashboard
            onBackToDashboard={() => setActiveTab('dashboard')}
          />
        )}

        {/* Step 8: Code & Charter Specification */}
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
            <button
              onClick={() => setIsAboutModalOpen(true)}
              className="text-emerald-300 hover:text-white font-medium cursor-pointer inline-flex items-center space-x-1.5 transition-colors"
            >
              <Info className="w-3.5 h-3.5 text-emerald-400" />
              <span>About Platform & Authors</span>
            </button>

            {user?.role === 'admin' && (
              <button
                onClick={() => downloadJavaProjectsZip()}
                className="text-emerald-200 hover:text-white font-medium cursor-pointer inline-flex items-center space-x-1.5 transition-colors bg-[#0B2A1E] px-2.5 py-1 rounded-lg border border-[#164432]"
                title="Admin: Export Java / Web Application Archives"
              >
                <Download className="w-3.5 h-3.5 text-[#FF4D26]" />
                <span>Export Codebases (.zip)</span>
              </button>
            )}
          </div>
        </div>
      </footer>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        defaultRole={authDefaultRole}
        onSuccess={handleAuthSuccess}
      />

      {/* About Platform & Authors Modal */}
      <AboutModal
        isOpen={isAboutModalOpen}
        onClose={() => setIsAboutModalOpen(false)}
      />

    </div>
  );
}
