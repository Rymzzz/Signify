import { HandLandmark, ASLSign } from '../types/index';
import { ASL_ALPHABET } from '../data/aslAlphabet';
import { DynamicMotionState } from './motionTracker';

export interface FingerStateAnalysis {
  thumbExtended: boolean;
  thumbOutward: boolean;
  thumbAcross: boolean;
  thumbOverFront: boolean;
  thumbAlongsideIndex: boolean;
  thumbCrossedOverKnuckles: boolean;
  thumbUpright: boolean;
  allFingersCurled: boolean;
  thumbBetweenIndexMiddle: boolean;
  indexExtended: boolean;
  middleExtended: boolean;
  ringExtended: boolean;
  pinkyExtended: boolean;
  indexHooked: boolean;
  indexMiddleCrossed: boolean;
  indexMiddleSpread: number; // distance between index tip and middle tip normalized
  indexMiddleTogether: boolean;
  indexThumbPinch: boolean; // tips close (O, F)
  middleThumbPinch: boolean;
  handUpright: boolean;
  pointingDown: boolean;
  pointingHoriz: boolean;
  indexPointingUpright: boolean;
  indexPointingHoriz: boolean;
  middlePointingUpright: boolean;
  middlePointingHoriz: boolean;
  twoFingersHoriz: boolean;
  twoFingersUpright: boolean;
  palmFacing: 'FRONT' | 'SIDE' | 'DOWN';
  isCurvedC: boolean;
  isClawedE: boolean;
  isFistM: boolean;
  isFistN: boolean;
  isFistT: boolean;
  isFistS: boolean;
  isClosedCircleO: boolean;
  isIndexHooked: boolean;
  isPointingDownP: boolean;
  isPointingDownQ: boolean;
  thumbPinkySpread: number;
}

export interface ClassificationResult {
  letter: string;
  confidence: number;
  sign: ASLSign;
  fingerAnalysis: FingerStateAnalysis;
  rawDistances: { letter: string; score: number }[];
  coachingCue: string;
  isDynamicMotion?: boolean;
  motionProgress?: number;
}

// Distance between two 2D/3D landmarks
function dist(p1: HandLandmark, p2: HandLandmark): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

// Normalize 21 landmarks into scale-invariant 42-float vector (wrist at 0,0, max abs coord = 1)
export function extractNormalized42(landmarks: HandLandmark[]): number[] {
  if (!landmarks || landmarks.length < 21) return new Array(42).fill(0);

  const baseX = landmarks[0].x;
  const baseY = landmarks[0].y;

  const raw: number[] = [];
  let maxVal = 0;

  for (let i = 0; i < 21; i++) {
    const rx = landmarks[i].x - baseX;
    const ry = landmarks[i].y - baseY;
    raw.push(rx, ry);
    if (Math.abs(rx) > maxVal) maxVal = Math.abs(rx);
    if (Math.abs(ry) > maxVal) maxVal = Math.abs(ry);
  }

  if (maxVal < 0.0001) maxVal = 1;

  return raw.map(v => v / maxVal);
}

