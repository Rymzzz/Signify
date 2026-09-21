import React, { useRef, useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { 
  Camera, 
  CameraOff, 
  BookOpen, 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  Lock, 
  Sliders, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  Eye, 
  EyeOff,
  Radio,
  Database
} from 'lucide-react';
import { ASL_ALPHABET } from '../data/aslAlphabet';
import { ASLSign, HandLandmark, GestureEventRecord } from '../types/index';
import { soundEngine } from '../utils/audio';
import { classifyHandPose, analyzeFingers } from '../utils/aslClassifier';
import { globalMotionTracker } from '../utils/motionTracker';
import { UnitGuideModal } from './UnitGuideModal';
import { DatasetCollectorModal } from './DatasetCollectorModal';
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

interface ChapterDef {
  id: number;
  title: string;
  letters: string[];
}

const CHAPTERS: ChapterDef[] = [
  { id: 1, title: 'Chapter 1: Letters A through E', letters: ['A', 'B', 'C', 'D', 'E'] },
  { id: 2, title: 'Chapter 2: Letters F through J', letters: ['F', 'G', 'H', 'I', 'J'] },
  { id: 3, title: 'Chapter 3: Letters K through O', letters: ['K', 'L', 'M', 'N', 'O'] },
  { id: 4, title: 'Chapter 4: Letters P through T', letters: ['P', 'Q', 'R', 'S', 'T'] },
  { id: 5, title: 'Chapter 5: Letters U through Z', letters: ['U', 'V', 'W', 'X', 'Y', 'Z'] },
];

interface LiveCameraRecognizerProps {
  completedLetters: string[];
  onLetterCompleted: (letter: string) => void;
  onSelectLetterForGuide?: (letter: string) => void;
}

export const LiveCameraRecognizer: React.FC<LiveCameraRecognizerProps> = ({
  completedLetters,
  onLetterCompleted,
}) => {
  // Target Letter state (starts on 'A' so users practice from the beginning)
  const [currentTargetLetter, setCurrentTargetLetter] = useState<string>('A');
  const targetSignIndex = ASL_ALPHABET.findIndex(s => s.letter === currentTargetLetter);
  const targetSign: ASLSign = ASL_ALPHABET[targetSignIndex >= 0 ? targetSignIndex : 0];

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const simCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isCameraActive, setIsCameraActive] = useState<boolean>(true);
  const [cameraLoading, setCameraLoading] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isHandDetected, setIsHandDetected] = useState<boolean>(false);
  const [detectedLandmarkCount, setDetectedLandmarkCount] = useState<number>(0);

  // Recognition state
  const [detectedLetter, setDetectedLetter] = useState<string>('--');
  const [confidence, setConfidence] = useState<number>(0);
  const [coachingCue, setCoachingCue] = useState<string>('');
  const [holdProgress, setHoldProgress] = useState<number>(0); // 0 to 100%
  const [holdRemainingMs, setHoldRemainingMs] = useState<number>(400);
  const [isHoldingCorrect, setIsHoldingCorrect] = useState<boolean>(false);
  const [justCompletedSign, setJustCompletedSign] = useState<string | null>(null);

  // Settings & Toggles
  const [unlockAll, setUnlockAll] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [showGhostGuide, setShowGhostGuide] = useState<boolean>(false);
  const [showUnitGuide, setShowUnitGuide] = useState<boolean>(false);
  const [showDevTools, setShowDevTools] = useState<boolean>(false);
  const [useSimulator, setUseSimulator] = useState<boolean>(false); // Off by default
  const [showDatasetModal, setShowDatasetModal] = useState<boolean>(false);
  const [latestLandmarks, setLatestLandmarks] = useState<HandLandmark[] | null>(null);

  // Simulator reference joint controls
  const [simThumb, setSimThumb] = useState(0.85);
  const [simIndex, setSimIndex] = useState(0.1);
  const [simMiddle, setSimMiddle] = useState(0.1);
  const [simRing, setSimRing] = useState(0.1);
  const [simPinky, setSimPinky] = useState(0.1);

  // Event stream log
  const [eventLogs, setEventLogs] = useState<GestureEventRecord[]>([]);

  const holdStartRef = useRef<number>(0);
  const lastMatchTimeRef = useRef<number>(0);
  const isCompletingRef = useRef<boolean>(false);
  const currentTargetLetterRef = useRef<string>(currentTargetLetter);
  const processLandmarksRef = useRef<(landmarks: HandLandmark[] | null) => void>(() => {});
  const pumpFrameRef = useRef<number | null>(null);

  const logEvent = useCallback((
    eventType: GestureEventRecord['eventType'], 
    payload: GestureEventRecord['payload']
  ) => {
    setEventLogs(prev => [
      {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        timestamp: Date.now(),
        eventType,
        payload
      },
      ...prev.slice(0, 14)
    ]);
  }, []);

  // Check if letter is unlocked
  const isLetterUnlocked = (letter: string) => {
    if (unlockAll) return true;
    if (letter === 'A' || letter === 'B') return true;
    const letterIdx = ASL_ALPHABET.findIndex(s => s.letter === letter);
    if (letterIdx <= 0) return true;
    const prevLetter = ASL_ALPHABET[letterIdx - 1].letter;
    return completedLetters.includes(prevLetter);
  };

  // Preset joint positions for reference simulator across full A–Z alphabet
  const snapToSign = useCallback((letter: string) => {
    switch (letter) {
      case 'A':
        setSimThumb(0.85); setSimIndex(0.1); setSimMiddle(0.1); setSimRing(0.1); setSimPinky(0.1);
        break;
      case 'B':
        setSimThumb(0.1); setSimIndex(1.0); setSimMiddle(1.0); setSimRing(1.0); setSimPinky(1.0);
        break;
      case 'C':
        setSimThumb(0.5); setSimIndex(0.5); setSimMiddle(0.5); setSimRing(0.5); setSimPinky(0.5);
        break;
      case 'D':
        setSimThumb(0.3); setSimIndex(1.0); setSimMiddle(0.2); setSimRing(0.2); setSimPinky(0.1);
        break;
      case 'E':
        setSimThumb(0.15); setSimIndex(0.25); setSimMiddle(0.25); setSimRing(0.25); setSimPinky(0.25);
        break;
      case 'F':
        setSimThumb(0.3); setSimIndex(0.3); setSimMiddle(1.0); setSimRing(1.0); setSimPinky(1.0);
        break;
      case 'G':
        setSimThumb(0.8); setSimIndex(0.8); setSimMiddle(0.1); setSimRing(0.1); setSimPinky(0.1);
        break;
      case 'H':
        setSimThumb(0.2); setSimIndex(0.9); setSimMiddle(0.9); setSimRing(0.1); setSimPinky(0.1);
        break;
      case 'I':
      case 'J':
        setSimThumb(0.2); setSimIndex(0.1); setSimMiddle(0.1); setSimRing(0.1); setSimPinky(1.0);
        break;
      case 'K':
      case 'P':
        setSimThumb(0.4); setSimIndex(1.0); setSimMiddle(0.7); setSimRing(0.1); setSimPinky(0.1);
        break;
      case 'L':
        setSimThumb(1.0); setSimIndex(1.0); setSimMiddle(0.1); setSimRing(0.1); setSimPinky(0.1);
        break;
      case 'M':
      case 'N':
      case 'T':
      case 'S':
        setSimThumb(0.2); setSimIndex(0.1); setSimMiddle(0.1); setSimRing(0.1); setSimPinky(0.1);
        break;
      case 'O':
        setSimThumb(0.4); setSimIndex(0.35); setSimMiddle(0.35); setSimRing(0.35); setSimPinky(0.35);
        break;
      case 'Q':
        setSimThumb(0.6); setSimIndex(0.6); setSimMiddle(0.1); setSimRing(0.1); setSimPinky(0.1);
        break;
      case 'R':
      case 'U':
        setSimThumb(0.2); setSimIndex(1.0); setSimMiddle(1.0); setSimRing(0.1); setSimPinky(0.1);
        break;
      case 'V':
        setSimThumb(0.2); setSimIndex(1.0); setSimMiddle(1.0); setSimRing(0.1); setSimPinky(0.1);
        break;
      case 'W':
        setSimThumb(0.2); setSimIndex(1.0); setSimMiddle(1.0); setSimRing(1.0); setSimPinky(0.1);
        break;
      case 'X':
        setSimThumb(0.2); setSimIndex(0.45); setSimMiddle(0.1); setSimRing(0.1); setSimPinky(0.1);
        break;
      case 'Y':
        setSimThumb(1.0); setSimIndex(0.1); setSimMiddle(0.1); setSimRing(0.1); setSimPinky(1.0);
        break;
      case 'Z':
        setSimThumb(0.2); setSimIndex(1.0); setSimMiddle(0.1); setSimRing(0.1); setSimPinky(0.1);
        break;
      default:
        setSimThumb(0.5); setSimIndex(0.5); setSimMiddle(0.5); setSimRing(0.5); setSimPinky(0.5);
    }
  }, []);

  // Update simulator guide and reset timers whenever currentTargetLetter changes
  useEffect(() => {
    currentTargetLetterRef.current = currentTargetLetter;
    globalMotionTracker.reset();
    holdStartRef.current = 0;
    lastMatchTimeRef.current = 0;
    setHoldProgress(0);
    setHoldRemainingMs(400);
    setIsHoldingCorrect(false);
    setJustCompletedSign(null);
    isCompletingRef.current = false;
    snapToSign(currentTargetLetter);
  }, [currentTargetLetter, snapToSign]);

  // Switch to previous sign (Prompted by user action)
  const handlePrevSign = () => {
    const curIdx = ASL_ALPHABET.findIndex(s => s.letter === currentTargetLetter);
    if (curIdx > 0) {
      setJustCompletedSign(null);
      isCompletingRef.current = false;
      holdStartRef.current = 0;
      setCurrentTargetLetter(ASL_ALPHABET[curIdx - 1].letter);
      setHoldProgress(0);
      setHoldRemainingMs(400);
      setIsHoldingCorrect(false);
    }
  };

  // Switch to next sign (Prompted by user action)
  const handleNextSign = useCallback(() => {
    const curIdx = ASL_ALPHABET.findIndex(s => s.letter === currentTargetLetterRef.current);
    if (curIdx < ASL_ALPHABET.length - 1) {
      setJustCompletedSign(null);
      isCompletingRef.current = false;
      holdStartRef.current = 0;
      setCurrentTargetLetter(ASL_ALPHABET[curIdx + 1].letter);
      setHoldProgress(0);
      setHoldRemainingMs(400);
      setIsHoldingCorrect(false);
    }
  }, []);

  // Trigger success for recognized sign via visual hold detection
  // DOES NOT auto-advance to next sign — user prompts when ready
  const triggerSuccess = useCallback((letterToComplete: string) => {
    if (isCompletingRef.current) return;
    isCompletingRef.current = true;

    setHoldProgress(100);
    setHoldRemainingMs(0);
    setIsHoldingCorrect(true);
    setJustCompletedSign(letterToComplete);

    if (!completedLetters.includes(letterToComplete)) {
      onLetterCompleted(letterToComplete);
    }

    if (soundEnabled) {
      soundEngine.playSuccess();
    }

    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 }
      });
    } catch {
      // ignore
    }

    logEvent('GESTURE_CLASSIFIED', {
      predictedSign: letterToComplete,
      targetSign: letterToComplete,
      confidence: 0.95,
      status: 'CORRECT',
      message: `Mastered Letter '${letterToComplete}'!`
    });
  }, [completedLetters, onLetterCompleted, soundEnabled, logEvent]);

  // Generate simulated hand landmarks for separate visual reference canvas only
  const generateSimulatedLandmarks = useCallback((): HandLandmark[] => {
    const points: HandLandmark[] = [];
    points.push({ x: 0.5, y: 0.82 }); // Wrist

    const tAngle = -0.3;
    const tLen = 0.06 * simThumb + 0.04;
    points.push({ x: 0.44, y: 0.75 });
    points.push({ x: 0.38 + tAngle * 0.05, y: 0.68 });
    points.push({ x: 0.34 + tAngle * 0.08, y: 0.62 - tLen * 0.5 });
    points.push({ x: 0.31 + tAngle * 0.12, y: 0.56 - tLen });

    const fingerConfigs = [
      { ext: simIndex, mcpX: 0.42, angle: -0.1 },
      { ext: simMiddle, mcpX: 0.48, angle: -0.02 },
      { ext: simRing, mcpX: 0.54, angle: 0.03 },
      { ext: simPinky, mcpX: 0.60, angle: 0.12 },
    ];

    fingerConfigs.forEach(f => {
      const mcpY = 0.52;
      points.push({ x: f.mcpX, y: mcpY });
      const pipLen = 0.08 * f.ext + 0.03 * (1 - f.ext);
      const dipLen = 0.07 * f.ext + 0.025 * (1 - f.ext);
      const tipLen = 0.06 * f.ext + 0.02 * (1 - f.ext);

      const curlDirection = f.ext > 0.4 ? -1 : 0.8;
      const pX1 = f.mcpX + Math.sin(f.angle) * pipLen;
      const pY1 = mcpY - Math.cos(f.angle) * pipLen;
      points.push({ x: pX1, y: pY1 });

      const pX2 = pX1 + Math.sin(f.angle) * dipLen;
      const pY2 = pY1 + (curlDirection * Math.cos(f.angle) * dipLen);
      points.push({ x: pX2, y: pY2 });

      const pX3 = pX2 + Math.sin(f.angle) * tipLen;
      const pY3 = pY2 + (curlDirection * Math.cos(f.angle) * tipLen);
      points.push({ x: pX3, y: pY3 });
    });

    return points;
  }, [simThumb, simIndex, simMiddle, simRing, simPinky]);

  // Process live camera landmarks only (simulator NEVER feeds into here)
  const processLandmarks = useCallback((landmarks: HandLandmark[] | null) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!landmarks || landmarks.length < 21) {
      setLatestLandmarks(null);
      setIsHandDetected(false);
      setDetectedLandmarkCount(0);
      setDetectedLetter('--');
      setConfidence(0);
      setHoldProgress(0);
      setIsHoldingCorrect(false);
      return;
    }

    setLatestLandmarks(landmarks);
    setIsHandDetected(true);
    setDetectedLandmarkCount(21);

    // 1. Draw Skeleton Lines (in bright vibrant orange #FF7A00 matching screenshot)
    ctx.save();
    ctx.strokeStyle = '#FF7A00';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    SKELETON_CONNECTIONS.forEach(([p1, p2]) => {
      const pt1 = landmarks[p1];
      const pt2 = landmarks[p2];
      if (!pt1 || !pt2) return;
      ctx.beginPath();
      ctx.moveTo((1 - pt1.x) * canvas.width, pt1.y * canvas.height);
      ctx.lineTo((1 - pt2.x) * canvas.width, pt2.y * canvas.height);
      ctx.stroke();
    });

    // 2. Draw 21 Landmark Nodes (White inner dots, bright orange border ring)
    landmarks.forEach((pt, idx) => {
      const cx = (1 - pt.x) * canvas.width;
      const cy = pt.y * canvas.height;
      const isTip = [4, 8, 12, 16, 20].includes(idx);
      const radius = isTip ? 6 : 4;

      ctx.beginPath();
      ctx.arc(cx, cy, radius + 2, 0, 2 * Math.PI);
      ctx.fillStyle = '#FF7A00';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
    });
    ctx.restore();

    // 3. Real-time classification with orientation-invariant geometric engine & dynamic motion tracker
    const targetLetter = currentTargetLetterRef.current;
    const now = performance.now();
    globalMotionTracker.addFrame(landmarks, now);
    const fingerAnalysis = analyzeFingers(landmarks);
    const motionState = globalMotionTracker.evaluate(fingerAnalysis, targetLetter);

    const result = classifyHandPose(landmarks, targetLetter, motionState);

    // Draw dynamic motion trail on canvas (glowing neon trail for J, Z, or continuous gestures)
    const activeTrail = motionState.activeTrail;
    if (activeTrail.length >= 2) {
      ctx.save();
      ctx.strokeStyle = '#38BDF8'; // Vivid cyan neon trail
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

      // Fingertip glowing orb at lead point
      const leadPt = activeTrail[activeTrail.length - 1];
      const leadX = (1 - leadPt.x) * canvas.width;
      const leadY = leadPt.y * canvas.height;
      ctx.beginPath();
      ctx.arc(leadX, leadY, 7, 0, 2 * Math.PI);
      ctx.fillStyle = '#67E8F9';
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#38BDF8';
      ctx.fill();

      ctx.restore();
    }

    const confPercent = Math.round(result.confidence * 100);
    setDetectedLetter(result.letter);
    setConfidence(confPercent);
    setCoachingCue(result.coachingCue);

    // 4. Temporal Hold Stabilization or Dynamic Stroke Completion
    const isDynamicLetter = targetLetter === 'J' || targetLetter === 'Z';
    const dynamicStrokeDetected = (targetLetter === 'J' && motionState.j.detected) ||
                                  (targetLetter === 'Z' && motionState.z.detected);

    if (isDynamicLetter) {
      const dynamicProgress = targetLetter === 'J' ? motionState.j.progress : motionState.z.progress;
      if (dynamicStrokeDetected && !isCompletingRef.current) {
        setHoldProgress(100);
        setHoldRemainingMs(0);
        setIsHoldingCorrect(true);
        triggerSuccess(targetLetter);
      } else if (!isCompletingRef.current) {
        setHoldProgress(dynamicProgress);
        setHoldRemainingMs(dynamicProgress > 0 ? Math.round(400 * (1 - dynamicProgress / 100)) : 400);
        setIsHoldingCorrect(dynamicProgress > 0);
      }
    } else {
      // Standard static sign hold check (400 ms hold target)
      const HOLD_TARGET_MS = 400;
      const topDist = result.rawDistances;
      
      const isTargetMatch = 
        (result.letter === targetLetter && result.confidence >= 0.35) ||
        (topDist.length > 0 && topDist[0].letter === targetLetter && topDist[0].score >= 35);

      if (isTargetMatch && !isCompletingRef.current) {
        setIsHoldingCorrect(true);
        lastMatchTimeRef.current = now;

        if (holdStartRef.current === 0) {
          holdStartRef.current = now;
        }

        const elapsed = now - holdStartRef.current;
        const progress = Math.min(100, Math.round((elapsed / HOLD_TARGET_MS) * 100));
        setHoldProgress(progress);
        setHoldRemainingMs(Math.max(0, Math.round(HOLD_TARGET_MS - elapsed)));

        // Trigger completion upon steady hold
        if (elapsed >= HOLD_TARGET_MS) {
          triggerSuccess(targetLetter);
        }
      } else if (!isCompletingRef.current) {
        // Grace period: allow 280ms of momentary motion before resetting hold timer
        const timeSinceLastMatch = now - lastMatchTimeRef.current;
        if (timeSinceLastMatch > 280 || holdStartRef.current === 0) {
          holdStartRef.current = 0;
          setHoldProgress(0);
          setHoldRemainingMs(HOLD_TARGET_MS);
          setIsHoldingCorrect(false);
        }
      }
    }
  }, [triggerSuccess]);

  // Keep ref up to date to prevent stale closures in camera loops
  useEffect(() => {
    processLandmarksRef.current = processLandmarks;
  }, [processLandmarks]);

  // Start Camera with MediaPipe Hands
  const startCamera = async () => {
    setCameraLoading(true);
    setCameraError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
        audio: false
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch {
          // Play request might be interrupted on rapid tab switch, continue safely
        }
      }

      // Initialize singleton MediaPipe Hands
      try {
        await getHandsInstance();
      } catch (e) {
        console.warn('MediaPipe Hands initialization deferred:', e);
      }

      // Frame pump using singleton tracker
      const pump = async () => {
        if (videoRef.current && videoRef.current.readyState >= 2) {
          await processVideoFrame(videoRef.current);
        }
        pumpFrameRef.current = requestAnimationFrame(pump);
      };
      pump();

      setIsCameraActive(true);
      setCameraLoading(false);
    } catch {
      setCameraError('Webcam access was not granted or is unsupported. Please ensure camera permissions are allowed in your browser.');
      setIsCameraActive(false);
      setCameraLoading(false);
      setUseSimulator(false);
    }
  };

  const stopCamera = () => {
    if (pumpFrameRef.current) {
      cancelAnimationFrame(pumpFrameRef.current);
      pumpFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  // Mount camera and subscribe to hand tracking landmarks
  useEffect(() => {
    const unsubscribe = subscribeHandTracker((landmarks) => {
      processLandmarksRef.current(landmarks);
    });

    startCamera();

    return () => {
      unsubscribe();
      stopCamera();
    };
  }, []);

  // Visual guide skeleton renderer for simulator inspector canvas (does NOT affect camera)
  useEffect(() => {
    if (!showDevTools || !useSimulator || !simCanvasRef.current) return;
    const canvas = simCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const simLandmarks = generateSimulatedLandmarks();

    ctx.save();
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    SKELETON_CONNECTIONS.forEach(([p1, p2]) => {
      const pt1 = simLandmarks[p1];
      const pt2 = simLandmarks[p2];
      if (!pt1 || !pt2) return;
      ctx.beginPath();
      ctx.moveTo(pt1.x * canvas.width, pt1.y * canvas.height);
      ctx.lineTo(pt2.x * canvas.width, pt2.y * canvas.height);
      ctx.stroke();
    });

    simLandmarks.forEach((pt, idx) => {
      const isTip = [4, 8, 12, 16, 20].includes(idx);
      ctx.fillStyle = isTip ? '#F59E0B' : '#38BDF8';
      ctx.beginPath();
      ctx.arc(pt.x * canvas.width, pt.y * canvas.height, isTip ? 5 : 3.5, 0, 2 * Math.PI);
      ctx.fill();
    });
    ctx.restore();
  }, [showDevTools, useSimulator, simThumb, simIndex, simMiddle, simRing, simPinky, generateSimulatedLandmarks]);

  return (
    <div className="flex flex-col lg:flex-row gap-5 pb-12">
      {/* ============================================================ */}
      {/* LEFT COLUMN: Unit 1 Banner & Chapters (Letters A through Z)   */}
      {/* ============================================================ */}
      <aside className="w-full lg:w-[390px] xl:w-[420px] flex-shrink-0 flex flex-col space-y-4">
        
        {/* Unit 1: Introduction & Fingerspelling Banner Card */}
        <div className="bg-gradient-to-r from-[#EA580C] via-[#F97316] to-[#FB923C] rounded-2xl p-4 shadow-lg shadow-orange-600/15 text-white flex items-center justify-between gap-3">
          <div className="space-y-0.5 flex-1 min-w-0">
            <h2 className="font-bold text-sm sm:text-base leading-snug break-words">
              Unit 1: Introduction &amp; Fingerspelling
            </h2>
            <p className="text-xs text-orange-100/90 leading-tight">
              Foundations of ASL Alphabet (A through Z)
            </p>
          </div>

          <button
            onClick={() => setShowUnitGuide(true)}
            className="px-3.5 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 active:bg-white/40 border border-white/40 text-white font-semibold text-xs flex items-center gap-1.5 backdrop-blur transition-all cursor-pointer whitespace-nowrap shrink-0 shadow-sm"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Guide</span>
          </button>
        </div>

        {/* Chapters Navigation */}
        <div className="space-y-3 max-h-[720px] overflow-y-auto pr-1 scrollbar-thin">
          {CHAPTERS.map(chapter => {
            const chapterSigns = ASL_ALPHABET.filter(s => chapter.letters.includes(s.letter));
            const completedInChapter = chapter.letters.filter(l => completedLetters.includes(l)).length;
            const progressPercent = Math.round((completedInChapter / chapter.letters.length) * 100);

            return (
              <div
                key={chapter.id}
                className="bg-[#0B2A1E] border border-[#164432] rounded-2xl p-3.5 shadow-md space-y-3"
              >
                {/* Chapter Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-emerald-100">
                      {chapter.title}
                    </h3>
                    <div className="text-[11px] text-emerald-400 font-medium">
                      {completedInChapter} of {chapter.letters.length} completed
                    </div>
                  </div>

                  {/* Mini Progress Bar */}
                  <div className="w-20 h-1.5 bg-[#071F15] rounded-full overflow-hidden border border-[#164432]">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* 2-Column Grid of Sign Cards */}
                <div className="grid grid-cols-2 gap-2.5">
                  {chapterSigns.map(sign => {
                    const isTarget = sign.letter === currentTargetLetter;
                    const isDone = completedLetters.includes(sign.letter);
                    const unlocked = isLetterUnlocked(sign.letter);

                    // Card status: COMPLETE, ACTIVE, or LOCKED
                    let cardBorder = 'border-[#164432]';
                    let cardBg = 'bg-[#071F15]';
                    let badgeBg = 'bg-[#0B2A1E] text-emerald-400';
                    let badgeContent = <Lock className="w-3.5 h-3.5" />;
                    let statusLabel = '+15 XP LOCKED';
                    let statusColor = 'text-emerald-500/70';

                    if (isDone) {
                      cardBorder = 'border-emerald-500/60';
                      cardBg = 'bg-[#071F15] hover:bg-[#0A261B]';
                      badgeBg = 'bg-emerald-600 text-white';
                      badgeContent = <Check className="w-3.5 h-3.5 stroke-[3]" />;
                      statusLabel = '+15 XP COMPLETE';
                      statusColor = 'text-emerald-400';
                    } else if (isTarget) {
                      cardBorder = 'border-2 border-[#F97316] shadow-lg shadow-orange-500/10';
                      cardBg = 'bg-[#071F15]';
                      badgeBg = 'bg-[#F97316] text-white';
                      badgeContent = <span className="font-black text-xs">{sign.letter}</span>;
                      statusLabel = '+15 XP ACTIVE ►';
                      statusColor = 'text-[#F97316]';
                    } else if (unlocked) {
                      cardBorder = 'border-[#164432] hover:border-[#1F533E]';
                      cardBg = 'bg-[#071F15] hover:bg-[#0A261B]';
                      badgeBg = 'bg-[#0E3627] text-emerald-300 border border-[#164432]';
                      badgeContent = <span className="font-bold text-xs">{sign.letter}</span>;
                      statusLabel = '+15 XP READY';
                      statusColor = 'text-emerald-300';
                    }

                    return (
                      <button
                        key={sign.id}
                        onClick={() => {
                          setJustCompletedSign(null);
                          isCompletingRef.current = false;
                          holdStartRef.current = 0;
                          setCurrentTargetLetter(sign.letter);
                          setHoldProgress(0);
                          setHoldRemainingMs(400);
                          setIsHoldingCorrect(false);
                          snapToSign(sign.letter);
                        }}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between min-h-[92px] ${cardBg} ${cardBorder}`}
                      >
                        <div className="flex items-start gap-2">
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${badgeBg}`}>
                            {badgeContent}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-white truncate">
                              Sign &apos;{sign.letter}&apos;
                            </div>
                            <div className="text-[10px] text-emerald-200/70 line-clamp-2 leading-tight mt-0.5">
                              {sign.shortDescription || sign.description}
                            </div>
                          </div>
                        </div>

                        <div className={`text-[9px] font-bold tracking-tight uppercase mt-1 truncate ${statusColor}`}>
                          {statusLabel}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Sidebar Controls Footer */}
        <div className="bg-[#0B2A1E] border border-[#164432] rounded-2xl p-3 flex items-center justify-between text-xs text-emerald-300">
          <div className="flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-[#F97316]" />
            <span className="font-semibold text-white">Full A–Z Mode</span>
          </div>

          <button
            onClick={() => setUnlockAll(!unlockAll)}
            className="text-[11px] px-2.5 py-1 rounded-lg bg-[#071F15] hover:bg-[#123828] border border-[#164432] text-emerald-200 font-medium cursor-pointer transition-colors"
          >
            {unlockAll ? 'Guided Unlock Mode' : 'Unlock All Signs'}
          </button>
        </div>

      </aside>

      {/* ============================================================ */}
      {/* RIGHT COLUMN: Lesson Header, Video Canvas, Reference Guide   */}
      {/* ============================================================ */}
      <main className="flex-1 flex flex-col space-y-4">

        {/* 1. Lesson Header Card */}
        <div className="bg-[#0B2A1E] border border-[#164432] rounded-2xl p-4 flex items-center gap-4 shadow-lg">
          <div className="w-12 h-12 rounded-xl bg-[#F97316] text-white font-black text-2xl flex items-center justify-center shadow-md flex-shrink-0">
            {targetSign.letter}
          </div>

          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-bold text-white leading-tight">
              Lesson: Sign the Character &apos;{targetSign.letter}&apos;
            </h1>
            <p className="text-xs text-emerald-300/90 truncate mt-0.5">
              Position hand in view, match handshape, and hold steadily for 400 ms.
            </p>
          </div>
        </div>

        {/* 2. Central Video Canvas Viewport */}
        <div className="bg-[#0B2A1E] border border-[#164432] rounded-2xl p-4 shadow-xl flex flex-col space-y-3">
          
          <div className="relative rounded-2xl overflow-hidden bg-[#04120B] border border-[#164432] aspect-video flex items-center justify-center shadow-inner">
            {/* Live Video Feed */}
            <video
              ref={videoRef}
              playsInline
              muted
              className="w-full h-full object-cover scale-x-[-1]"
            />

            {/* Canvas for 21 Skeleton Landmarks */}
            <canvas
              ref={canvasRef}
              width={640}
              height={480}
              className="absolute inset-0 w-full h-full pointer-events-none"
            />

            {/* Ghost Guide Overlay */}
            {showGhostGuide && targetSign.referenceLandmarks && (
              <svg 
                viewBox="0 0 1 1" 
                className="absolute inset-0 w-full h-full pointer-events-none opacity-40"
              >
                {SKELETON_CONNECTIONS.map(([a, b], idx) => {
                  const p1 = targetSign.referenceLandmarks[a];
                  const p2 = targetSign.referenceLandmarks[b];
                  if (!p1 || !p2) return null;
                  return (
                    <line
                      key={idx}
                      x1={1 - p1.x}
                      y1={p1.y}
                      x2={1 - p2.x}
                      y2={p2.y}
                      stroke="#10B981"
                      strokeWidth="0.015"
                      strokeDasharray="0.02, 0.02"
                    />
                  );
                })}
              </svg>
            )}

            {/* Top Left Tag: Live AI Recognition Status */}
            <div className="absolute top-3 left-3 bg-[#0B2A1E]/90 backdrop-blur-md border border-[#164432] px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs font-semibold shadow-md">
              <span className={`w-2 h-2 rounded-full ${isCameraActive ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
              <span className="text-white">
                {isCameraActive ? 'AI Vision Active' : 'Camera Off'}
              </span>
              {isHandDetected && (
                <span className="text-[11px] text-emerald-300 font-mono">
                  ({detectedLandmarkCount} pts)
                </span>
              )}
            </div>

            {/* Top Right Quick Controls */}
            <div className="absolute top-3 right-3 flex items-center gap-1.5">
              <button
                onClick={() => setShowDatasetModal(true)}
                className="px-2.5 py-1.5 rounded-xl bg-[#0B2A1E]/80 hover:bg-[#164432] border border-[#164432] text-emerald-300 hover:text-white backdrop-blur-md transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold shadow-xs"
                title="Collect Training Data & Export .CSV"
              >
                <Database className="w-3.5 h-3.5 text-[#F97316]" />
                <span className="hidden sm:inline">Dataset .CSV</span>
              </button>

              <button
                onClick={() => setShowGhostGuide(!showGhostGuide)}
                className={`p-2 rounded-xl border backdrop-blur-md transition-colors cursor-pointer ${
                  showGhostGuide 
                    ? 'bg-emerald-600/90 border-emerald-400 text-white' 
                    : 'bg-[#0B2A1E]/80 border-[#164432] text-emerald-300 hover:text-white'
                }`}
                title="Toggle Ghost Alignment Guide"
              >
                {showGhostGuide ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>

              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-2 rounded-xl border backdrop-blur-md transition-colors cursor-pointer ${
                  soundEnabled 
                    ? 'bg-[#0B2A1E]/80 border-[#164432] text-emerald-300 hover:text-white' 
                    : 'bg-red-950/80 border-red-800 text-red-300'
                }`}
                title="Toggle Sound Effects"
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>

              <button
                onClick={() => {
                  if (isCameraActive) stopCamera();
                  else startCamera();
                }}
                className="p-2 rounded-xl bg-[#0B2A1E]/80 border border-[#164432] text-emerald-300 hover:text-white backdrop-blur-md transition-colors cursor-pointer"
                title={isCameraActive ? 'Turn Camera Off' : 'Turn Camera On'}
              >
                {isCameraActive ? <Camera className="w-4 h-4" /> : <CameraOff className="w-4 h-4" />}
              </button>
            </div>

            {/* Camera Error Message Overlay */}
            {cameraError && (
              <div className="absolute inset-0 bg-[#04120B]/95 p-6 flex flex-col items-center justify-center text-center z-20 space-y-3">
                <CameraOff className="w-10 h-10 text-amber-400" />
                <div className="text-white font-bold text-sm max-w-sm">
                  {cameraError}
                </div>
                <button
                  onClick={startCamera}
                  className="px-4 py-2 bg-[#F97316] hover:bg-[#EA580C] text-white text-xs font-bold rounded-xl cursor-pointer shadow-md transition-colors"
                >
                  Retry Camera
                </button>
              </div>
            )}

            {/* Camera Loading Overlay */}
            {cameraLoading && (
              <div className="absolute inset-0 bg-[#04120B]/90 flex flex-col items-center justify-center text-center z-10 space-y-2">
                <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-medium text-emerald-200">
                  Starting camera and loading MediaPipe model...
                </span>
              </div>
            )}

            {/* Holding Progress Bar at the Bottom of Canvas */}
            {holdProgress > 0 && (
              <div className="absolute bottom-0 left-0 right-0 h-2 bg-black/40">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-amber-400 transition-all duration-75"
                  style={{ width: `${holdProgress}%` }}
                />
              </div>
            )}
          </div>

          {/* User-Prompted Success Celebration Banner */}
          {justCompletedSign && (
            <div className="bg-emerald-950/90 border border-emerald-500/60 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-white shadow-xl animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-black text-xl shadow-md">
                  <Check className="w-6 h-6 stroke-[3]" />
                </div>
                <div>
                  <div className="font-bold text-sm text-emerald-100 flex items-center gap-1.5">
                    <span>Sign &apos;{justCompletedSign}&apos; Accomplished! (+15 XP)</span>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                  </div>
                  <p className="text-xs text-emerald-300/90">
                    Visual posture verified. You can continue practicing or advance to the next sign when ready.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => {
                    setJustCompletedSign(null);
                    holdStartRef.current = 0;
                    setHoldProgress(0);
                    setHoldRemainingMs(400);
                    setIsHoldingCorrect(false);
                    isCompletingRef.current = false;
                  }}
                  className="px-3.5 py-2 rounded-xl bg-[#061F15] hover:bg-[#0E3524] border border-emerald-600/40 text-emerald-200 text-xs font-semibold cursor-pointer transition-colors"
                >
                  Practice &apos;{justCompletedSign}&apos; Again
                </button>

                {targetSignIndex < ASL_ALPHABET.length - 1 && (
                  <button
                    onClick={() => {
                      setJustCompletedSign(null);
                      handleNextSign();
                    }}
                    className="px-5 py-2 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white text-xs font-bold shadow-lg shadow-orange-600/30 flex items-center gap-1.5 cursor-pointer transition-all transform hover:scale-[1.02]"
                  >
                    <span>Next Sign ({ASL_ALPHABET[targetSignIndex + 1]?.letter})</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Status Bar & Action Controls */}
          <div className="bg-[#071F15] border border-[#164432] rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3">
            
            {/* Live Detection Information */}
            <div className="flex flex-col text-center sm:text-left">
              <div className="text-sm font-bold text-white tracking-wide">
                Sign: &apos;{detectedLetter}&apos; ({confidence}% confidence) | Target: &apos;{targetSign.letter}&apos;
              </div>

              {/* Real-time coaching hint and countdown */}
              <div className="text-xs text-emerald-400/90 mt-1 font-medium min-h-[22px] flex items-center justify-center sm:justify-start">
                {isHoldingCorrect ? (
                  <span className="text-emerald-300 font-bold animate-pulse flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>★ Steady hold! Visual confirmation in {holdRemainingMs} ms ({holdProgress}%)...</span>
                  </span>
                ) : (
                  <span>{coachingCue || `Hold posture for '${targetSign.letter}' firmly in camera view`}</span>
                )}
              </div>
            </div>

            {/* Action Buttons: Previous Sign & Next Sign (Visual detection handles confirmation) */}
            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-center">
              <button
                onClick={handlePrevSign}
                disabled={targetSignIndex <= 0}
                className="px-4 py-2.5 rounded-xl bg-[#0D2E21] border border-[#1F4A38] hover:bg-[#143E2C] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous Sign</span>
              </button>

              <button
                onClick={handleNextSign}
                disabled={targetSignIndex >= ASL_ALPHABET.length - 1}
                className="px-5 py-2.5 rounded-xl bg-[#F97316] hover:bg-[#EA580C] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-colors cursor-pointer"
              >
                <span>Next Sign</span>
                <ChevronRight className="w-4 h-4" />
              </button>

              {/* Utility Inspector Toggle */}
              <button
                onClick={() => setShowDevTools(!showDevTools)}
                className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${
                  showDevTools 
                    ? 'bg-[#143E2C] border-[#F97316] text-[#F97316]' 
                    : 'bg-[#0D2E21] border-[#1F4A38] text-emerald-300 hover:text-white'
                }`}
                title="Toggle 3D Reference Hand Guide"
              >
                <Sliders className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>

        {/* 3. Bottom Reference & Guidance Card */}
        <div className="bg-[#0B2A1E] border border-[#164432] rounded-2xl p-5 shadow-lg flex flex-col sm:flex-row items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#F97316] text-white font-black text-2xl flex items-center justify-center shadow-md flex-shrink-0">
            {targetSign.letter}
          </div>

          <div className="flex-1 space-y-2">
            <div>
              <h2 className="text-base font-bold text-white">
                {targetSign.title}
              </h2>
              <div className="text-xs text-emerald-400 font-medium">
                American Sign Language Reference Guide
              </div>
            </div>

            <p className="text-xs text-emerald-100/90 leading-relaxed">
              {targetSign.description}
            </p>

            {/* Tip Highlight Banner */}
            <div className="bg-[#061C12] border border-emerald-600/40 rounded-xl px-3.5 py-2 text-xs text-emerald-300 font-medium flex items-center gap-2 mt-2">
              <span className="text-sm">💡</span>
              <span>Tip: {targetSign.tips[0]}</span>
            </div>
          </div>
        </div>

        {/* 4. 3D Reference Hand Guide & Joint Inspector (Isolated from camera pipeline) */}
        {showDevTools && (
          <div className="bg-[#0B2A1E] border border-[#164432] rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#164432] pb-3">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <Sliders className="w-4 h-4 text-[#F97316]" />
                <span>3D Reference Hand Guide &amp; Joint Inspector</span>
                <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded-md font-normal">
                  Visual reference only
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setUseSimulator(!useSimulator)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg font-medium border cursor-pointer transition-colors ${
                    useSimulator
                      ? 'bg-[#F97316] border-[#F97316] text-white'
                      : 'bg-[#071F15] border-[#164432] text-emerald-300 hover:text-white'
                  }`}
                >
                  {useSimulator ? 'Hide 3D Skeleton' : 'Show 3D Skeleton'}
                </button>
                <button
                  onClick={() => snapToSign(targetSign.letter)}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-[#071F15] border border-[#164432] text-emerald-300 hover:text-white cursor-pointer font-medium"
                >
                  Reset to Sign &apos;{targetSign.letter}&apos;
                </button>
              </div>
            </div>

            {useSimulator && (
              <div className="flex flex-col md:flex-row items-center gap-5">
                <canvas
                  ref={simCanvasRef}
                  width={200}
                  height={200}
                  className="rounded-xl bg-[#04120B] border border-[#164432] flex-shrink-0"
                />
                
                {/* Sliders */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 flex-1 w-full">
                  {[
                    { label: 'Thumb', val: simThumb, set: setSimThumb },
                    { label: 'Index', val: simIndex, set: setSimIndex },
                    { label: 'Middle', val: simMiddle, set: setSimMiddle },
                    { label: 'Ring', val: simRing, set: setSimRing },
                    { label: 'Pinky', val: simPinky, set: setSimPinky },
                  ].map(slider => (
                    <div key={slider.label} className="space-y-1">
                      <div className="flex justify-between text-[11px] text-emerald-300">
                        <span>{slider.label}</span>
                        <span className="font-mono">{(slider.val * 100).toFixed(0)}%</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.05}
                        value={slider.val}
                        onChange={e => slider.set(parseFloat(e.target.value))}
                        className="w-full accent-[#F97316]"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Event Logs */}
            <div className="bg-[#05160E] border border-[#164432] rounded-xl p-3 font-mono text-[10px] max-h-24 overflow-y-auto space-y-1 text-emerald-300/80">
              {eventLogs.map(log => (
                <div key={log.id} className="truncate">
                  <span className="text-emerald-500">[{log.eventType}]</span> {log.payload.message || `Letter: ${log.payload.predictedSign}`}
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      {/* Unit Guide Modal */}
      <UnitGuideModal
        isOpen={showUnitGuide}
        onClose={() => setShowUnitGuide(false)}
      />

      {/* Dataset Studio & CSV Exporter Modal */}
      <DatasetCollectorModal
        isOpen={showDatasetModal}
        onClose={() => setShowDatasetModal(false)}
        currentLandmarks={latestLandmarks}
        isCameraActive={isCameraActive}
        onStartCamera={startCamera}
      />
    </div>
  );
};
