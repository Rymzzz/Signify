import { ASLSign, CurriculumModule, CurriculumUnit, HandLandmark } from '../types/index';
import { ASL_ALPHABET } from './aslAlphabet';

// Landmark builder for numbers and words
function buildHandLandmarks(config: {
  thumbExt: number; // 0 (curled) to 1 (straight)
  thumbAngle?: number;
  thumbAcross?: boolean;
  thumbTouchFinger?: 'index' | 'middle' | 'ring' | 'pinky';
  indexExt: number;
  middleExt: number;
  ringExt: number;
  pinkyExt: number;
  spread?: number;
  handTilt?: number;
  isOpenPalm?: boolean;
}): HandLandmark[] {
  const points: HandLandmark[] = [];
  const wrist = { x: 0.5, y: 0.84 };
  points.push(wrist);

  const spread = config.spread || 0.08;
  const tilt = config.handTilt || 0;

  // 1-4 Thumb
  if (config.thumbTouchFinger === 'index') {
    // 9 (index tip touches thumb tip, other 3 up)
    points.push({ x: 0.44, y: 0.76 });
    points.push({ x: 0.42, y: 0.69 });
    points.push({ x: 0.42, y: 0.62 });
    points.push({ x: 0.44, y: 0.56 });
  } else if (config.thumbTouchFinger === 'middle') {
    // 8 (middle tip touches thumb tip)
    points.push({ x: 0.44, y: 0.76 });
    points.push({ x: 0.45, y: 0.69 });
    points.push({ x: 0.47, y: 0.62 });
    points.push({ x: 0.49, y: 0.57 });
  } else if (config.thumbTouchFinger === 'ring') {
    // 7 (ring tip touches thumb tip)
    points.push({ x: 0.44, y: 0.76 });
    points.push({ x: 0.46, y: 0.69 });
    points.push({ x: 0.50, y: 0.62 });
    points.push({ x: 0.54, y: 0.58 });
  } else if (config.thumbTouchFinger === 'pinky') {
    // 6 (pinky tip touches thumb tip)
    points.push({ x: 0.44, y: 0.76 });
    points.push({ x: 0.48, y: 0.69 });
    points.push({ x: 0.54, y: 0.62 });
    points.push({ x: 0.58, y: 0.59 });
  } else if (config.thumbAcross) {
    points.push({ x: 0.45, y: 0.76 });
    points.push({ x: 0.43, y: 0.69 });
    points.push({ x: 0.47, y: 0.64 });
    points.push({ x: 0.51, y: 0.62 });
  } else {
    const tAngle = config.thumbAngle !== undefined ? config.thumbAngle : -0.3;
    const tLen = 0.06 * config.thumbExt + 0.04;
    points.push({ x: 0.44, y: 0.77 });
    points.push({ x: 0.38 + tAngle * 0.05, y: 0.70 });
    points.push({ x: 0.34 + tAngle * 0.08, y: 0.63 - tLen * 0.5 });
    points.push({ x: 0.31 + tAngle * 0.12, y: 0.58 - tLen });
  }

  // Fingers (Index, Middle, Ring, Pinky)
  const fingerConfigs = [
    { mcpX: 0.42, ext: config.indexExt, angle: -spread * 1.2, isTouch: config.thumbTouchFinger === 'index' },
    { mcpX: 0.49, ext: config.middleExt, angle: -spread * 0.2, isTouch: config.thumbTouchFinger === 'middle' },
    { mcpX: 0.56, ext: config.ringExt, angle: spread * 0.3, isTouch: config.thumbTouchFinger === 'ring' },
    { mcpX: 0.62, ext: config.pinkyExt, angle: spread * 1.1, isTouch: config.thumbTouchFinger === 'pinky' },
  ];

  fingerConfigs.forEach(f => {
    const mcpY = 0.52;
    points.push({ x: f.mcpX, y: mcpY });

    if (f.isTouch) {
      // Finger touches thumb tip in loop
      const tipY = 0.56;
      points.push({ x: f.mcpX - 0.01, y: mcpY - 0.06 });
      points.push({ x: f.mcpX - 0.03, y: mcpY - 0.02 });
      points.push({ x: f.mcpX - 0.02, y: tipY });
    } else {
      const segLen = 0.07 * f.ext + 0.02;
      const pipX = f.mcpX + Math.sin(f.angle + tilt) * segLen;
      const pipY = mcpY - Math.cos(f.angle + tilt) * segLen;
      points.push({ x: pipX, y: pipY });

      const dipX = pipX + Math.sin(f.angle + tilt) * segLen;
      const dipY = pipY - Math.cos(f.angle + tilt) * segLen;
      points.push({ x: dipX, y: dipY });

      const tipX = dipX + Math.sin(f.angle + tilt) * segLen * 0.9;
      const tipY = dipY - Math.cos(f.angle + tilt) * segLen * 0.9;
      points.push({ x: tipX, y: tipY });
    }
  });

  return points;
}