// Analyze anatomical finger states from landmarks with orientation-invariant geometric vectors
export function analyzeFingers(landmarks: HandLandmark[]): FingerStateAnalysis {
  if (!landmarks || landmarks.length < 21) {
    return {
      thumbExtended: false,
      thumbOutward: false,
      thumbAcross: false,
      thumbOverFront: false,
      thumbAlongsideIndex: false,
      thumbCrossedOverKnuckles: false,
      thumbUpright: false,
      allFingersCurled: false,
      thumbBetweenIndexMiddle: false,
      indexExtended: false,
      middleExtended: false,
      ringExtended: false,
      pinkyExtended: false,
      indexHooked: false,
      indexMiddleCrossed: false,
      indexMiddleSpread: 0,
      indexMiddleTogether: false,
      indexThumbPinch: false,
      middleThumbPinch: false,
      handUpright: true,
      pointingDown: false,
      pointingHoriz: false,
      indexPointingUpright: false,
      indexPointingHoriz: false,
      middlePointingUpright: false,
      middlePointingHoriz: false,
      twoFingersHoriz: false,
      twoFingersUpright: false,
      palmFacing: 'FRONT',
      isCurvedC: false,
      isClawedE: false,
      isFistM: false,
      isFistN: false,
      isFistT: false,
      isFistS: false,
      isClosedCircleO: false,
      isIndexHooked: false,
      isPointingDownP: false,
      isPointingDownQ: false,
      thumbPinkySpread: 0,
    };
  }

  const wrist = landmarks[0];
  const thumbTip = landmarks[4];
  const thumbIp = landmarks[3];
  const thumbMcp = landmarks[2];

  const indexMcp = landmarks[5];
  const indexPip = landmarks[6];
  const indexDip = landmarks[7];
  const indexTip = landmarks[8];

  const middleMcp = landmarks[9];
  const middlePip = landmarks[10];
  const middleDip = landmarks[11];
  const middleTip = landmarks[12];

  const ringMcp = landmarks[13];
  const ringPip = landmarks[14];
  const ringDip = landmarks[15];
  const ringTip = landmarks[16];

  const pinkyMcp = landmarks[17];
  const pinkyPip = landmarks[18];
  const pinkyDip = landmarks[19];
  const pinkyTip = landmarks[20];

  // Palm size reference (wrist to middle MCP)
  const palmScale = Math.max(0.01, dist(wrist, middleMcp));

  // Knuckle vector from Index MCP (5) to Pinky MCP (17)
  const kx = pinkyMcp.x - indexMcp.x;
  const ky = pinkyMcp.y - indexMcp.y;
  const knuckleDist = Math.max(0.001, Math.hypot(kx, ky));
  // Unit vector along palm towards thumb side (opposite of pinky direction, works for both left/right hands)
  const uxThumbSide = -kx / knuckleDist;
  const uyThumbSide = -ky / knuckleDist;

  // Palm upward vector from wrist (0) to middle MCP (9)
  const fx = middleMcp.x - wrist.x;
  const fy = middleMcp.y - wrist.y;
  const palmLen = Math.max(0.001, Math.hypot(fx, fy));
  const uxUp = fx / palmLen;
  const uyUp = fy / palmLen;

  // Thumb position relative to Index MCP (5)
  const dxThumb = thumbTip.x - indexMcp.x;
  const dyThumb = thumbTip.y - indexMcp.y;

  // Lateral projection: positive if on thumb side, negative if crossing toward middle/ring/pinky
  const thumbLateral = dxThumb * uxThumbSide + dyThumb * uyThumbSide;
  // Upward projection: positive if pointing toward fingertips/upward, negative if toward wrist
  const thumbUpward = dxThumb * uxUp + dyThumb * uyUp;

  // Finger extension checks (orientation-invariant: works for upright, horizontal, and angled poses):
  const indexExtended = dist(indexTip, indexMcp) > palmScale * 0.42 &&
    (dist(indexTip, wrist) > dist(indexPip, wrist) * 1.06 || dist(indexTip, indexMcp) > dist(indexPip, indexMcp) * 1.18);

  const middleExtended = dist(middleTip, middleMcp) > palmScale * 0.42 &&
    (dist(middleTip, wrist) > dist(middlePip, wrist) * 1.06 || dist(middleTip, middleMcp) > dist(middlePip, middleMcp) * 1.18);

  const ringExtended = dist(ringTip, ringMcp) > palmScale * 0.42 &&
    (dist(ringTip, wrist) > dist(ringPip, wrist) * 1.06 || dist(ringTip, ringMcp) > dist(ringPip, ringMcp) * 1.18);

  const pinkyExtended = dist(pinkyTip, pinkyMcp) > palmScale * 0.42 &&
    (dist(pinkyTip, wrist) > dist(pinkyPip, wrist) * 1.06 || dist(pinkyTip, pinkyMcp) > dist(pinkyPip, pinkyMcp) * 1.18);

  const allFingersCurled = !indexExtended && !middleExtended && !ringExtended && !pinkyExtended;

  // Thumb analysis:
  const thumbOutDist = dist(thumbTip, indexMcp);
  const thumbExtended = dist(thumbTip, wrist) > dist(thumbMcp, wrist) * 1.18 ||
                        thumbOutDist > palmScale * 0.65;

  const thumbOutward = thumbLateral > palmScale * 0.35 && thumbOutDist > palmScale * 0.7;

  // Thumb upright along hand (pointing toward ceiling/fingertips, higher than MCP)
  const thumbUpright = thumbUpward > -0.2 * palmScale && (thumbTip.y < thumbMcp.y || dist(thumbTip, wrist) > dist(thumbMcp, wrist) * 1.05);

  // Thumb alongside index finger (Core signature of Sign 'A'):
  // - Thumb is positioned outside or directly alongside index MCP laterally
  // - Thumb points upright
  // - Thumb tip is far from middle and ring knuckles
  const thumbAlongsideIndex = thumbLateral > -0.16 * palmScale &&
                              thumbUpright &&
                              dist(thumbTip, middleMcp) > palmScale * 0.42 &&
                              dist(thumbTip, ringMcp) > palmScale * 0.52;

  // Thumb crossed in front of knuckles (Signature of Sign 'S'):
  // - Thumb tip is in front of middle or ring knuckles/PIPs
  // - Thumb is folded horizontally, NOT pointing upright
  const thumbOverFront = (dist(thumbTip, middlePip) < palmScale * 0.48 || 
                          dist(thumbTip, ringPip) < palmScale * 0.48 || 
                          dist(thumbTip, middleMcp) < palmScale * 0.48) && 
                         !thumbAlongsideIndex;

  const thumbCrossedOverKnuckles = (thumbLateral < -0.12 * palmScale || thumbOverFront) && !thumbUpright;
  const thumbAcross = thumbLateral < -0.15 * palmScale && !thumbUpright;

  const thumbBetweenIndexMiddle = dist(thumbTip, indexMcp) < palmScale * 0.38 && 
                                  dist(thumbTip, middleMcp) < palmScale * 0.45 && 
                                  thumbUpward < 0.15 * palmScale;

  // Pinches & Spreads
  const indexMiddleSpread = dist(indexTip, middleTip) / palmScale;
  // Crossed index and middle (R): tips cross laterally over MCP baseline
  const indexMiddleCrossed = indexExtended && middleExtended && 
    ((indexTip.x > middleTip.x && indexMcp.x < middleMcp.x) || 
     (indexTip.x < middleTip.x && indexMcp.x > middleMcp.x));

  const indexMiddleTogether = indexExtended && middleExtended && indexMiddleSpread < 0.28 && !indexMiddleCrossed;
  const indexThumbPinch = dist(indexTip, thumbTip) < palmScale * 0.38;
  const middleThumbPinch = dist(middleTip, thumbTip) < palmScale * 0.38;

  // Finger curvature ratios & distances
  const idxStraightRatio = dist(indexMcp, indexTip) / Math.max(0.01, dist(indexMcp, indexPip) + dist(indexPip, indexDip) + dist(indexDip, indexTip));
  const thumbIndexDist = dist(thumbTip, indexTip) / palmScale;
  const thumbPinkySpread = dist(thumbTip, pinkyTip) / palmScale;

  const middleDist = dist(middleTip, middleMcp) / palmScale;
  const ringDist = dist(ringTip, ringMcp) / palmScale;
  const pinkyDist = dist(pinkyTip, pinkyMcp) / palmScale;

  // Middle, ring, pinky curled into tight fist palm
  const otherThreeInFist = middleDist < 0.20 && ringDist < 0.20 && pinkyDist < 0.20;

  // C-Shape Detection:
  // - Open crescent opening between thumb tip and index/middle tips (0.35 to 1.35 palmScale)
  // - Hand is NOT in a tight fist (fingers are curved open into air: middleDist > 0.22 && ringDist > 0.22)
  // - Thumb is not tucked across palm or alongside index
  // - Fingers are curved in an arc together (not flat straight upright like B, not closed into circle like O)
  const isCurvedC = thumbIndexDist > 0.35 && thumbIndexDist < 1.35 &&
    !otherThreeInFist && middleDist > 0.22 && ringDist > 0.22 &&
    !thumbAlongsideIndex && !thumbAcross && !thumbOverFront &&
    (thumbExtended || dist(thumbTip, wrist) > palmScale * 0.68) &&
    dist(middleTip, ringTip) < palmScale * 0.45 &&
    dist(indexTip, middleTip) < palmScale * 0.40;

  // Hooked index (X)
  const isIndexHooked = otherThreeInFist && !isCurvedC &&
    dist(indexPip, indexMcp) > palmScale * 0.16 &&
    dist(indexTip, indexMcp) > palmScale * 0.16 &&
    (dist(indexTip, indexMcp) < dist(indexPip, indexMcp) * 1.35 || indexTip.y > indexPip.y - palmScale * 0.08 || idxStraightRatio < 0.88);

  const indexHooked = isIndexHooked;

  const handUpright = middleMcp.y < wrist.y;
  const pointingDown = middleTip.y > middleMcp.y + palmScale * 0.15 || indexTip.y > indexMcp.y + palmScale * 0.15;
  const pointingHoriz = Math.abs(indexTip.x - indexMcp.x) > Math.abs(indexTip.y - indexMcp.y) * 1.1;

  // Relative distances of thumb tip to finger MCP joints (normalized by palmScale):
  const tToRing = dist(thumbTip, ringMcp) / palmScale;
  const tToMid = dist(thumbTip, middleMcp) / palmScale;
  const tToIndex = dist(thumbTip, indexMcp) / palmScale;

  // Fist family distinctions:
  // E detection: Thumb folded horizontally underneath curled fingertips (doesn't reach middle/ring)
  const isClawedE = (allFingersCurled || (!indexExtended && !middleExtended && !ringExtended && !pinkyExtended)) &&
    !thumbAlongsideIndex && !isCurvedC &&
    tToRing > 0.35 && tToMid > 0.22 && tToIndex < 0.28;

  // M detection: Thumb tucked under 3 fingers (thumb tip reaches ring finger)
  const isFistM = (allFingersCurled || (!indexExtended && !middleExtended && !ringExtended && !pinkyExtended)) &&
    !thumbAlongsideIndex && !isCurvedC &&
    tToRing <= tToMid && tToRing <= tToIndex && tToRing < 0.22;

  // N detection: Thumb tucked under 2 fingers (thumb tip reaches under middle finger)
  const isFistN = (allFingersCurled || (!indexExtended && !middleExtended && !ringExtended && !pinkyExtended)) &&
    !thumbAlongsideIndex && !isCurvedC &&
    tToMid <= tToIndex && tToMid < tToRing && tToMid < 0.22;

  // T detection: Thumb tucked between index and middle knuckles
  const isFistT = (allFingersCurled || (!indexExtended && !middleExtended && !ringExtended && !pinkyExtended)) &&
    !thumbAlongsideIndex && !isCurvedC &&
    tToIndex < tToMid && tToIndex < tToRing && tToMid <= 0.24 && tToIndex < 0.20;

  // S detection: Thumb crossed across front of curled index and middle fingers
  const isFistS = (allFingersCurled || (!indexExtended && !middleExtended && !ringExtended && !pinkyExtended)) &&
    !thumbAlongsideIndex && !isCurvedC &&
    (thumbAcross || thumbOverFront || thumbTip.y > indexTip.y + palmScale * 0.06) &&
    tToRing >= 0.25;

  // Precise directional vectors for index and middle fingers:
  const idxVecX = indexTip.x - indexMcp.x;
  const idxVecY = indexTip.y - indexMcp.y;
  const midVecX = middleTip.x - middleMcp.x;
  const midVecY = middleTip.y - middleMcp.y;

  // Index orientation (in screen coordinates: y decreases upward):
  // Upright: points towards ceiling (-y direction), vertical component dominates
  const indexPointingUpright = indexExtended && idxVecY < -palmScale * 0.25 && Math.abs(idxVecY) > Math.abs(idxVecX) * 0.85;
  // Horizontal: points sideways (left or right across frame), horizontal component dominates
  const indexPointingHoriz = indexExtended && Math.abs(idxVecX) > Math.abs(idxVecY) * 0.70 && Math.abs(idxVecX) > palmScale * 0.25;

  // Middle finger orientation:
  const middlePointingUpright = middleExtended && midVecY < -palmScale * 0.25 && Math.abs(midVecY) > Math.abs(midVecX) * 0.85;
  const middlePointingHoriz = middleExtended && Math.abs(midVecX) > Math.abs(midVecY) * 0.70 && Math.abs(midVecX) > palmScale * 0.25;

  // O detection: All fingers curved so fingertips meet thumb tip in a circle
  const isClosedCircleO = dist(indexTip, thumbTip) < palmScale * 0.40 &&
    (dist(middleTip, thumbTip) < palmScale * 0.45 || dist(ringTip, thumbTip) < palmScale * 0.50) &&
    !isIndexHooked && !indexPointingUpright && !isCurvedC;

  // P & Q downward pointing:
  const isPointingDownP = (indexTip.y > indexMcp.y - palmScale * 0.12 || middleTip.y > middleMcp.y - palmScale * 0.12 || pointingDown) &&
    indexExtended && middleExtended && !ringExtended && !pinkyExtended;

  const isPointingDownQ = (indexTip.y > indexMcp.y - palmScale * 0.12 || pointingDown) &&
    indexExtended && !middleExtended && !ringExtended && !pinkyExtended;

  // 2-finger combination orientations (H vs V / U):
  // Both index and middle pointing horizontally sideways:
  const twoFingersHoriz = indexExtended && middleExtended && !ringExtended && !pinkyExtended &&
    (indexPointingHoriz || middlePointingHoriz || (Math.abs(idxVecX) > palmScale * 0.22 && Math.abs(midVecX) > palmScale * 0.22));

  // Both index and middle pointing vertically upright (peace sign / V / U):
  const twoFingersUpright = indexExtended && middleExtended && !ringExtended && !pinkyExtended &&
    (indexPointingUpright && middlePointingUpright);

  let palmFacing: 'FRONT' | 'SIDE' | 'DOWN' = 'FRONT';
  if (pointingDown) palmFacing = 'DOWN';
  else if (Math.abs(indexMcp.x - pinkyMcp.x) < palmScale * 0.45) palmFacing = 'SIDE';

  return {
    thumbExtended,
    thumbOutward,
    thumbAcross,
    thumbOverFront,
    thumbAlongsideIndex,
    thumbCrossedOverKnuckles,
    thumbUpright,
    allFingersCurled,
    thumbBetweenIndexMiddle,
    indexExtended,
    middleExtended,
    ringExtended,
    pinkyExtended,
    indexHooked,
    indexMiddleCrossed,
    indexMiddleSpread,
    indexMiddleTogether,
    indexThumbPinch,
    middleThumbPinch,
    handUpright,
    pointingDown,
    pointingHoriz,
    indexPointingUpright,
    indexPointingHoriz,
    middlePointingUpright,
    middlePointingHoriz,
    twoFingersHoriz,
    twoFingersUpright,
    palmFacing,
    isCurvedC,
    isClawedE,
    isFistM,
    isFistN,
    isFistT,
    isFistS,
    isClosedCircleO,
    isIndexHooked,
    isPointingDownP,
    isPointingDownQ,
    thumbPinkySpread,
  };
}

