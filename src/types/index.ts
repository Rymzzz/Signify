export interface HandLandmark {
  x: number;
  y: number;
  z?: number;
}

export type SignCategory = 'vowel' | 'consonant' | 'complex' | 'number' | 'word' | 'phrase';

export interface ASLSign {
  id: string;
  letter: string; // The display label (e.g., 'A', '5', 'HELLO', 'THANK YOU')
  title: string;
  shortDescription?: string;
  category: SignCategory;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  description: string;
  fingerStates: {
    thumb: string;
    index: string;
    middle: string;
    ring: string;
    pinky: string;
  };
  tips: string[];
  commonMistakes: string[];
  // Reference 21 normalized landmarks for simulation and visualization
  referenceLandmarks: HandLandmark[];
  // Video and media visual samples
  videoUrl?: string;
  gifUrl?: string;
  sampleVideoQuery?: string;
  motionTrajectory?: { x: number; y: number }[];
  signType?: 'alphabet' | 'number' | 'word' | 'phrase';
  dynamicMotion?: boolean;
}

export type UserRole = 'user' | 'admin';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  password?: string; // Stored securely for account authentication
  role: UserRole;
  avatar: string;
  createdAt: number;
  lastActiveDate: string; // 'YYYY-MM-DD'
  streak: number;
  xp: number;
  trophies?: number;
  level: number;
  // Completed signs across all modules
  completedSigns: string[];
  // Map of date string -> sign IDs practiced that day (prevents duplicate XP on same day)
  dailyPracticedSigns: Record<string, string[]>;
  // Module IDs fully finished
  completedModules: string[];
  // Reaction & execution speed records in milliseconds per sign
  bestSpeedRecords: Record<string, number>;
  averageSpeedMs?: number;
  deviceSyncedAt?: number;
}

export type ModuleCategory = 'alphabet' | 'numbers' | 'words' | 'phrases';

export interface CurriculumModule {
  id: string;
  unitId?: string;
  unitNumber?: number;
  title: string;
  subtitle: string;
  description: string;
  category: ModuleCategory;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  badge: string;
  itemCount: number;
  xpPerSign: number;
  signs: ASLSign[];
  color: string;
}

export interface CurriculumUnit {
  id: string; // 'unit-1', 'unit-2', 'unit-3'
  unitNumber: number;
  title: string;
  subtitle: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  description: string;
  badge: string;
  color: string;
  modules: CurriculumModule[];
}

export interface SpeedTrialRecord {
  signId: string;
  signLetter: string;
  targetStartTime: number;
  completionTime: number;
  elapsedMs: number;
  isPersonalBest: boolean;
  rating: 'LIGHTNING' | 'SWIFT' | 'STEADY' | 'LEARNING';
  feedback: string;
}

export interface GestureEventRecord {
  id: string;
  timestamp: number;
  eventType: 'FRAME_CAPTURED' | 'LANDMARKS_EXTRACTED' | 'FEATURES_NORMALIZED' | 'GESTURE_CLASSIFIED' | 'FEEDBACK_TRIGGERED';
  payload: {
    predictedSign?: string;
    targetSign?: string;
    confidence?: number;
    status?: 'CORRECT' | 'TRY_AGAIN' | 'SCANNING';
    fps?: number;
    latencyMs?: number;
    message?: string;
    landmarkCount?: number;
  };
}

export interface CodeFile {
  name: string;
  path: string;
  language: 'java' | 'xml' | 'python' | 'markdown' | 'css' | 'json';
  category: 'desktop' | 'mobile' | 'converter' | 'config';
  description: string;
  content: string;
}

export interface PracticeSessionState {
  currentSignIndex: number;
  targetLetter: string;
  detectedLetter: string;
  confidence: number;
  score: number;
  streak: number;
  attempts: number;
  correctCount: number;
  feedbackStatus: 'IDLE' | 'CORRECT' | 'TRY_AGAIN';
  feedbackMessage: string;
  holdProgress: number; // 0 to 100% stabilization hold
  speedTimerActive?: boolean;
  speedStartTime?: number;
  lastElapsedMs?: number;
}
