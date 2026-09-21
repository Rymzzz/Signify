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
  Target
} from 'lucide-react';
import { ASL_ALPHABET } from '../data/aslAlphabet';
import { ASLSign, HandLandmark } from '../types/index';
import { classifyHandPose, analyzeFingers, ClassificationResult } from '../utils/aslClassifier';
import { globalMotionTracker } from '../utils/motionTracker';
import { soundEngine } from '../utils/audio';
import { getHandsInstance, subscribeHandTracker, processVideoFrame } from '../utils/handTracker';

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
}

export const PracticeView: React.FC<PracticeViewProps> = ({ onScoreEarned }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pumpFrameRef = useRef<number | null>(null);

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [detectedLetter, setDetectedLetter] = useState<string>('--');
  const [confidence, setConfidence] = useState<number>(0);
  const [topPredictions, setTopPredictions] = useState<{ letter: string; score: number }[]>([]);
  const [history, setHistory] = useState<{ letter: string; time: string; confidence: number }[]>([]);

  // Challenge Mode State
  const [isChallengeMode, setIsChallengeMode] = useState(false);
  const [challengeTarget, setChallengeTarget] = useState<string>('A');
  const [challengeTimer, setChallengeTimer] = useState(60);
  const [challengeScore, setChallengeScore] = useState(0);
  const [challengeActive, setChallengeActive] = useState(false);

  const pickRandomLetter = useCallback(() => {
    globalMotionTracker.reset();
    const randomSign = ASL_ALPHABET[Math.floor(Math.random() * ASL_ALPHABET.length)];
    setChallengeTarget(randomSign.letter);
  }, []);

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

  // Start Challenge
  const startChallenge = () => {
    setIsChallengeMode(true);
    setChallengeTimer(60);
    setChallengeScore(0);
    setChallengeActive(true);
    pickRandomLetter();
  };

  // Setup camera & MediaPipe hands
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
        setIsCameraActive(true);
      }

      // Initialize singleton MediaPipe Hands
      try {
        await getHandsInstance();
      } catch (e) {
        console.warn('MediaPipe Hands initialization deferred in PracticeView:', e);
      }

      // Video pump using singleton tracker
      const pump = async () => {
        if (videoRef.current && videoRef.current.readyState >= 2) {
          await processVideoFrame(videoRef.current);
        }
        pumpFrameRef.current = requestAnimationFrame(pump);
      };
      pump();
    } catch {
      // Fallback
    }
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

  useEffect(() => {
    const unsubscribe = subscribeHandTracker((landmarks) => {
      if (!canvasRef.current || !videoRef.current) return;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (landmarks && landmarks.length > 0) {
        // Render skeleton
        ctx.save();
        ctx.strokeStyle = '#F97316';
        ctx.lineWidth = 3.5;
        ctx.lineCap = 'round';

        SKELETON_CONNECTIONS.forEach(([p1, p2]) => {
          const pt1 = landmarks[p1];
          const pt2 = landmarks[p2];
          if (!pt1 || !pt2) return;
          ctx.beginPath();
          // Mirror coordinates
          ctx.moveTo((1 - pt1.x) * canvas.width, pt1.y * canvas.height);
          ctx.lineTo((1 - pt2.x) * canvas.width, pt2.y * canvas.height);
          ctx.stroke();
        });

        // Draw joints
        landmarks.forEach((pt) => {
          const cx = (1 - pt.x) * canvas.width;
          const cy = pt.y * canvas.height;
          ctx.beginPath();
          ctx.arc(cx, cy, 6, 0, 2 * Math.PI);
          ctx.fillStyle = '#FF7A00';
          ctx.fill();
          ctx.lineWidth = 2;
          ctx.strokeStyle = '#FFFFFF';
          ctx.stroke();
        });

        ctx.restore();

        const now = performance.now();
        globalMotionTracker.addFrame(landmarks, now);
        const targetLetter = isChallengeMode ? challengeTarget : undefined;
        const fingerAnalysis = analyzeFingers(landmarks);
        const motionState = globalMotionTracker.evaluate(fingerAnalysis, targetLetter);

        // Draw dynamic motion trail on canvas (cyan glow)
        const activeTrail = motionState.activeTrail;
        if (activeTrail.length >= 2) {
          ctx.save();
          ctx.strokeStyle = '#38BDF8';
          ctx.lineWidth = 5;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.shadowColor = '#0284C7';
          ctx.shadowBlur = 12;

          ctx.beginPath();
          activeTrail.forEach((pt, i) => {
            const tx = (1 - pt.x) * canvas.width;
            const ty = pt.y * canvas.height;
            if (i === 0) ctx.moveTo(tx, ty);
            else ctx.lineTo(tx, ty);
          });
          ctx.stroke();
          ctx.restore();
        }

        // Run classification with dynamic motion evaluation
        const result: ClassificationResult = classifyHandPose(landmarks, targetLetter, motionState);
        setDetectedLetter(result.letter);
        setConfidence(Math.round(result.confidence * 100));
        setTopPredictions(result.rawDistances);

        // Check challenge hit (supports dynamic stroke for J & Z)
        const isDynamicTarget = challengeTarget === 'J' || challengeTarget === 'Z';
        const isChallengeMatch = isDynamicTarget
          ? (challengeTarget === 'J' && motionState.j.detected) || (challengeTarget === 'Z' && motionState.z.detected)
          : (result.letter === challengeTarget && result.confidence > 0.65);

        if (isChallengeMode && challengeActive && isChallengeMatch) {
          soundEngine.playSuccess();
          setChallengeScore(s => s + 1);
          if (onScoreEarned) onScoreEarned(15);
          pickRandomLetter();
        }
      } else {
        setDetectedLetter('--');
        setConfidence(0);
      }
    });

    startCamera();

    return () => {
      unsubscribe();
      stopCamera();
    };
  }, [isChallengeMode, challengeTarget, challengeActive]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-[#0B2A1E] border border-[#164432] rounded-3xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-[#F97316] text-white flex items-center justify-center shadow-lg font-bold text-xl">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Freeform Practice &amp; Speed Challenge (A – Z)
            </h2>
            <p className="text-xs text-emerald-300/90 mt-0.5">
              Sign any letter freely or test your fingerspelling fluency against the 60-second speed clock.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
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
                : 'bg-[#F97316] text-white hover:bg-[#EA580C] shadow-md'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>{isChallengeMode ? 'Exit Challenge Mode' : 'Start 60s Challenge'}</span>
          </button>

          <button
            onClick={() => isCameraActive ? stopCamera() : startCamera()}
            className="px-4 py-2 rounded-xl bg-[#071F15] border border-[#164432] hover:bg-[#0E3524] text-emerald-200 text-xs font-semibold flex items-center gap-2 cursor-pointer"
          >
            {isCameraActive ? <CameraOff className="w-4 h-4 text-rose-400" /> : <Camera className="w-4 h-4 text-emerald-400" />}
            <span>{isCameraActive ? 'Pause Camera' : 'Start Camera'}</span>
          </button>
        </div>
      </div>

      {/* Main Practice Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Video & Live Feed */}
        <div className="lg:col-span-8 bg-[#0B2A1E] border border-[#164432] rounded-3xl p-5 shadow-xl flex flex-col space-y-4">
          {/* Target / Mode Header */}
          {isChallengeMode ? (
            <div className="bg-[#071F15] border border-amber-500/40 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-xl bg-[#F97316] text-white font-black text-2xl flex items-center justify-center shadow-md animate-pulse">
                  {challengeTarget}
                </div>
                <div>
                  <div className="text-xs text-amber-300 font-semibold">SPEED CHALLENGE TARGET</div>
                  <div className="text-base font-bold text-white">Sign the letter &apos;{challengeTarget}&apos;</div>
                </div>
              </div>

              <div className="flex items-center gap-4 text-right">
                <div>
                  <div className="text-[10px] uppercase text-emerald-400 font-semibold">Score</div>
                  <div className="text-xl font-black text-emerald-300">{challengeScore} pts</div>
                </div>
                <div className="flex items-center gap-1.5 bg-[#04120B] px-3.5 py-1.5 rounded-xl border border-[#164432]">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span className="text-lg font-black text-white">{challengeTimer}s</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-[#071F15] border border-[#164432] rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-[#04120B] border border-[#164432] text-[#F97316] font-black text-xl flex items-center justify-center">
                  {detectedLetter}
                </div>
                <div>
                  <div className="text-xs text-emerald-400 font-semibold">FREEFORM SIGNING MODE</div>
                  <div className="text-sm font-bold text-white">
                    {detectedLetter !== '--' ? `Detected Letter '${detectedLetter}' (${confidence}%)` : 'Show any sign from A to Z'}
                  </div>
                </div>
              </div>
              <span className="text-xs text-emerald-400/80 px-2.5 py-1 rounded-full bg-[#04120B] border border-[#164432]">
                Continuous 30 FPS
              </span>
            </div>
          )}

          {/* Camera Canvas Container */}
          <div className="relative rounded-2xl overflow-hidden bg-[#04120B] border border-[#164432] aspect-video flex items-center justify-center">
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

            {/* Floating Live Badge */}
            <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/65 backdrop-blur px-3 py-1.5 rounded-full border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>LIVE AI CLASSIFIER (A–Z)</span>
            </div>
          </div>
        </div>

        {/* Right: Real-time Analysis & Probability Rankings */}
        <div className="lg:col-span-4 bg-[#0B2A1E] border border-[#164432] rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="border-b border-[#164432] pb-3 flex items-center justify-between">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#F97316]" />
                Top Recognized Candidates
              </h3>
              <span className="text-[10px] text-emerald-400">MediaPipe + TFLite</span>
            </div>

            {/* Candidate List */}
            <div className="space-y-2.5">
              {topPredictions.length > 0 ? (
                topPredictions.map((cand, idx) => (
                  <div
                    key={cand.letter}
                    className={`p-3 rounded-2xl border transition-all ${
                      idx === 0
                        ? 'bg-[#0E3627] border-[#F97316] text-white shadow-md'
                        : 'bg-[#071F15] border-[#164432] text-emerald-200/80'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5 font-bold">
                      <div className="flex items-center gap-2">
                        <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black ${
                          idx === 0 ? 'bg-[#F97316] text-white' : 'bg-[#04120B] text-emerald-300'
                        }`}>
                          {cand.letter}
                        </span>
                        <span>Sign &apos;{cand.letter}&apos;</span>
                      </div>
                      <span className={idx === 0 ? 'text-[#F97316]' : 'text-emerald-400'}>
                        {cand.score}% match
                      </span>
                    </div>

                    {/* Mini bar */}
                    <div className="w-full h-1.5 bg-[#04120B] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${idx === 0 ? 'bg-[#F97316]' : 'bg-emerald-500'}`}
                        style={{ width: `${cand.score}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-[#071F15] border border-[#164432] rounded-2xl p-6 text-center text-xs text-emerald-400/80 space-y-2">
                  <Camera className="w-6 h-6 mx-auto text-emerald-400" />
                  <p>Hold your hand up to the camera to see real-time probability rankings across all 26 letters.</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Guidance Box */}
          <div className="bg-[#071F15] border border-[#164432] rounded-2xl p-4 text-xs text-emerald-300/90 space-y-1.5">
            <div className="font-semibold text-white flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#F97316]" />
              Event-Driven Pipeline Architecture
            </div>
            <p className="text-[11px] text-emerald-300/70 leading-relaxed">
              Every video frame fires a `FRAME_CAPTURED` event, extracts 21 coordinates via MediaPipe Hands, projects them onto normalized 42-D Euclidean space, and classifies the letter with sub-15ms latency.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