// Pre-compute normalized 42-D feature vectors for reference alphabet
const REFERENCE_FEATURES: { letter: string; features: number[]; sign: ASLSign }[] = ASL_ALPHABET.map(sign => ({
  letter: sign.letter,
  features: extractNormalized42(sign.referenceLandmarks),
  sign,
}));

// Core Real-Time Classifier supporting all 26 letters (A through Z)
export function classifyHandPose(
  landmarks: HandLandmark[],
  targetLetter?: string,
  motionState?: DynamicMotionState
): ClassificationResult {
  const fallbackSign = ASL_ALPHABET[0];

  if (!landmarks || landmarks.length < 21) {
    return {
      letter: '--',
      confidence: 0,
      sign: fallbackSign,
      fingerAnalysis: analyzeFingers([]),
      rawDistances: [],
      coachingCue: 'No hand detected in view. Show hand to camera.'
    };
  }

  const userNorm42 = extractNormalized42(landmarks);
  const analysis = analyzeFingers(landmarks);
  const palmScale = Math.hypot(landmarks[0].x - landmarks[9].x, landmarks[0].y - landmarks[9].y);
  const thumbTip = landmarks[4];
  const indexMcp = landmarks[5];

  // Compute Euclidean similarity against all 26 ASL reference signs
  const scores: {
    letter: string;
    compositeScore: number;
    baseSimilarity: number;
    ruleBonus: number;
    sign: ASLSign;
  }[] = [];

  REFERENCE_FEATURES.forEach(({ letter, features, sign }) => {
    let sumSq = 0;
    for (let i = 0; i < 42; i++) {
      const diff = userNorm42[i] - features[i];
      sumSq += diff * diff;
    }
    const euclideanDist = Math.sqrt(sumSq);

    // Anatomical bonus/penalty heuristics for each letter of the alphabet (A-Z):
    let ruleBonus = 0;

    switch (letter) {
      case 'A':
        // Fist with thumb resting alongside index finger
        if (analysis.isClawedE || analysis.isClosedCircleO || analysis.isCurvedC || analysis.isIndexHooked || analysis.isFistM || analysis.isFistN || analysis.isFistT || analysis.isFistS) {
          ruleBonus -= 0.60;
        } else if (analysis.allFingersCurled) {
          if (analysis.thumbAlongsideIndex || (analysis.thumbUpright && !analysis.thumbAcross)) {
            ruleBonus += 0.90;
          } else {
            ruleBonus += 0.40;
          }
        } else {
          ruleBonus -= 0.40;
        }
        break;

      case 'B':
        // 4 fingers straight up together, thumb tucked across palm
        if (analysis.isCurvedC) {
          ruleBonus -= 0.80;
        } else if (analysis.indexExtended && analysis.middleExtended && analysis.ringExtended && analysis.pinkyExtended) {
          ruleBonus += 0.65;
          if (!analysis.thumbOutward) ruleBonus += 0.25;
          if (analysis.indexMiddleTogether) ruleBonus += 0.15;
        } else {
          ruleBonus -= 0.60;
        }
        break;

      case 'C':
        // Curved hand forming C, thumb open opposite
        if (analysis.isCurvedC) {
          ruleBonus += 0.95;
        } else if (analysis.thumbExtended && !analysis.allFingersCurled && !analysis.thumbAcross && !analysis.thumbOverFront) {
          ruleBonus += 0.70;
        } else if (targetLetter === 'C' && !analysis.thumbAcross && !analysis.indexPointingUpright) {
          ruleBonus += 0.65;
        } else {
          ruleBonus -= 0.40;
        }
        break;

      case 'D':
        // Index straight up (UPRIGHT), middle/ring/pinky touching thumb tip.
        // MUST be upright! If horizontal, it's G, NOT D!
        // If thumb is extended outward at 90 deg, it's L, NOT D!
        if (analysis.indexExtended && !analysis.middleExtended && !analysis.ringExtended && !analysis.pinkyExtended) {
          if (analysis.thumbOutward || (analysis.thumbExtended && !analysis.thumbAcross && dist(thumbTip, indexMcp) > palmScale * 0.50)) {
            // Thumb outward is Sign 'L'! Penalize 'D'
            ruleBonus -= 0.65;
          } else if (analysis.indexPointingUpright && !analysis.indexPointingHoriz) {
            ruleBonus += 0.85;
            if (analysis.middleThumbPinch || !analysis.thumbOutward) ruleBonus += 0.20;
          } else if (analysis.indexPointingHoriz) {
            // Index pointing sideways/horizontally is Sign 'G'! Heavily penalize 'D'
            ruleBonus -= 0.85;
          } else {
            ruleBonus += 0.20;
          }
          if (motionState?.z.detected) {
            ruleBonus -= 0.60;
          }
        } else {
          ruleBonus -= 0.6;
        }
        break;

      case 'E':
        // Fist with thumb folded horizontally under curled fingertips
        if (analysis.isClawedE) {
          ruleBonus += 0.95;
        } else if (analysis.allFingersCurled && !analysis.thumbAlongsideIndex && !analysis.thumbUpright) {
          ruleBonus += 0.65;
          if (analysis.thumbAcross || analysis.thumbOverFront) ruleBonus += 0.20;
        } else if (targetLetter === 'E' && !analysis.indexExtended && !analysis.pinkyExtended) {
          ruleBonus += 0.60;
        } else {
          ruleBonus -= 0.50;
        }
        break;

      case 'F':
        // Index & thumb pinch in circle, middle, ring, pinky straight up
        if (analysis.middleExtended && analysis.ringExtended && analysis.pinkyExtended) {
          ruleBonus += 0.55;
          if (analysis.indexThumbPinch) ruleBonus += 0.35;
        } else {
          ruleBonus -= 0.5;
        }
        break;

      case 'G':
        // Index pointing HORIZONTALLY / SIDEWAYS, thumb parallel/alongside, other 3 curled.
        // MUST be horizontal! If upright, it's D, NOT G!
        if (analysis.indexExtended && !analysis.middleExtended && !analysis.ringExtended && !analysis.pinkyExtended) {
          if (analysis.indexPointingHoriz) {
            ruleBonus += 0.85;
            if (analysis.thumbExtended || analysis.thumbOutward || analysis.thumbAlongsideIndex) {
              ruleBonus += 0.25;
            }
          } else if (analysis.indexPointingUpright) {
            // Index pointing straight up is Sign 'D'! Heavily penalize 'G'
            ruleBonus -= 0.85;
          } else {
            ruleBonus += 0.15;
          }
        } else {
          ruleBonus -= 0.6;
        }
        break;

      case 'H':
        // Index and middle pointing HORIZONTALLY / SIDEWAYS together, ring & pinky curled.
        // MUST be horizontal! If upright, it's V or U, NOT H!
        if (analysis.indexExtended && analysis.middleExtended && !analysis.ringExtended && !analysis.pinkyExtended) {
          if (analysis.twoFingersHoriz) {
            ruleBonus += 0.85;
            if (analysis.indexMiddleTogether || analysis.indexMiddleSpread < 0.45) {
              ruleBonus += 0.25;
            }
          } else if (analysis.twoFingersUpright || analysis.indexPointingUpright) {
            // Fingers pointing straight up is Sign 'V' or 'U'! Heavily penalize 'H'
            ruleBonus -= 0.85;
          } else {
            ruleBonus += 0.15;
          }
        } else {
          ruleBonus -= 0.6;
        }
        break;

      case 'I':
        // Only pinky extended upright, other 3 curled (STATIC)
        if (analysis.pinkyExtended && !analysis.indexExtended && !analysis.middleExtended && !analysis.ringExtended) {
          if (motionState?.j.detected) {
            // Hand is performing dynamic J stroke, NOT static I!
            ruleBonus -= 0.70;
          } else {
            ruleBonus += 0.70;
            if (!analysis.thumbOutward) ruleBonus += 0.20;
          }
        } else {
          ruleBonus -= 0.6;
        }
        break;

      case 'J':
        // Dynamic J gesture: Pinky extended and tracing J-hook motion in air
        if (analysis.pinkyExtended && !analysis.indexExtended && !analysis.middleExtended && !analysis.ringExtended) {
          if (motionState?.j.detected) {
            ruleBonus += 1.40;
          } else if (motionState && motionState.j.progress > 0) {
            ruleBonus += 0.50 + (motionState.j.progress / 100) * 0.50;
          } else if (targetLetter === 'J') {
            ruleBonus += 0.90;
          } else {
            ruleBonus += 0.25;
          }
        } else {
          ruleBonus -= 0.6;
        }
        break;

      case 'K':
        // Index upright, middle angled forward, thumb resting between them
        if (analysis.indexExtended && analysis.middleExtended && !analysis.ringExtended && !analysis.pinkyExtended) {
          ruleBonus += 0.45;
          if (analysis.thumbExtended && !analysis.indexMiddleTogether) ruleBonus += 0.3;
        } else {
          ruleBonus -= 0.4;
        }
        break;

      case 'L':
        // Index straight up, thumb straight out 90 degrees
        if (analysis.indexExtended && (analysis.thumbOutward || analysis.thumbExtended) && !analysis.middleExtended && !analysis.ringExtended && !analysis.pinkyExtended) {
          ruleBonus += 0.95;
        } else if (analysis.indexExtended && !analysis.middleExtended && !analysis.ringExtended) {
          ruleBonus += 0.25;
        } else {
          ruleBonus -= 0.5;
        }
        break;

      case 'M':
        // Thumb under three fingers (index, middle, ring draped over thumb)
        if (analysis.isFistM) {
          ruleBonus += 0.95;
        } else if (analysis.isClawedE || analysis.isClosedCircleO || analysis.isCurvedC || analysis.isFistT || analysis.isFistN) {
          ruleBonus -= 0.60;
        } else if (analysis.allFingersCurled) {
          if (analysis.thumbAlongsideIndex || (analysis.thumbUpright && !analysis.thumbAcross)) {
            ruleBonus -= 0.50;
          } else if (targetLetter === 'M') {
            ruleBonus += 0.85;
          } else {
            ruleBonus += 0.35;
          }
        } else {
          ruleBonus -= 0.40;
        }
        break;

      case 'N':
        // Thumb under two fingers (index, middle draped over thumb)
        if (analysis.isFistN) {
          ruleBonus += 0.95;
        } else if (analysis.isClawedE || analysis.isClosedCircleO || analysis.isCurvedC || analysis.isFistT || analysis.isFistM) {
          ruleBonus -= 0.60;
        } else if (analysis.allFingersCurled) {
          if (analysis.thumbAlongsideIndex || (analysis.thumbUpright && !analysis.thumbAcross)) {
            ruleBonus -= 0.50;
          } else if (targetLetter === 'N') {
            ruleBonus += 0.85;
          } else {
            ruleBonus += 0.35;
          }
        } else {
          ruleBonus -= 0.40;
        }
        break;

      case 'O':
        // All fingers curved to meet thumb tip in a circle
        if (analysis.isClosedCircleO) {
          ruleBonus += 0.95;
        } else if (analysis.indexThumbPinch && !analysis.indexExtended && !analysis.pinkyExtended) {
          ruleBonus += 0.80;
        } else if (targetLetter === 'O' && !analysis.indexExtended && !analysis.pinkyExtended) {
          ruleBonus += 0.75;
        } else {
          ruleBonus -= 0.40;
        }
        break;

      case 'P':
        // Downward K: index forward, middle down, thumb between
        if (analysis.isPointingDownP) {
          ruleBonus += 0.95;
        } else if (analysis.indexExtended && analysis.middleExtended && !analysis.ringExtended && !analysis.pinkyExtended) {
          if (analysis.pointingDown || targetLetter === 'P') {
            ruleBonus += 0.85;
          } else {
            ruleBonus += 0.30;
          }
        } else {
          ruleBonus -= 0.50;
        }
        break;

      case 'Q':
        // Downward G: index and thumb pointing downward
        if (analysis.isPointingDownQ) {
          ruleBonus += 0.95;
        } else if (analysis.indexExtended && !analysis.middleExtended && !analysis.ringExtended && !analysis.pinkyExtended) {
          if (analysis.pointingDown || targetLetter === 'Q') {
            ruleBonus += 0.85;
          } else {
            ruleBonus += 0.25;
          }
        } else {
          ruleBonus -= 0.50;
        }
        break;

      case 'R':
        // Index and middle fingers upright and crossed
        if (analysis.indexExtended && analysis.middleExtended && !analysis.ringExtended && !analysis.pinkyExtended) {
          ruleBonus += 0.45;
          if (analysis.indexMiddleCrossed || analysis.indexMiddleTogether) ruleBonus += 0.35;
        } else {
          ruleBonus -= 0.4;
        }
        break;

      case 'S':
        // Fist with thumb folded across knuckles
        if (analysis.isFistS) {
          ruleBonus += 0.95;
        } else if (analysis.isClawedE || analysis.isClosedCircleO || analysis.isCurvedC || analysis.isFistM || analysis.isFistN || analysis.isFistT) {
          ruleBonus -= 0.60;
        } else if (analysis.allFingersCurled) {
          if (analysis.thumbAcross || analysis.thumbOverFront) {
            ruleBonus += 0.85;
          } else if (targetLetter === 'S') {
            ruleBonus += 0.80;
          } else {
            ruleBonus += 0.35;
          }
        } else {
          ruleBonus -= 0.40;
        }
        break;

      case 'T':
        // Thumb tucked between index and middle knuckles
        if (analysis.isFistT) {
          ruleBonus += 0.95;
        } else if (analysis.isClawedE || analysis.isClosedCircleO || analysis.isCurvedC || analysis.isFistM || analysis.isFistN) {
          ruleBonus -= 0.60;
        } else if (analysis.allFingersCurled) {
          if (analysis.thumbAlongsideIndex || (analysis.thumbUpright && !analysis.thumbAcross)) {
            ruleBonus -= 0.50;
          } else if (analysis.thumbBetweenIndexMiddle || targetLetter === 'T') {
            ruleBonus += 0.85;
          } else {
            ruleBonus += 0.35;
          }
        } else {
          ruleBonus -= 0.40;
        }
        break;

      case 'U':
        // Index and middle straight up together (UPRIGHT), ring & pinky curled.
        // MUST be upright! If horizontal, it's H, NOT U!
        if (analysis.indexExtended && analysis.middleExtended && !analysis.ringExtended && !analysis.pinkyExtended) {
          if (analysis.twoFingersUpright || (analysis.indexPointingUpright && !analysis.twoFingersHoriz)) {
            ruleBonus += 0.65;
            if (analysis.indexMiddleTogether && !analysis.indexMiddleCrossed) ruleBonus += 0.35;
          } else if (analysis.twoFingersHoriz) {
            // Horizontal fingers is Sign 'H'! Heavily penalize 'U'
            ruleBonus -= 0.85;
          } else {
            ruleBonus += 0.20;
          }
        } else {
          ruleBonus -= 0.5;
        }
        break;

      case 'V':
        // Index and middle straight up spread (peace sign, UPRIGHT), ring & pinky curled.
        // MUST be upright! If horizontal, it's H, NOT V!
        if (analysis.indexExtended && analysis.middleExtended && !analysis.ringExtended && !analysis.pinkyExtended) {
          if (analysis.twoFingersUpright || (analysis.indexPointingUpright && !analysis.twoFingersHoriz)) {
            ruleBonus += 0.65;
            if (!analysis.indexMiddleTogether && analysis.indexMiddleSpread > 0.30) ruleBonus += 0.35;
          } else if (analysis.twoFingersHoriz) {
            // Horizontal fingers is Sign 'H'! Heavily penalize 'V'
            ruleBonus -= 0.85;
          } else {
            ruleBonus += 0.20;
          }
        } else {
          ruleBonus -= 0.5;
        }
        break;

      case 'W':
        // Index, middle, ring straight up spread, pinky curled
        if (analysis.indexExtended && analysis.middleExtended && analysis.ringExtended && !analysis.pinkyExtended) {
          ruleBonus += 0.75;
        } else {
          ruleBonus -= 0.5;
        }
        break;

      case 'X':
        // Index hooked, other three curled into fist
        if (analysis.isIndexHooked) {
          ruleBonus += 0.95;
        } else if (!analysis.middleExtended && !analysis.ringExtended && !analysis.pinkyExtended) {
          if (targetLetter === 'X') {
            ruleBonus += 0.85;
          } else if (analysis.indexHooked) {
            ruleBonus += 0.75;
          } else if (!analysis.indexExtended) {
            ruleBonus += 0.25;
          }
        } else {
          ruleBonus -= 0.40;
        }
        break;

      case 'Y':
        // Thumb and pinky extended, middle 3 curled (hang loose)
        if (analysis.pinkyExtended && (analysis.thumbOutward || (analysis.thumbExtended && !analysis.thumbAcross)) && !analysis.middleExtended && !analysis.ringExtended && !analysis.indexExtended) {
          ruleBonus += 0.95;
          if (analysis.thumbPinkySpread > 0.90) ruleBonus += 0.15;
        } else if (targetLetter === 'Y' && analysis.pinkyExtended && (analysis.thumbOutward || analysis.thumbExtended)) {
          ruleBonus += 0.85;
        } else {
          ruleBonus -= 0.50;
        }
        break;

      case 'Z':
        // Dynamic Z gesture: Index finger tracing 3-segment zigzag in air
        if (analysis.indexExtended && !analysis.middleExtended && !analysis.ringExtended && !analysis.pinkyExtended) {
          if (motionState?.z.detected) {
            ruleBonus += 1.40;
          } else if (motionState && motionState.z.progress > 0) {
            ruleBonus += 0.50 + (motionState.z.progress / 100) * 0.50;
          } else if (targetLetter === 'Z') {
            ruleBonus += 0.90;
          } else {
            ruleBonus += 0.25;
          }
        } else {
          ruleBonus -= 0.6;
        }
        break;
      default:
        break;
    }

    // Contextual target bonus when user matches target sign's rules
    if (targetLetter && letter === targetLetter) {
      if (ruleBonus > 0.25) {
        ruleBonus += 0.45;
      } else if (ruleBonus >= 0) {
        ruleBonus += 0.30;
      }
    }

    // Convert distance to similarity score (higher = closer match)
    const baseSimilarity = Math.max(0.01, 1.0 - (euclideanDist / 2.8));
    // Composite ranking score combines landmark geometric distance and anatomical pose checks
    const compositeScore = baseSimilarity * 1.5 + ruleBonus;

    scores.push({
      letter,
      compositeScore,
      baseSimilarity,
      ruleBonus,
      sign
    });
  });

  scores.sort((a, b) => b.compositeScore - a.compositeScore);

  const top = scores[0];
  const matchedSign = top.sign;

  // Normalized display confidence between 0.05 and 0.99
  const confidence = Math.max(0.05, Math.min(0.99, (top.baseSimilarity * 0.65) + Math.max(0, Math.min(0.35, top.ruleBonus * 0.35))));

  const isDynamicMotion = (top.letter === 'J' && !!motionState?.j.detected) ||
                          (top.letter === 'Z' && !!motionState?.z.detected);

  const motionProgress = top.letter === 'J' ? (motionState?.j.progress || 0) :
                         top.letter === 'Z' ? (motionState?.z.progress || 0) : undefined;

  // Generate coaching cue
  let coachingCue = matchedSign.tips[0] || 'Good form!';
  if (targetLetter && targetLetter !== top.letter) {
    const targetSign = ASL_ALPHABET.find(s => s.letter === targetLetter);
    if (targetSign) {
      if (targetLetter === 'G' && analysis.indexPointingUpright) {
        coachingCue = 'Target is "G": Turn your hand sideways and point your index finger horizontally.';
      } else if (targetLetter === 'G' && !analysis.indexExtended) {
        coachingCue = 'Target is "G": Extend your index finger horizontally with thumb parallel.';
      } else if (targetLetter === 'D' && analysis.indexPointingHoriz) {
        coachingCue = 'Target is "D": Point your index finger straight up vertically toward the ceiling.';
      } else if (targetLetter === 'H' && analysis.twoFingersUpright) {
        coachingCue = 'Target is "H": Point your index and middle fingers horizontally sideways, not upright.';
      } else if (targetLetter === 'H' && !analysis.middleExtended) {
        coachingCue = 'Target is "H": Extend both your index and middle fingers horizontally sideways together.';
      } else if (targetLetter === 'V' && analysis.twoFingersHoriz) {
        coachingCue = 'Target is "V": Hold your index and middle fingers straight up in a V-shape toward the ceiling.';
      } else if (targetLetter === 'U' && analysis.twoFingersHoriz) {
        coachingCue = 'Target is "U": Hold your index and middle fingers straight up pressed together.';
      } else if (targetLetter === 'J') {
        if (motionState?.j.detected) {
          coachingCue = 'Awesome! J stroke recognized!';
        } else if (motionState && motionState.j.progress > 0) {
          coachingCue = motionState.j.strokeStage;
        } else if (!analysis.pinkyExtended) {
          coachingCue = 'Target is "J": Form an "I" shape first with pinky extended upright.';
        } else {
          coachingCue = 'Target is "J": With pinky upright, trace a "J" hook in the air (dip down and curve up).';
        }
      } else if (targetLetter === 'Z') {
        if (motionState?.z.detected) {
          coachingCue = 'Awesome! Z zigzag recognized!';
        } else if (motionState && motionState.z.progress > 0) {
          coachingCue = motionState.z.strokeStage;
        } else if (!analysis.indexExtended) {
          coachingCue = 'Target is "Z": Extend your index finger forward to trace.';
        } else {
          coachingCue = 'Target is "Z": In the air, trace a "Z" pattern (across, diagonal down-opposite, across).';
        }
      } else if (targetLetter === 'A' && analysis.indexExtended) {
        coachingCue = 'Target is "A": Curl your index and other fingers tightly into your palm.';
      } else if (targetLetter === 'A' && analysis.thumbCrossedOverKnuckles) {
        coachingCue = 'Target is "A": Keep thumb resting upright beside index, do not cross knuckles.';
      } else if (targetLetter === 'B' && !analysis.pinkyExtended) {
        coachingCue = 'Target is "B": Extend all 4 fingers straight up together.';
      } else if (targetLetter === 'L' && !analysis.thumbOutward) {
        coachingCue = 'Target is "L": Point your thumb outward at 90° from your upright index finger.';
      } else if (targetLetter === 'V' && analysis.indexMiddleTogether) {
        coachingCue = 'Target is "V": Spread your index and middle fingers apart in a V-shape.';
      } else if (targetLetter === 'U' && !analysis.indexMiddleTogether) {
        coachingCue = 'Target is "U": Press your index and middle fingers tightly together.';
      } else if (targetLetter === 'Y' && !analysis.thumbOutward) {
        coachingCue = 'Target is "Y": Extend both your thumb and pinky finger outward like a phone.';
      } else if (targetLetter === 'W' && !analysis.ringExtended) {
        coachingCue = 'Target is "W": Hold up 3 fingers (index, middle, and ring).';
      } else if (targetLetter === 'C' && analysis.indexThumbPinch) {
        coachingCue = 'Target is "C": Keep an open curve; do not touch thumb to fingers.';
      } else if (targetLetter === 'R' && !analysis.indexMiddleCrossed) {
        coachingCue = 'Target is "R": Cross your middle finger over your index finger.';
      } else if (targetLetter === 'S' && !analysis.thumbCrossedOverKnuckles) {
        coachingCue = 'Target is "S": Wrap your thumb horizontally across the front of your curled knuckles.';
      } else {
        coachingCue = targetSign.tips[0] || `Form the posture for letter ${targetLetter}`;
      }
    }
  }

  return {
    letter: top.letter,
    confidence,
    sign: matchedSign,
    fingerAnalysis: analysis,
    rawDistances: scores.slice(0, 5).map(s => ({
      letter: s.letter,
      score: Math.round(Math.max(0.05, Math.min(0.99, (s.baseSimilarity * 0.65) + Math.max(0, Math.min(0.35, s.ruleBonus * 0.35)))) * 100)
    })),
    coachingCue,
    isDynamicMotion,
    motionProgress,
  };
}
