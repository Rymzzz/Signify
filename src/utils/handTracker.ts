import { HandLandmark } from '../types/index';

type HandResultsCallback = (landmarks: HandLandmark[] | null) => void;

let handsInstance: any = null;
let initPromise: Promise<any> | null = null;
let activeCallback: HandResultsCallback | null = null;
let isProcessingFrame = false;
let isFatalError = false;

/**
 * Lazily initializes and returns the singleton MediaPipe Hands WASM instance.
 * Using a singleton prevents React double-mounting (StrictMode) and tab switching
 * from re-initializing WebAssembly modules, which corrupts Emscripten's global state
 * and triggers "Aborted(Module.arguments has been replaced with plain arguments_)".
 */
export async function getHandsInstance(): Promise<any> {
  if (handsInstance && !isFatalError) return handsInstance;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    // Wait for the MediaPipe Hands CDN script to finish evaluating
    let HandsClass = (window as any).Hands;
    if (!HandsClass) {
      for (let i = 0; i < 40; i++) {
        await new Promise(r => setTimeout(r, 100));
        HandsClass = (window as any).Hands;
        if (HandsClass) break;
      }
    }

    if (!HandsClass) {
      initPromise = null;
      throw new Error('MediaPipe Hands script was not loaded from CDN.');
    }

    const hands = new HandsClass({
      locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/${file}`
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    hands.onResults((results: any) => {
      isProcessingFrame = false;
      if (activeCallback) {
        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
          activeCallback(results.multiHandLandmarks[0]);
        } else {
          activeCallback(null);
        }
      }
    });

    handsInstance = hands;
    isFatalError = false;
    isProcessingFrame = false;
    return hands;
  })();

  return initPromise;
}

/**
 * Registers an active callback for hand landmark results.
 * Returns an unsubscribe function to be called on component unmount.
 */
export function subscribeHandTracker(callback: HandResultsCallback): () => void {
  activeCallback = callback;
  return () => {
    if (activeCallback === callback) {
      activeCallback = null;
    }
  };
}

/**
 * Sends a video frame to the MediaPipe Hands processor.
 * Includes concurrency locking to prevent overlapping WASM calls,
 * and halts further processing if a fatal Emscripten abort occurs,
 * eliminating the 60fps console spam loop.
 */
export async function processVideoFrame(video: HTMLVideoElement): Promise<void> {
  if (isFatalError || isProcessingFrame || !handsInstance) return;
  if (video.readyState < 2) return;

  isProcessingFrame = true;
  try {
    await handsInstance.send({ image: video });
  } catch (err: any) {
    isProcessingFrame = false;
    const msg = (err && (err.message || String(err))) || '';
    if (msg.includes('Aborted') || msg.includes('arguments_') || msg.includes('memory')) {
      isFatalError = true;
      console.warn('Hand tracking halted due to WASM runtime abort:', err);
    }
  }
}

/**
 * Resets the tracker instance if an unrecoverable failure occurred.
 */
export function resetHandTracker(): void {
  if (handsInstance) {
    try {
      handsInstance.close();
    } catch {
      // ignore
    }
  }
  handsInstance = null;
  initPromise = null;
  activeCallback = null;
  isProcessingFrame = false;
  isFatalError = false;
}