// ASL NUMBERS MODULE (0 through 10)
export const ASL_NUMBERS: ASLSign[] = [
  {
    id: 'num-0',
    letter: '0',
    title: 'Number 0 (Zero)',
    shortDescription: 'Fingertips meet thumb forming an O ring',
    category: 'number',
    difficulty: 'Beginner',
    signType: 'number',
    description: 'Curve all fingers and thumb until the fingertips touch the thumb tip, creating a circular 0 shape. Palm faces slightly forward or towards the non-dominant side.',
    fingerStates: {
      thumb: 'Curved up to meet all fingertips',
      index: 'Curved touching thumb',
      middle: 'Curved touching thumb',
      ring: 'Curved touching thumb',
      pinky: 'Curved touching thumb',
    },
    tips: [
      'Keep fingertips gently touching the thumb pad.',
      'Maintain an open round ring hole like an O or 0.',
      'Face palm slightly forward.'
    ],
    commonMistakes: [
      'Squeezing into a tight fist instead of an open circle.',
      'Flattening fingers against palm.'
    ],
    referenceLandmarks: buildHandLandmarks({
      thumbExt: 0.6,
      thumbTouchFinger: 'index',
      indexExt: 0.35,
      middleExt: 0.35,
      ringExt: 0.35,
      pinkyExt: 0.35,
    }),
    gifUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    sampleVideoQuery: 'ASL sign number 0 zero'
  },
  {
    id: 'num-1',
    letter: '1',
    title: 'Number 1 (One)',
    shortDescription: 'Index finger straight up, thumb locks curled fingers',
    category: 'number',
    difficulty: 'Beginner',
    signType: 'number',
    description: 'Extend the index finger straight upward toward the ceiling. Keep middle, ring, and pinky curled into the palm, locked by the thumb across their nails. Palm faces inward or forward.',
    fingerStates: {
      thumb: 'Folded across middle, ring, and pinky nails',
      index: 'Extended straight upright',
      middle: 'Curled into palm',
      ring: 'Curled into palm',
      pinky: 'Curled into palm',
    },
    tips: [
      'Palm typically faces your chest or inward in ASL numbers 1-5.',
      'Keep index vertical and straight.',
      'Thumb secures the curled fingers.'
    ],
    commonMistakes: [
      'Extending the thumb outward like the letter L.',
      'Curling index finger forward.'
    ],
    referenceLandmarks: buildHandLandmarks({
      thumbExt: 0.3,
      thumbAcross: true,
      indexExt: 1.0,
      middleExt: 0.15,
      ringExt: 0.15,
      pinkyExt: 0.15,
    }),
    gifUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
    sampleVideoQuery: 'ASL sign number 1 one'
  },
  {
    id: 'num-2',
    letter: '2',
    title: 'Number 2 (Two)',
    shortDescription: 'Index and middle fingers extended upward in V',
    category: 'number',
    difficulty: 'Beginner',
    signType: 'number',
    description: 'Extend both index and middle fingers straight upward in a V shape. Ring and pinky are curled into the palm, held down by the thumb.',
    fingerStates: {
      thumb: 'Folded over ring and pinky fingers',
      index: 'Extended straight upright',
      middle: 'Extended straight upright, spread from index',
      ring: 'Curled into palm',
      pinky: 'Curled into palm',
    },
    tips: [
      'Spread index and middle fingers slightly into a clear V.',
      'Palm faces inward toward you in traditional ASL counting.',
      'Keep wrist neutral.'
    ],
    commonMistakes: [
      'Pressing index and middle together (looks like letter U).',
      'Extending ring finger.'
    ],
    referenceLandmarks: buildHandLandmarks({
      thumbExt: 0.3,
      thumbAcross: true,
      indexExt: 1.0,
      middleExt: 1.0,
      ringExt: 0.15,
      pinkyExt: 0.15,
      spread: 0.14
    }),
    gifUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    sampleVideoQuery: 'ASL sign number 2 two'
  },
  {
    id: 'num-3',
    letter: '3',
    title: 'Number 3 (Three)',
    shortDescription: 'Thumb, index, and middle extended (ASL 3)',
    category: 'number',
    difficulty: 'Beginner',
    signType: 'number',
    description: 'In ASL, 3 is signed by extending the thumb, index finger, and middle finger! Ring and pinky remain curled into the palm. (Note: this is different from the hearing European 3).',
    fingerStates: {
      thumb: 'Extended outward/upward',
      index: 'Extended straight upright',
      middle: 'Extended straight upright',
      ring: 'Curled into palm',
      pinky: 'Curled into palm',
    },
    tips: [
      'Remember ASL 3 uses THUMB + INDEX + MIDDLE!',
      'Do not extend index, middle, and ring (that is letter W, not number 3).',
      'Palm faces inward toward you.'
    ],
    commonMistakes: [
      'Signing W (index, middle, ring) instead of ASL 3 (thumb, index, middle).',
      'Folding the thumb in.'
    ],
    referenceLandmarks: buildHandLandmarks({
      thumbExt: 0.9,
      thumbAngle: -0.4,
      indexExt: 1.0,
      middleExt: 1.0,
      ringExt: 0.15,
      pinkyExt: 0.15,
      spread: 0.12
    }),
    gifUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    sampleVideoQuery: 'ASL sign number 3 three'
  },
  {
    id: 'num-4',
    letter: '4',
    title: 'Number 4 (Four)',
    shortDescription: 'Four fingers upright, thumb tucked into palm',
    category: 'number',
    difficulty: 'Beginner',
    signType: 'number',
    description: 'Extend all four fingers (index, middle, ring, pinky) straight upright with slight spread. Fold the thumb flat across the palm.',
    fingerStates: {
      thumb: 'Tucked flat across palm',
      index: 'Extended straight upright',
      middle: 'Extended straight upright',
      ring: 'Extended straight upright',
      pinky: 'Extended straight upright',
    },
    tips: [
      'Keep thumb tucked into the palm so only four fingers show.',
      'Slightly spread the 4 fingers for distinct clarity.',
      'Palm faces inward.'
    ],
    commonMistakes: [
      'Allowing thumb to stick out (looks like 5).',
      'Curling pinky.'
    ],
    referenceLandmarks: buildHandLandmarks({
      thumbExt: 0.2,
      thumbAcross: true,
      indexExt: 1.0,
      middleExt: 1.0,
      ringExt: 1.0,
      pinkyExt: 1.0,
      spread: 0.10
    }),
    gifUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=400&q=80',
    sampleVideoQuery: 'ASL sign number 4 four'
  },
  {
    id: 'num-5',
    letter: '5',
    title: 'Number 5 (Five)',
    shortDescription: 'All 5 fingers extended open wide',
    category: 'number',
    difficulty: 'Beginner',
    signType: 'number',
    description: 'Extend all five fingers (thumb, index, middle, ring, pinky) fully open with fingers spread apart in a clear open handshape.',
    fingerStates: {
      thumb: 'Extended outward open',
      index: 'Extended straight upright',
      middle: 'Extended straight upright',
      ring: 'Extended straight upright',
      pinky: 'Extended straight upright',
    },
    tips: [
      'Spread all 5 digits comfortably.',
      'Keep hand relaxed yet distinct.',
      'Palm faces inward toward you during basic counting, or forward in conversation.'
    ],
    commonMistakes: [
      'Tucking the thumb into the palm.',
      'Curling any finger joint.'
    ],
    referenceLandmarks: buildHandLandmarks({
      thumbExt: 1.0,
      thumbAngle: -0.45,
      indexExt: 1.0,
      middleExt: 1.0,
      ringExt: 1.0,
      pinkyExt: 1.0,
      spread: 0.15
    }),
    gifUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
    sampleVideoQuery: 'ASL sign number 5 five'
  },
  {
    id: 'num-6',
    letter: '6',
    title: 'Number 6 (Six)',
    shortDescription: 'Pinky and thumb touch tips; other 3 upright',
    category: 'number',
    difficulty: 'Intermediate',
    signType: 'number',
    description: 'Touch the tip of your pinky finger to the tip of your thumb. Keep index, middle, and ring fingers extended straight upright with slight spread. Palm faces forward.',
    fingerStates: {
      thumb: 'Touching pinky tip',
      index: 'Extended straight upright',
      middle: 'Extended straight upright',
      ring: 'Extended straight upright',
      pinky: 'Touching thumb tip',
    },
    tips: [
      'Remember ASL number memory rule: 6 is smallest finger (pinky) touches thumb!',
      '7 is next finger (ring), 8 is middle, 9 is index.',
      'Palm faces FORWARD for 6-9.'
    ],
    commonMistakes: [
      'Touching index finger instead of pinky (that is 9 or F).',
      'Curling index and middle.'
    ],
    referenceLandmarks: buildHandLandmarks({
      thumbExt: 0.5,
      thumbTouchFinger: 'pinky',
      indexExt: 1.0,
      middleExt: 1.0,
      ringExt: 1.0,
      pinkyExt: 0.25,
      spread: 0.10
    }),
    gifUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80',
    sampleVideoQuery: 'ASL sign number 6 six'
  },
  {
    id: 'num-7',
    letter: '7',
    title: 'Number 7 (Seven)',
    shortDescription: 'Ring finger and thumb touch tips; other 3 upright',
    category: 'number',
    difficulty: 'Intermediate',
    signType: 'number',
    description: 'Touch the tip of your ring finger to the tip of your thumb. Keep index, middle, and pinky fingers extended straight upright. Palm faces forward.',
    fingerStates: {
      thumb: 'Touching ring finger tip',
      index: 'Extended straight upright',
      middle: 'Extended straight upright',
      ring: 'Touching thumb tip',
      pinky: 'Extended straight upright',
    },
    tips: [
      'Thumb touches ring finger tip.',
      'Pinky remains extended upright.',
      'Palm faces forward toward the viewer.'
    ],
    commonMistakes: [
      'Allowing pinky to curl down with ring finger.',
      'Touching middle finger (that is 8).'
    ],
    referenceLandmarks: buildHandLandmarks({
      thumbExt: 0.5,
      thumbTouchFinger: 'ring',
      indexExt: 1.0,
      middleExt: 1.0,
      ringExt: 0.25,
      pinkyExt: 1.0,
      spread: 0.10
    }),
    gifUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80',
    sampleVideoQuery: 'ASL sign number 7 seven'
  },
  {
    id: 'num-8',
    letter: '8',
    title: 'Number 8 (Eight)',
    shortDescription: 'Middle finger and thumb touch tips; other 3 upright',
    category: 'number',
    difficulty: 'Intermediate',
    signType: 'number',
    description: 'Touch the tip of your middle finger to the tip of your thumb. Keep index, ring, and pinky fingers extended upright. Palm faces forward.',
    fingerStates: {
      thumb: 'Touching middle finger tip',
      index: 'Extended straight upright',
      middle: 'Touching thumb tip',
      ring: 'Extended straight upright',
      pinky: 'Extended straight upright',
    },
    tips: [
      'Thumb and middle finger pinch together.',
      'Index, ring, and pinky extend upright.',
      'Keep palm facing forward.'
    ],
    commonMistakes: [
      'Curling ring finger.',
      'Touching ring finger (that is 7).'
    ],
    referenceLandmarks: buildHandLandmarks({
      thumbExt: 0.5,
      thumbTouchFinger: 'middle',
      indexExt: 1.0,
      middleExt: 0.25,
      ringExt: 1.0,
      pinkyExt: 1.0,
      spread: 0.10
    }),
    gifUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80',
    sampleVideoQuery: 'ASL sign number 8 eight'
  },
  {
    id: 'num-9',
    letter: '9',
    title: 'Number 9 (Nine)',
    shortDescription: 'Index and thumb touch tips (F-shape); other 3 upright',
    category: 'number',
    difficulty: 'Intermediate',
    signType: 'number',
    description: 'Touch the tip of your index finger to the tip of your thumb forming an open circle. Keep middle, ring, and pinky fingers extended upright with spread. Handshape matches letter F. Palm faces forward.',
    fingerStates: {
      thumb: 'Touching index finger tip',
      index: 'Touching thumb tip',
      middle: 'Extended straight upright',
      ring: 'Extended straight upright',
      pinky: 'Extended straight upright',
    },
    tips: [
      'Matches the handshape for ASL letter F.',
      'Keep remaining three fingers upright and spread.',
      'Palm faces forward.'
    ],
    commonMistakes: [
      'Confusing with 6 (pinky touches thumb in 6, index in 9).',
      'Curling the middle and ring fingers.'
    ],
    referenceLandmarks: buildHandLandmarks({
      thumbExt: 0.5,
      thumbTouchFinger: 'index',
      indexExt: 0.25,
      middleExt: 1.0,
      ringExt: 1.0,
      pinkyExt: 1.0,
      spread: 0.10
    }),
    gifUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
    sampleVideoQuery: 'ASL sign number 9 nine'
  },
  {
    id: 'num-10',
    letter: '10',
    title: 'Number 10 (Ten)',
    shortDescription: 'Thumbs up (A-fist) shaking side-to-side',
    category: 'number',
    difficulty: 'Intermediate',
    signType: 'number',
    dynamicMotion: true,
    description: 'Make an "A" fist or "thumbs up" handshape with your thumb extended straight upright. Gently shake or wiggle the hand from the wrist side-to-side twice.',
    fingerStates: {
      thumb: 'Extended upright (thumbs up)',
      index: 'Curled into fist',
      middle: 'Curled into fist',
      ring: 'Curled into fist',
      pinky: 'Curled into fist',
    },
    tips: [
      'Thumb points upward.',
      'Oscillate or twist the wrist side-to-side slightly.',
      'Dynamic motion distinguishes 10 from letter A.'
    ],
    commonMistakes: [
      'Keeping hand completely still (looks like letter A).',
      'Extending index finger.'
    ],
    referenceLandmarks: buildHandLandmarks({
      thumbExt: 1.0,
      thumbAngle: -0.15,
      indexExt: 0.1,
      middleExt: 0.1,
      ringExt: 0.1,
      pinkyExt: 0.1,
    }),
    motionTrajectory: [
      { x: 0.46, y: 0.50 },
      { x: 0.54, y: 0.50 },
      { x: 0.46, y: 0.50 },
      { x: 0.54, y: 0.50 }
    ],
    gifUrl: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&w=400&q=80',
    sampleVideoQuery: 'ASL sign number 10 ten'
  }
];

