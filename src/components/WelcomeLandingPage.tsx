import React from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  User, 
  BookOpen, 
  Target, 
  Zap, 
  Flame, 
  Timer, 
  Award,
  Video,
  Database,
  Layers,
  HeartHandshake,
  CheckCircle2
} from 'lucide-react';
import { SignifyLogo } from './SignifyLogo';

interface WelcomeLandingPageProps {
  onOpenLogin: (defaultRole?: 'user' | 'admin') => void;
}

export const WelcomeLandingPage: React.FC<WelcomeLandingPageProps> = ({
  onOpenLogin
}) => {
  return (
    <div className="space-y-12 py-4 pb-16">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#09251A] via-[#071F15] to-[#04130C] border border-[#143B2B] p-6 sm:p-10 md:p-14 shadow-2xl text-center flex flex-col items-center">
        {/* Glow ambient background circles */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#F97316]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 right-1/4 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Badge */}
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#0B2A1E] border border-emerald-500/40 text-emerald-300 text-xs font-semibold mb-6 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Next-Gen Computer Vision ASL Learning Platform &bull; Production Edition</span>
        </div>

        {/* Signify Logo & Title */}
        <div className="flex flex-col items-center space-y-4 mb-6">
          <SignifyLogo className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl shadow-2xl hover:scale-105 transition-transform" glow />
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-white font-signify">
            SIGNIFY
          </h1>
          <p className="text-base sm:text-xl text-emerald-200/90 font-medium max-w-2xl leading-relaxed">
            Master American Sign Language in real-time with AI-powered landmark tracking, speed metrics, and cloud-synchronized progress.
          </p>
        </div>

        {/* SDG 4 Target 4.5 Badge */}
        <div className="flex items-center space-x-2 text-xs text-emerald-300/80 bg-[#071F15]/90 border border-[#164432] rounded-xl px-4 py-2 mb-8">
          <HeartHandshake className="w-4 h-4 text-emerald-400" />
          <span>Aligned with United Nations SDG 4 Target 4.5: Inclusive & Accessible Education</span>
        </div>

        {/* Primary CTA Buttons (No Guest Bypasses) */}
        <div className="flex flex-col sm:flex-row items-center gap-3.5 w-full sm:w-auto">
          <button
            onClick={() => onOpenLogin('user')}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#FF4D26] to-[#F97316] hover:from-[#FF6644] hover:to-[#FB923C] text-white font-bold text-sm shadow-xl shadow-[#FF4D26]/20 flex items-center justify-center space-x-2 transition-all hover:scale-102 cursor-pointer"
          >
            <User className="w-4 h-4" />
            <span>Sign In to Your Account</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => onOpenLogin('user')}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-[#0B2A1E] hover:bg-[#123828] border border-[#164432] text-emerald-100 font-semibold text-sm shadow-md transition-all hover:scale-102 cursor-pointer flex items-center justify-center space-x-2"
          >
            <span>Create New Account</span>
          </button>

          <button
            onClick={() => onOpenLogin('admin')}
            className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-[#05160E] hover:bg-[#0B2A1E] border border-amber-500/30 text-amber-300 hover:text-amber-200 font-semibold text-sm transition-all cursor-pointer flex items-center justify-center space-x-2"
          >
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>Admin Portal</span>
          </button>
        </div>
      </div>

      {/* Feature Pillars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Pillar 1: Full Curriculum */}
        <div className="bg-[#0B2A1E] border border-[#164432] rounded-3xl p-6 shadow-xl space-y-3 hover:border-emerald-500/40 transition-colors">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white tracking-tight">
            Expanded Curriculum
          </h3>
          <p className="text-xs text-emerald-300/80 leading-relaxed">
            All 26 ASL alphabet letters, numbers 0 through 10, and high-frequency WLASL vocabulary & greetings (Hello, Thank You, Yes, No, Please, More).
          </p>
          <div className="pt-2 text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>4 Complete Modules</span>
          </div>
        </div>

        {/* Pillar 2: MediaPipe 21-Joint Computer Vision */}
        <div className="bg-[#0B2A1E] border border-[#164432] rounded-3xl p-6 shadow-xl space-y-3 hover:border-emerald-500/40 transition-colors">
          <div className="w-12 h-12 rounded-2xl bg-[#F97316]/20 text-[#F97316] flex items-center justify-center border border-[#F97316]/30">
            <Layers className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white tracking-tight">
            21-Joint Hand Tracking
          </h3>
          <p className="text-xs text-emerald-300/80 leading-relaxed">
            Real-time client-side skeletal tracking running completely in your browser. Scale-invariant 42D vectors, orientation-invariant finger curling, and dynamic gesture tracking.
          </p>
          <div className="pt-2 text-[11px] font-semibold text-[#F97316] flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Zero Server Latency</span>
          </div>
        </div>

        {/* Pillar 3: Speed & Reaction Stopwatch */}
        <div className="bg-[#0B2A1E] border border-[#164432] rounded-3xl p-6 shadow-xl space-y-3 hover:border-emerald-500/40 transition-colors">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
            <Timer className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white tracking-tight">
            Reaction Speed Stopwatch
          </h3>
          <p className="text-xs text-emerald-300/80 leading-relaxed">
            Tests how fast you can recall and execute signs once clicking on any designated letter, number, or word. Tracks personal bests and speed tiers down to milliseconds.
          </p>
          <div className="pt-2 text-[11px] font-semibold text-amber-400 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Millisecond Precision</span>
          </div>
        </div>

        {/* Pillar 4: Accounts & Device Sync */}
        <div className="bg-[#0B2A1E] border border-[#164432] rounded-3xl p-6 shadow-xl space-y-3 hover:border-emerald-500/40 transition-colors">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-500/30">
            <Database className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white tracking-tight">
            Cloud & Cross-Device Sync
          </h3>
          <p className="text-xs text-emerald-300/80 leading-relaxed">
            Firebase-ready accounts with User and Admin roles. Daily streaks, XP ledger with duplicate XP protection, and module completion syncing across all devices.
          </p>
          <div className="pt-2 text-[11px] font-semibold text-sky-400 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Anti-Duplicate XP Engine</span>
          </div>
        </div>
      </div>

      {/* Video & Kinematics Demonstration Preview Banner */}
      <div className="bg-[#071F15] border border-[#164432] rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
            <Video className="w-3.5 h-3.5 text-[#FF4D26]" />
            <span>Interactive Kinematics & Video Samples</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Watch Exact Hand Orientations & Motion Cues
          </h3>
          <p className="text-xs sm:text-sm text-emerald-300/80 leading-relaxed">
            Every sign includes interactive 3D skeletal playback, finger state specifications, common pitfalls, and links to verified Deaf educator video demonstrations.
          </p>
        </div>

        <button
          onClick={() => onOpenLogin('user')}
          className="px-6 py-3 rounded-2xl bg-[#0E3627] hover:bg-[#144733] border border-emerald-500/50 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md transition-all cursor-pointer shrink-0"
        >
          <span>Enter Learning Dashboard</span>
          <ArrowRight className="w-4 h-4 text-emerald-400" />
        </button>
      </div>
    </div>
  );
};
