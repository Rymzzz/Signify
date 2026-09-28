import React, { useState } from 'react';
import { 
  BookOpen, 
  Search, 
  Sparkles, 
  ChevronRight, 
  Video, 
  CheckCircle2, 
  AlertTriangle, 
  Layers,
  Camera,
  Play
} from 'lucide-react';
import { getAllSigns, CURRICULUM_MODULES } from '../data/aslCurriculum';
import { ASLSign, HandLandmark } from '../types/index';
import { SignVideoModal } from './SignVideoModal';

interface DictionaryViewProps {
  onPracticeSign: (letter: string) => void;
}

const SKELETON_CONNECTIONS = [
  // Thumb
  [0, 1], [1, 2], [2, 3], [3, 4],
  // Index
  [0, 5], [5, 6], [6, 7], [7, 8],
  // Middle
  [0, 9], [9, 10], [10, 11], [11, 12],
  // Ring
  [0, 13], [13, 14], [14, 15], [15, 16],
  // Pinky
  [0, 17], [17, 18], [18, 19], [19, 20],
  // Palm knuckles
  [5, 9], [9, 13], [13, 17]
];

export const DictionaryView: React.FC<DictionaryViewProps> = ({ onPracticeSign }) => {
  const allSigns = getAllSigns();
  const [searchQuery, setSearchQuery] = useState('');
  const [moduleFilter, setModuleFilter] = useState<'all' | 'alphabet' | 'numbers' | 'words' | 'phrases'>('all');
  const [selectedLetter, setSelectedLetter] = useState<string>('A');
  const [videoModalSign, setVideoModalSign] = useState<ASLSign | null>(null);

  const filteredSigns = allSigns.filter(sign => {
    const matchesSearch = 
      sign.letter.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sign.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sign.description.toLowerCase().includes(searchQuery.toLowerCase());

    const signModule = sign.signType || (sign.category === 'number' ? 'numbers' : sign.category === 'word' ? 'words' : sign.category === 'phrase' ? 'phrases' : 'alphabet');
    const matchesModule = moduleFilter === 'all' || signModule === moduleFilter;

    return matchesSearch && matchesModule;
  });

  const selectedSign: ASLSign = allSigns.find(s => s.letter === selectedLetter || s.id === selectedLetter) || allSigns[0];

  return (
    <div className="space-y-6 pb-14">
      {/* Header Banner */}
      <div className="bg-[#0B2A1E] border border-[#164432] rounded-3xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-[#F97316] text-white flex items-center justify-center shadow-lg font-bold text-xl">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              ASL Visual Dictionary & Video Reference
            </h2>
            <p className="text-xs text-emerald-300/90 mt-0.5">
              Comprehensive index covering the 26 Alphabet letters, Numbers 0–10, and WLASL everyday words & greetings.
            </p>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <div className="relative flex-1 sm:w-56">
            <Search className="w-4 h-4 text-emerald-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search sign, letter, word..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#071F15] border border-[#164432] rounded-xl text-xs text-emerald-100 placeholder-emerald-400/50 focus:outline-none focus:border-[#F97316]"
            />
          </div>

          <div className="flex items-center bg-[#071F15] border border-[#164432] rounded-xl p-0.5 text-xs">
            {(['all', 'alphabet', 'numbers', 'words', 'phrases'] as const).map(mod => (
              <button
                key={mod}
                onClick={() => setModuleFilter(mod)}
                className={`px-3 py-1.5 rounded-lg capitalize font-medium transition-colors cursor-pointer ${
                  moduleFilter === mod
                    ? 'bg-[#F97316] text-white font-semibold shadow-xs'
                    : 'text-emerald-300/80 hover:text-white'
                }`}
              >
                {mod}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Grid & Detail Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Sign Cards Grid */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between text-xs text-emerald-400 px-1 font-medium">
            <span>Displaying {filteredSigns.length} of {allSigns.length} curriculum signs</span>
            <span>Click any card to inspect 3D kinematics</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-[640px] overflow-y-auto pr-1">
            {filteredSigns.map(sign => {
              const isSelected = sign.letter === selectedLetter;
              return (
                <div
                  key={sign.id}
                  onClick={() => setSelectedLetter(sign.letter)}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between h-32 relative group ${
                    isSelected
                      ? 'bg-[#0E3627] border-[#F97316] shadow-lg shadow-orange-500/10 ring-1 ring-[#F97316]'
                      : 'bg-[#0B2A1E] border-[#164432] hover:bg-[#0F3526] hover:border-[#1F533E]'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <span className="text-xl font-black text-white font-signify tracking-wide">
                      {sign.letter}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setVideoModalSign(sign);
                      }}
                      className="p-1 rounded-lg bg-[#071F15] hover:bg-[#FF4D26] text-emerald-300 hover:text-white transition-colors"
                      title="Watch Video Sample"
                    >
                      <Video className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div>
                    <span className="text-xs font-bold text-emerald-100 truncate block">
                      {sign.title}
                    </span>
                    <span className="text-[10px] text-emerald-400/80 uppercase tracking-wider block">
                      {sign.signType || sign.category}
                    </span>
                  </div>

                  <div className="w-full h-1 bg-[#05160E] rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500/60 w-3/4" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Detailed Sign Inspection & Visualizer */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#0B2A1E] border border-[#164432] rounded-3xl p-6 shadow-xl space-y-5">
            {/* Header info */}
            <div className="flex items-center justify-between pb-4 border-b border-[#164432]">
              <div className="flex items-center space-x-3.5">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FF4D26] to-[#F97316] text-white flex items-center justify-center font-black text-2xl shadow-lg">
                  {selectedSign.letter}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white tracking-tight">{selectedSign.title}</h3>
                  <span className="text-xs text-emerald-300/80 block mt-0.5">{selectedSign.shortDescription}</span>
                </div>
              </div>

              <button
                onClick={() => setVideoModalSign(selectedSign)}
                className="px-3 py-1.5 rounded-xl bg-[#071F15] hover:bg-[#123828] border border-amber-500/40 text-amber-300 hover:text-amber-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Video className="w-3.5 h-3.5 text-[#FF4D26]" />
                <span>Video Demo</span>
              </button>
            </div>

            {/* 3D Skeleton Kinematics Preview Canvas */}
            <div className="relative aspect-4/3 bg-[#04120B] rounded-2xl border border-[#164432] overflow-hidden flex items-center justify-center shadow-inner">
              <svg 
                viewBox="0 0 1 1" 
                className="w-full h-full p-4 transform scale-y-[-1]"
              >
                {SKELETON_CONNECTIONS.map(([p1, p2], idx) => {
                  const pt1 = selectedSign.referenceLandmarks[p1];
                  const pt2 = selectedSign.referenceLandmarks[p2];
                  if (!pt1 || !pt2) return null;
                  return (
                    <line
                      key={idx}
                      x1={pt1.x}
                      y1={1 - pt1.y}
                      x2={pt2.x}
                      y2={1 - pt2.y}
                      stroke="#10B981"
                      strokeWidth="0.015"
                      strokeLinecap="round"
                    />
                  );
                })}

                {selectedSign.referenceLandmarks.map((pt, idx) => {
                  const isThumb = idx >= 1 && idx <= 4;
                  const isTip = [4, 8, 12, 16, 20].includes(idx);
                  return (
                    <circle
                      key={idx}
                      cx={pt.x}
                      cy={1 - pt.y}
                      r={isTip ? 0.024 : 0.016}
                      fill={idx === 0 ? '#F97316' : isTip ? '#34D399' : isThumb ? '#FBBF24' : '#10B981'}
                      stroke="#05160E"
                      strokeWidth="0.005"
                    />
                  );
                })}
              </svg>

              <div className="absolute top-3 left-3 bg-[#05160E]/80 backdrop-blur-sm border border-emerald-500/30 px-2.5 py-1 rounded-full text-[11px] font-semibold text-emerald-300">
                MediaPipe 21 Landmark Blueprint
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                Technique Description
              </span>
              <p className="text-xs text-emerald-100/90 leading-relaxed bg-[#071F15] p-3 rounded-xl border border-[#164432]">
                {selectedSign.description}
              </p>
            </div>

            {/* Finger states breakdown */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                Finger State Analysis
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {Object.entries(selectedSign.fingerStates).map(([finger, state]) => (
                  <div key={finger} className="bg-[#071F15] border border-[#164432] rounded-xl p-2">
                    <span className="font-bold text-amber-400 capitalize block text-[10px]">
                      {finger}
                    </span>
                    <span className="text-[11px] text-emerald-200/90 truncate block">
                      {state}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Practice CTA */}
            <button
              onClick={() => onPracticeSign(selectedSign.letter)}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg flex items-center justify-center space-x-2 transition-all cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              <span>Practice &apos;{selectedSign.letter}&apos; in Live Studio</span>
            </button>
          </div>
        </div>
      </div>

      {/* Video Demonstration Modal */}
      {videoModalSign && (
        <SignVideoModal
          sign={videoModalSign}
          isOpen={Boolean(videoModalSign)}
          onClose={() => setVideoModalSign(null)}
          onPractice={(letter) => {
            setVideoModalSign(null);
            onPracticeSign(letter);
          }}
        />
      )}
    </div>
  );
};
