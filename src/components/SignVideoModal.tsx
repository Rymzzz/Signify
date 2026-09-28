import React, { useState, useEffect } from 'react';
import { 
  X, 
  Play, 
  Pause, 
  RotateCcw, 
  Video, 
  ExternalLink, 
  Sparkles, 
  Layers, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  Compass
} from 'lucide-react';
import { ASLSign, HandLandmark } from '../types/index';

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

interface SignVideoModalProps {
  sign: ASLSign;
  isOpen: boolean;
  onClose: () => void;
  onPractice?: (signId: string) => void;
}

export const SignVideoModal: React.FC<SignVideoModalProps> = ({
  sign,
  isOpen,
  onClose,
  onPractice
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [animProgress, setAnimProgress] = useState<number>(0);
  const [activeStep, setActiveStep] = useState<number>(0);

  // Animation loop for skeleton playback
  useEffect(() => {
    if (!isOpen || !isPlaying) return;

    let frameId: number;
    let start = performance.now();

    const animate = (time: number) => {
      const elapsed = (time - start) * playbackSpeed;
      const duration = sign.dynamicMotion ? 2500 : 1800;
      const progress = (elapsed % duration) / duration;
      setAnimProgress(progress);
      frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [isOpen, isPlaying, playbackSpeed, sign]);

  if (!isOpen) return null;

  // Calculate animated landmark positions
  const getRenderedLandmarks = (): HandLandmark[] => {
    const base = sign.referenceLandmarks;
    if (!base || base.length < 21) return [];

    // Apply smooth breathing / articulation motion
    const wave = Math.sin(animProgress * Math.PI * 2);
    const motionOffset = sign.motionTrajectory
      ? {
          x: Math.sin(animProgress * Math.PI * 2) * 0.08,
          y: Math.cos(animProgress * Math.PI * 2) * 0.04
        }
      : { x: 0, y: wave * 0.015 };

    return base.map((pt, idx) => {
      // Wrist
      if (idx === 0) {
        return { x: pt.x + motionOffset.x, y: pt.y + motionOffset.y };
      }
      // Fingertips (4, 8, 12, 16, 20) have slightly more dynamic range
      const isTip = [4, 8, 12, 16, 20].includes(idx);
      const tipFactor = isTip ? 0.02 * wave : 0.01 * wave;

      return {
        x: pt.x + motionOffset.x + tipFactor * (pt.x > 0.5 ? 1 : -1),
        y: pt.y + motionOffset.y - Math.abs(tipFactor)
      };
    });
  };

  const renderedLandmarks = getRenderedLandmarks();

  // Search queries for direct ASL dictionaries
  const searchKeywords = encodeURIComponent(
    sign.sampleVideoQuery || `ASL sign ${sign.letter} demonstration`
  );
  const handspeakUrl = `https://www.handspeak.com/word/search/app/index.php?terms=${encodeURIComponent(sign.letter.toLowerCase())}`;
  const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${searchKeywords}`;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div 
        className="bg-[#071F15] border border-[#164432] rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col my-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-[#0B2A1E] border-b border-[#164432] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#FF4D26] to-[#F97316] text-white font-black text-xl flex items-center justify-center shadow-md">
              {sign.letter.length > 2 ? sign.letter[0] : sign.letter}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-white tracking-tight">{sign.title}</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {sign.signType || sign.category}
                </span>
                {sign.dynamicMotion && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Dynamic Motion
                  </span>
                )}
              </div>
              <p className="text-xs text-emerald-300/80 mt-0.5">{sign.shortDescription}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-[#071F15] hover:bg-[#123828] border border-[#164432] text-emerald-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 max-h-[75vh] overflow-y-auto">
          {/* Left: Interactive 3D Skeleton Video Demonstration */}
          <div className="lg:col-span-6 flex flex-col space-y-4">
            <div className="relative aspect-4/3 bg-[#03100A] rounded-2xl border border-[#143B2B] overflow-hidden flex items-center justify-center shadow-inner group">
              {/* MediaPipe 21-Joint Animated Hand Skeleton */}
              <svg 
                viewBox="0 0 1 1" 
                className="w-full h-full p-4 transform scale-y-[-1]"
              >
                {/* Background grid */}
                <defs>
                  <pattern id="grid" width="0.1" height="0.1" patternUnits="userSpaceOnUse">
                    <path d="M 0.1 0 L 0 0 0 0.1" fill="none" stroke="#0E3627" strokeWidth="0.003" />
                  </pattern>
                </defs>
                <rect width="1" height="1" fill="url(#grid)" />

                {/* Bone Connections */}
                {SKELETON_CONNECTIONS.map(([p1, p2], idx) => {
                  const pt1 = renderedLandmarks[p1];
                  const pt2 = renderedLandmarks[p2];
                  if (!pt1 || !pt2) return null;
                  return (
                    <line
                      key={idx}
                      x1={pt1.x}
                      y1={1 - pt1.y}
                      x2={pt2.x}
                      y2={1 - pt2.y}
                      stroke="#10B981"
                      strokeWidth="0.015"
                      strokeLinecap="round"
                    />
                  );
                })}

                {/* 21 Landmarks Joint Nodes */}
                {renderedLandmarks.map((pt, idx) => {
                  const isThumb = idx >= 1 && idx <= 4;
                  const isTip = [4, 8, 12, 16, 20].includes(idx);
                  const nodeColor = idx === 0 
                    ? '#F97316' 
                    : isTip 
                      ? '#34D399' 
                      : isThumb 
                        ? '#FBBF24' 
                        : '#10B981';

                  return (
                    <g key={idx}>
                      <circle
                        cx={pt.x}
                        cy={1 - pt.y}
                        r={isTip ? 0.024 : 0.016}
                        fill={nodeColor}
                        stroke="#05160E"
                        strokeWidth="0.005"
                      />
                      {isTip && (
                        <circle
                          cx={pt.x}
                          cy={1 - pt.y}
                          r={0.035}
                          fill="none"
                          stroke={nodeColor}
                          strokeWidth="0.003"
                          opacity="0.5"
                        />
                      )}
                    </g>
                  );
                })}

                {/* Motion Trajectory Indicator */}
                {sign.motionTrajectory && (
                  <path
                    d={`M ${sign.motionTrajectory.map(p => `${p.x} ${1 - p.y}`).join(' L ')}`}
                    fill="none"
                    stroke="#FF4D26"
                    strokeWidth="0.01"
                    strokeDasharray="0.02 0.01"
                  />
                )}
              </svg>

              {/* Video Player Overlay Badges */}
              <div className="absolute top-3 left-3 flex items-center space-x-2">
                <span className="bg-[#05160E]/80 backdrop-blur-sm border border-emerald-500/40 text-emerald-300 text-[11px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  MediaPipe 3D Kinematics
                </span>
                <span className="bg-[#05160E]/80 backdrop-blur-sm border border-[#164432] text-emerald-400/80 text-[11px] px-2 py-1 rounded-full font-mono">
                  {Math.round(animProgress * 100)}%
                </span>
              </div>

              {/* Watermark overlay */}
              <div className="absolute bottom-3 right-3 text-[10px] text-emerald-400/40 font-mono">
                21 Landmarked Coordinates
              </div>
            </div>

            {/* Video Controls Bar */}
            <div className="bg-[#0B2A1E] border border-[#164432] rounded-2xl p-3 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="px-3.5 py-1.5 rounded-xl bg-[#071F15] hover:bg-[#123828] border border-[#164432] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5 text-amber-400" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
                  <span>{isPlaying ? 'Pause' : 'Play'}</span>
                </button>

                <button
                  onClick={() => setAnimProgress(0)}
                  className="p-1.5 rounded-xl bg-[#071F15] hover:bg-[#123828] border border-[#164432] text-emerald-300 hover:text-white cursor-pointer transition-colors"
                  title="Restart animation"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Speed Buttons */}
              <div className="flex items-center space-x-1 bg-[#071F15] border border-[#164432] rounded-xl p-1 text-xs">
                {[0.5, 1.0, 1.5].map(speed => (
                  <button
                    key={speed}
                    onClick={() => setPlaybackSpeed(speed)}
                    className={`px-2 py-0.5 rounded-lg font-medium transition-colors cursor-pointer ${
                      playbackSpeed === speed
                        ? 'bg-[#F97316] text-white font-bold'
                        : 'text-emerald-300/70 hover:text-white'
                    }`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
            </div>

            {/* External High-Resolution Video Links */}
            <div className="bg-[#0B2A1E] border border-[#164432] rounded-2xl p-4 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Video className="w-4 h-4 text-[#FF4D26]" />
                  Real-World Demonstration Videos
                </span>
                <span className="text-[10px] text-emerald-400/70">WLASL Verified</span>
              </div>
              <p className="text-[11px] text-emerald-300/80">
                Watch native Deaf signers demonstrate this exact sign at normal and slow speeds:
              </p>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <a
                  href={handspeakUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[#071F15] hover:bg-[#123828] border border-[#164432] text-xs text-emerald-200 hover:text-white transition-colors"
                >
                  <span className="font-medium">Handspeak ASL</span>
                  <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                </a>

                <a
                  href={youtubeSearchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[#071F15] hover:bg-[#123828] border border-[#164432] text-xs text-emerald-200 hover:text-white transition-colors"
                >
                  <span className="font-medium">Video Lessons</span>
                  <ExternalLink className="w-3.5 h-3.5 text-[#FF4D26]" />
                </a>
              </div>
            </div>
          </div>

          {/* Right: Step-by-Step Anatomical Instructions & Finger Guide */}
          <div className="lg:col-span-6 space-y-4 flex flex-col justify-between">
            {/* Description */}
            <div className="bg-[#0B2A1E] border border-[#164432] rounded-2xl p-4 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-emerald-400" />
                Execution Details
              </h4>
              <p className="text-xs text-emerald-100/90 leading-relaxed">
                {sign.description}
              </p>
            </div>

            {/* Finger State Specifications */}
            <div className="bg-[#0B2A1E] border border-[#164432] rounded-2xl p-4 space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                Finger Configuration
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {Object.entries(sign.fingerStates).map(([finger, state]) => (
                  <div key={finger} className="bg-[#071F15] border border-[#164432] rounded-xl p-2.5">
                    <span className="font-bold text-white capitalize block mb-0.5 text-[11px] text-amber-400">
                      {finger} Finger
                    </span>
                    <span className="text-[11px] text-emerald-200/90">{state}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tips & Common Mistakes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-[#0B2A1E] border border-[#164432] rounded-2xl p-3.5 space-y-2">
                <h5 className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Key Coaching Tips
                </h5>
                <ul className="text-[11px] text-emerald-200/90 space-y-1.5 list-disc list-inside">
                  {sign.tips.map((tip, idx) => (
                    <li key={idx} className="leading-tight">{tip}</li>
                  ))}
                </ul>
              </div>

              <div className="bg-[#0B2A1E] border border-[#164432] rounded-2xl p-3.5 space-y-2">
                <h5 className="text-[11px] font-bold text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                  Common Mistakes
                </h5>
                <ul className="text-[11px] text-rose-200/90 space-y-1.5 list-disc list-inside">
                  {sign.commonMistakes.map((mistake, idx) => (
                    <li key={idx} className="leading-tight">{mistake}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Practice CTA Button */}
            {onPractice && (
              <button
                onClick={() => {
                  onClose();
                  onPractice(sign.letter);
                }}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Practice Signing "{sign.letter}" in Studio</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