// HIGH-FREQUENCY WORDS & GREETINGS MODULE (Inspired by WLASL / MuteMotion Dataset)
export const ASL_WORDS: ASLSign[] = [
  {
    id: 'word-hello',
    letter: 'HELLO',
    title: 'Hello / Hi',
    shortDescription: 'Salute gesture moving outward from temple',
    category: 'word',
    difficulty: 'Beginner',
    signType: 'word',
    dynamicMotion: true,
    description: 'Place your dominant hand near your temple in a flat open palm with fingers together. Move your hand slightly forward and outward in an open salute gesture.',
    fingerStates: {
      thumb: 'Relaxed alongside index finger',
      index: 'Extended straight with other fingers',
      middle: 'Extended straight with other fingers',
      ring: 'Extended straight with other fingers',
      pinky: 'Extended straight with other fingers',
    },
    tips: [
      'Start hand near eyebrow or temple.',
      'Smoothly sweep outward about 4 to 6 inches.',
      'Accompany with a pleasant facial expression.'
    ],
    commonMistakes: [
      'Military salute touching forehead rigidly.',
      'Curling fingers into a fist.'
    ],
    referenceLandmarks: buildHandLandmarks({
      thumbExt: 0.8,
      indexExt: 1.0,
      middleExt: 1.0,
      ringExt: 1.0,
      pinkyExt: 1.0,
      spread: 0.05,
      handTilt: -0.1
    }),
    motionTrajectory: [
      { x: 0.42, y: 0.40 },
      { x: 0.55, y: 0.38 },
      { x: 0.65, y: 0.36 }
    ],
    gifUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
    sampleVideoQuery: 'ASL sign HELLO'
  },
  {
    id: 'word-thankyou',
    letter: 'THANK YOU',
    title: 'Thank You',
    shortDescription: 'Flat hand touches chin and moves forward toward person',
    category: 'word',
    difficulty: 'Beginner',
    signType: 'word',
    dynamicMotion: true,
    description: 'Touch the fingertips of your flat dominant hand to your chin or lower lip. Then move your hand forward and slightly downward toward the person you are thanking.',
    fingerStates: {
      thumb: 'Alongside index finger',
      index: 'Extended flat with fingers together',
      middle: 'Extended flat with fingers together',
      ring: 'Extended flat with fingers together',
      pinky: 'Extended flat with fingers together',
    },
    tips: [
      'Fingertips start on chin or lower lip.',
      'Palm faces toward your face at start, tilting upward/forward as you extend outward.',
      'Nod gently while signing.'
    ],
    commonMistakes: [
      'Starting from forehead (that is "Good", not "Thank you").',
      'Using a fist instead of an open flat hand.'
    ],
    referenceLandmarks: buildHandLandmarks({
      thumbExt: 0.8,
      indexExt: 1.0,
      middleExt: 1.0,
      ringExt: 1.0,
      pinkyExt: 1.0,
      spread: 0.04
    }),
    motionTrajectory: [
      { x: 0.50, y: 0.65 },
      { x: 0.50, y: 0.55 },
      { x: 0.50, y: 0.45 }
    ],
    gifUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    sampleVideoQuery: 'ASL sign THANK YOU'
  },
  {
    id: 'word-yes',
    letter: 'YES',
    title: 'Yes',
    shortDescription: 'Fist nodding up and down from the wrist',
    category: 'word',
    difficulty: 'Beginner',
    signType: 'word',
    dynamicMotion: true,
    description: 'Make an "S" handshape (closed fist with thumb crossed in front). Pivot your fist up and down from the wrist, mimicking a head nodding yes.',
    fingerStates: {
      thumb: 'Crossed over curled fingers',
      index: 'Curled in tight fist',
      middle: 'Curled in tight fist',
      ring: 'Curled in tight fist',
      pinky: 'Curled in tight fist',
    },
    tips: [
      'Fist mimics your head nodding.',
      'Pivot from the wrist twice in smooth vertical arcs.',
      'Accompany with an affirmative head nod.'
    ],
    commonMistakes: [
      'Moving the whole arm instead of hinging at the wrist.',
      'Opening fingers during the nod.'
    ],
    referenceLandmarks: buildHandLandmarks({
      thumbExt: 0.2,
      thumbAcross: true,
      indexExt: 0.1,
      middleExt: 0.1,
      ringExt: 0.1,
      pinkyExt: 0.1
    }),
    motionTrajectory: [
      { x: 0.50, y: 0.50 },
      { x: 0.50, y: 0.60 },
      { x: 0.50, y: 0.50 },
      { x: 0.50, y: 0.60 }
    ],
    gifUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
    sampleVideoQuery: 'ASL sign YES'
  },
  {
    id: 'word-no',
    letter: 'NO',
    title: 'No',
    shortDescription: 'Index & middle snap down onto thumb like closing beak',
    category: 'word',
    difficulty: 'Beginner',
    signType: 'word',
    dynamicMotion: true,
    description: 'Extend your thumb, index finger, and middle finger. Quickly snap the index and middle fingertips down together to touch the tip of the thumb, like a closing bird beak.',
    fingerStates: {
      thumb: 'Extended out to meet index & middle tips',
      index: 'Snaps down to touch thumb pad',
      middle: 'Snaps down to touch thumb pad together with index',
      ring: 'Curled into palm',
      pinky: 'Curled into palm',
    },
    tips: [
      'Snap closed crisply.',
      'Ring and pinky remain curled into the palm.',
      'Slight head shake reinforces the negation.'
    ],
    commonMistakes: [
      'Using only index finger (use BOTH index and middle).',
      'Leaving fingers open without the snap.'
    ],
    referenceLandmarks: buildHandLandmarks({
      thumbExt: 0.6,
      thumbTouchFinger: 'middle',
      indexExt: 0.4,
      middleExt: 0.4,
      ringExt: 0.15,
      pinkyExt: 0.15
    }),
    motionTrajectory: [
      { x: 0.50, y: 0.45 },
      { x: 0.50, y: 0.55 }
    ],
    gifUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    sampleVideoQuery: 'ASL sign NO'
  },
  {
    id: 'word-please',
    letter: 'PLEASE',
    title: 'Please',
    shortDescription: 'Flat palm rubbing clockwise circle over chest',
    category: 'word',
    difficulty: 'Beginner',
    signType: 'word',
    dynamicMotion: true,
    description: 'Place your dominant flat open palm against the center of your chest. Rub your hand in a gentle circular motion (clockwise from your perspective) a couple of times.',
    fingerStates: {
      thumb: 'Extended alongside index finger',
      index: 'Extended flat with fingers together',
      middle: 'Extended flat with fingers together',
      ring: 'Extended flat with fingers together',
      pinky: 'Extended flat with fingers together',
    },
    tips: [
      'Hand stays flat against upper torso/chest.',
      'Circle is smooth and about 4-5 inches in diameter.',
      'Friendly, polite facial expression.'
    ],
    commonMistakes: [
      'Using a fist instead of open flat palm (a fist is "Sorry").',
      'Circling away from the chest.'
    ],
    referenceLandmarks: buildHandLandmarks({
      thumbExt: 0.8,
      indexExt: 1.0,
      middleExt: 1.0,
      ringExt: 1.0,
      pinkyExt: 1.0,
      spread: 0.05
    }),
    motionTrajectory: [
      { x: 0.45, y: 0.50 },
      { x: 0.55, y: 0.45 },
      { x: 0.55, y: 0.55 },
      { x: 0.45, y: 0.55 }
    ],
    gifUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    sampleVideoQuery: 'ASL sign PLEASE'
  },
  {
    id: 'word-sorry',
    letter: 'SORRY',
    title: 'Sorry / Apology',
    shortDescription: 'A-fist rubbing in a circular motion on the chest',
    category: 'word',
    difficulty: 'Beginner',
    signType: 'word',
    dynamicMotion: true,
    description: 'Form an "A" handshape (closed fist with thumb resting upright against index finger). Rub your fist in a circular motion over your chest/heart area.',
    fingerStates: {
      thumb: 'Resting upright alongside curled index',
      index: 'Curled in fist',
      middle: 'Curled in fist',
      ring: 'Curled in fist',
      pinky: 'Curled in fist',
    },
    tips: [
      'Use an "A" fist, not an open palm (open palm is "Please").',
      'Rub in 2 or 3 circular revolutions over your chest.',
      'An apologetic facial expression completes the grammatical sign.'
    ],
    commonMistakes: [
      'Confusing with "Please" (Please is flat hand; Sorry is A-fist).',
      'Rubbing on stomach.'
    ],
    referenceLandmarks: buildHandLandmarks({
      thumbExt: 0.8,
      thumbAngle: -0.1,
      indexExt: 0.1,
      middleExt: 0.1,
      ringExt: 0.1,
      pinkyExt: 0.1
    }),
    motionTrajectory: [
      { x: 0.45, y: 0.50 },
      { x: 0.55, y: 0.45 },
      { x: 0.55, y: 0.55 },
      { x: 0.45, y: 0.55 }
    ],
    gifUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=400&q=80',
    sampleVideoQuery: 'ASL sign SORRY'
  },
  {
    id: 'word-help',
    letter: 'HELP',
    title: 'Help',
    shortDescription: 'Thumbs-up fist placed on flat open palm, lifting up',
    category: 'word',
    difficulty: 'Intermediate',
    signType: 'word',
    dynamicMotion: true,
    description: 'Place your dominant fist in a thumbs-up (A-handshape) resting on top of the open, upward-facing palm of your non-dominant hand. Lift both hands together upward.',
    fingerStates: {
      thumb: 'Extended upright in thumbs up',
      index: 'Curled in fist',
      middle: 'Curled in fist',
      ring: 'Curled in fist',
      pinky: 'Curled in fist',
    },
    tips: [
      'The base hand provides the foundation (open palm facing up).',
      'The top hand is an "A" thumbs-up.',
      'Lifting hands upward signifies elevating or providing support.'
    ],
    commonMistakes: [
      'Using a flat hand on top instead of thumbs-up.',
      'Dropping hands downward instead of lifting.'
    ],
    referenceLandmarks: buildHandLandmarks({
      thumbExt: 1.0,
      thumbAngle: -0.1,
      indexExt: 0.1,
      middleExt: 0.1,
      ringExt: 0.1,
      pinkyExt: 0.1
    }),
    motionTrajectory: [
      { x: 0.50, y: 0.65 },
      { x: 0.50, y: 0.50 },
      { x: 0.50, y: 0.38 }
    ],
    gifUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
    sampleVideoQuery: 'ASL sign HELP'
  },
  {
    id: 'word-more',
    letter: 'MORE',
    title: 'More',
    shortDescription: 'Flattened O handshapes tapping fingertips together',
    category: 'word',
    difficulty: 'Beginner',
    signType: 'word',
    dynamicMotion: true,
    description: 'Flatten both hands so the fingertips touch the thumb in flattened "O" shapes. Tap the fingertips of both hands together in front of your chest repeatedly.',
    fingerStates: {
      thumb: 'Touching all fingertips in flat O',
      index: 'Curved touching thumb',
      middle: 'Curved touching thumb',
      ring: 'Curved touching thumb',
      pinky: 'Curved touching thumb',
    },
    tips: [
      'Fingertips tap together 2 or 3 times.',
      'Hands meet directly in front of center chest.',
      'Very commonly used high-frequency ASL sign.'
    ],
    commonMistakes: [
      'Clapping flat palms together.',
      'Tapping wrists instead of fingertips.'
    ],
    referenceLandmarks: buildHandLandmarks({
      thumbExt: 0.6,
      thumbTouchFinger: 'index',
      indexExt: 0.3,
      middleExt: 0.3,
      ringExt: 0.3,
      pinkyExt: 0.3
    }),
    motionTrajectory: [
      { x: 0.42, y: 0.50 },
      { x: 0.50, y: 0.50 },
      { x: 0.42, y: 0.50 },
      { x: 0.50, y: 0.50 }
    ],
    gifUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80',
    sampleVideoQuery: 'ASL sign MORE'
  },
  {
    id: 'word-ily',
    letter: 'I LOVE YOU',
    title: 'I Love You (ILY)',
    shortDescription: 'Thumb, index, and pinky extended; middle and ring folded',
    category: 'word',
    difficulty: 'Beginner',
    signType: 'word',
    description: 'Extend your thumb, index finger, and pinky finger straight out. Fold your middle and ring fingers down into your palm. Palm faces forward toward the recipient.',
    fingerStates: {
      thumb: 'Extended outward to the side',
      index: 'Extended straight upright (I + L)',
      middle: 'Curled flat into palm',
      ring: 'Curled flat into palm',
      pinky: 'Extended straight upright (I)',
    },
    tips: [
      'Combines letters I, L, and Y from the manual alphabet.',
      'Thumb + Index = "L", Pinky = "I", Thumb + Pinky = "Y".',
      'Palm faces forward toward the recipient.'
    ],
    commonMistakes: [
      'Tucking the thumb in (without thumb, it is "rock on" or Horns, not ILY).',
      'Extending middle finger.'
    ],
    referenceLandmarks: buildHandLandmarks({
      thumbExt: 1.0,
      thumbAngle: -0.4,
      indexExt: 1.0,
      middleExt: 0.15,
      ringExt: 0.15,
      pinkyExt: 1.0,
      spread: 0.14
    }),
    gifUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80',
    sampleVideoQuery: 'ASL sign I LOVE YOU'
  },
  {
    id: 'word-water',
    letter: 'WATER',
    title: 'Water',
    shortDescription: 'W-handshape tapping index finger against chin twice',
    category: 'word',
    difficulty: 'Intermediate',
    signType: 'word',
    dynamicMotion: true,
    description: 'Form a "W" handshape (index, middle, and ring fingers extended upright and spread; thumb holds pinky). Tap the side of your index finger against your chin twice.',
    fingerStates: {
      thumb: 'Holding pinky finger down',
      index: 'Extended upright (part of W)',
      middle: 'Extended upright (part of W)',
      ring: 'Extended upright (part of W)',
      pinky: 'Curled down under thumb',
    },
    tips: [
      'Handshape is the letter W.',
      'Tap index finger against the chin or lower lip twice.',
      'Keep wrist upright and steady.'
    ],
    commonMistakes: [
      'Extending 4 fingers instead of 3.',
      'Tapping cheek instead of chin.'
    ],
    referenceLandmarks: buildHandLandmarks({
      thumbExt: 0.3,
      thumbAcross: true,
      indexExt: 1.0,
      middleExt: 1.0,
      ringExt: 1.0,
      pinkyExt: 0.15,
      spread: 0.12
    }),
    motionTrajectory: [
      { x: 0.50, y: 0.60 },
      { x: 0.50, y: 0.64 },
      { x: 0.50, y: 0.60 },
      { x: 0.50, y: 0.64 }
    ],
    gifUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80',
    sampleVideoQuery: 'ASL sign WATER'
  }
];

