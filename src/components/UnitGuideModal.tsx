import React from 'react';
import { X, BookOpen, Lightbulb, Hand, CheckCircle2, ShieldCheck } from 'lucide-react';

interface UnitGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UnitGuideModal: React.FC<UnitGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0B2A1E] border border-[#1B4B37] rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl text-emerald-100 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-[#164432] flex items-center justify-between sticky top-0 bg-[#0B2A1E]/95 backdrop-blur z-10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-[#F97316] text-white flex items-center justify-center shadow-md">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Unit 1: Introduction & Fingerspelling
              </h2>
              <p className="text-xs text-emerald-300">
                Foundations of ASL Alphabet &bull; Real-Time Gesture Recognition
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-emerald-300 hover:text-white hover:bg-[#123828] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 text-sm">
          {/* Overview */}
          <div className="bg-[#071F15] border border-[#164432] rounded-2xl p-4 space-y-2">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <Hand className="w-4 h-4 text-[#F97316]" />
              The Art of ASL Fingerspelling
            </h3>
            <p className="text-xs leading-relaxed text-emerald-200/90">
              American Sign Language (ASL) uses 26 distinct manual handshapes to represent the letters of the English alphabet. Fingerspelling is used for proper names, technical terms, and vocabulary words that lack dedicated sign glosses.
            </p>
          </div>

          {/* Key Principles */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#F97316]">
              Key Recognition Guidelines
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-[#071F15] border border-[#164432] rounded-xl p-3.5 space-y-1.5">
                <div className="flex items-center gap-2 text-emerald-300 font-semibold text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Posture & Framing
                </div>
                <p className="text-xs text-emerald-200/80 leading-normal">
                  Keep your dominant hand at upper chest level, about 1.5 to 2 feet from your webcam. Keep wrist steady and facing comfortably forward.
                </p>
              </div>

              <div className="bg-[#071F15] border border-[#164432] rounded-xl p-3.5 space-y-1.5">
                <div className="flex items-center gap-2 text-emerald-300 font-semibold text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Hold to Confirm (600 ms)
                </div>
                <p className="text-xs text-emerald-200/80 leading-normal">
                  To prevent false triggers from hand transitions, the system uses temporal stabilization: hold the target posture steadily for 600 ms to earn +15 XP.
                </p>
              </div>

              <div className="bg-[#071F15] border border-[#164432] rounded-xl p-3.5 space-y-1.5">
                <div className="flex items-center gap-2 text-emerald-300 font-semibold text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  21 Anatomical Keypoints
                </div>
                <p className="text-xs text-emerald-200/80 leading-normal">
                  MediaPipe tracks 21 skeletal joints (wrist, knuckles, PIP, DIP, tips) in real-time at 30 FPS with zero latency.
                </p>
              </div>

              <div className="bg-[#071F15] border border-[#164432] rounded-xl p-3.5 space-y-1.5">
                <div className="flex items-center gap-2 text-emerald-300 font-semibold text-xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Client-Side Privacy
                </div>
                <p className="text-xs text-emerald-200/80 leading-normal">
                  All computer vision processing is executed directly inside your browser on device. No video frames are ever recorded or transmitted to any server.
                </p>
              </div>
            </div>
          </div>

          {/* Lighting Tip */}
          <div className="bg-[#061C12] border border-emerald-600/40 rounded-2xl p-4 flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-emerald-200 text-xs">Lighting & Background Recommendation</h4>
              <p className="text-xs text-emerald-300/80 mt-1 leading-relaxed">
                Ensure front-facing light on your hands. Avoid strong backlights (e.g. bright windows directly behind you) so individual finger knuckles are clearly distinguished by the computer vision tracker.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#164432] bg-[#071F15] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white font-bold text-xs transition-colors cursor-pointer"
          >
            Got It, Let&apos;s Sign!
          </button>
        </div>
      </div>
    </div>
  );
};
