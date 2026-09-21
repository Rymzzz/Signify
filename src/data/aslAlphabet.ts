import { ASLSign, HandLandmark } from '../types/index';

// 21 MediaPipe hand landmarks:
// 0: Wrist
// 1-4: Thumb (CMC, MCP, IP, Tip)
// 5-8: Index (MCP, PIP, DIP, Tip)
// 9-12: Middle (MCP, PIP, DIP, Tip)
// 13-16: Ring (MCP, PIP, DIP, Tip)
// 17-20: Pinky (MCP, PIP, DIP, Tip)

function createLandmarks(config: {
  thumb: { x: number; y: number }[]; // 4 points (1, 2, 3, 4)
  index: { x: number; y: number }[]; // 4 points (5, 6, 7, 8)
  middle: { x: number; y: number }[]; // 4 points (9, 10, 11, 12)
  ring: { x: number; y: number }[]; // 4 points (13, 14, 15, 16)
  pinky: { x: number; y: number }[]; // 4 points (17, 18, 19, 20)
  wrist?: { x: number; y: number };
}): HandLandmark[] {
  const points: HandLandmark[] = [];
  points.push(config.wrist || { x: 0.5, y: 0.85 });
  points.push(...config.thumb);
  points.push(...config.index);
  points.push(...config.middle);
  points.push(...config.ring);
  points.push(...config.pinky);
  return points;
}

