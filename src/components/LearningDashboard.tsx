import React, { useState } from 'react';
import { 
  Flame, 
  Zap, 
  Trophy, 
  Timer, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles, 
  BookOpen, 
  Camera, 
  Target, 
  ShieldCheck, 
  Info,
  PlayCircle,
  Video,
  Award,
  Layers,
  GraduationCap,
  Hash,
  MessageSquare
} from 'lucide-react';
import { UserProfile, CurriculumModule, CurriculumUnit } from '../types/index';
import { CURRICULUM_UNITS, CURRICULUM_MODULES } from '../data/aslCurriculum';

interface LearningDashboardProps {
  user: UserProfile;
  onSelectModule: (module: CurriculumModule) => void;
  onStartPractice: (initialSign?: string) => void;
  onOpenStudio: (initialSign?: string) => void;
  onOpenDictionary: () => void;
  onOpenAdmin?: () => void;
}

export const LearningDashboard: React.FC<LearningDashboardProps> = ({
  user,
  onSelectModule,
  onStartPractice,
  onOpenStudio,
  onOpenDictionary,
  onOpenAdmin
}) => {
  const [selectedUnitId, setSelectedUnitId] = useState<string>('all');
  const todayStr = new Date().toISOString().split('T')[0];
  const todayPracticed = user.dailyPracticedSigns?.[todayStr] || [];
  const completedSignsSet = new Set(user.completedSigns || []);

  return (
    <div className="space-y-8 py-2 pb-14">
      {/* Welcome Banner Card */}
      <div className="bg-gradient-to-r from-[#0B2A1E] via-[#0D3325] to-[#071F15] border border-[#164432] rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center space-x-4 sm:space-x-5">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-[#05160E] border border-emerald-500/30 flex items-center justify-center text-3xl sm:text-4xl shadow-lg shrink-0">
            {user.avatar || '👩‍🎓'}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Welcome back, {user.displayName}!
              </h2>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                user.role === 'admin'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              }`}>
                {user.role === 'admin' ? '🛡️ Administrator' : `Signify Level ${user.level}`}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-emerald-300/80 mt-1 max-w-xl">
              Track your daily ASL practice streak, reaction speed records, and explore structured modules grounded in real-time computer vision.
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="text-xs text-emerald-400 font-mono">
                {user.email}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Launch Studio Action */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full md:w-auto">
          <button
            onClick={() => onOpenStudio('A')}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm shadow-xl shadow-emerald-950/40 flex items-center justify-center gap-2 transition-all hover:scale-102 cursor-pointer"
          >
            <Camera className="w-4 h-4" />
            <span>Start Learning</span>
          </button>

          {user.role === 'admin' && onOpenAdmin && (
            <button
              onClick={onOpenAdmin}
              className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-[#05160E] hover:bg-[#0B2A1E] border border-amber-500/40 text-amber-300 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Admin Panel</span>
            </button>
          )}
        </div>
      </div>

      {/* Progress Telemetry Row (Streak, XP, Trophies, Speed) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Streak */}
        <div className="bg-[#0B2A1E] border border-[#164432] rounded-2xl p-4 sm:p-5 flex items-center space-x-3.5 shadow-md">
          <div className="w-12 h-12 rounded-xl bg-orange-500/20 text-[#F97316] flex items-center justify-center border border-orange-500/30 shrink-0">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-emerald-300/70 uppercase tracking-wider block">
              Active Streak
            </span>
            <span className="text-xl sm:text-2xl font-black text-white font-mono">
              {user.streak} <span className="text-xs text-orange-400 font-sans font-bold">Days</span>
            </span>
          </div>
        </div>

        {/* Experience Points */}
        <div className="bg-[#0B2A1E] border border-[#164432] rounded-2xl p-4 sm:p-5 flex items-center space-x-3.5 shadow-md">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shrink-0">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-emerald-300/70 uppercase tracking-wider block">
              Experience Gained
            </span>
            <span className="text-xl sm:text-2xl font-black text-white font-mono">
              {user.xp} <span className="text-xs text-emerald-400 font-sans font-bold">XP</span>
            </span>
          </div>
        </div>

        {/* Trophies */}
        <div className="bg-[#0B2A1E] border border-[#164432] rounded-2xl p-4 sm:p-5 flex items-center space-x-3.5 shadow-md">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30 shrink-0">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-emerald-300/70 uppercase tracking-wider block">
              Trophies Earned
            </span>
            <span className="text-xl sm:text-2xl font-black text-white font-mono">
              {user.trophies} <span className="text-xs text-amber-400 font-sans font-bold">Awards</span>
            </span>
          </div>
        </div>

        {/* Speed Record */}
        <div className="bg-[#0B2A1E] border border-[#164432] rounded-2xl p-4 sm:p-5 flex items-center space-x-3.5 shadow-md">
          <div className="w-12 h-12 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-500/30 shrink-0">
            <Timer className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-emerald-300/70 uppercase tracking-wider block">
              Avg Reaction Speed
            </span>
            <span className="text-xl sm:text-2xl font-black text-white font-mono">
              {user.averageSpeedMs && user.averageSpeedMs > 0 ? `${(user.averageSpeedMs / 1000).toFixed(2)}s` : '--'}
            </span>
          </div>
        </div>
      </div>

      {/* Curriculum Units & Modules Section */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                Curriculum Roadmap
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                3-Unit Learning Path
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-emerald-300/80 mt-1">
              Progressive mastery from Alphabet finger-spelling to Numeric gestures and WLASL conversational vocabulary.
            </p>
          </div>

          <button
            onClick={onOpenDictionary}
            className="self-start sm:self-auto px-4 py-2 rounded-xl bg-[#0B2A1E] hover:bg-[#123828] border border-[#164432] text-xs text-emerald-300 hover:text-white font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
            <span>Sign Dictionary</span>
          </button>
        </div>

        {/* Unit Selector Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-[#164432] pb-3">
          <button
            onClick={() => setSelectedUnitId('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedUnitId === 'all'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-[#071F15] text-emerald-300/70 hover:text-white border border-[#164432]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>All Units (13 Modules)</span>
          </button>

          {CURRICULUM_UNITS.map(unit => {
            const isSelected = selectedUnitId === unit.id;
            return (
              <button
                key={unit.id}
                onClick={() => setSelectedUnitId(unit.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-[#071F15] text-emerald-300/70 hover:text-white border border-[#164432]'
                }`}
              >
                {unit.unitNumber === 1 && <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />}
                {unit.unitNumber === 2 && <Hash className="w-3.5 h-3.5 text-amber-400" />}
                {unit.unitNumber === 3 && <MessageSquare className="w-3.5 h-3.5 text-sky-400" />}
                <span>Unit {unit.unitNumber}: {unit.difficulty} ({unit.modules.length})</span>
              </button>
            );
          })}
        </div>

        {/* Units Container */}
        {CURRICULUM_UNITS.filter(unit => selectedUnitId === 'all' || selectedUnitId === unit.id).map(unit => {
          const unitTotalSigns = unit.modules.reduce((acc, m) => acc + m.itemCount, 0);
          const unitCompletedSigns = unit.modules.reduce((acc, m) => {
            return acc + m.signs.filter(s => completedSignsSet.has(s.letter) || completedSignsSet.has(s.id)).length;
          }, 0);
          const unitPercent = unitTotalSigns > 0 ? Math.round((unitCompletedSigns / unitTotalSigns) * 100) : 0;

          return (
            <div key={unit.id} className="space-y-4 pt-2">
              {/* Unit Header Card */}
              <div className="bg-gradient-to-r from-[#071F15] via-[#0B2A1E] to-[#071F15] border border-[#164432] rounded-2xl p-5 sm:p-6 shadow-lg">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-amber-400 tracking-wider">
                        {unit.badge}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        unit.difficulty === 'Beginner' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                        unit.difficulty === 'Intermediate' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                        'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                      }`}>
                        {unit.difficulty}
                      </span>
                    </div>
                    <h4 className="text-lg sm:text-xl font-black text-white tracking-tight">
                      {unit.title}
                    </h4>
                    <p className="text-xs text-emerald-300/80 max-w-2xl">
                      {unit.description}
                    </p>
                  </div>

                  {/* Unit Completion Metric */}
                  <div className="bg-[#05160E] border border-[#164432] rounded-xl p-3 px-4 shrink-0 flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-[11px] font-semibold text-emerald-300/70">
                        Unit Mastery
                      </div>
                      <div className="text-sm font-bold text-white font-mono">
                        {unitCompletedSigns} / {unitTotalSigns} signs
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-[#0B2A1E] border border-emerald-500/30 flex items-center justify-center text-xs font-mono font-bold text-emerald-300">
                      {unitPercent}%
                    </div>
                  </div>
                </div>
              </div>

              {/* Modules Grid for this Unit */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {unit.modules.map(module => {
                  const completedCount = module.signs.filter(s => 
                    completedSignsSet.has(s.letter) || completedSignsSet.has(s.id)
                  ).length;
                  const percent = Math.round((completedCount / module.itemCount) * 100);

                  return (
                    <div 
                      key={module.id}
                      className="bg-[#0B2A1E] border border-[#164432] hover:border-emerald-500/50 rounded-2xl p-5 shadow-lg space-y-4 flex flex-col justify-between transition-all group"
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-amber-400 font-mono tracking-wide">
                            {module.badge}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#071F15] text-emerald-300 border border-[#164432]">
                            +{module.xpPerSign} XP
                          </span>
                        </div>

                        <h5 className="text-base font-bold text-white group-hover:text-emerald-200 transition-colors">
                          {module.title}
                        </h5>
                        <p className="text-xs text-emerald-300/80 leading-relaxed line-clamp-2">
                          {module.description}
                        </p>

                        {/* Progress Bar */}
                        <div className="space-y-1 pt-1">
                          <div className="flex items-center justify-between text-[11px] font-semibold">
                            <span className="text-emerald-300/80">
                              {completedCount} / {module.itemCount} signs
                            </span>
                            <span className="text-emerald-400 font-mono font-bold">
                              {percent}%
                            </span>
                          </div>
                          <div className="w-full h-2 bg-[#05160E] rounded-full overflow-hidden border border-[#164432]">
                            <div 
                              className={`h-full bg-gradient-to-r ${module.color} rounded-full transition-all duration-500`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Module Action Buttons */}
                      <div className="pt-2 flex items-center space-x-2">
                        <button
                          onClick={() => {
                            onSelectModule(module);
                            const firstSign = module.signs[0]?.letter;
                            onOpenStudio(firstSign);
                          }}
                          className="flex-1 py-2 rounded-xl bg-[#071F15] hover:bg-[#123828] border border-[#164432] text-white text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                        >
                          <Camera className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Studio</span>
                        </button>

                        <button
                          onClick={() => {
                            onSelectModule(module);
                            onStartPractice(module.signs[0]?.letter);
                          }}
                          className="flex-1 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center justify-center space-x-1.5 transition-all shadow-md cursor-pointer"
                        >
                          <Target className="w-3.5 h-3.5 text-amber-300" />
                          <span>Speed Test</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
