import React, { useRef, useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { 
  Camera, 
  CameraOff, 
  Sparkles, 
  Flame, 
  Zap, 
  Trophy, 
  RefreshCw, 
  CheckCircle2, 
  Sliders, 
  Award,
  Clock,
  Target,
  Video,
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import { getAllSigns, CURRICULUM_MODULES } from '../data/aslCurriculum';
import { ASLSign, HandLandmark } from '../types/index';
import { classifyHandPose, analyzeFingers, ClassificationResult } from '../utils/aslClassifier';
import { globalMotionTracker } from '../utils/motionTracker';
import { soundEngine } from '../utils/audio';
import { getHandsInstance, subscribeHandTracker, processVideoFrame } from '../utils/handTracker';
import { SpeedTrackerWidget } from './SpeedTrackerWidget';
import { SignVideoModal } from './SignVideoModal';
import { authSyncService } from '../services/authSyncService';

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

interface PracticeViewProps {
  onScoreEarned?: (amount: number) => void;
  initialSign?: string;
  onSignChange?: (sign: string) => void;
}

export const PracticeView: React.FC<PracticeViewProps> = ({ onScoreEarned, initialSign, onSignChange }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pumpFrameRef = useRef<number | null>(null);

  const allSigns = getAllSigns();
  const [selectedModule, setSelectedModule] = useState<'all' | 'alphabet' | 'numbers' | 'words' | 'phrases'>('all');
  
  const getFilteredSigns = useCallback(() => {
    return allSigns.filter(s => {
      if (selectedModule === 'all') return true;
      const type = s.signType || (s.category === 'number' ? 'numbers' : s.category === 'word' ? 'words' : s.category === 'phrase' ? 'phrases' : 'alphabet');
      return type === selectedModule;
    });
  }, [allSigns, selectedModule]);

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [detectedLetter, setDetectedLetter] = useState<string>('--');
  const [confidence, setConfidence] = useState<number>(0);
  const [topPredictions, setTopPredictions] = useState<{ letter: string; score: number }[]>([]);

  // Challenge / Target Mode State
  const [challengeTarget, setChallengeTarget] = useState<string>(initialSign || 'A');
  const prevInitialSignRef = useRef(initialSign);

  useEffect(() => {
    if (initialSign && initialSign !== prevInitialSignRef.current) {
      prevInitialSignRef.current = initialSign;
      setChallengeTarget(initialSign);
    }
  }, [initialSign]);

  const [isChallengeMode, setIsChallengeMode] = useState(false);
  const [challengeTimer, setChallengeTimer] = useState(60);
  const [challengeScore, setChallengeScore] = useState(0);
  const [challengeActive, setChallengeActive] = useState(false);

  // Speed Tracker & Video Modal state
  const [isTargetMatched, setIsTargetMatched] = useState<boolean>(false);
  const [speedTrialKey, setSpeedTrialKey] = useState<number>(Date.now());
  const [videoModalOpen, setVideoModalOpen] = useState<boolean>(false);

  const currentUser = authSyncService.getCurrentUser();
  const currentTargetSign: ASLSign = allSigns.find(s => s.letter === challengeTarget || s.id === challengeTarget) || allSigns[0];

  const pickRandomSign = useCallback(() => {
    globalMotionTracker.reset();
    const list = getFilteredSigns();
    const randomSign = list[Math.floor(Math.random() * list.length)] || allSigns[0];
    setChallengeTarget(randomSign.letter);
    onSignChange?.(randomSign.letter);
    setIsTargetMatched(false);
    setSpeedTrialKey(Date.now());
  }, [getFilteredSigns, allSigns, onSignChange]);

  // Challenge countdown timer
  useEffect(() => {
    let interval: any = null;
    if (challengeActive && challengeTimer > 0) {
      interval = setInterval(() => {
        setChallengeTimer(t => {
          if (t <= 1) {
            setChallengeActive(false);
            soundEngine.playLevelUp();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [challengeActive, challengeTimer]);

  const startChallenge = () => {
    setIsChallengeMode(true);
    setChallengeTimer(60);
    setChallengeScore(0);
    setChallengeActive(true);
    pickRandomSign();
  };

  // Start Camera with 3-tier progressive constraints
  const startCamera = async (checkCancelled?: () => boolean) => {
    // Release any previous tracks first
    if (videoRef.current && videoRef.current.srcObject) {
      const s = videoRef.current.srcObject as MediaStream;
      s.getTracks().forEach(t => { try { t.stop(); } catch {} });
      videoRef.current.srcObject = null;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setIsCameraActive(false);
      return;
    }

    if (checkCancelled && checkCancelled()) return;

    let stream: MediaStream | null = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false
      });
    } catch {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false
        });
      } catch {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
          });
        } catch (e) {
          console.error('All camera constraint tiers failed in PracticeView:', e);
        }
      }
    }

    if (!stream) {
      setIsCameraActive(false);
      return;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.muted = true;
      videoRef.current.playsInline = true;
      videoRef.current.play().catch(() => {});
      setIsCameraActive(true);
    }

    try {
      await getHandsInstance();
    } catch (e) {
      console.warn('Hands init deferred in PracticeView:', e);
    }

    if (pumpFrameRef.current) {
      cancelAnimationFrame(pumpFrameRef.current);
      pumpFrameRef.current = null;
    }

    const pump = async () => {
      if (videoRef.current && videoRef.current.readyState >= 2) {
        await processVideoFrame(videoRef.current);
      }
      pumpFrameRef.current = requestAnimationFrame(pump);
    };

    pumpFrameRef.current = requestAnimationFrame(pump);
  };

  const stopCamera = () => {
    if (pumpFrameRef.current) {
      cancelAnimationFrame(pumpFrameRef.current);
      pumpFrameRef.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  // Mount camera once on load
  useEffect(() => {
    let isCancelled = false;
    startCamera(() => isCancelled);

    return () => {
      isCancelled = true;
      stopCamera();
    };
  }, []);

  // Subscribe to MediaPipe singleton hand tracker
  useEffect(() => {
    const unsubscribe = subscribeHandTracker((landmarks) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (landmarks && landmarks.length >= 21) {
        // Sync canvas internal resolution with its rendered client bounds
        if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
          canvas.width = canvas.clientWidth;
          canvas.height = canvas.clientHeight;
        }

        const video = videoRef.current;
        const vWidth = video?.videoWidth || 640;
        const vHeight = video?.videoHeight || 480;
        const cWidth = canvas.width;
        const cHeight = canvas.height;

        // Sub-pixel object-cover projection mapping:
        const scale = Math.max(cWidth / vWidth, cHeight / vHeight);
        const renderWidth = vWidth * scale;
        const renderHeight = vHeight * scale;
        const offsetX = (cWidth - renderWidth) / 2;
        const offsetY = (cHeight - renderHeight) / 2;

        const toCanvasX = (normX: number) => offsetX + (1 - normX) * renderWidth;
        const toCanvasY = (normY: number) => offsetY + normY * renderHeight;

        // Draw Skeleton Lines
        ctx.save();
        ctx.strokeStyle = '#F97316';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        SKELETON_CONNECTIONS.forEach(([p1, p2]) => {
          const pt1 = landmarks[p1];
          const pt2 = landmarks[p2];
          if (!pt1 || !pt2) return;
          ctx.beginPath();
          ctx.moveTo(toCanvasX(pt1.x), toCanvasY(pt1.y));
          ctx.lineTo(toCanvasX(pt2.x), toCanvasY(pt2.y));
          ctx.stroke();
        });

        // Draw 21 Landmark Nodes
        landmarks.forEach((pt, idx) => {
          const cx = toCanvasX(pt.x);
          const cy = toCanvasY(pt.y);
          const isTip = [4, 8, 12, 16, 20].includes(idx);
          const radius = isTip ? 6 : 4;

          ctx.beginPath();
          ctx.arc(cx, cy, radius + 2, 0, 2 * Math.PI);
          ctx.fillStyle = '#F97316';
          ctx.fill();

          ctx.beginPath();
          ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
          ctx.fillStyle = '#FFFFFF';
          ctx.fill();
        });
        ctx.restore();

        // Motion Evaluation
        const now = performance.now();
        globalMotionTracker.addFrame(landmarks, now);
        const fingerAnalysis = analyzeFingers(landmarks);
        const motionState = globalMotionTracker.evaluate(fingerAnalysis, challengeTarget);

        const result: ClassificationResult = classifyHandPose(landmarks, challengeTarget, motionState);
        setDetectedLetter(result.letter);
        setConfidence(Math.round(result.confidence * 100));
        setTopPredictions(result.rawDistances);

        // Check match for target (strict >= 0.65 confidence and anatomical match)
        const isDynamicTarget = challengeTarget === 'J' || challengeTarget === 'Z' || currentTargetSign.dynamicMotion;
        const isMatch = isDynamicTarget
          ? (challengeTarget === 'J' && motionState.j.detected) ||
            (challengeTarget === 'Z' && motionState.z.detected) ||
            (result.letter === challengeTarget && result.confidence >= 0.65)
          : (result.letter === challengeTarget && result.confidence >= 0.65);

        if (isMatch && !isTargetMatched) {
          setIsTargetMatched(true);
          soundEngine.playSuccess();

          if (isChallengeMode && challengeActive) {
            setChallengeScore(s => s + 1);
            if (onScoreEarned) onScoreEarned(15);
            setTimeout(() => {
              pickRandomSign();
            }, 800);
          }
        }
      } else {
        setDetectedLetter('--');
        setConfidence(0);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [challengeTarget, isChallengeMode, challengeActive, isTargetMatched, currentTargetSign, pickRandomSign, onScoreEarned]);

  const handleTimeTrialComplete = async (elapsedMs: number) => {
    // Record with authSyncService and award progress
    const signXp = currentTargetSign.category === 'phrase' ? 35 : currentTargetSign.category === 'word' ? 25 : currentTargetSign.category === 'number' ? 20 : 15;
    const res = await authSyncService.recordSignPractice(challengeTarget, signXp, elapsedMs);
    if (res.xpEarned > 0 && onScoreEarned) {
      onScoreEarned(res.xpEarned);
    }
  };

  const filteredSigns = getFilteredSigns();

  return (
    <div className="space-y-6 pb-14">
      {/* Header Banner */}
      <div className="bg-[#0B2A1E] border border-[#164432] rounded-3xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-[#F97316] text-white flex items-center justify-center shadow-lg font-bold text-xl">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Speed Challenge &amp; Reaction Practice
            </h2>
            <p className="text-xs text-emerald-300/90 mt-0.5">
              Practice signs against the live stopwatch or enter the 60-second speed challenge.
            </p>
          </div>
        </div>

        {/* Challenge button and module filter */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center bg-[#071F15] border border-[#164432] rounded-xl p-0.5 text-xs">
            {(['all', 'alphabet', 'numbers', 'words', 'phrases'] as const).map(mod => (
              <button
                key={mod}
                onClick={() => {
                  setSelectedModule(mod);
                  setTimeout(() => pickRandomSign(), 50);
                }}
                className={`px-2.5 py-1.5 rounded-lg capitalize font-medium transition-colors cursor-pointer ${
                  selectedModule === mod
                    ? 'bg-[#F97316] text-white font-semibold'
                    : 'text-emerald-300/80 hover:text-white'
                }`}
              >
                {mod}
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              if (isChallengeMode) {
                setIsChallengeMode(false);
                setChallengeActive(false);
              } else {
                startChallenge();
              }
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              isChallengeMode
                ? 'bg-[#071F15] border border-amber-500/40 text-amber-300 hover:bg-[#0E3524]'
                : 'bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700 shadow-md'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>{isChallengeMode ? 'Exit Challenge' : 'Start 60s Challenge'}</span>
          </button>
        </div>
      </div>

      {/* Main Practice View Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Video & Skeleton Canvas */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative rounded-2xl overflow-hidden bg-[#04120B] border border-[#164432] aspect-video flex items-center justify-center shadow-2xl">
            <video
              ref={videoRef}
              playsInline
              muted
              className="w-full h-full object-cover scale-x-[-1]"
            />
            <canvas
              ref={canvasRef}
              width={640}
              height={480}
              className="absolute inset-0 w-full h-full pointer-events-none"
            />

            {/* Target Sign Badge Overlay */}
            <div className="absolute top-4 left-4 bg-[#0B2A1E]/95 backdrop-blur-md border border-[#164432] rounded-2xl p-3 flex items-center space-x-3 shadow-lg">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FF4D26] to-[#F97316] text-white font-black text-2xl flex items-center justify-center shadow-md">
                {challengeTarget}
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-400/80 block">
                  Target Sign
                </span>
                <span className="text-sm font-bold text-white block">
                  {currentTargetSign.title}
                </span>
              </div>
            </div>

            {/* Challenge Countdown */}
            {isChallengeMode && (
              <div className="absolute top-4 right-4 bg-[#0B2A1E]/95 backdrop-blur-md border border-amber-500/40 rounded-2xl px-4 py-2 flex items-center space-x-2 text-amber-300">
                <Clock className="w-4 h-4" />
                <span className="font-mono font-bold text-lg">{challengeTimer}s</span>
                <span className="text-xs text-white">&bull; Score: {challengeScore}</span>
              </div>
            )}

            {/* Match Toast overlay */}
            {isTargetMatched && (
              <div className="absolute inset-0 bg-emerald-950/40 backdrop-blur-xs flex items-center justify-center pointer-events-none">
                <div className="bg-[#05160E] border border-emerald-500 rounded-3xl p-5 text-center shadow-2xl space-y-2 animate-in zoom-in-95 duration-200">
                  <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <h4 className="text-lg font-black text-white">Sign '{challengeTarget}' Matched!</h4>
                  <p className="text-xs text-emerald-300">Speed stopwatch recorded below</p>
                </div>
              </div>
            )}
          </div>

          {/* Quick Sign Picker Grid */}
          <div className="bg-[#0B2A1E] border border-[#164432] rounded-2xl p-4 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white">Click any sign to test reaction speed:</span>
              <span className="text-emerald-400 font-mono text-[11px]">{filteredSigns.length} Signs</span>
            </div>

            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
              {filteredSigns.map(sign => (
                <button
                  key={sign.id}
                  onClick={() => {
                    setChallengeTarget(sign.letter);
                    setIsTargetMatched(false);
                    setSpeedTrialKey(Date.now());
                  }}
                  className={`px-3 py-1.5 rounded-xl font-bold font-mono text-xs transition-all cursor-pointer ${
                    challengeTarget === sign.letter
                      ? 'bg-[#F97316] text-white shadow-md'
                      : 'bg-[#071F15] hover:bg-[#123828] text-emerald-200 border border-[#164432]'
                  }`}
                >
                  {sign.letter}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Stopwatch Tracker & Action Controls */}
        <div className="lg:col-span-5 space-y-4">
          {/* Reaction Speed Stopwatch (Comment 3) */}
          <SpeedTrackerWidget
            key={speedTrialKey}
            targetLabel={challengeTarget}
            isMatched={isTargetMatched}
            onTimeTrialComplete={handleTimeTrialComplete}
            personalBestMs={currentUser?.bestSpeedRecords?.[challengeTarget]}
            onResetTrial={() => setIsTargetMatched(false)}
          />

          {/* Demonstration & Guidance Card */}
          <div className="bg-[#0B2A1E] border border-[#164432] rounded-3xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Posture Instructions
                </span>
              </div>

              <button
                onClick={() => setVideoModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-[#071F15] hover:bg-[#123828] border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Video className="w-3.5 h-3.5 text-[#FF4D26]" />
                <span>Watch Video Sample</span>
              </button>
            </div>

            <p className="text-xs text-emerald-100/90 leading-relaxed bg-[#071F15] p-3.5 rounded-2xl border border-[#164432]">
              {currentTargetSign.description}
            </p>

            {/* Finger states */}
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-emerald-400">
                Key Finger Placement
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {Object.entries(currentTargetSign.fingerStates).map(([f, s]) => (
                  <div key={f} className="p-2 rounded-xl bg-[#071F15] border border-[#164432]">
                    <span className="font-bold text-amber-400 capitalize text-[10px] block">{f}</span>
                    <span className="text-[11px] text-emerald-200/90 truncate block">{s}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Next Random Sign Button */}
            <button
              onClick={pickRandomSign}
              className="w-full py-3 rounded-2xl bg-[#071F15] hover:bg-[#123828] border border-[#164432] text-white font-bold text-xs flex items-center justify-center space-x-2 transition-colors cursor-pointer"
            >
              <span>Next Random Practice Sign</span>
              <ChevronRight className="w-4 h-4 text-[#F97316]" />
            </button>
          </div>
        </div>
      </div>

      {/* Video Demonstration Modal */}
      {videoModalOpen && (
        <SignVideoModal
          sign={currentTargetSign}
          isOpen={videoModalOpen}
          onClose={() => setVideoModalOpen(false)}
        />
      )}
    </div>
  );
};