// Parametric landmark builder for standard finger extension/curls
function generateLandmarks(config: {
  thumbExt: number; // 0 (curled) to 1 (straight)
  thumbAngle?: number; // radians offset
  thumbAcross?: boolean;
  thumbTuckedUnder?: 'index' | 'middle' | 'ring';
  thumbUnderFingersE?: boolean;
  isC?: boolean;
  isO?: boolean;
  indexExt: number;
  middleExt: number;
  ringExt: number;
  pinkyExt: number;
  spread?: number;
  indexHooked?: boolean;
  crossedRM?: boolean;
  orientation?: 'UPRIGHT' | 'HORIZONTAL' | 'DOWNWARD';
}): HandLandmark[] {
  const points: HandLandmark[] = [];
  const wrist = { x: 0.5, y: 0.84 };
  points.push(wrist);

  const spread = config.spread || 0.08;
  const isHoriz = config.orientation === 'HORIZONTAL';
  const isDown = config.orientation === 'DOWNWARD';

  // 1-4 Thumb
  if (config.isC) {
    // C: Lower crescent of C
    points.push({ x: 0.44, y: 0.77 });
    points.push({ x: 0.38, y: 0.73 });
    points.push({ x: 0.32, y: 0.68 });
    points.push({ x: 0.30, y: 0.63 });
  } else if (config.isO) {
    // O: Thumb arches up to meet fingertips in a circle
    points.push({ x: 0.44, y: 0.76 });
    points.push({ x: 0.38, y: 0.68 });
    points.push({ x: 0.35, y: 0.58 });
    points.push({ x: 0.38, y: 0.49 });
  } else if (config.thumbUnderFingersE) {
    // E: Thumb folded horizontally underneath curled fingertips
    points.push({ x: 0.44, y: 0.76 });
    points.push({ x: 0.40, y: 0.68 });
    points.push({ x: 0.38, y: 0.61 });
    points.push({ x: 0.42, y: 0.57 });
  } else if (config.thumbAcross) {
    points.push({ x: 0.45, y: 0.76 });
    points.push({ x: 0.42, y: 0.69 });
    points.push({ x: 0.46, y: 0.64 });
    points.push({ x: 0.52, y: 0.62 }); // Thumb tip crossing fingers
  } else if (config.thumbTuckedUnder === 'index') {
    // T: thumb under index
    points.push({ x: 0.44, y: 0.76 });
    points.push({ x: 0.42, y: 0.68 });
    points.push({ x: 0.43, y: 0.60 });
    points.push({ x: 0.44, y: 0.55 });
  } else if (config.thumbTuckedUnder === 'ring') {
    // M: thumb under 3 fingers
    points.push({ x: 0.45, y: 0.76 });
    points.push({ x: 0.45, y: 0.67 });
    points.push({ x: 0.49, y: 0.59 });
    points.push({ x: 0.54, y: 0.55 });
  } else if (config.thumbTuckedUnder === 'middle') {
    // N: thumb under 2 fingers
    points.push({ x: 0.45, y: 0.76 });
    points.push({ x: 0.44, y: 0.67 });
    points.push({ x: 0.47, y: 0.60 });
    points.push({ x: 0.49, y: 0.56 });
  } else {
    const tAngle = config.thumbAngle !== undefined ? config.thumbAngle : -0.3;
    const tLen = 0.06 * config.thumbExt + 0.04;
    points.push({ x: 0.44, y: 0.77 });
    points.push({ x: 0.38 + tAngle * 0.05, y: 0.70 });
    points.push({ x: 0.34 + tAngle * 0.08, y: 0.63 - tLen * 0.5 });
    points.push({ x: 0.31 + tAngle * 0.12, y: 0.58 - tLen });
  }

  // Fingers configuration
  const fingerConfigs = [
    { baseIdx: 5, mcpX: 0.42, ext: config.indexExt, angle: -spread * 1.2, isHooked: config.indexHooked },
    { baseIdx: 9, mcpX: 0.49, ext: config.middleExt, angle: -spread * 0.2 },
    { baseIdx: 13, mcpX: 0.56, ext: config.ringExt, angle: spread * 0.3 },
    { baseIdx: 17, mcpX: 0.62, ext: config.pinkyExt, angle: spread * 1.1 },
  ];

  fingerConfigs.forEach((f, idx) => {
    const mcpY = 0.52;
    points.push({ x: f.mcpX, y: mcpY }); // MCP

    if (isHoriz && (idx === 0 || (idx === 1 && f.ext > 0.5))) {
      // Horizontal pointing (G, H)
      const forwardLen = 0.18 * f.ext;
      points.push({ x: f.mcpX - 0.06, y: mcpY });
      points.push({ x: f.mcpX - 0.12, y: mcpY });
      points.push({ x: f.mcpX - forwardLen, y: mcpY });
      return;
    }

    if (isDown && f.ext > 0.5) {
      // Downward pointing (P, Q)
      points.push({ x: f.mcpX, y: mcpY + 0.07 });
      points.push({ x: f.mcpX, y: mcpY + 0.14 });
      points.push({ x: f.mcpX, y: mcpY + 0.21 });
      return;
    }

    if (config.isC) {
      // C: Upper crescent of C - fingers curve forward and arch above thumb
      points.push({ x: f.mcpX - 0.03, y: 0.42 });
      points.push({ x: f.mcpX - 0.07, y: 0.41 });
      points.push({ x: f.mcpX - 0.10, y: 0.45 });
      return;
    }

    if (config.isO) {
      // O: Fingertips curve forward to meet thumb tip in a circle
      points.push({ x: f.mcpX - 0.03, y: 0.44 });
      points.push({ x: f.mcpX - 0.06, y: 0.46 });
      points.push({ x: 0.38 + idx * 0.015, y: 0.49 });
      return;
    }

    if (config.thumbUnderFingersE) {
      // E: Fingertips tucked straight down, resting on/above thumb
      points.push({ x: f.mcpX, y: 0.46 });
      points.push({ x: f.mcpX, y: 0.50 });
      points.push({ x: f.mcpX, y: 0.54 });
      return;
    }

    if (config.crossedRM && idx === 0) {
      // Crossed fingers (R): Index leans across middle finger
      points.push({ x: 0.44, y: 0.43 });
      points.push({ x: 0.47, y: 0.34 });
      points.push({ x: 0.50, y: 0.25 });
      return;
    }
    if (config.crossedRM && idx === 1) {
      // Middle finger straight behind index
      points.push({ x: 0.48, y: 0.43 });
      points.push({ x: 0.46, y: 0.34 });
      points.push({ x: 0.45, y: 0.25 });
      return;
    }

    if (f.isHooked) {
      // X: Index finger hooked
      points.push({ x: 0.42, y: 0.44 });
      points.push({ x: 0.43, y: 0.41 });
      points.push({ x: 0.45, y: 0.46 });
      return;
    }

    const pipLen = 0.08 * f.ext + 0.03 * (1 - f.ext);
    const dipLen = 0.07 * f.ext + 0.025 * (1 - f.ext);
    const tipLen = 0.06 * f.ext + 0.02 * (1 - f.ext);

    const curlDirection = f.ext > 0.4 ? -1 : 0.8;
    const pX1 = f.mcpX + Math.sin(f.angle) * pipLen;
    const pY1 = mcpY - Math.cos(f.angle) * pipLen;
    points.push({ x: pX1, y: pY1 }); // PIP

    const pX2 = pX1 + Math.sin(f.angle) * dipLen;
    const pY2 = pY1 + (curlDirection * Math.cos(f.angle) * dipLen);
    points.push({ x: pX2, y: pY2 }); // DIP

    const pX3 = pX2 + Math.sin(f.angle) * tipLen;
    const pY3 = pY2 + (curlDirection * Math.cos(f.angle) * tipLen);
    points.push({ x: pX3, y: pY3 }); // Tip
  });

  return points;
}

