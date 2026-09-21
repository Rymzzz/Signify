import React from 'react';
import { Trophy, Flame, Zap, Award, CheckCircle2, Star, BookOpen, Layers, ShieldCheck } from 'lucide-react';
import { ASL_ALPHABET } from '../data/aslAlphabet';
import { SignifyLogo } from './SignifyLogo';

interface ProfileViewProps {
  completedLetters?: string[];
  xp?: number;
  streak?: number;
  trophies?: number;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  completedLetters = ['A', 'B'],
  xp = 200,
  streak = 5,
  trophies = 12
}) => {
  const totalLetters = 26;
  const completedCount = completedLetters.length;
  const percentComplete = Math.round((completedCount / totalLetters) * 100);

  const achievements = [
    { title: 'First Sign', desc: 'Successfully signed Letter A', unlocked: true, icon: Star },
    { title: '5-Day Streak', desc: 'Practiced consistently for 5 days', unlocked: streak >= 5, icon: Flame },
    { title: 'Precision Master', desc: 'Achieved 95%+ confidence on handshape', unlocked: true, icon: Award },
    { title: 'Full A-Z Master', desc: 'Recognized all 26 ASL alphabet signs', unlocked: completedCount >= 26, icon: Trophy },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner Card */}
      <div className="bg-[#0B2A1E] border border-[#164432] rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center space-x-5">
          <SignifyLogo className="w-20 h-20 rounded-3xl shadow-xl hover:scale-105 transition-transform shrink-0" glow />
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-2xl font-black text-white tracking-tight">ASL Learner Profile</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#071F15] border border-emerald-500/40 text-emerald-300 font-signify tracking-wider">
                SIGNIFY LEVEL 2
              </span>
            </div>
            <p className="text-xs text-emerald-300/80 mt-1">
              Mastering the 26 letters of the American Sign Language Manual Alphabet &bull; Group #9 Signify Platform
            </p>
          </div>
        </div>

        {/* Stats Pill Badges */}
        <div className="grid grid-cols-3 gap-3 w-full md:w-auto">
          <div className="bg-[#071F15] border border-[#164432] rounded-2xl p-3.5 text-center flex flex-col items-center">
            <Flame className="w-5 h-5 text-[#F97316] mb-1" />
            <span className="text-xs text-emerald-300/70 font-semibold">Day Streak</span>
            <span className="text-lg font-black text-[#F97316]">{streak} Days</span>
          </div>

          <div className="bg-[#071F15] border border-[#164432] rounded-2xl p-3.5 text-center flex flex-col items-center">
            <Trophy className="w-5 h-5 text-amber-400 mb-1" />
            <span className="text-xs text-emerald-300/70 font-semibold">Trophies</span>
            <span className="text-lg font-black text-amber-400">{trophies}</span>
          </div>

          <div className="bg-[#071F15] border border-[#164432] rounded-2xl p-3.5 text-center flex flex-col items-center">
            <Zap className="w-5 h-5 text-emerald-400 mb-1" />
            <span className="text-xs text-emerald-300/70 font-semibold">Total XP</span>
            <span className="text-lg font-black text-emerald-300">{xp} XP</span>
          </div>
        </div>
      </div>

      {/* Progress & Alphabet Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Overall A-Z Matrix */}
        <div className="lg:col-span-8 bg-[#0B2A1E] border border-[#164432] rounded-3xl p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-[#164432] pb-4">
            <div>
              <h3 className="font-bold text-white text-base">A – Z Alphabet Mastery Grid</h3>
              <p className="text-xs text-emerald-300/80 mt-0.5">
                {completedCount} of 26 letters mastered ({percentComplete}%)
              </p>
            </div>
            <div className="w-36 h-2.5 bg-[#071F15] rounded-full overflow-hidden border border-[#164432]">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-[#F97316] rounded-full transition-all duration-500"
                style={{ width: `${percentComplete}%` }}
              />
            </div>
          </div>

          {/* Letter Badges A-Z */}
          <div className="grid grid-cols-6 sm:grid-cols-7 md:grid-cols-9 gap-2.5">
            {ASL_ALPHABET.map(sign => {
              const isDone = completedLetters.includes(sign.letter);
              return (
                <div
                  key={sign.id}
                  className={`p-3 rounded-2xl border text-center flex flex-col items-center justify-center transition-all ${
                    isDone
                      ? 'bg-[#0E3627] border-emerald-500/70 text-emerald-100 shadow-md'
                      : 'bg-[#071F15] border-[#164432] text-emerald-400/50'
                  }`}
                >
                  <span className="text-lg font-black">{sign.letter}</span>
                  <div className="mt-1">
                    {isDone ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <span className="text-[9px] uppercase font-bold text-emerald-500/50">15 XP</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Chapter Breakdown */}
          <div className="pt-4 border-t border-[#164432] grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="bg-[#071F15] p-3 rounded-xl border border-[#164432] flex justify-between items-center">
              <span className="text-emerald-200">Chapter 1: Letters A – E</span>
              <span className="font-bold text-emerald-400">1 / 5 Done</span>
            </div>
            <div className="bg-[#071F15] p-3 rounded-xl border border-[#164432] flex justify-between items-center">
              <span className="text-emerald-200">Chapter 2: Letters F – J</span>
              <span className="font-bold text-emerald-400">0 / 5 Done</span>
            </div>
            <div className="bg-[#071F15] p-3 rounded-xl border border-[#164432] flex justify-between items-center">
              <span className="text-emerald-200">Chapter 3: Letters K – O</span>
              <span className="font-bold text-emerald-400">0 / 5 Done</span>
            </div>
            <div className="bg-[#071F15] p-3 rounded-xl border border-[#164432] flex justify-between items-center">
              <span className="text-emerald-200">Chapter 4: Letters P – T</span>
              <span className="font-bold text-emerald-400">0 / 5 Done</span>
            </div>
            <div className="bg-[#071F15] p-3 rounded-xl border border-[#164432] flex justify-between items-center sm:col-span-2">
              <span className="text-emerald-200">Chapter 5: Letters U – Z</span>
              <span className="font-bold text-emerald-400">0 / 6 Done</span>
            </div>
          </div>
        </div>

        {/* Right: Achievements & Academic Info */}
        <div className="lg:col-span-4 space-y-6">
          {/* Achievements */}
          <div className="bg-[#0B2A1E] border border-[#164432] rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Award className="w-4 h-4 text-[#F97316]" />
              Milestone Badges
            </h3>

            <div className="space-y-2.5">
              {achievements.map((ach, idx) => {
                const Icon = ach.icon;
                return (
                  <div
                    key={idx}
                    className={`p-3 rounded-2xl border flex items-center space-x-3 ${
                      ach.unlocked
                        ? 'bg-[#071F15] border-emerald-500/40 text-white'
                        : 'bg-[#071F15]/40 border-[#164432] text-emerald-400/40 opacity-60'
                    }`}
                  >
                    <div className={`p-2 rounded-xl ${
                      ach.unlocked ? 'bg-[#F97316] text-white' : 'bg-[#123828] text-emerald-500/40'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold">{ach.title}</div>
                      <div className="text-[11px] text-emerald-300/70">{ach.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Academic Charter & Group #9 Note */}
          <div className="bg-[#0B2A1E] border border-[#164432] rounded-3xl p-6 shadow-xl text-xs space-y-2 text-emerald-200/90">
            <div className="font-bold text-white flex items-center gap-2 text-sm">
              <Layers className="w-4 h-4 text-[#F97316]" />
              Group #9 &bull; SDG 4 Target 4.5
            </div>
            <p className="text-[11px] text-emerald-300/80 leading-relaxed">
              Research project by Barsatan, Capio, Tangalin, and Venasquez. Signify eliminates educational barriers for Deaf and Hard of Hearing learners through real-time assistive technology.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
