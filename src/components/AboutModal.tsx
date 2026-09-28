import React from 'react';
import { 
  X, 
  Sparkles, 
  HeartHandshake, 
  Code2, 
  Users, 
  Cpu, 
  ShieldCheck, 
  Globe, 
  ExternalLink,
  Award,
  BookOpen
} from 'lucide-react';
import { SignifyLogo } from './SignifyLogo';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const teamMembers = [
    {
      name: 'Christine Althea D. Barsatan',
      role: 'Lead Researcher',
      contribution: 'ASL linguistics, literature research, taxonomy, and curriculum learning pathway design.'
    },
    {
      name: 'Bryce Willand B. Tangalin',
      role: 'Lead Researcher',
      contribution: 'ASL dataset synthesis, qualitative research, comparative benchmark analysis & domain validation.'
    },
    {
      name: 'Francisco Alphonso M. Capio',
      role: 'Pipeline & Computer Vision Engineer',
      contribution: 'MediaPipe landmark processing pipeline, orientation-invariant vector modeling & real-time pose classification.'
    },
    {
      name: 'Raymond Augustine N. Venasquez',
      role: 'Full-Stack Engineer & Database Architect',
      contribution: 'End-to-end web architecture, Firebase Realtime Database synchronization, state management & reactive UI/UX.'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="bg-[#071F15] border border-[#164432] rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-[#0B2A1E] border-b border-[#164432] px-6 py-5 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3.5">
            <SignifyLogo className="w-10 h-10 rounded-2xl shadow-md" glow />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black text-white tracking-tight">About Signify</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Production Edition
                </span>
              </div>
              <p className="text-xs text-emerald-300/80">
                AI-Powered American Sign Language Platform
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-[#071F15] hover:bg-[#123828] border border-[#164432] text-emerald-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Mission & Purpose */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Mission & Vision
            </h4>
            <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
              Signify is a next-generation interactive learning platform designed to make American Sign Language (ASL) accessible, verifiable, and engaging. Using client-side computer vision and real-time landmark tracking, Signify enables learners to receive instant postural feedback without specialized hardware.
            </p>
          </div>

          {/* SDG 4 Alignment */}
          <div className="p-4 rounded-2xl bg-[#0B2A1E] border border-emerald-500/30 flex items-start space-x-3">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0 mt-0.5">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <span className="text-xs font-bold text-white block">
                Aligned with UN Sustainable Development Goal 4 &bull; Target 4.5
              </span>
              <p className="text-xs text-emerald-300/80 leading-relaxed">
                Dedicated to eliminating gender and ability disparities in education, fostering inclusive communication tools, and empowering deaf and hard-of-hearing communities worldwide.
              </p>
            </div>
          </div>

          {/* Engineering Team */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-4 h-4 text-emerald-400" />
              Engineering & Development Team
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {teamMembers.map((member, i) => (
                <div 
                  key={i} 
                  className="p-3.5 rounded-2xl bg-[#0B2A1E] border border-[#164432] space-y-1 hover:border-emerald-500/40 transition-colors"
                >
                  <span className="font-bold text-white text-xs block">
                    {member.name}
                  </span>
                  <span className="text-[11px] font-semibold text-amber-300 block">
                    {member.role}
                  </span>
                  <p className="text-[11px] text-emerald-300/70 leading-normal">
                    {member.contribution}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Technology Architecture */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-teal-400" />
              Core Architecture & Technologies
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
              <div className="p-3 rounded-xl bg-[#0B2A1E] border border-[#164432]">
                <span className="font-bold text-white block">MediaPipe</span>
                <span className="text-[10px] text-emerald-300/70">21 3D Landmarks</span>
              </div>
              <div className="p-3 rounded-xl bg-[#0B2A1E] border border-[#164432]">
                <span className="font-bold text-white block">Firebase RTDB</span>
                <span className="text-[10px] text-emerald-300/70">Cloud Sync & Auth</span>
              </div>
              <div className="p-3 rounded-xl bg-[#0B2A1E] border border-[#164432]">
                <span className="font-bold text-white block">React 19 & Vite</span>
                <span className="text-[10px] text-emerald-300/70">Sub-millisecond UI</span>
              </div>
              <div className="p-3 rounded-xl bg-[#0B2A1E] border border-[#164432]">
                <span className="font-bold text-white block">WLASL Dataset</span>
                <span className="text-[10px] text-emerald-300/70">Gesture Lexicon</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-[#0B2A1E] border-t border-[#164432] px-6 py-4 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-emerald-400/70">
            Signify ASL &copy; 2026. All rights reserved.
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md cursor-pointer transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