export const ASL_ALPHABET: ASLSign[] = [
  // --- CHAPTER 1: Letters A through E ---
  {
    id: 'sign-a',
    letter: 'A',
    title: 'Fist with Thumb Alongside',
    shortDescription: 'Fist with Thumb Alongside',
    category: 'vowel',
    difficulty: 'Beginner',
    description: 'Make a fist with your four fingers curled tight into your palm. Keep your thumb resting straight alongside the index finger pointing upwards.',
    fingerStates: {
      thumb: 'Upright alongside index finger',
      index: 'Curled closed into palm',
      middle: 'Curled closed into palm',
      ring: 'Curled closed into palm',
      pinky: 'Curled closed into palm',
    },
    tips: [
      'Keep thumb strictly beside the index finger, not across the knuckles.',
      'Ensure all four fingers are curled firmly into the palm.',
      'Maintain palm facing forward toward the camera.',
    ],
    commonMistakes: [
      'Crossing thumb over the front of fingers (that forms "S").',
      'Leaving index finger loose or partially open.',
    ],
    referenceLandmarks: generateLandmarks({
      thumbExt: 0.85,
      thumbAngle: -0.1,
      indexExt: 0.1,
      middleExt: 0.1,
      ringExt: 0.1,
      pinkyExt: 0.1,
    }),
  },
  {
    id: 'sign-b',
    letter: 'B',
    title: 'Flat Hand, Thumb Across Palm',
    shortDescription: 'Flat Open Palm with Tucked Thumb',
    category: 'consonant',
    difficulty: 'Beginner',
    description: 'Hold your four fingers completely straight and pressed together pointing upwards. Fold your thumb across your palm.',
    fingerStates: {
      thumb: 'Tucked across the palm',
      index: 'Straight upright together',
      middle: 'Straight upright together',
      ring: 'Straight upright together',
      pinky: 'Straight upright together',
    },
    tips: [
      'Keep four fingers upright with no gaps between them.',
      'Fold thumb flat across the palm, not sticking out.',
      'Keep wrist straight and hand vertical.',
    ],
    commonMistakes: [
      'Spreading fingers apart (keep them tightly pressed together).',
      'Leaving thumb sticking out to the side.',
    ],
    referenceLandmarks: generateLandmarks({
      thumbExt: 0.2,
      thumbAngle: 0.3,
      indexExt: 1.0,
      middleExt: 1.0,
      ringExt: 1.0,
      pinkyExt: 1.0,
      spread: 0.02,
    }),
  },
  {
    id: 'sign-c',
    letter: 'C',
    title: 'Curved Hand forming "C"',
    shortDescription: 'Curved C-Shape Hand',
    category: 'consonant',
    difficulty: 'Beginner',
    description: 'Curve your fingers and thumb to form the shape of the letter "C". View from the side shows a clear open crescent.',
    fingerStates: {
      thumb: 'Curved upward forming bottom of C',
      index: 'Curved downward forming top of C',
      middle: 'Curved alongside index',
      ring: 'Curved alongside index',
      pinky: 'Curved alongside index',
    },
    tips: [
      'Arch your fingers smoothly into an open semicircle.',
      'Maintain an even opening between thumb and fingertips.',
    ],
    commonMistakes: [
      'Closing thumb and fingers into an "O".',
      'Flattening fingers instead of maintaining a curve.',
    ],
    referenceLandmarks: generateLandmarks({
      thumbExt: 0.6,
      indexExt: 0.6,
      middleExt: 0.6,
      ringExt: 0.6,
      pinkyExt: 0.6,
      isC: true,
    }),
  },
  {
    id: 'sign-d',
    letter: 'D',
    title: 'Index Up, Fingertips on Thumb',
    shortDescription: 'Index Pointing Up, Fingertips Touching Thumb',
    category: 'consonant',
    difficulty: 'Beginner',
    description: 'Point your index finger straight up. Touch your middle, ring, and pinky fingertips to the tip of your thumb to form an "O" shape at the base.',
    fingerStates: {
      thumb: 'Touches middle and ring fingertips',
      index: 'Points straight upright',
      middle: 'Curled to touch thumb',
      ring: 'Curled to touch thumb',
      pinky: 'Curled to touch thumb',
    },
    tips: [
      'Ensure index finger is strictly upright and vertical.',
      'Thumb and other three fingers form a round loop.',
    ],
    commonMistakes: [
      'Letting middle finger extend alongside index (forms "K" or "U").',
    ],
    referenceLandmarks: generateLandmarks({
      thumbExt: 0.35,
      thumbAngle: 0.25,
      indexExt: 1.0,
      middleExt: 0.25,
      ringExt: 0.2,
      pinkyExt: 0.2,
    }),
  },
  {
    id: 'sign-e',
    letter: 'E',
    title: 'Fingers Curled, Thumb Tucked Under',
    shortDescription: 'All Fingers Curled Inward',
    category: 'vowel',
    difficulty: 'Beginner',
    description: 'Curl all four fingertips tightly downward toward the palm. Tuck your thumb horizontally across your palm beneath the fingertips.',
    fingerStates: {
      thumb: 'Folded horizontally under fingertips',
      index: 'Curled down at PIP and DIP joints',
      middle: 'Curled down at PIP and DIP joints',
      ring: 'Curled down at PIP and DIP joints',
      pinky: 'Curled down at PIP and DIP joints',
    },
    tips: [
      'Rest the tips of your curled fingers directly onto or above the thumb.',
      'Fingertips curl in with knuckles exposed.',
    ],
    commonMistakes: [
      'Clenching into a standard fist (E requires knuckles prominent with fingertips resting on thumb).',
    ],
    referenceLandmarks: generateLandmarks({
      thumbExt: 0.35,
      indexExt: 0.2,
      middleExt: 0.2,
      ringExt: 0.2,
      pinkyExt: 0.2,
      thumbUnderFingersE: true,
    }),
  },

  // --- CHAPTER 2: Letters F through J ---
  {
    id: 'sign-f',
    letter: 'F',
    title: 'Index and Thumb Pinch (OK Sign)',
    shortDescription: 'Index & Thumb Touching (OK sign)',
    category: 'consonant',
    difficulty: 'Beginner',
    description: 'Touch your index finger and thumb tips together in a circle, and extend your middle, ring, and pinky fingers straight up and spread.',
    fingerStates: {
      thumb: 'Pinches tip of index finger',
      index: 'Pinches tip of thumb',
      middle: 'Extended straight up',
      ring: 'Extended straight up',
      pinky: 'Extended straight up',
    },
    tips: [
      'Spread the three upright fingers slightly apart.',
      'Make sure index and thumb form a clear circular loop.',
    ],
    commonMistakes: [
      'Confusing with "D" (in D, only index is upright; in F, the other 3 fingers are upright).',
    ],
    referenceLandmarks: generateLandmarks({
      thumbExt: 0.4,
      thumbAngle: 0.1,
      indexExt: 0.3,
      middleExt: 1.0,
      ringExt: 1.0,
      pinkyExt: 1.0,
      spread: 0.07,
    }),
  },
  {
    id: 'sign-g',
    letter: 'G',
    title: 'Index and Thumb Parallel Horizontal',
    shortDescription: 'Index & Thumb Parallel Horizontal',
    category: 'consonant',
    difficulty: 'Intermediate',
    description: 'Point your index finger horizontally forward/sideways with your thumb held parallel just below it. Curl middle, ring, and pinky tight.',
    fingerStates: {
      thumb: 'Extended parallel to index finger',
      index: 'Extended horizontally',
      middle: 'Curled into palm',
      ring: 'Curled into palm',
      pinky: 'Curled into palm',
    },
    tips: [
      'Hold index finger and thumb horizontal, parallel like a small caliper.',
      'Keep other three fingers tucked securely in.',
    ],
    commonMistakes: [
      'Pointing index finger vertically (that is "L").',
    ],
    referenceLandmarks: generateLandmarks({
      thumbExt: 0.7,
      thumbAngle: -0.2,
      indexExt: 0.9,
      middleExt: 0.1,
      ringExt: 0.1,
      pinkyExt: 0.1,
      orientation: 'HORIZONTAL',
    }),
  },
  {
    id: 'sign-h',
    letter: 'H',
    title: 'Two Fingers Horizontal Parallel',
    shortDescription: 'Index & Middle Parallel Horizontal',
    category: 'consonant',
    difficulty: 'Intermediate',
    description: 'Extend both index and middle fingers horizontally side-by-side pressed together. Thumb tucks over the ring and pinky fingers.',
    fingerStates: {
      thumb: 'Resting over ring finger',
      index: 'Extended horizontally forward',
      middle: 'Extended horizontally forward alongside index',
      ring: 'Curled into palm',
      pinky: 'Curled into palm',
    },
    tips: [
      'Index and middle fingers remain tightly together pointing sideways.',
      'Ring and pinky fingers remain folded into palm.',
    ],
    commonMistakes: [
      'Spreading index and middle fingers apart.',
      'Holding fingers vertically (that is "U").',
    ],
    referenceLandmarks: generateLandmarks({
      thumbExt: 0.3,
      thumbAngle: 0.1,
      indexExt: 0.9,
      middleExt: 0.9,
      ringExt: 0.1,
      pinkyExt: 0.1,
      orientation: 'HORIZONTAL',
    }),
  },
  {
    id: 'sign-i',
    letter: 'I',
    title: 'Pinky Finger Straight Up',
    shortDescription: 'Pinky Finger Extended Upright',
    category: 'vowel',
    difficulty: 'Beginner',
    description: 'Make a fist with your thumb resting across your index, middle, and ring fingers. Extend only your pinky finger straight up.',
    fingerStates: {
      thumb: 'Folds over curled index, middle, and ring',
      index: 'Curled closed into palm',
      middle: 'Curled closed into palm',
      ring: 'Curled closed into palm',
      pinky: 'Straight upright',
    },
    tips: [
      'Keep pinky finger completely upright and straight.',
      'Thumb stays clamped firmly over the other three curled fingers.',
    ],
    commonMistakes: [
      'Extending thumb (that forms "Y").',
    ],
    referenceLandmarks: generateLandmarks({
      thumbExt: 0.2,
      thumbAcross: true,
      indexExt: 0.1,
      middleExt: 0.1,
      ringExt: 0.1,
      pinkyExt: 1.0,
    }),
  },
  {
    id: 'sign-j',
    letter: 'J',
    title: 'Pinky Tracing J-Curve Stroke',
    shortDescription: 'Pinky Tracing J-Curve Stroke',
    category: 'complex',
    difficulty: 'Intermediate',
    description: 'Hold the "I" handshape (pinky upright), then rotate your wrist downward and curve your pinky in the shape of the letter "J".',
    fingerStates: {
      thumb: 'Clamps curled fingers',
      index: 'Curled into palm',
      middle: 'Curled into palm',
      ring: 'Curled into palm',
      pinky: 'Extended and angled/hooked inward',
    },
    tips: [
      'Start with pinky up, then dip downward and curve back up.',
      'Maintain the pinky extension throughout the gesture.',
    ],
    commonMistakes: [
      'Moving the whole arm instead of rotating the wrist.',
    ],
    referenceLandmarks: generateLandmarks({
      thumbExt: 0.25,
      thumbAcross: true,
      indexExt: 0.1,
      middleExt: 0.1,
      ringExt: 0.1,
      pinkyExt: 0.85,
      spread: 0.05,
    }),
  },

  // --- CHAPTER 3: Letters K through O ---
  {
    id: 'sign-k',
    letter: 'K',
    title: 'Index Up, Middle Angled, Thumb Between',
    shortDescription: 'Index Up, Middle Angled, Thumb Between',
    category: 'consonant',
    difficulty: 'Intermediate',
    description: 'Index finger straight up, middle finger angled forward at ~45 degrees. Thumb rests on the middle finger joint between them.',
    fingerStates: {
      thumb: 'Points up touching middle finger knuckle',
      index: 'Extended straight up',
      middle: 'Extended forward/up at 45 degrees',
      ring: 'Curled into palm',
      pinky: 'Curled into palm',
    },
    tips: [
      'Position thumb tip securely against the second joint of middle finger.',
      'Ring and pinky remain curled firmly against the palm.',
    ],
    commonMistakes: [
      'Extending middle finger straight up (forms "V").',
    ],
    referenceLandmarks: generateLandmarks({
      thumbExt: 0.6,
      thumbAngle: 0.0,
      indexExt: 1.0,
      middleExt: 0.75,
      ringExt: 0.1,
      pinkyExt: 0.1,
      spread: 0.08,
    }),
  },
  {
    id: 'sign-l',
    letter: 'L',
    title: 'Index Up, Thumb Out 90° (L-Shape)',
    shortDescription: 'Index Up, Thumb Out 90° (L-Shape)',
    category: 'consonant',
    difficulty: 'Beginner',
    description: 'Point your index finger straight up and extend your thumb outward horizontally at a 90-degree angle to form an "L". Curl other fingers.',
    fingerStates: {
      thumb: 'Extended horizontally at 90 degrees',
      index: 'Extended straight upright',
      middle: 'Curled into palm',
      ring: 'Curled into palm',
      pinky: 'Curled into palm',
    },
    tips: [
      'Make a clear 90-degree right angle between thumb and index.',
      'Curl the other three fingers flat against your palm.',
    ],
    commonMistakes: [
      'Holding thumb too close to palm.',
    ],
    referenceLandmarks: generateLandmarks({
      thumbExt: 1.0,
      thumbAngle: -0.6,
      indexExt: 1.0,
      middleExt: 0.1,
      ringExt: 0.1,
      pinkyExt: 0.1,
    }),
  },
  {
    id: 'sign-m',
    letter: 'M',
    title: 'Thumb Under Three Fingers',
    shortDescription: 'Thumb Tucked Under Three Fingers',
    category: 'consonant',
    difficulty: 'Intermediate',
    description: 'Fold your thumb under your index, middle, and ring fingers. The tips of these three fingers fold over the top of the thumb.',
    fingerStates: {
      thumb: 'Tucked beneath index, middle, and ring',
      index: 'Folded over thumb',
      middle: 'Folded over thumb',
      ring: 'Folded over thumb',
      pinky: 'Curled into palm beside thumb',
    },
    tips: [
      'Count 3 fingers draped over the thumb: index, middle, ring.',
      'Pinky curls next to the thumb at the bottom.',
    ],
    commonMistakes: [
      'Draping only 2 fingers (that is "N").',
    ],
    referenceLandmarks: generateLandmarks({
      thumbExt: 0.4,
      thumbTuckedUnder: 'ring',
      indexExt: 0.2,
      middleExt: 0.2,
      ringExt: 0.2,
      pinkyExt: 0.1,
    }),
  },
  {
    id: 'sign-n',
    letter: 'N',
    title: 'Thumb Under Two Fingers',
    shortDescription: 'Thumb Tucked Under Two Fingers',
    category: 'consonant',
    difficulty: 'Intermediate',
    description: 'Fold your thumb under your index and middle fingers only. The tips of these two fingers drape over the top of the thumb.',
    fingerStates: {
      thumb: 'Tucked beneath index and middle',
      index: 'Folded over thumb',
      middle: 'Folded over thumb',
      ring: 'Curled into palm',
      pinky: 'Curled into palm',
    },
    tips: [
      'Count 2 fingers draped over the thumb: index and middle.',
      'Ring and pinky stay curled beside the thumb.',
    ],
    commonMistakes: [
      'Draping three fingers (that is "M") or only one (that is "T").',
    ],
    referenceLandmarks: generateLandmarks({
      thumbExt: 0.35,
      thumbTuckedUnder: 'middle',
      indexExt: 0.2,
      middleExt: 0.2,
      ringExt: 0.1,
      pinkyExt: 0.1,
    }),
  },
  {
    id: 'sign-o',
    letter: 'O',
    title: 'All Fingertips Touching Thumb (O-Shape)',
    shortDescription: 'All Fingertips Touching Thumb (O-Shape)',
    category: 'vowel',
    difficulty: 'Beginner',
    description: 'Curve all fingers and thumb so that all fingertips meet the tip of the thumb, forming a complete circular "O" opening.',
    fingerStates: {
      thumb: 'Meets fingertips in a circle',
      index: 'Curved to touch thumb tip',
      middle: 'Curved to touch thumb tip',
      ring: 'Curved to touch thumb tip',
      pinky: 'Curved to touch thumb tip',
    },
    tips: [
      'Make a smooth, round circle with thumb and fingers.',
      'View from front or side reveals a clear round tunnel.',
    ],
    commonMistakes: [
      'Leaving gap between fingers and thumb (forms "C").',
    ],
    referenceLandmarks: generateLandmarks({
      thumbExt: 0.45,
      indexExt: 0.3,
      middleExt: 0.3,
      ringExt: 0.3,
      pinkyExt: 0.3,
      isO: true,
    }),
  },

  // --- CHAPTER 4: Letters P through T ---
  {
    id: 'sign-p',
    letter: 'P',
    title: 'Index Forward, Middle Down, Thumb Between',
    shortDescription: 'Index Forward, Middle Down, Thumb Between',
    category: 'consonant',
    difficulty: 'Intermediate',
    description: 'Similar to the "K" handshape, but tilted downwards. Index finger points forward, middle finger points straight down, thumb rests between them.',
    fingerStates: {
      thumb: 'Supports middle knuckle',
      index: 'Pointing forward / horizontal',
      middle: 'Pointing downwards',
      ring: 'Curled into palm',
      pinky: 'Curled into palm',
    },
    tips: [
      'Tilt wrist so index points forward and middle drops down.',
      'Thumb stays placed between index and middle knuckles.',
    ],
    commonMistakes: [
      'Holding upright (an upright "P" is "K").',
    ],
    referenceLandmarks: generateLandmarks({
      thumbExt: 0.6,
      thumbAngle: 0.0,
      indexExt: 0.8,
      middleExt: 0.8,
      ringExt: 0.1,
      pinkyExt: 0.1,
      orientation: 'DOWNWARD',
    }),
  },
  {
    id: 'sign-q',
    letter: 'Q',
    title: 'Index and Thumb Pointing Downward',
    shortDescription: 'Index & Thumb Pointing Downward',
    category: 'consonant',
    difficulty: 'Intermediate',
    description: 'Similar to the "G" handshape, but pointed downwards. Index finger and thumb point downwards parallel like a small claw or caliper.',
    fingerStates: {
      thumb: 'Pointing downward parallel to index',
      index: 'Pointing downward',
      middle: 'Curled into palm',
      ring: 'Curled into palm',
      pinky: 'Curled into palm',
    },
    tips: [
      'Direct index and thumb straight downward towards the floor.',
      'Maintain small gap between index and thumb.',
    ],
    commonMistakes: [
      'Holding sideways (sideways is "G").',
    ],
    referenceLandmarks: generateLandmarks({
      thumbExt: 0.6,
      thumbAngle: -0.2,
      indexExt: 0.8,
      middleExt: 0.1,
      ringExt: 0.1,
      pinkyExt: 0.1,
      orientation: 'DOWNWARD',
    }),
  },
  {
    id: 'sign-r',
    letter: 'R',
    title: 'Index and Middle Fingers Crossed',
    shortDescription: 'Index and Middle Crossed Over',
    category: 'consonant',
    difficulty: 'Intermediate',
    description: 'Cross your index and middle fingers together upright ("crossing fingers for luck"). Fold thumb over ring and pinky fingers.',
    fingerStates: {
      thumb: 'Resting over ring finger',
      index: 'Extended upright crossed with middle',
      middle: 'Extended upright crossed behind index',
      ring: 'Curled into palm',
      pinky: 'Curled into palm',
    },
    tips: [
      'Cross middle finger tightly over or behind index finger.',
      'Keep fingers pointing straight upwards.',
    ],
    commonMistakes: [
      'Holding fingers side by side without crossing (forms "U").',
    ],
    referenceLandmarks: generateLandmarks({
      thumbExt: 0.3,
      thumbAngle: 0.2,
      indexExt: 1.0,
      middleExt: 1.0,
      ringExt: 0.1,
      pinkyExt: 0.1,
      crossedRM: true,
    }),
  },
  {
    id: 'sign-s',
    letter: 'S',
    title: 'Fist with Thumb Across Front',
    shortDescription: 'Fist with Thumb Across Front',
    category: 'consonant',
    difficulty: 'Beginner',
    description: 'Make a tight fist with all four fingers curled into the palm. Fold your thumb horizontally across the outside of all curled fingers.',
    fingerStates: {
      thumb: 'Folded across front of curled fingers',
      index: 'Curled into tight fist',
      middle: 'Curled into tight fist',
      ring: 'Curled into tight fist',
      pinky: 'Curled into tight fist',
    },
    tips: [
      'Wrap thumb across knuckles on the outside of the fist.',
      'Thumb wraps across index, middle, and ring fingers.',
    ],
    commonMistakes: [
      'Leaving thumb on the side alongside index (that is "A").',
    ],
    referenceLandmarks: generateLandmarks({
      thumbExt: 0.5,
      thumbAcross: true,
      indexExt: 0.1,
      middleExt: 0.1,
      ringExt: 0.1,
      pinkyExt: 0.1,
    }),
  },
  {
    id: 'sign-t',
    letter: 'T',
    title: 'Thumb Tucked Under Index Finger',
    shortDescription: 'Thumb Between Index and Middle',
    category: 'consonant',
    difficulty: 'Beginner',
    description: 'Make a fist with your thumb tucked directly between your index and middle fingers. The index finger curls over the top of the thumb.',
    fingerStates: {
      thumb: 'Poking up between index and middle knuckles',
      index: 'Curled over the thumb',
      middle: 'Curled beside thumb',
      ring: 'Curled into palm',
      pinky: 'Curled into palm',
    },
    tips: [
      'Only the index finger drapes over the thumb.',
      'Thumb tip peeks out between index and middle fingers.',
    ],
    commonMistakes: [
      'Draping two fingers over thumb (that forms "N").',
    ],
    referenceLandmarks: generateLandmarks({
      thumbExt: 0.35,
      thumbTuckedUnder: 'index',
      indexExt: 0.2,
      middleExt: 0.1,
      ringExt: 0.1,
      pinkyExt: 0.1,
    }),
  },

  // --- CHAPTER 5: Letters U through Z ---
  {
    id: 'sign-u',
    letter: 'U',
    title: 'Index and Middle Straight Up Together',
    shortDescription: 'Index & Middle Straight Up Together',
    category: 'vowel',
    difficulty: 'Beginner',
    description: 'Extend index and middle fingers straight up pressed tightly together. Ring and pinky are curled into palm, held down by thumb.',
    fingerStates: {
      thumb: 'Pins ring and pinky into palm',
      index: 'Straight upright pressed to middle',
      middle: 'Straight upright pressed to index',
      ring: 'Curled into palm',
      pinky: 'Curled into palm',
    },
    tips: [
      'Hold index and middle fingers completely parallel with zero gap.',
      'Thumb holds ring and pinky firmly.',
    ],
    commonMistakes: [
      'Spreading fingers apart (that forms "V").',
    ],
    referenceLandmarks: generateLandmarks({
      thumbExt: 0.2,
      thumbAngle: 0.2,
      indexExt: 1.0,
      middleExt: 1.0,
      ringExt: 0.1,
      pinkyExt: 0.1,
      spread: 0.02,
    }),
  },
  {
    id: 'sign-v',
    letter: 'V',
    title: 'Index and Middle Spread in "V"',
    shortDescription: 'Index & Middle Spread in V-Shape',
    category: 'consonant',
    difficulty: 'Beginner',
    description: 'Extend index and middle fingers straight up and spread apart in a "V" shape (peace sign). Thumb pins ring and pinky into palm.',
    fingerStates: {
      thumb: 'Pins ring and pinky into palm',
      index: 'Extended upright spread apart',
      middle: 'Extended upright spread apart',
      ring: 'Curled into palm',
      pinky: 'Curled into palm',
    },
    tips: [
      'Spread index and middle fingers into a clear "V".',
      'Hold palm facing directly forward.',
    ],
    commonMistakes: [
      'Holding fingers together (that forms "U").',
    ],
    referenceLandmarks: generateLandmarks({
      thumbExt: 0.2,
      thumbAngle: 0.2,
      indexExt: 1.0,
      middleExt: 1.0,
      ringExt: 0.1,
      pinkyExt: 0.1,
      spread: 0.18,
    }),
  },
  {
    id: 'sign-w',
    letter: 'W',
    title: 'Index, Middle, and Ring Fingers Spread',
    shortDescription: 'Index, Middle, and Ring Spread Up',
    category: 'consonant',
    difficulty: 'Beginner',
    description: 'Extend your index, middle, and ring fingers straight up and spread apart. Thumb folds over pinky finger to hold it down.',
    fingerStates: {
      thumb: 'Pins pinky tip down',
      index: 'Extended straight up',
      middle: 'Extended straight up',
      ring: 'Extended straight up',
      pinky: 'Held down by thumb',
    },
    tips: [
      'Spread the three upright fingers evenly.',
      'Thumb securely clamps pinky finger.',
    ],
    commonMistakes: [
      'Extending pinky instead of ring finger (forms "B").',
    ],
    referenceLandmarks: generateLandmarks({
      thumbExt: 0.2,
      thumbAngle: 0.3,
      indexExt: 1.0,
      middleExt: 1.0,
      ringExt: 1.0,
      pinkyExt: 0.1,
      spread: 0.07,
    }),
  },
  {
    id: 'sign-x',
    letter: 'X',
    title: 'Index Hooked Like a Pirate Hook',
    shortDescription: 'Index Hooked Like a Pirate Hook',
    category: 'consonant',
    difficulty: 'Intermediate',
    description: 'Make a fist, but extend your index finger slightly and curl/hook it at the knuckle, resembling a pirate hook. Thumb tucked.',
    fingerStates: {
      thumb: 'Folded across curled fingers',
      index: 'Bent into a hook shape',
      middle: 'Curled into palm',
      ring: 'Curled into palm',
      pinky: 'Curled into palm',
    },
    tips: [
      'Bend index finger at the first and second joints into a clear hook.',
      'Keep other three fingers closed tightly.',
    ],
    commonMistakes: [
      'Straightening index completely (forms "D" or "1").',
    ],
    referenceLandmarks: generateLandmarks({
      thumbExt: 0.3,
      thumbAngle: 0.2,
      indexExt: 0.5,
      indexHooked: true,
      middleExt: 0.1,
      ringExt: 0.1,
      pinkyExt: 0.1,
    }),
  },
  {
    id: 'sign-y',
    letter: 'Y',
    title: 'Thumb and Pinky Extended (Hang Loose)',
    shortDescription: 'Thumb & Pinky Out (Hang Loose)',
    category: 'consonant',
    difficulty: 'Beginner',
    description: 'Extend your thumb and pinky fingers straight outward ("Hang Loose" / phone sign). Middle three fingers are curled into palm.',
    fingerStates: {
      thumb: 'Extended outward to side',
      index: 'Curled into palm',
      middle: 'Curled into palm',
      ring: 'Curled into palm',
      pinky: 'Extended outward to side',
    },
    tips: [
      'Stretch thumb and pinky as far apart as comfortable.',
      'Keep middle three fingers tight against palm.',
    ],
    commonMistakes: [
      'Leaving index finger extended.',
    ],
    referenceLandmarks: generateLandmarks({
      thumbExt: 1.0,
      thumbAngle: -0.5,
      indexExt: 0.1,
      middleExt: 0.1,
      ringExt: 0.1,
      pinkyExt: 1.0,
    }),
  },
  {
    id: 'sign-z',
    letter: 'Z',
    title: 'Index Finger Tracing "Z" Path',
    shortDescription: 'Index Extended Tracing Z-Path',
    category: 'complex',
    difficulty: 'Intermediate',
    description: 'Extend your index finger like pointing. In the air, trace the letter "Z" (horizontal right, diagonal down-left, horizontal right).',
    fingerStates: {
      thumb: 'Holds curled middle, ring, pinky',
      index: 'Extended forward/upright for tracing',
      middle: 'Curled into palm',
      ring: 'Curled into palm',
      pinky: 'Curled into palm',
    },
    tips: [
      'Index points forward and traces a crisp zigzag "Z" pattern.',
      'Keep other three fingers firmly tucked under thumb.',
    ],
    commonMistakes: [
      'Moving whole forearm rather than wrist and finger.',
    ],
    referenceLandmarks: generateLandmarks({
      thumbExt: 0.3,
      thumbAngle: 0.2,
      indexExt: 1.0,
      middleExt: 0.1,
      ringExt: 0.1,
      pinkyExt: 0.1,
    }),
  },
];
