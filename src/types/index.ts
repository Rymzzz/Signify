export interface HandLandmark {
  x: number;
  y: number;
  z?: number;
}

export interface ASLSign {
  id: string;
  letter: string;
  title: string;
  shortDescription?: string;
  category: 'vowel' | 'consonant' | 'complex';
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
}
