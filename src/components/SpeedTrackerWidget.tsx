import React, { useState, useEffect, useRef } from 'react';
import { 
  Timer, 
  Zap, 
  RotateCcw, 
  Trophy, 
  Award, 
  CheckCircle2, 
  Flame,
  ArrowRight
} from 'lucide-react';

interface SpeedTrackerWidgetProps {
  targetLabel: string;
  isMatched: boolean;
  onTimeTrialComplete?: (elapsedMs: number) => void;
  personalBestMs?: number;
  onResetTrial?: () => void;
  compact?: boolean;
}

export const SpeedTrackerWidget: React.FC<SpeedTrackerWidgetProps> = ({
  targetLabel,
  isMatched,
  onTimeTrialComplete,
  personalBestMs,
  onResetTrial,
  compact = false
}) => {
  const [elapsedMs, setElapsedMs] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [completedTime, setCompletedTime] = useState<number | null>(null);

  const startTimeRef = useRef<number>(performance.now());
  const rafRef = useRef<number | null>(null);
  const matchedHandledRef = useRef<boolean>(false);

  // Restart timer whenever the target sign changes
  useEffect(() => {
    startTimeRef.current = performance.now();
    setElapsedMs(0);
    setCompletedTime(null);
    setIsRunning(true);
    matchedHandledRef.current = false;
  }, [targetLabel]);

  // Live stopwatch RAF pump
  useEffect(() => {
    if (!isRunning) return;

    const tick = () => {
      const current = performance.now() - startTimeRef.current;
      setElapsedMs(Math.round(current));
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isRunning]);

  // Handle completion when user successfully matches the sign
  useEffect(() => {
    if (isMatched && isRunning && !matchedHandledRef.current) {
      matchedHandledRef.current = true;
      const finalMs = Math.round(performance.now() - startTimeRef.current);
      setCompletedTime(finalMs);
      setElapsedMs(finalMs);
      setIsRunning(false);
      if (onTimeTrialComplete) {
        onTimeTrialComplete(finalMs);
      }
    }
  }, [isMatched, isRunning, onTimeTrialComplete]);

  const handleRestart = () => {
    startTimeRef.current = performance.now();
    setElapsedMs(0);
    setCompletedTime(null);
    setIsRunning(true);
    matchedHandledRef.current = false;
    if (onResetTrial) onResetTrial();
  };

  // Format milliseconds to "0.00s"
  const formatSeconds = (ms: number): string => {
    return (ms / 1000).toFixed(2) + 's';
  };

  // Speed rating
  const getSpeedTier = (ms: number) => {
    if (ms < 2000) return { label: 'Lightning Fast', color: 'text-amber-400 bg-amber-500/20 border-amber-500/40', icon: Zap };
    if (ms < 4000) return { label: 'Swift Reflexes', color: 'text-emerald-300 bg-emerald-500/20 border-emerald-500/40', icon: Flame };
    if (ms < 7000) return { label: 'Steady Pace', color: 'text-sky-300 bg-sky-500/20 border-sky-500/40', icon: Award };
    return { label: 'Deliberate Form', color: 'text-teal-300 bg-teal-500/20 border-teal-500/40', icon: CheckCircle2 };
  };

  const currentDisplayTime = completedTime !== null ? completedTime : elapsedMs;
  const tier = getSpeedTier(currentDisplayTime);
  const TierIcon = tier.icon;
  const isNewRecord = personalBestMs && completedTime !== null && completedTime < personalBestMs;

  if (compact) {
    return (
      <div className="flex items-center space-x-2 bg-[#071F15] border border-[#164432] rounded-xl px-2.5 py-1 text-xs">
        <Timer className={`w-3.5 h-3.5 ${isRunning ? 'text-amber-400 animate-spin' : 'text-emerald-400'}`} />
        <span className="font-mono font-bold text-white">
          {formatSeconds(currentDisplayTime)}
        </span>
        {completedTime !== null && (
          <span className="text-[10px] text-emerald-400 font-semibold">Done!</span>
        )}
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border transition-all ${
      completedTime !== null 
        ? 'bg-gradient-to-br from-[#0B2A1E] to-[#0E3627] border-emerald-500/60 shadow-lg shadow-emerald-950/40' 
        : 'bg-[#0B2A1E] border-[#164432]'
    } p-3.5 sm:p-4 space-y-3`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className={`p-1.5 rounded-lg ${isRunning ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
            <Timer className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-white tracking-wide block">
              Speed & Reaction Stopwatch
            </span>
            <span className="text-[10px] text-emerald-300/70">
              Target: <span className="font-bold text-white font-mono">{targetLabel}</span>
            </span>
          </div>
        </div>

        <button
          onClick={handleRestart}
          className="p-1.5 rounded-lg bg-[#071F15] hover:bg-[#123828] border border-[#164432] text-emerald-300 hover:text-white transition-colors cursor-pointer"
          title="Restart Stopwatch"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main Counter Display */}
      <div className="flex items-baseline justify-between bg-[#05160E] border border-[#143B2B] rounded-xl px-4 py-2.5">
        <div>
          <span className="text-[10px] uppercase font-bold text-emerald-400/80 block">
            {completedTime !== null ? 'Sign Time Recorded' : 'Execution Time'}
          </span>
          <span className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${
            completedTime !== null ? 'text-emerald-400' : 'text-amber-300'
          }`}>
            {formatSeconds(currentDisplayTime)}
          </span>
        </div>

        {/* Speed Tier Badge */}
        <div className={`px-2.5 py-1 rounded-full border text-[11px] font-bold flex items-center gap-1.5 ${tier.color}`}>
          <TierIcon className="w-3.5 h-3.5" />
          <span>{tier.label}</span>
        </div>
      </div>

      {/* Footer Info: Personal Best & Status */}
      <div className="flex items-center justify-between text-[11px] pt-0.5">
        <div className="flex items-center space-x-1.5 text-emerald-300/80">
          <Award className="w-3.5 h-3.5 text-amber-400" />
          <span>Personal Best:</span>
          <span className="font-mono font-bold text-white">
            {personalBestMs ? formatSeconds(personalBestMs) : '--'}
          </span>
        </div>

        {completedTime !== null ? (
          <span className={`font-semibold ${isNewRecord ? 'text-amber-400 animate-pulse' : 'text-emerald-400'}`}>
            {isNewRecord ? '⚡ New Personal Record!' : 'Sign verified!'}
          </span>
        ) : (
          <span className="text-emerald-400/70 italic text-[10px]">
            Make sign to stop clock...
          </span>
        )}
      </div>
    </div>
  );
};