// CONVERSATIONAL PHRASES MODULE
export const ASL_PHRASES: ASLSign[] = [
  {
    id: 'phrase-nicetomeet',
    letter: 'NICE TO MEET YOU',
    title: 'Nice to Meet You',
    shortDescription: 'Compound sign: NICE (sliding flat palms) + MEET (index fingers meeting)',
    category: 'phrase',
    difficulty: 'Advanced',
    signType: 'phrase',
    dynamicMotion: true,
    description: 'First sign "NICE" (slide dominant open palm over non-dominant palm), then sign "MEET" (bring both index fingers facing each other together like two people meeting).',
    fingerStates: {
      thumb: 'Alongside index finger',
      index: 'Extended upright pointing to conversational partner',
      middle: 'Together with index in flat hand',
      ring: 'Together in flat hand',
      pinky: 'Together in flat hand',
    },
    tips: [
      'Fluid transition between "NICE" and "MEET YOU".',
      'Warm smile and direct eye contact are essential in ASL conversation.'
    ],
    commonMistakes: [
      'Signing individual English words instead of the conceptual ASL phrase.'
    ],
    referenceLandmarks: buildHandLandmarks({
      thumbExt: 0.8,
      indexExt: 1.0,
      middleExt: 1.0,
      ringExt: 1.0,
      pinkyExt: 1.0,
      spread: 0.05
    }),
    gifUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
    sampleVideoQuery: 'ASL sign NICE TO MEET YOU'
  },
  {
    id: 'phrase-howareyou',
    letter: 'HOW ARE YOU',
    title: 'How Are You?',
    shortDescription: 'Curved hands roll forward into open palms + point to you',
    category: 'phrase',
    difficulty: 'Advanced',
    signType: 'phrase',
    dynamicMotion: true,
    description: 'Form curved hands with backs of fingers touching, roll hands forward so palms face up ("HOW"), then point toward your conversational partner ("YOU"). Tilt head and furrow brows slightly for a WH-question.',
    fingerStates: {
      thumb: 'Extended alongside curved hand',
      index: 'Curved then extended to point',
      middle: 'Curved then open',
      ring: 'Curved then open',
      pinky: 'Curved then open',
    },
    tips: [
      'WH-question in ASL requires slightly furrowed eyebrows and forward head tilt.',
      'Roll hands smoothly outward.'
    ],
    commonMistakes: [
      'Raising eyebrows instead of furrowing (raised eyebrows is for yes/no questions).'
    ],
    referenceLandmarks: buildHandLandmarks({
      thumbExt: 0.8,
      indexExt: 0.7,
      middleExt: 0.7,
      ringExt: 0.7,
      pinkyExt: 0.7,
      spread: 0.08
    }),
    gifUrl: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&w=400&q=80',
    sampleVideoQuery: 'ASL sign HOW ARE YOU'
  }
];

