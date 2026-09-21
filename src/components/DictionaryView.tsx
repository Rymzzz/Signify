import React, { useState } from 'react';
import { BookOpen, Search, Sparkles, ChevronRight, Video, CheckCircle2, AlertTriangle, Layers } from 'lucide-react';
import { ASL_ALPHABET } from '../data/aslAlphabet';
import { ASLSign, HandLandmark } from '../types/index';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'vowel' | 'consonant' | 'complex'>('all');
  const [selectedLetter, setSelectedLetter] = useState<string>('A');

  const filteredSigns = ASL_ALPHABET.filter(sign => {
    const matchesSearch = sign.letter.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          sign.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          sign.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || sign.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const selectedSign: ASLSign = ASL_ALPHABET.find(s => s.letter === selectedLetter) || ASL_ALPHABET[0];

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-[#0B2A1E] border border-[#164432] rounded-3xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-[#F97316] text-white flex items-center justify-center shadow-lg font-bold text-xl">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              ASL Alphabet Visual Dictionary (A – Z)
            </h2>
            <p className="text-xs text-emerald-300/90 mt-0.5">
              Comprehensive reference for all 26 American Sign Language handshapes, finger configurations, and coaching cues.
            </p>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <div className="relative flex-1 sm:w-56">
            <Search className="w-4 h-4 text-emerald-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search letter or sign..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#071F15] border border-[#164432] rounded-xl text-xs text-emerald-100 placeholder-emerald-400/50 focus:outline-none focus:border-[#F97316]"
            />
          </div>

          <div className="flex items-center bg-[#071F15] border border-[#164432] rounded-xl p-0.5 text-xs">
            {(['all', 'vowel', 'consonant', 'complex'] as const).map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-lg capitalize font-medium transition-colors cursor-pointer ${
                  categoryFilter === cat
                    ? 'bg-[#F97316] text-white font-semibold shadow-xs'
                    : 'text-emerald-300/80 hover:text-white'
                }`}
              >
                {cat === 'complex' ? 'Motion' : cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Grid & Detail Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Alphabet Cards Grid */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between text-xs text-emerald-400 px-1 font-medium">
            <span>Displaying {filteredSigns.length} of 26 letters</span>
            <span>Click any sign to inspect 3D landmarks</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-[640px] overflow-y-auto pr-1">
            {filteredSigns.map(sign => {
              const isSelected = sign.letter === selectedLetter;
              return (
                <button
                  key={sign.id}
                  onClick={() => setSelectedLetter(sign.letter)}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between h-28 ${
                    isSelected
                      ? 'bg-[#0E3627] border-[#F97316] shadow-lg shadow-orange-500/10 ring-1 ring-[#F97316]'
                      : 'bg-[#0B2A1E] border-[#164432] hover:bg-[#0F3526] hover:border-[#1F533E]'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className={`w-8 h-8 rounded-xl font-bold flex items-center justify-center text-sm ${
                      isSelected ? 'bg-[#F97316] text-white shadow-sm' : 'bg-[#071F15] text-emerald-300 border border-[#164432]'
                    }`}>
                      {sign.letter}
                    </div>
                    <span className="text-[10px] uppercase font-semibold text-emerald-400/80 tracking-wider">
                      {sign.category}
                    </span>
                  </div>

                  <div>
                    <div className="text-xs font-semibold text-white truncate">
                      {sign.title}
                    </div>
                    <div className="text-[11px] text-emerald-300/70 truncate mt-0.5">
                      {sign.shortDescription || sign.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Sign Detail Card */}
        <div className="lg:col-span-5 bg-[#0B2A1E] border border-[#164432] rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-6">
          <div className="space-y-5">
            {/* Top header */}
            <div className="flex items-center justify-between border-b border-[#164432] pb-4">
              <div className="flex items-center space-x-3.5">
                <div className="w-14 h-14 rounded-2xl bg-[#F97316] text-white font-black text-2xl flex items-center justify-center shadow-lg">
                  {selectedSign.letter}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-white">
                      Letter &apos;{selectedSign.letter}&apos;
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#071F15] border border-emerald-500/30 text-emerald-300 uppercase">
                      {selectedSign.difficulty}
                    </span>
                  </div>
                  <p className="text-xs text-emerald-300 font-medium">
                    {selectedSign.title}
                  </p>
                </div>
              </div>

              <button
                onClick={() => onPracticeSign(selectedSign.letter)}
                className="px-4 py-2 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-colors cursor-pointer"
              >
                <Video className="w-3.5 h-3.5" />
                <span>Practice</span>
              </button>
            </div>

            {/* Visual Landmark Canvas Preview */}
            <div className="bg-[#05160E] border border-[#164432] rounded-2xl p-4 flex flex-col items-center justify-center relative">
              <div className="text-[11px] text-emerald-400 font-semibold absolute top-3 left-3 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#F97316]" />
                MediaPipe 21 Landmark Topology
              </div>

              <svg viewBox="0 0 400 400" className="w-48 h-48 my-2">
                {/* Connections */}
                {SKELETON_CONNECTIONS.map(([p1, p2], idx) => {
                  const pt1 = selectedSign.referenceLandmarks[p1];
                  const pt2 = selectedSign.referenceLandmarks[p2];
                  if (!pt1 || !pt2) return null;
                  return (
                    <line
                      key={`sk-${idx}`}
                      x1={pt1.x * 400}
                      y1={pt1.y * 400}
                      x2={pt2.x * 400}
                      y2={pt2.y * 400}
                      stroke="#F97316"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />
                  );
                })}

                {/* Joints */}
                {selectedSign.referenceLandmarks.map((pt, idx) => (
                  <g key={`pt-${idx}`}>
                    <circle
                      cx={pt.x * 400}
                      cy={pt.y * 400}
                      r="6.5"
                      fill="#FF7A00"
                      stroke="#FFFFFF"
                      strokeWidth="2"
                    />
                  </g>
                ))}
              </svg>

              <div className="text-[10px] text-emerald-400/80">
                Frontal Camera Reference Projection
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#F97316]">
                Anatomical Description
              </h4>
              <p className="text-xs leading-relaxed text-emerald-100/90 bg-[#071F15] p-3 rounded-xl border border-[#164432]">
                {selectedSign.description}
              </p>
            </div>

            {/* Finger placement breakdown */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#F97316]">
                Finger Placements
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-[#071F15] p-2 rounded-xl border border-[#164432]">
                  <span className="font-semibold text-white">Thumb: </span>
                  <span className="text-emerald-300">{selectedSign.fingerStates.thumb}</span>
                </div>
                <div className="bg-[#071F15] p-2 rounded-xl border border-[#164432]">
                  <span className="font-semibold text-white">Index: </span>
                  <span className="text-emerald-300">{selectedSign.fingerStates.index}</span>
                </div>
                <div className="bg-[#071F15] p-2 rounded-xl border border-[#164432]">
                  <span className="font-semibold text-white">Middle: </span>
                  <span className="text-emerald-300">{selectedSign.fingerStates.middle}</span>
                </div>
                <div className="bg-[#071F15] p-2 rounded-xl border border-[#164432]">
                  <span className="font-semibold text-white">Pinky: </span>
                  <span className="text-emerald-300">{selectedSign.fingerStates.pinky}</span>
                </div>
              </div>
            </div>

            {/* Tips & Common Pitfalls */}
            <div className="space-y-2">
              <div className="bg-[#061C12] border border-emerald-600/40 rounded-xl p-3 text-xs text-emerald-200 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-[#F97316] flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-white">Pro Tip: </span>
                  {selectedSign.tips[0]}
                </div>
              </div>

              {selectedSign.commonMistakes.length > 0 && (
                <div className="bg-[#241108] border border-amber-600/40 rounded-xl p-3 text-xs text-amber-200 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-white">Common Mistake: </span>
                    {selectedSign.commonMistakes[0]}
                  </div>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => onPracticeSign(selectedSign.letter)}
            className="w-full py-3 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
          >
            <span>Launch Live Recognition for Letter &apos;{selectedSign.letter}&apos;</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
