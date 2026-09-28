import { HandLandmark } from '../types/index';

type HandResultsCallback = (landmarks: HandLandmark[] | null) => void;

let handsInstance: any = null;
let initPromise: Promise<any> | null = null;
let activeCallback: HandResultsCallback | null = null;
let isProcessingFrame = false;
let lastFrameSentTime = 0;
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
    // 1. Wait for MediaPipe Hands script to be available on window
    let HandsClass = (window as any).Hands;
    if (!HandsClass) {
      // Dynamically load from local /mediapipe/hands/hands.js first, with CDN fallback
      await new Promise<void>((resolve) => {
        const script = document.createElement('script');
        script.src = '/mediapipe/hands/hands.js';
        script.onload = () => resolve();
        script.onerror = () => {
          const fallback = document.createElement('script');
          fallback.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/hands.js';
          fallback.crossOrigin = 'anonymous';
          fallback.onload = () => resolve();
          fallback.onerror = () => resolve();
          document.head.appendChild(fallback);
        };
        document.head.appendChild(script);
      });

      for (let i = 0; i < 40; i++) {
        HandsClass = (window as any).Hands;
        if (HandsClass) break;
        await new Promise(r => setTimeout(r, 100));
      }
    }

    if (!HandsClass) {
      initPromise = null;
      throw new Error('MediaPipe Hands script was not loaded.');
    }

    // 2. Configure Hands with local assets (/mediapipe/hands/)
    const hands = new HandsClass({
      locateFile: (file: string) => `/mediapipe/hands/${file}`
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    hands.onResults((results: any) => {
      isProcessingFrame = false;
      try {
        if (activeCallback) {
          if (results && results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            activeCallback(results.multiHandLandmarks[0]);
          } else {
            activeCallback(null);
          }
        }
      } catch (callbackErr) {
        console.error('Error in hand tracking subscriber callback:', callbackErr);
      }
    });

    handsInstance = hands;
    isFatalError = false;
    isProcessingFrame = false;
    lastFrameSentTime = 0;
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
  isProcessingFrame = false; // Always clear pending lock on subscriber change
  return () => {
    if (activeCallback === callback) {
      activeCallback = null;
    }
  };
}

/**
 * Sends a video frame to the MediaPipe Hands processor.
 * Includes watchdog timer (120ms) to prevent dropped frames from permanently locking processing,
 * and auto-recovers if a temporary Emscripten error occurs.
 */
export async function processVideoFrame(video: HTMLVideoElement): Promise<void> {
  if (isFatalError || !handsInstance) return;
  if (!video || video.readyState < 2 || video.paused || video.ended) return;

  const now = performance.now();

  // Watchdog timer: If isProcessingFrame has been held for > 120ms, the previous frame was dropped
  // by the WASM pipeline. Reset the lock so tracking never stays frozen.
  if (isProcessingFrame) {
    if (now - lastFrameSentTime > 120) {
      isProcessingFrame = false;
    } else {
      return; // Concurrency lock: previous frame is still evaluating
    }
  }

  isProcessingFrame = true;
  lastFrameSentTime = now;

  try {
    await handsInstance.send({ image: video });
  } catch (err: any) {
    isProcessingFrame = false;
    const msg = (err && (err.message || String(err))) || '';
    if (msg.includes('Aborted') || msg.includes('arguments_') || msg.includes('memory')) {
      console.warn('WASM runtime abort detected. Auto-recovering tracker instance...', err);
      resetHandTracker();
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
  lastFrameSentTime = 0;
  isFatalError = false;
}
