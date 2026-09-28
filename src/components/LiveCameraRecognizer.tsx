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
  Database,
  Video,
  Timer
} from 'lucide-react';
import { ASL_ALPHABET } from '../data/aslAlphabet';
import { getAllSigns, CURRICULUM_UNITS, CURRICULUM_MODULES } from '../data/aslCurriculum';
import { ASLSign, HandLandmark, GestureEventRecord, CurriculumUnit, CurriculumModule } from '../types/index';
import { soundEngine } from '../utils/audio';
import { classifyHandPose, analyzeFingers } from '../utils/aslClassifier';
import { globalMotionTracker } from '../utils/motionTracker';
import { UnitGuideModal } from './UnitGuideModal';
import { DatasetCollectorModal } from './DatasetCollectorModal';
import { SpeedTrackerWidget } from './SpeedTrackerWidget';
import { SignVideoModal } from './SignVideoModal';
import { authSyncService } from '../services/authSyncService';
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

export interface LessonInfo {
  unitId: string;
  unitNumber: number;
  unitTitle: string;
  unitBadge: string;
  moduleId: string;
  moduleBadge: string;
  moduleTitle: string;
  lessonCode: string; // e.g. "1.1.1"
  sign: ASLSign;
}

export function getLessonInfoForSign(signLetter: string): LessonInfo | null {
  for (const unit of CURRICULUM_UNITS) {
    for (let mIdx = 0; mIdx < unit.modules.length; mIdx++) {
      const mod = unit.modules[mIdx];
      for (let sIdx = 0; sIdx < mod.signs.length; sIdx++) {
        const s = mod.signs[sIdx];
        if (s.letter === signLetter || s.id === signLetter) {
          return {
            unitId: unit.id,
            unitNumber: unit.unitNumber,
            unitTitle: unit.title,
            unitBadge: unit.badge,
            moduleId: mod.id,
            moduleBadge: mod.badge,
            moduleTitle: mod.title,
            lessonCode: `${unit.unitNumber}.${mIdx + 1}.${sIdx + 1}`,
            sign: s,
          };
        }
      }
    }
  }
  return null;
}

interface LiveCameraRecognizerProps {
  completedLetters: string[];
  onLetterCompleted: (letter: string) => void;
  onSelectLetterForGuide?: (letter: string) => void;
  initialSign?: string;
  onSignChange?: (sign: string) => void;
}

