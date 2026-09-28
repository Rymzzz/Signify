import React from 'react';
import { 
  Trophy, 
  Flame, 
  Zap, 
  Award, 
  CheckCircle2, 
  Star, 
  BookOpen, 
  Layers, 
  ShieldCheck,
  Timer,
  Clock,
  Sparkles,
  Info
} from 'lucide-react';
import { SignifyLogo } from './SignifyLogo';
import { authSyncService } from '../services/authSyncService';
import { getAllSigns, CURRICULUM_MODULES } from '../data/aslCurriculum';

interface ProfileViewProps {
  completedLetters?: string[];
  xp?: number;
  streak?: number;
  trophies?: number;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  completedLetters = [],
  xp = 0,
  streak = 0,
  trophies = 0
}) => {
  const user = authSyncService.getCurrentUser();
  const allSigns = getAllSigns();

  const activeXp = user ? user.xp : xp;
  const activeStreak = user ? user.streak : streak;
  const activeTrophies = user ? user.trophies : trophies;
  const completedList = user?.completedSigns?.length ? user.completedSigns : completedLetters;

  const totalCurriculumCount = allSigns.length;
  const totalCompletedCount = completedList.length;
  const percentComplete = Math.min(100, Math.round((totalCompletedCount / totalCurriculumCount) * 100));

  // Top speed records
  const speedEntries = Object.entries(user?.bestSpeedRecords || {}).sort((a, b) => a[1] - b[1]);

  const achievements = [
    { title: 'First Sign', desc: 'Successfully signed your first ASL character', unlocked: totalCompletedCount >= 1, icon: Star },
    { title: '3-Day Streak', desc: 'Practiced consistently for 3 days', unlocked: activeStreak >= 3, icon: Flame },
    { title: '5-Day Streak', desc: 'Maintained practice routine for 5 days', unlocked: activeStreak >= 5, icon: Flame },
    { title: 'Speed Demon', desc: 'Executed a sign in under 2 seconds', unlocked: Boolean(speedEntries.some(e => e[1] < 2000)), icon: Timer },
    { title: 'Alphabet Scholar', desc: 'Mastered all 26 manual alphabet signs', unlocked: totalCompletedCount >= 26, icon: Trophy },
  ];

  return (
    <div className="space-y-6 pb-14">
      {/* Top Banner Card */}
      <div className="bg-[#0B2A1E] border border-[#164432] rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center space-x-5">
          <div className="w-20 h-20 rounded-3xl bg-[#05160E] border border-emerald-500/30 flex items-center justify-center text-4xl shadow-xl hover:scale-105 transition-transform shrink-0">
            {user?.avatar || '👩‍🎓'}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-2xl font-black text-white tracking-tight">
                {user?.displayName || 'Learner Profile'}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#071F15] border border-emerald-500/40 text-emerald-300 font-signify tracking-wider">
                SIGNIFY LEVEL {user?.level || Math.max(1, Math.floor(activeXp / 100) + 1)}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {user?.role === 'admin' ? '🛡️ Administrator' : 'Student Learner'}
              </span>
            </div>
            <p className="text-xs text-emerald-300/80 mt-1 flex flex-wrap items-center gap-1.5">
              <span>{user?.email || 'learner@signify.edu'}</span>
              <span>&bull;</span>
              <span className="text-emerald-400 font-mono">Real-Time Cloud Synced</span>
              <span>&bull;</span>
              <span className="text-amber-300">Signify AI Platform</span>
            </p>
          </div>
        </div>

        {/* Stats Pill Badges */}
        <div className="grid grid-cols-3 gap-3 w-full md:w-auto">
          <div className="bg-[#071F15] border border-[#164432] rounded-2xl p-3.5 text-center flex flex-col items-center">
            <Flame className="w-5 h-5 text-[#F97316] mb-1" />
            <span className="text-xs text-emerald-300/70 font-semibold">Day Streak</span>
            <span className="text-lg font-black text-[#F97316]">{activeStreak} Days</span>
          </div>

          <div className="bg-[#071F15] border border-[#164432] rounded-2xl p-3.5 text-center flex flex-col items-center">
            <Trophy className="w-5 h-5 text-amber-400 mb-1" />
            <span className="text-xs text-emerald-300/70 font-semibold">Trophies</span>
            <span className="text-lg font-black text-amber-400">{activeTrophies}</span>
          </div>

          <div className="bg-[#071F15] border border-[#164432] rounded-2xl p-3.5 text-center flex flex-col items-center">
            <Zap className="w-5 h-5 text-emerald-400 mb-1" />
            <span className="text-xs text-emerald-300/70 font-semibold">Total XP</span>
            <span className="text-lg font-black text-emerald-300">{activeXp} XP</span>
          </div>
        </div>
      </div>

      {/* Progress & Speed Records Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Overall Curriculum Matrix */}
        <div className="lg:col-span-8 bg-[#0B2A1E] border border-[#164432] rounded-3xl p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-[#164432] pb-4">
            <div>
              <h3 className="font-bold text-white text-base">Curriculum Mastery Matrix</h3>
              <p className="text-xs text-emerald-300/80 mt-0.5">
                {totalCompletedCount} of {totalCurriculumCount} signs mastered ({percentComplete}%)
              </p>
            </div>
            <div className="w-36 h-2.5 bg-[#071F15] rounded-full overflow-hidden border border-[#164432]">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-[#F97316] rounded-full transition-all duration-500"
                style={{ width: `${percentComplete}%` }}
              />
            </div>
          </div>

          {/* Curriculum Badges */}
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
            {allSigns.map(sign => {
              const isDone = completedList.includes(sign.letter) || completedList.includes(sign.id);
              return (
                <div
                  key={sign.id}
                  className={`p-2.5 rounded-2xl border text-center flex flex-col items-center justify-center transition-all ${
                    isDone
                      ? 'bg-[#0E3627] border-emerald-500/70 text-emerald-100 shadow-md'
                      : 'bg-[#071F15] border-[#164432] text-emerald-400/50'
                  }`}
                >
                  <span className="text-sm font-black font-signify truncate w-full">{sign.letter}</span>
                  <span className="text-[9px] mt-0.5 uppercase tracking-wider font-semibold">
                    {isDone ? '✓ Done' : 'Locked'}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Duplicate XP Protection explanation */}
          <div className="bg-[#071F15] border border-[#164432] rounded-2xl p-4 flex items-start gap-3">
            <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <p className="text-xs text-emerald-300/80 leading-relaxed">
              <strong className="text-emerald-200">Duplicate Experience Protection:</strong> Daily practice records allow unlimited muscle memory drill, but XP is only credited once per sign per calendar day to ensure consistent long-term habits.
            </p>
          </div>
        </div>

        {/* Right: Personal Speed Leaderboard & Achievements */}
        <div className="lg:col-span-4 space-y-4">
          {/* Reaction Speed Hall of Fame */}
          <div className="bg-[#0B2A1E] border border-[#164432] rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center space-x-2">
              <Timer className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-white text-base">Fastest Reaction Records</h3>
            </div>

            {speedEntries.length > 0 ? (
              <div className="space-y-2">
                {speedEntries.slice(0, 5).map(([signLetter, ms], rank) => (
                  <div key={signLetter} className="flex items-center justify-between p-2.5 rounded-xl bg-[#071F15] border border-[#164432]">
                    <div className="flex items-center space-x-2">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        rank === 0 ? 'bg-amber-500 text-black' : 'bg-emerald-500/20 text-emerald-300'
                      }`}>
                        #{rank + 1}
                      </span>
                      <span className="font-bold font-mono text-white text-xs">{signLetter}</span>
                    </div>
                    <span className="font-mono font-bold text-xs text-emerald-400">
                      {(ms / 1000).toFixed(2)}s
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-emerald-300/70 bg-[#071F15] p-4 rounded-xl border border-[#164432] text-center">
                Practice in Studio or Speed Challenge to record reaction stopwatch times.
              </div>
            )}
          </div>

          {/* Achievements */}
          <div className="bg-[#0B2A1E] border border-[#164432] rounded-3xl p-6 shadow-xl space-y-3.5">
            <h3 className="font-bold text-white text-base">Accomplishments</h3>
            <div className="space-y-2.5">
              {achievements.map((ach, idx) => {
                const Icon = ach.icon;
                return (
                  <div
                    key={idx}
                    className={`p-3 rounded-2xl border flex items-center space-x-3 transition-all ${
                      ach.unlocked
                        ? 'bg-[#0E3627] border-emerald-500/60 shadow-xs'
                        : 'bg-[#071F15] border-[#164432] opacity-50'
                    }`}
                  >
                    <div className={`p-2 rounded-xl shrink-0 ${ach.unlocked ? 'bg-emerald-500/20 text-emerald-400' : 'bg-[#0B2A1E] text-emerald-400/40'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">{ach.title}</h4>
                      <p className="text-[11px] text-emerald-300/80 leading-tight">{ach.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
