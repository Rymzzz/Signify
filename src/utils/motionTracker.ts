import { HandLandmark } from '../types/index';
import { FingerStateAnalysis } from './aslClassifier';

export interface MotionPoint {
  x: number;
  y: number;
  t: number;
}

export interface DynamicDetectionResult {
  detected: boolean;
  confidence: number;
  progress: number; // 0 to 100
  strokeStage: string;
  trail: { x: number; y: number }[];
}

export interface DynamicMotionState {
  j: DynamicDetectionResult;
  z: DynamicDetectionResult;
  activeTrail: { x: number; y: number }[];
}

/**
 * Tracks fingertip trajectory over a sliding time window (last ~1.8 seconds)
 * to detect dynamic ASL signs:
 * - J: Pinky traces a downward path that loops around in a hook and curves back up.
 * - Z: Index finger traces a 3-segment zigzag (horizontal, diagonal down-opposite, horizontal).
 */
export class MotionTracker {
  private pinkyHistory: MotionPoint[] = [];
  private indexHistory: MotionPoint[] = [];
  private wristHistory: MotionPoint[] = [];
  private lastJTriggerTime = 0;
  private lastZTriggerTime = 0;

  /**
   * Pushes a new landmark frame into the motion history buffer.
   */
  public addFrame(landmarks: HandLandmark[] | null, timestamp = performance.now()): void {
    if (!landmarks || landmarks.length < 21) {
      // If hand lost for > 600ms, clear history
      if (this.pinkyHistory.length > 0 && timestamp - this.pinkyHistory[this.pinkyHistory.length - 1].t > 600) {
        this.reset();
      }
      return;
    }

    const pinkyTip = landmarks[20];
    const indexTip = landmarks[8];
    const wrist = landmarks[0];

    this.pinkyHistory.push({ x: pinkyTip.x, y: pinkyTip.y, t: timestamp });
    this.indexHistory.push({ x: indexTip.x, y: indexTip.y, t: timestamp });
    this.wristHistory.push({ x: wrist.x, y: wrist.y, t: timestamp });

    // Prune points older than 2000ms or exceeding 70 frames
    const cutoff = timestamp - 2000;
    while (this.pinkyHistory.length > 70 || (this.pinkyHistory.length > 0 && this.pinkyHistory[0].t < cutoff)) {
      this.pinkyHistory.shift();
    }
    while (this.indexHistory.length > 70 || (this.indexHistory.length > 0 && this.indexHistory[0].t < cutoff)) {
      this.indexHistory.shift();
    }
    while (this.wristHistory.length > 70 || (this.wristHistory.length > 0 && this.wristHistory[0].t < cutoff)) {
      this.wristHistory.shift();
    }
  }

  /**
   * Evaluates if a dynamic 'J' stroke has been drawn with the pinky finger.
   */
  public analyzeJ(analysis: FingerStateAnalysis, now = performance.now()): DynamicDetectionResult {
    // Cooldown check (prevent multi-firing on the same gesture within 1000ms)
    if (now - this.lastJTriggerTime < 1000) {
      return {
        detected: true,
        confidence: 0.96,
        progress: 100,
        strokeStage: 'J Stroke Complete!',
        trail: this.pinkyHistory.slice(-25).map(p => ({ x: p.x, y: p.y })),
      };
    }

    const defaultRes: DynamicDetectionResult = {
      detected: false,
      confidence: 0,
      progress: 0,
      strokeStage: 'Ready to trace J',
      trail: [],
    };

    // Handshape requirement: Pinky extended, other three fingers curled
    if (!analysis.pinkyExtended || analysis.indexExtended || analysis.middleExtended || analysis.ringExtended) {
      return defaultRes;
    }

    const pts = this.pinkyHistory;
    if (pts.length < 8) return defaultRes;

    const trail = pts.slice(-30).map(p => ({ x: p.x, y: p.y }));

    // Test multiple time windows (from 8 frames up to available)
    for (let len = Math.min(pts.length, 50); len >= 10; len -= 3) {
      const windowPts = pts.slice(pts.length - len);
      const start = windowPts[0];
      const end = windowPts[windowPts.length - 1];

      // Find bottom-most point (maximum y in screen coords)
      let maxIdx = 0;
      let maxY = windowPts[0].y;
      for (let i = 0; i < windowPts.length; i++) {
        if (windowPts[i].y > maxY) {
          maxY = windowPts[i].y;
          maxIdx = i;
        }
      }

      const downDist = maxY - start.y;
      const hookUpDist = maxY - end.y;
      const lateralDist = Math.abs(end.x - windowPts[maxIdx].x);
      const ratio = maxIdx / (windowPts.length - 1);

      // Partial progress calculation
      if (downDist >= 0.03 && ratio >= 0.25) {
        defaultRes.progress = Math.min(80, Math.round((downDist / 0.06) * 50 + (hookUpDist / 0.03) * 30));
        defaultRes.strokeStage = hookUpDist > 0.01 ? 'Curving hook upward...' : 'Drawing downstroke...';
      }

      // Complete J stroke criteria:
      // 1. Downward motion >= 0.045
      // 2. Bottom point occurs between 30% and 85% of duration
      // 3. Upward turnaround >= 0.02
      // 4. Lateral displacement in hook >= 0.018
      if (downDist >= 0.045 && hookUpDist >= 0.02 && lateralDist >= 0.018 && ratio >= 0.30 && ratio <= 0.88) {
        this.lastJTriggerTime = now;
        return {
          detected: true,
          confidence: Math.min(0.98, 0.80 + downDist + hookUpDist),
          progress: 100,
          strokeStage: 'J Stroke Complete!',
          trail,
        };
      }
    }

    defaultRes.trail = trail;
    return defaultRes;
  }

