import React, { useState } from 'react';
import { BookOpen, Sparkles, CheckCircle2, ChevronRight, Info, Award } from 'lucide-react';
import { ASL_ALPHABET } from '../data/aslAlphabet';
import { ASLSign } from '../types';

interface AlphabetBrowserProps {
  onPracticeSign?: (letter: string) => void;
}

export const AlphabetBrowser: React.FC<AlphabetBrowserProps> = ({ onPracticeSign }) => {
  const [selectedLetter, setSelectedLetter] = useState<string>('A');

  const selectedSign: ASLSign = ASL_ALPHABET.find(s => s.letter === selectedLetter) || ASL_ALPHABET[0];

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white border border-[#E6E4DD] rounded-2xl p-5 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 rounded-xl bg-[#F5F2ED] text-[#5A5A40] border border-[#E6E4DD]">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-serif font-bold text-[#5A5A40]">
              Interactive ASL Alphabet Reference Guide
            </h2>
            <p className="text-xs text-[#8A887C] mt-0.5">
              Explore all standard alphabet signs, precise finger placements, coaching cues, and common pitfalls.
            </p>
          </div>
        </div>
      </div>

      {/* Grid of Alphabet Letters */}
      <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-13 gap-2">
        {ASL_ALPHABET.map((sign) => {
          const isSelected = sign.letter === selectedLetter;
          return (
            <button
              key={sign.id}
              onClick={() => setSelectedLetter(sign.letter)}
              className={`p-3 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer ${
                isSelected
                  ? 'bg-[#5A5A40] text-white shadow-md scale-105 font-serif font-extrabold border border-[#5A5A40]'
                  : 'bg-white hover:bg-[#F5F2ED] text-[#3D3D3D] border border-[#E6E4DD]'
              }`}
            >
              <span className="text-xl font-serif font-black">{sign.letter}</span>
              <span className="text-[9px] opacity-75 uppercase tracking-tighter">{sign.category.slice(0, 3)}</span>
            </button>
          );
        })}
      </div>

      {/* Detailed Sign Card */}
      <div className="bg-white border border-[#E6E4DD] rounded-3xl p-6 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Sign Visual & Header */}
        <div className="lg:col-span-4 flex flex-col items-center justify-center p-6 bg-[#F5F2ED] rounded-2xl border border-[#E6E4DD] text-center space-y-4">
          <div className="w-24 h-28 rounded-2xl bg-white border border-[#E6E4DD] flex items-center justify-center shadow-xs">
            <span className="text-6xl font-serif font-bold text-[#5A5A40]">{selectedSign.letter}</span>
          </div>

          <div>
            <h3 className="text-lg font-serif font-bold text-[#5A5A40]">{selectedSign.title}</h3>
            <div className="flex items-center justify-center space-x-2 mt-1">
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-white text-[#8A887C] border border-[#E6E4DD] font-medium">
                {selectedSign.category}
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-white text-[#A68F6B] border border-[#E6E4DD] font-medium">
                {selectedSign.difficulty}
              </span>
            </div>
          </div>

          {onPracticeSign && (
            <button
              onClick={() => onPracticeSign(selectedSign.letter)}
              className="w-full py-2.5 px-4 rounded-xl bg-[#5A5A40] hover:bg-[#474732] text-white text-xs font-semibold shadow-xs cursor-pointer transition-all flex items-center justify-center space-x-2"
            >
              <span>Practice '{selectedSign.letter}' in Live Lab</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Anatomical Finger Positions and Tips */}
        <div className="lg:col-span-8 space-y-4">
          
          <div>
            <h4 className="text-xs font-bold text-[#8A887C] uppercase tracking-wider">
              Hand Pose Description
            </h4>
            <p className="text-sm text-[#3D3D3D] mt-1 leading-relaxed">
              {selectedSign.description}
            </p>
          </div>

          {/* Finger By Finger Breakdown */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-[#8A887C] uppercase tracking-wider">
              Finger Joint Positions
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-[#F5F2ED] border border-[#E6E4DD]">
                <strong className="text-[#5A5A40] block text-[11px] mb-0.5">Thumb:</strong>
                <span className="text-[#3D3D3D]">{selectedSign.fingerStates.thumb}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#F5F2ED] border border-[#E6E4DD]">
                <strong className="text-[#5A5A40] block text-[11px] mb-0.5">Index Finger:</strong>
                <span className="text-[#3D3D3D]">{selectedSign.fingerStates.index}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#F5F2ED] border border-[#E6E4DD]">
                <strong className="text-[#5A5A40] block text-[11px] mb-0.5">Middle Finger:</strong>
                <span className="text-[#3D3D3D]">{selectedSign.fingerStates.middle}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#F5F2ED] border border-[#E6E4DD]">
                <strong className="text-[#5A5A40] block text-[11px] mb-0.5">Ring &amp; Pinky:</strong>
                <span className="text-[#3D3D3D]">{selectedSign.fingerStates.pinky}</span>
              </div>
            </div>
          </div>

          {/* Coaching & Common Mistakes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 rounded-2xl bg-[#F5F2ED] border border-[#E6E4DD] text-xs space-y-1 shadow-xs">
              <span className="font-bold text-[#5A5A40] text-xs flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#5A5A40]" />
                <span>Coaching Cues:</span>
              </span>
              <ul className="list-disc list-inside space-y-1 text-[#3D3D3D] text-[11px]">
                {selectedSign.tips.map((tip, idx) => (
                  <li key={idx}>{tip}</li>
                ))}
              </ul>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#FFF9F5] border border-[#F0DDD0] text-xs space-y-1 shadow-xs">
              <span className="font-bold text-[#994D38] text-xs flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-[#994D38]" />
                <span>Common Mistakes:</span>
              </span>
              <ul className="list-disc list-inside space-y-1 text-[#5A382C] text-[11px]">
                {selectedSign.commonMistakes.map((mistake, idx) => (
                  <li key={idx}>{mistake}</li>
                ))}
              </ul>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