// Enrich ASL_ALPHABET with video queries and media
export const ENRICHED_ALPHABET: ASLSign[] = ASL_ALPHABET.map(sign => ({
  ...sign,
  signType: 'alphabet' as const,
  sampleVideoQuery: `ASL letter ${sign.letter} sign language finger spelling demonstration`,
  gifUrl: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80`
}));

// ==========================================
// 3 UNITS CURRICULUM ARCHITECTURE (Requirement 4)
// Unit 1: ASL Manual Alphabet (Beginner)
// Unit 2: ASL Numbers (Intermediate)
// Unit 3: ASL Words & Conversational Phrases (Advanced)
// ==========================================

export const UNIT_1_MODULES: CurriculumModule[] = [
  {
    id: 'module-1-1',
    unitId: 'unit-1',
    unitNumber: 1,
    title: 'Module 1.1: Alphabet Foundations (A – E)',
    subtitle: 'Core Fist, Open Palm, C-Curve & Index Upright',
    description: 'Master the first five fundamental building blocks of ASL finger spelling. Focus on distinct thumb placements for A vs S, and keeping index upright for D.',
    category: 'alphabet',
    level: 'Beginner',
    badge: '🌱 Alphabet Foundations',
    itemCount: 5,
    xpPerSign: 15,
    signs: ENRICHED_ALPHABET.slice(0, 5),
    color: 'from-emerald-600 to-teal-700'
  },
  {
    id: 'module-1-2',
    unitId: 'unit-1',
    unitNumber: 1,
    title: 'Module 1.2: Extending Fingers & Motion (F – J)',
    subtitle: 'Horizontal Pointers & Dynamic "J" Stroke',
    description: 'Learn the OK-handshape for F, horizontal finger pointing for G and H, pinky upright for I, and the dynamic curved trajectory of J.',
    category: 'alphabet',
    level: 'Beginner',
    badge: '🌿 Extending Fingers',
    itemCount: 5,
    xpPerSign: 15,
    signs: ENRICHED_ALPHABET.slice(5, 10),
    color: 'from-teal-600 to-emerald-700'
  },
  {
    id: 'module-1-3',
    unitId: 'unit-1',
    unitNumber: 1,
    title: 'Module 1.3: Intermediate Handshapes (K – O)',
    subtitle: 'V-Split with Thumb, Right-Angle L & Knuckle Tucks',
    description: 'Explore the V-with-thumb of K, the sharp right-angle of L, subtle differences between 3-finger M and 2-finger N, and the closed O-circle.',
    category: 'alphabet',
    level: 'Beginner',
    badge: '🍃 Intermediate Shapes',
    itemCount: 5,
    xpPerSign: 15,
    signs: ENRICHED_ALPHABET.slice(10, 15),
    color: 'from-emerald-700 to-teal-800'
  },
  {
    id: 'module-1-4',
    unitId: 'unit-1',
    unitNumber: 1,
    title: 'Module 1.4: Cross & Precision (P – T)',
    subtitle: 'Downward Points, Crossed Fingers & Thumb Tucks',
    description: 'Master downward-pointing P and Q, the crossed fingers of R, the thumb-across fist of S, and thumb-under-index of T.',
    category: 'alphabet',
    level: 'Beginner',
    badge: '🎯 Precision Letters',
    itemCount: 5,
    xpPerSign: 15,
    signs: ENRICHED_ALPHABET.slice(15, 20),
    color: 'from-teal-700 to-cyan-800'
  },
  {
    id: 'module-1-5',
    unitId: 'unit-1',
    unitNumber: 1,
    title: 'Module 1.5: Final Characters & Stroke (U – Z)',
    subtitle: 'Together vs Spread, Hooked X, Phone Y & Dynamic "Z"',
    description: 'Complete the manual alphabet: together fingers for U vs V spread, 3-finger W, hooked index X, phone hand Y, and tracing the dynamic Z zigzag.',
    category: 'alphabet',
    level: 'Beginner',
    badge: '⚡ Final Strokes',
    itemCount: 6,
    xpPerSign: 15,
    signs: ENRICHED_ALPHABET.slice(20, 26),
    color: 'from-cyan-700 to-emerald-800'
  },
  {
    id: 'module-1-6',
    unitId: 'unit-1',
    unitNumber: 1,
    title: 'Module 1.6: Complete Manual Alphabet (A – Z)',
    subtitle: 'Comprehensive 26-Letter Fluency Review',
    description: 'Review and benchmark reaction speed across all 26 manual alphabet characters under real-time MediaPipe computer vision.',
    category: 'alphabet',
    level: 'Beginner',
    badge: '🔤 Alphabet Master',
    itemCount: 26,
    xpPerSign: 15,
    signs: ENRICHED_ALPHABET,
    color: 'from-emerald-600 to-teal-700'
  }
];

export const UNIT_2_MODULES: CurriculumModule[] = [
  {
    id: 'module-2-1',
    unitId: 'unit-2',
    unitNumber: 2,
    title: 'Module 2.1: Basic Digits (0 – 5)',
    subtitle: 'Authentic ASL 3 with Thumb, Counting from Zero to Five',
    description: 'Discover authentic ASL numeric grammar. Learn why standard ASL "3" extends thumb + index + middle, rather than the English three fingers.',
    category: 'numbers',
    level: 'Intermediate',
    badge: '🔢 Basic Digits',
    itemCount: 6,
    xpPerSign: 20,
    signs: ASL_NUMBERS.slice(0, 6),
    color: 'from-amber-500 to-orange-600'
  },
  {
    id: 'module-2-2',
    unitId: 'unit-2',
    unitNumber: 2,
    title: 'Module 2.2: Advanced Digits (6 – 10)',
    subtitle: 'Finger-to-Thumb Touch Rules & Dynamic 10',
    description: 'Master the ASL touch rules: 6 touches pinky to thumb, 7 touches ring, 8 touches middle, 9 touches index, and 10 performs a thumbs-up wrist wiggle.',
    category: 'numbers',
    level: 'Intermediate',
    badge: '🚀 Advanced Counting',
    itemCount: 5,
    xpPerSign: 20,
    signs: ASL_NUMBERS.slice(6, 11),
    color: 'from-orange-500 to-amber-600'
  },
  {
    id: 'module-2-3',
    unitId: 'unit-2',
    unitNumber: 2,
    title: 'Module 2.3: Number Mastery Review (0 – 10)',
    subtitle: 'Complete Numeric Fluency & Speed Challenge',
    description: 'Practice seamless rapid transitions between digits 0 through 10 with millimeter-accurate joint angle validation.',
    category: 'numbers',
    level: 'Intermediate',
    badge: '🏆 Number Wizard',
    itemCount: 11,
    xpPerSign: 20,
    signs: ASL_NUMBERS,
    color: 'from-amber-600 to-orange-700'
  }
];

export const UNIT_3_MODULES: CurriculumModule[] = [
  {
    id: 'module-3-1',
    unitId: 'unit-3',
    unitNumber: 3,
    title: 'Module 3.1: Essential Greetings & Courtesy',
    subtitle: 'HELLO, THANK YOU, PLEASE, SORRY',
    description: 'High-frequency signs for everyday social interaction from the WLASL dataset. Salutes, chest circles, and chin touches.',
    category: 'words',
    level: 'Advanced',
    badge: '🤝 Social Courtesy',
    itemCount: 4,
    xpPerSign: 30,
    signs: ASL_WORDS.slice(0, 4),
    color: 'from-sky-500 to-blue-600'
  },
  {
    id: 'module-3-2',
    unitId: 'unit-3',
    unitNumber: 3,
    title: 'Module 3.2: Everyday Responses & Needs',
    subtitle: 'YES, NO, HELP, MORE',
    description: 'Express affirmations, negations, assistance requests, and quantity adjustments with authentic dynamic hand kinematics.',
    category: 'words',
    level: 'Advanced',
    badge: '💬 Core Responses',
    itemCount: 4,
    xpPerSign: 30,
    signs: ASL_WORDS.slice(4, 8),
    color: 'from-blue-600 to-indigo-600'
  },
  {
    id: 'module-3-3',
    unitId: 'unit-3',
    unitNumber: 3,
    title: 'Module 3.3: Expressions & Interactions',
    subtitle: 'I LOVE YOU, WATER, FRIEND, GOOD',
    description: 'Learn iconic ASL signs including the universal ILY handshape (thumb, index, pinky), W-chin touch for water, and interconnected index fingers for friend.',
    category: 'words',
    level: 'Advanced',
    badge: '❤️ Everyday Expressions',
    itemCount: 4,
    xpPerSign: 30,
    signs: ASL_WORDS.slice(8, 12),
    color: 'from-indigo-500 to-violet-600'
  },
  {
    id: 'module-3-4',
    unitId: 'unit-3',
    unitNumber: 3,
    title: 'Module 3.4: Conversational Fluency',
    subtitle: 'Nice to Meet You, How Are You, See You Later, You Are Welcome',
    description: 'Synthesize vocabulary into complete conversational phrases, bridging the gap between isolated signs and fluid real-world dialogue.',
    category: 'phrases',
    level: 'Advanced',
    badge: '🌟 Conversationalist',
    itemCount: 4,
    xpPerSign: 35,
    signs: ASL_PHRASES,
    color: 'from-violet-600 to-purple-700'
  }
];

export const CURRICULUM_UNITS: CurriculumUnit[] = [
  {
    id: 'unit-1',
    unitNumber: 1,
    title: 'Unit 1: ASL Manual Alphabet',
    subtitle: '26 Letters of Finger Spelling (Modules 1.1 – 1.6)',
    difficulty: 'Beginner',
    description: 'Build your foundation with the complete 26-letter American Sign Language manual alphabet. Learn static shapes, subtle palm orientations, and dynamic strokes.',
    badge: '🔤 Alphabet Foundations',
    color: 'from-emerald-600 to-teal-700',
    modules: UNIT_1_MODULES
  },
  {
    id: 'unit-2',
    unitNumber: 2,
    title: 'Unit 2: ASL Numbers & Counting',
    subtitle: 'Digits 0 Through 10 with ASL Grammar (Modules 2.1 – 2.3)',
    difficulty: 'Intermediate',
    description: 'Discover authentic numeric handshapes: authentic ASL 3 with thumb, finger-to-thumb touching logic for 6 through 9, and dynamic wrist wiggle for 10.',
    badge: '🔢 Numeric Systems',
    color: 'from-amber-500 to-orange-600',
    modules: UNIT_2_MODULES
  },
  {
    id: 'unit-3',
    unitNumber: 3,
    title: 'Unit 3: ASL Words & Conversational Phrases',
    subtitle: 'High-Frequency WLASL Vocabulary & Real-World Dialogue (Modules 3.1 – 3.4)',
    difficulty: 'Advanced',
    description: 'Transition from finger spelling to full signs and phrases. Master greetings, responses, everyday needs, and conversational sentences grounded in the WLASL dataset.',
    badge: '💬 Conversational Fluency',
    color: 'from-sky-500 to-indigo-600',
    modules: UNIT_3_MODULES
  }
];

// Flatted list of all modules across all 3 units
export const CURRICULUM_MODULES: CurriculumModule[] = [
  ...UNIT_1_MODULES,
  ...UNIT_2_MODULES,
  ...UNIT_3_MODULES
];

export function getAllSigns(): ASLSign[] {
  return [
    ...ENRICHED_ALPHABET,
    ...ASL_NUMBERS,
    ...ASL_WORDS,
    ...ASL_PHRASES
  ];
}

export function getAllUnits(): CurriculumUnit[] {
  return CURRICULUM_UNITS;
}

export function getUnitById(id: string): CurriculumUnit | undefined {
  return CURRICULUM_UNITS.find(u => u.id === id || u.unitNumber === Number(id));
}

export function getSignById(id: string): ASLSign | undefined {
  return getAllSigns().find(s => s.id === id || s.letter === id);
}

export function getModuleById(id: string): CurriculumModule | undefined {
  return CURRICULUM_MODULES.find(m => m.id === id || m.category === id);
}