  /**
   * Evaluates if a dynamic 'Z' stroke has been drawn with the index finger.
   */
  public analyzeZ(analysis: FingerStateAnalysis, now = performance.now()): DynamicDetectionResult {
    // Cooldown check (prevent multi-firing within 1000ms)
    if (now - this.lastZTriggerTime < 1000) {
      return {
        detected: true,
        confidence: 0.96,
        progress: 100,
        strokeStage: 'Z Stroke Complete!',
        trail: this.indexHistory.slice(-30).map(p => ({ x: p.x, y: p.y })),
      };
    }

    const defaultRes: DynamicDetectionResult = {
      detected: false,
      confidence: 0,
      progress: 0,
      strokeStage: 'Ready to trace Z',
      trail: [],
    };

    // Handshape requirement: Index extended, other three fingers curled
    if (!analysis.indexExtended || analysis.middleExtended || analysis.ringExtended || analysis.pinkyExtended) {
      return defaultRes;
    }

    const pts = this.indexHistory;
    if (pts.length < 12) return defaultRes;

    const trail = pts.slice(-35).map(p => ({ x: p.x, y: p.y }));

    // Test multiple time windows
    for (let len = Math.min(pts.length, 60); len >= 14; len -= 4) {
      const windowPts = pts.slice(pts.length - len);

      // Sample points to smooth hand tremor
      const sampled: MotionPoint[] = [];
      const step = Math.max(1, Math.floor(windowPts.length / 15));
      for (let i = 0; i < windowPts.length; i += step) {
        sampled.push(windowPts[i]);
      }
      if (sampled[sampled.length - 1] !== windowPts[windowPts.length - 1]) {
        sampled.push(windowPts[windowPts.length - 1]);
      }

      // Detect horizontal directional turning points
      const turns: { idx: number; pt: MotionPoint }[] = [];
      for (let i = 1; i < sampled.length - 1; i++) {
        const d1 = sampled[i].x - sampled[i - 1].x;
        const d2 = sampled[i + 1].x - sampled[i].x;
        // Direction change with minimum velocity
        if ((d1 > 0.012 && d2 < -0.012) || (d1 < -0.012 && d2 > 0.012)) {
          turns.push({ idx: i, pt: sampled[i] });
        }
      }

      if (turns.length === 1) {
        defaultRes.progress = 50;
        defaultRes.strokeStage = 'Drawing diagonal downstroke...';
      }

      if (turns.length >= 2) {
        // Take the two primary turning corners
        const t1 = turns[0].pt;
        const t2 = turns[1].pt;
        const start = sampled[0];
        const end = sampled[sampled.length - 1];

        const seg1Dx = t1.x - start.x;
        const seg2Dx = t2.x - t1.x;
        const seg3Dx = end.x - t2.x;

        const s1Sign = Math.sign(seg1Dx);
        const s2Sign = Math.sign(seg2Dx);
        const s3Sign = Math.sign(seg3Dx);

        // Downward vertical progress across the diagonal (t2 is below t1)
        const diagDy = t2.y - t1.y;

        // Seg1 and Seg3 must be same direction, Seg2 in reverse direction
        if (s1Sign !== 0 && s1Sign === s3Sign && s1Sign !== s2Sign && diagDy >= 0.025) {
          this.lastZTriggerTime = now;
          return {
            detected: true,
            confidence: 0.96,
            progress: 100,
            strokeStage: 'Z Stroke Complete!',
            trail,
          };
        }
      }
    }

    defaultRes.trail = trail;
    return defaultRes;
  }

  /**
   * Retrieves full dynamic state evaluation for both J and Z.
   */
  public evaluate(analysis: FingerStateAnalysis, targetLetter?: string): DynamicMotionState {
    const jResult = this.analyzeJ(analysis);
    const zResult = this.analyzeZ(analysis);

    let activeTrail: { x: number; y: number }[] = [];
    if (targetLetter === 'J' || jResult.progress > 0) {
      activeTrail = jResult.trail;
    } else if (targetLetter === 'Z' || zResult.progress > 0) {
      activeTrail = zResult.trail;
    }

    return {
      j: jResult,
      z: zResult,
      activeTrail,
    };
  }

  /**
   * Resets all history buffers.
   */
  public reset(): void {
    this.pinkyHistory = [];
    this.indexHistory = [];
    this.wristHistory = [];
  }
}

// Export singleton instance for global or component sharing
export const globalMotionTracker = new MotionTracker();