export const LiveCameraRecognizer: React.FC<LiveCameraRecognizerProps> = ({
  completedLetters,
  onLetterCompleted,
  initialSign,
  onSignChange,
}) => {
  const allCurriculumSigns = getAllSigns();

  // Target Sign state
  const [currentTargetLetter, setCurrentTargetLetter] = useState<string>(initialSign || 'A');
  const targetSignIndex = allCurriculumSigns.findIndex(s => s.letter === currentTargetLetter || s.id === currentTargetLetter);
  const targetSign: ASLSign = allCurriculumSigns[targetSignIndex >= 0 ? targetSignIndex : 0];
  const currentLessonInfo = getLessonInfoForSign(currentTargetLetter);
  const [selectedUnitTab, setSelectedUnitTab] = useState<string>(currentLessonInfo?.unitId || 'all');

  const prevInitialSignRef = useRef(initialSign);
  // React to prop changes smoothly only when parent genuinely passes a new sign
  useEffect(() => {
    if (initialSign && initialSign !== prevInitialSignRef.current) {
      prevInitialSignRef.current = initialSign;
      setCurrentTargetLetter(initialSign);
      currentTargetLetterRef.current = initialSign;
      const info = getLessonInfoForSign(initialSign);
      if (info) {
        setSelectedUnitTab(info.unitId);
      }
    }
  }, [initialSign]);

  // Video Demo & Stopwatch state
  const [showVideoModal, setShowVideoModal] = useState<boolean>(false);
  const [lastSpeedMs, setLastSpeedMs] = useState<number | null>(null);
  const [duplicateXpNotice, setDuplicateXpNotice] = useState<string | null>(null);
  const speedStartTimeRef = useRef<number>(performance.now());

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
    speedStartTimeRef.current = performance.now();
    setLastSpeedMs(null);
    setDuplicateXpNotice(null);
    setHoldProgress(0);
    setHoldRemainingMs(400);
    setIsHoldingCorrect(false);
    setJustCompletedSign(null);
    isCompletingRef.current = false;
    snapToSign(currentTargetLetter);
  }, [currentTargetLetter, snapToSign]);

  // Unified helper to switch target sign and notify parent App
  const selectSign = useCallback((sign: string) => {
    setJustCompletedSign(null);
    isCompletingRef.current = false;
    holdStartRef.current = 0;
    setCurrentTargetLetter(sign);
    currentTargetLetterRef.current = sign;
    onSignChange?.(sign);
    setHoldProgress(0);
    setHoldRemainingMs(400);
    setIsHoldingCorrect(false);
  }, [onSignChange]);

  // Switch to previous sign (Prompted by user action)
  const handlePrevSign = () => {
    const curIdx = allCurriculumSigns.findIndex(s => s.letter === currentTargetLetter || s.id === currentTargetLetter);
    if (curIdx > 0) {
      selectSign(allCurriculumSigns[curIdx - 1].letter);
    }
  };

  // Switch to next sign (Prompted by user action)
  const handleNextSign = useCallback(() => {
    const curIdx = allCurriculumSigns.findIndex(s => s.letter === currentTargetLetterRef.current || s.id === currentTargetLetterRef.current);
    if (curIdx < allCurriculumSigns.length - 1) {
      selectSign(allCurriculumSigns[curIdx + 1].letter);
    }
  }, [allCurriculumSigns, selectSign]);

  // Trigger success for recognized sign via visual hold detection
  // DOES NOT auto-advance to next sign — user prompts when ready
  const triggerSuccess = useCallback((letterToComplete: string) => {
    if (isCompletingRef.current) return;
    isCompletingRef.current = true;

    // Automatically allow further practice after celebration window
    setTimeout(() => {
      isCompletingRef.current = false;
    }, 2500);

    setHoldProgress(100);
    setHoldRemainingMs(0);
    setIsHoldingCorrect(true);
    setJustCompletedSign(letterToComplete);

    const now = performance.now();
    const rawElapsed = Math.round(now - (speedStartTimeRef.current || now));
    const elapsed = Math.max(150, Math.min(30000, rawElapsed));
    setLastSpeedMs(elapsed);

    // Call progress tracking with duplicate XP protection & speed recording
    authSyncService.recordSignPractice(letterToComplete, 15, elapsed).then(res => {
      let notice = '';
      if (res.isPersonalBest) {
        notice = `⚡ NEW PERSONAL BEST: ${(elapsed / 1000).toFixed(2)}s! `;
      }
      if (res.isDuplicateToday) {
        notice += `Reaction: ${(elapsed / 1000).toFixed(2)}s (Daily XP already credited for '${letterToComplete}')`;
      } else {
        notice += `+${res.xpEarned} XP! Day streak: ${res.streak}d (Reaction: ${(elapsed / 1000).toFixed(2)}s)`;
      }
      setDuplicateXpNotice(notice);
    }).catch(err => {
      console.warn('Record practice notice:', err);
    });

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
      message: `Mastered Sign '${letterToComplete}'!`
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
      ctx.moveTo(toCanvasX(pt1.x), toCanvasY(pt1.y));
      ctx.lineTo(toCanvasX(pt2.x), toCanvasY(pt2.y));
      ctx.stroke();
    });

    // 2. Draw 21 Landmark Nodes (White inner dots, bright orange border ring)
    landmarks.forEach((pt, idx) => {
      const cx = toCanvasX(pt.x);
      const cy = toCanvasY(pt.y);
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
        const tx = toCanvasX(pt.x);
        const ty = toCanvasY(pt.y);
        if (i === 0) ctx.moveTo(tx, ty);
        else ctx.lineTo(tx, ty);
      });
      ctx.stroke();

      // Fingertip glowing orb at lead point
      const leadPt = activeTrail[activeTrail.length - 1];
      const leadX = toCanvasX(leadPt.x);
      const leadY = toCanvasY(leadPt.y);
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
      // High-confidence static sign hold check (450 ms steady hold, >= 65% confidence, zero false positives)
      const HOLD_TARGET_MS = 450;
      const topDist = result.rawDistances;
      
      const isTargetMatch = 
        result.letter === targetLetter && 
        result.confidence >= 0.65 &&
        (topDist.length > 0 ? topDist[0].letter === targetLetter : true);

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

  // Start Camera with MediaPipe Hands and 3-tier progressive constraints
  const startCamera = async () => {
    setCameraLoading(true);
    setCameraError(null);

    // Stop any existing tracks first to release device hardware locks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => {
        try { t.stop(); } catch {}
      });
      streamRef.current = null;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Webcam API is not supported in this browser or context. Please use a modern browser on localhost or HTTPS.');
      setIsCameraActive(false);
      setCameraLoading(false);
      return;
    }

    let stream: MediaStream | null = null;
    let lastErr: any = null;

    // Constraint Tier 1: Ideal 640x480 with facingMode user
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
        audio: false
      });
    } catch (err1: any) {
      console.warn('Tier 1 camera constraints failed, attempting fallback tier 2:', err1);
      lastErr = err1;
      // Constraint Tier 2: Without facingMode (essential for external USB/virtual webcams)
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 }
          },
          audio: false
        });
      } catch (err2: any) {
        console.warn('Tier 2 camera constraints failed, attempting fallback tier 3 (basic video):', err2);
        lastErr = err2;
        // Constraint Tier 3: Pure basic video
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
          });
        } catch (err3: any) {
          console.error('All camera constraint tiers failed:', err3);
          lastErr = err3;
        }
      }
    }

    if (!stream) {
      const errName = lastErr?.name || '';
      let message = 'Webcam access was not granted or is unsupported. Please ensure camera permissions are allowed in your browser.';
      if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError') {
        message = 'Camera permission was denied. Please allow camera access in your browser address bar and click Retry Camera.';
      } else if (errName === 'NotFoundError' || errName === 'DevicesNotFoundError') {
        message = 'No webcam was detected on this device. Please connect a webcam and click Retry Camera.';
      } else if (errName === 'NotReadableError' || errName === 'TrackStartError') {
        message = 'Webcam is currently in use by another tab or program. Please close other camera apps and click Retry Camera.';
      }
      setCameraError(message);
      setIsCameraActive(false);
      setCameraLoading(false);
      return;
    }

    streamRef.current = stream;
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.muted = true;
      videoRef.current.playsInline = true;
      try {
        await videoRef.current.play();
      } catch (playErr) {
        console.warn('Video play interrupted or waiting for user interaction:', playErr);
      }
    }

    // Initialize singleton MediaPipe Hands
    try {
      await getHandsInstance();
    } catch (e) {
      console.warn('MediaPipe Hands initialization note:', e);
    }

    // Cancel any previous pump loop before starting a new one
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
    pump();

    setIsCameraActive(true);
    setCameraLoading(false);
  };

  const stopCamera = () => {
    if (pumpFrameRef.current) {
      cancelAnimationFrame(pumpFrameRef.current);
      pumpFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => {
        try { t.stop(); } catch {}
      });
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
    <div className="flex flex-col lg:flex-row gap-5 pb-12 w-full max-w-full">
      {/* ============================================================ */}
      {/* LEFT COLUMN: 3-Unit, Module, & Lesson Hierarchy Sidebar      */}
      {/* ============================================================ */}
      <aside className="w-full lg:w-80 xl:w-88 flex-shrink-0 flex flex-col space-y-3">
        
        {/* Learn Portal Banner */}
        <div className="bg-gradient-to-r from-[#0B2A1E] to-[#123828] border border-[#164432] rounded-2xl p-4 shadow-lg text-white flex items-center justify-between gap-3">
          <div className="space-y-0.5 flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                Interactive Practice
              </span>
            </div>
            <h2 className="font-bold text-sm sm:text-base leading-snug break-words">
              Signify Curriculum
            </h2>
            <p className="text-[11px] text-emerald-200/80 leading-tight">
              Units &bull; Modules &bull; Lessons
            </p>
          </div>

          <button
            onClick={() => setShowUnitGuide(true)}
            className="px-3 py-1.5 rounded-xl bg-[#071F15] hover:bg-[#0A261B] border border-emerald-500/30 text-emerald-200 font-semibold text-xs flex items-center gap-1 transition-all cursor-pointer whitespace-nowrap shrink-0 shadow-sm"
          >
            <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
            <span>Guide</span>
          </button>
        </div>

        {/* Unit Filter Tabs */}
        <div className="grid grid-cols-4 gap-1.5 bg-[#05160E] border border-[#164432] p-1.5 rounded-xl">
          {[
            { id: 'all', label: 'All' },
            { id: 'unit-1', label: 'U1' },
            { id: 'unit-2', label: 'U2' },
            { id: 'unit-3', label: 'U3' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedUnitTab(tab.id)}
              className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer text-center ${
                selectedUnitTab === tab.id
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-emerald-300/70 hover:text-white hover:bg-[#0B2A1E]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Units, Modules, & Lessons Hierarchy Tree */}
        <div className="space-y-3.5 max-h-[720px] overflow-y-auto pr-1 scrollbar-thin">
          {CURRICULUM_UNITS.filter(unit => selectedUnitTab === 'all' || selectedUnitTab === unit.id).map(unit => {
            const unitSigns = unit.modules.flatMap(m => m.signs);
            const completedInUnit = unitSigns.filter(s => completedLetters.includes(s.letter) || completedLetters.includes(s.id)).length;
            const progressPercent = unitSigns.length > 0 ? Math.round((completedInUnit / unitSigns.length) * 100) : 0;

            return (
              <div
                key={unit.id}
                className="bg-[#0B2A1E] border border-[#164432] rounded-2xl p-3.5 shadow-md space-y-3"
              >
                {/* Unit Header */}
                <div className="flex items-center justify-between border-b border-[#164432] pb-2.5">
                  <div className="min-w-0">
                    <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider block">
                      {unit.badge}
                    </span>
                    <h3 className="text-xs font-bold text-white truncate">
                      {unit.title}
                    </h3>
                    <div className="text-[10px] text-emerald-400/90 font-medium mt-0.5">
                      {completedInUnit} of {unitSigns.length} mastered ({progressPercent}%)
                    </div>
                  </div>

                  {/* Progress Ring / Bar */}
                  <div className="w-16 h-1.5 bg-[#071F15] rounded-full overflow-hidden border border-[#164432] shrink-0">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Modules & Lessons under this Unit */}
                <div className="space-y-3">
                  {unit.modules.map((mod, modIdx) => (
                    <div key={mod.id} className="space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-emerald-300/80 px-1">
                        <span className="truncate">
                          Mod {unit.unitNumber}.{modIdx + 1}: {mod.title.split(':')[1]?.trim() || mod.title}
                        </span>
                        <span className="text-[10px] text-amber-400/90 font-mono shrink-0 ml-1">
                          +{mod.xpPerSign} XP
                        </span>
                      </div>

                      {/* Lesson Cards */}
                      <div className="grid grid-cols-1 gap-1.5">
                        {mod.signs.map((sign, signIdx) => {
                          const lessonCode = `${unit.unitNumber}.${modIdx + 1}.${signIdx + 1}`;
                          const isTarget = sign.letter === currentTargetLetter || sign.id === currentTargetLetter;
                          const isDone = completedLetters.includes(sign.letter) || completedLetters.includes(sign.id);

                          return (
                            <button
                              key={sign.id}
                              onClick={() => {
                                selectSign(sign.letter);
                                snapToSign(sign.letter);
                              }}
                              className={`px-3 py-2 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 text-xs ${
                                isTarget
                                  ? 'bg-[#0E3627] border-[#F97316] text-white shadow-md'
                                  : isDone
                                  ? 'bg-[#071F15] border-emerald-500/50 text-emerald-100 hover:bg-[#0A261B]'
                                  : 'bg-[#071F15] border-[#164432] text-emerald-300/80 hover:bg-[#0A261B] hover:text-white'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold font-mono shrink-0 ${
                                  isTarget
                                    ? 'bg-[#F97316] text-white'
                                    : isDone
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-[#0B2A1E] text-emerald-300 border border-[#164432]'
                                }`}>
                                  {isDone ? '✓' : lessonCode.split('.').pop()}
                                </span>
                                <span className="font-bold text-white truncate">
                                  Lesson {lessonCode}: Sign &apos;{sign.letter}&apos;
                                </span>
                              </div>

                              <span className={`text-[10px] font-bold shrink-0 uppercase tracking-tight ${
                                isTarget
                                  ? 'text-[#F97316]'
                                  : isDone
                                  ? 'text-emerald-400'
                                  : 'text-emerald-400/60'
                              }`}>
                                {isTarget ? '► Active' : isDone ? 'Done' : 'Practice'}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </aside>

      {/* ============================================================ */}
      {/* RIGHT COLUMN: Lesson Header, Video Canvas, Reference Guide   */}
      {/* ============================================================ */}
      <main className="flex-1 min-w-0 flex flex-col space-y-4">

        {/* 1. Lesson Header Card & Reaction Speed Stopwatch */}
        <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3">
          <div className="bg-[#0B2A1E] border border-[#164432] rounded-2xl p-4 flex items-center justify-between gap-4 shadow-lg flex-1 min-w-0">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FF4D26] to-[#F97316] text-white font-black text-2xl flex items-center justify-center shadow-md flex-shrink-0">
                {targetSign.letter}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-bold text-white leading-tight truncate">
                    Lesson {currentLessonInfo?.lessonCode || '1.1.1'}: Sign &apos;{targetSign.letter}&apos;
                  </h1>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                    Unit {currentLessonInfo?.unitNumber || 1} &bull; {targetSign.signType || 'Alphabet'}
                  </span>
                </div>
                <p className="text-xs text-emerald-300/90 truncate mt-0.5">
                  Hold posture firmly in camera view to register visual completion.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowVideoModal(true)}
              className="px-3.5 py-2 rounded-xl bg-[#071F15] hover:bg-[#123828] border border-amber-500/40 text-amber-300 hover:text-amber-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              title="Watch video sample & 3D hand animation"
            >
              <Video className="w-4 h-4 text-[#FF4D26]" />
              <span className="hidden sm:inline">Watch Video / GIF Demo</span>
              <span className="sm:hidden">Video Demo</span>
            </button>
          </div>

          {/* Real-Time Reaction Speed Stopwatch */}
          <div className="xl:w-72 shrink-0">
            <SpeedTrackerWidget
              targetLabel={targetSign.letter}
              isMatched={isHoldingCorrect}
              onTimeTrialComplete={(ms) => setLastSpeedMs(ms)}
              personalBestMs={authSyncService.getCurrentUser()?.bestSpeedRecords?.[targetSign.letter]}
            />
          </div>
        </div>

        {/* 2. Central Video Canvas Viewport */}
        <div className="bg-[#0B2A1E] border border-[#164432] rounded-2xl p-4 shadow-xl flex flex-col space-y-3">
          
          <div className="relative rounded-2xl overflow-hidden bg-[#04120B] border border-[#164432] aspect-[16/9] w-full max-h-[480px] flex items-center justify-center shadow-inner">
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
              {authSyncService.getCurrentUser()?.role === 'admin' && (
                <button
                  onClick={() => setShowDatasetModal(true)}
                  className="px-2.5 py-1.5 rounded-xl bg-[#0B2A1E]/80 hover:bg-[#164432] border border-[#164432] text-emerald-300 hover:text-white backdrop-blur-md transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold shadow-xs"
                  title="Admin Training Data & Export .CSV"
                >
                  <Database className="w-3.5 h-3.5 text-[#F97316]" />
                  <span className="hidden sm:inline">Dataset .CSV</span>
                </button>
              )}

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
                  <div className="font-bold text-sm text-emerald-100 flex items-center gap-2 flex-wrap">
                    <span>Sign &apos;{justCompletedSign}&apos; Accomplished!</span>
                    {lastSpeedMs && (
                      <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full text-xs font-mono font-bold flex items-center gap-1">
                        <Timer className="w-3 h-3 text-amber-400" />
                        <span>{(lastSpeedMs / 1000).toFixed(2)}s</span>
                      </span>
                    )}
                    <Sparkles className="w-4 h-4 text-amber-300" />
                  </div>
                  <p className="text-xs text-emerald-300/90 mt-0.5">
                    {duplicateXpNotice || 'Visual posture verified. You can continue practicing or advance to the next sign when ready.'}
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
                    speedStartTimeRef.current = performance.now();
                  }}
                  className="px-3.5 py-2 rounded-xl bg-[#061F15] hover:bg-[#0E3524] border border-emerald-600/40 text-emerald-200 text-xs font-semibold cursor-pointer transition-colors"
                >
                  Practice &apos;{justCompletedSign}&apos; Again
                </button>

                {targetSignIndex < allCurriculumSigns.length - 1 && (
                  <button
                    onClick={() => {
                      setJustCompletedSign(null);
                      handleNextSign();
                    }}
                    className="px-5 py-2 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white text-xs font-bold shadow-lg shadow-orange-600/30 flex items-center gap-1.5 cursor-pointer transition-all transform hover:scale-[1.02]"
                  >
                    <span>Next Sign ({allCurriculumSigns[targetSignIndex + 1]?.letter})</span>
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
                disabled={targetSignIndex >= allCurriculumSigns.length - 1}
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

      {/* Video Demonstration Modal (Comment 5) */}
      {showVideoModal && (
        <SignVideoModal
          sign={targetSign}
          isOpen={showVideoModal}
          onClose={() => setShowVideoModal(false)}
        />
      )}
    </div>
  );
};
