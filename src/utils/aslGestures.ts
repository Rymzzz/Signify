import fp from 'fingerpose';
import { HandLandmark } from '../types/index';

const { GestureDescription, Finger, FingerCurl, FingerDirection, GestureEstimator } = fp;

export { GestureDescription, Finger, FingerCurl, FingerDirection, GestureEstimator };

// Helper to create a new gesture description
function createGesture(name: string): any {
  return new GestureDescription(name);
}

// All curriculum gesture descriptions
const allGestures: any[] = [];

// ==========================================
// ALPHABET (A - Z)
// ==========================================

// --- Sign A: Fist with thumb upright alongside index ---
const signA = createGesture('A');
signA.addCurl(Finger.Thumb, FingerCurl.NoCurl, 1.0);
signA.addDirection(Finger.Thumb, FingerDirection.VerticalUp, 1.0);
signA.addDirection(Finger.Thumb, FingerDirection.DiagonalUpLeft, 0.9);
signA.addDirection(Finger.Thumb, FingerDirection.DiagonalUpRight, 0.9);
for (const f of [Finger.Index, Finger.Middle, Finger.Ring, Finger.Pinky]) {
  signA.addCurl(f, FingerCurl.FullCurl, 1.0);
  signA.addCurl(f, FingerCurl.HalfCurl, 0.4);
}
allGestures.push(signA);

// --- Sign B: 4 fingers upright together, thumb curled across palm ---
const signB = createGesture('B');
signB.addCurl(Finger.Thumb, FingerCurl.FullCurl, 1.0);
signB.addCurl(Finger.Thumb, FingerCurl.HalfCurl, 0.8);
for (const f of [Finger.Index, Finger.Middle, Finger.Ring, Finger.Pinky]) {
  signB.addCurl(f, FingerCurl.NoCurl, 1.0);
  signB.addDirection(f, FingerDirection.VerticalUp, 1.0);
  signB.addDirection(f, FingerDirection.DiagonalUpLeft, 0.7);
  signB.addDirection(f, FingerDirection.DiagonalUpRight, 0.7);
}
allGestures.push(signB);

// --- Sign C: Curved hand forming C shape ---
const signC = createGesture('C');
signC.addCurl(Finger.Thumb, FingerCurl.NoCurl, 0.8);
signC.addCurl(Finger.Thumb, FingerCurl.HalfCurl, 1.0);
for (const f of [Finger.Index, Finger.Middle, Finger.Ring, Finger.Pinky]) {
  signC.addCurl(f, FingerCurl.HalfCurl, 1.0);
  signC.addCurl(f, FingerCurl.NoCurl, 0.4);
}
allGestures.push(signC);

// --- Sign D: Index straight up, middle/ring/pinky touching thumb ---
const signD = createGesture('D');
signD.addCurl(Finger.Index, FingerCurl.NoCurl, 1.0);
signD.addDirection(Finger.Index, FingerDirection.VerticalUp, 1.0);
signD.addCurl(Finger.Thumb, FingerCurl.HalfCurl, 1.0);
signD.addCurl(Finger.Thumb, FingerCurl.FullCurl, 0.8);
for (const f of [Finger.Middle, Finger.Ring, Finger.Pinky]) {
  signD.addCurl(f, FingerCurl.FullCurl, 1.0);
  signD.addCurl(f, FingerCurl.HalfCurl, 0.7);
}
allGestures.push(signD);

// --- Sign E: All fingertips curled down tightly resting on thumb ---
const signE = createGesture('E');
signE.addCurl(Finger.Thumb, FingerCurl.FullCurl, 1.0);
signE.addCurl(Finger.Thumb, FingerCurl.HalfCurl, 0.8);
for (const f of [Finger.Index, Finger.Middle, Finger.Ring, Finger.Pinky]) {
  signE.addCurl(f, FingerCurl.FullCurl, 1.0);
  signE.addCurl(f, FingerCurl.HalfCurl, 0.8);
}
allGestures.push(signE);

// --- Sign F: Index & Thumb pinched in circle, other 3 upright ---
const signF = createGesture('F');
signF.addCurl(Finger.Index, FingerCurl.HalfCurl, 1.0);
signF.addCurl(Finger.Index, FingerCurl.FullCurl, 0.8);
signF.addCurl(Finger.Thumb, FingerCurl.HalfCurl, 1.0);
signF.addCurl(Finger.Thumb, FingerCurl.NoCurl, 0.7);
for (const f of [Finger.Middle, Finger.Ring, Finger.Pinky]) {
  signF.addCurl(f, FingerCurl.NoCurl, 1.0);
  signF.addDirection(f, FingerDirection.VerticalUp, 1.0);
  signF.addDirection(f, FingerDirection.DiagonalUpLeft, 0.7);
  signF.addDirection(f, FingerDirection.DiagonalUpRight, 0.7);
}
allGestures.push(signF);

// --- Sign G: Index pointing horizontal/forward, thumb parallel, other 3 curled ---
const signG = createGesture('G');
signG.addCurl(Finger.Index, FingerCurl.NoCurl, 1.0);
signG.addDirection(Finger.Index, FingerDirection.HorizontalLeft, 1.0);
signG.addDirection(Finger.Index, FingerDirection.HorizontalRight, 1.0);
signG.addDirection(Finger.Index, FingerDirection.DiagonalUpLeft, 0.7);
signG.addDirection(Finger.Index, FingerDirection.DiagonalUpRight, 0.7);
signG.addCurl(Finger.Thumb, FingerCurl.NoCurl, 1.0);
signG.addCurl(Finger.Thumb, FingerCurl.HalfCurl, 0.8);
for (const f of [Finger.Middle, Finger.Ring, Finger.Pinky]) {
  signG.addCurl(f, FingerCurl.FullCurl, 1.0);
  signG.addCurl(f, FingerCurl.HalfCurl, 0.5);
}
allGestures.push(signG);

// --- Sign H: Index & Middle pointing horizontal together, other 2 curled ---
const signH = createGesture('H');
for (const f of [Finger.Index, Finger.Middle]) {
  signH.addCurl(f, FingerCurl.NoCurl, 1.0);
  signH.addDirection(f, FingerDirection.HorizontalLeft, 1.0);
  signH.addDirection(f, FingerDirection.HorizontalRight, 1.0);
  signH.addDirection(f, FingerDirection.DiagonalUpLeft, 0.7);
  signH.addDirection(f, FingerDirection.DiagonalUpRight, 0.7);
}
signH.addCurl(Finger.Thumb, FingerCurl.FullCurl, 1.0);
signH.addCurl(Finger.Thumb, FingerCurl.HalfCurl, 0.8);
signH.addCurl(Finger.Thumb, FingerCurl.NoCurl, 0.5);
for (const f of [Finger.Ring, Finger.Pinky]) {
  signH.addCurl(f, FingerCurl.FullCurl, 1.0);
  signH.addCurl(f, FingerCurl.HalfCurl, 0.5);
}
allGestures.push(signH);

// --- Sign I: Pinky straight up, other 3 curled, thumb folded across ---
const signI = createGesture('I');
signI.addCurl(Finger.Pinky, FingerCurl.NoCurl, 1.0);
signI.addDirection(Finger.Pinky, FingerDirection.VerticalUp, 1.0);
signI.addDirection(Finger.Pinky, FingerDirection.DiagonalUpLeft, 0.7);
signI.addDirection(Finger.Pinky, FingerDirection.DiagonalUpRight, 0.7);
signI.addCurl(Finger.Thumb, FingerCurl.FullCurl, 1.0);
signI.addCurl(Finger.Thumb, FingerCurl.HalfCurl, 0.8);
for (const f of [Finger.Index, Finger.Middle, Finger.Ring]) {
  signI.addCurl(f, FingerCurl.FullCurl, 1.0);
  signI.addCurl(f, FingerCurl.HalfCurl, 0.5);
}
allGestures.push(signI);

// --- Sign J: Pinky extended (base for dynamic J) ---
const signJ = createGesture('J');
signJ.addCurl(Finger.Pinky, FingerCurl.NoCurl, 1.0);
signJ.addCurl(Finger.Thumb, FingerCurl.FullCurl, 1.0);
signJ.addCurl(Finger.Thumb, FingerCurl.HalfCurl, 0.8);
for (const f of [Finger.Index, Finger.Middle, Finger.Ring]) {
  signJ.addCurl(f, FingerCurl.FullCurl, 1.0);
  signJ.addCurl(f, FingerCurl.HalfCurl, 0.5);
}
allGestures.push(signJ);

// --- Sign K: Index upright, middle angled forward/upward, thumb between them ---
const signK = createGesture('K');
signK.addCurl(Finger.Index, FingerCurl.NoCurl, 1.0);
signK.addDirection(Finger.Index, FingerDirection.VerticalUp, 1.0);
signK.addCurl(Finger.Middle, FingerCurl.NoCurl, 1.0);
signK.addCurl(Finger.Middle, FingerCurl.HalfCurl, 0.8);
signK.addDirection(Finger.Middle, FingerDirection.VerticalUp, 1.0);
signK.addDirection(Finger.Middle, FingerDirection.DiagonalUpLeft, 0.8);
signK.addDirection(Finger.Middle, FingerDirection.DiagonalUpRight, 0.8);
signK.addCurl(Finger.Thumb, FingerCurl.NoCurl, 1.0);
signK.addCurl(Finger.Thumb, FingerCurl.HalfCurl, 0.8);
for (const f of [Finger.Ring, Finger.Pinky]) {
  signK.addCurl(f, FingerCurl.FullCurl, 1.0);
  signK.addCurl(f, FingerCurl.HalfCurl, 0.5);
}
allGestures.push(signK);

// --- Sign L: Index upright, thumb pointing horizontal (90 deg L-shape) ---
const signL = createGesture('L');
signL.addCurl(Finger.Index, FingerCurl.NoCurl, 1.0);
signL.addDirection(Finger.Index, FingerDirection.VerticalUp, 1.0);
signL.addCurl(Finger.Thumb, FingerCurl.NoCurl, 1.0);
signL.addDirection(Finger.Thumb, FingerDirection.HorizontalLeft, 1.0);
signL.addDirection(Finger.Thumb, FingerDirection.HorizontalRight, 1.0);
signL.addDirection(Finger.Thumb, FingerDirection.DiagonalUpLeft, 0.7);
signL.addDirection(Finger.Thumb, FingerDirection.DiagonalUpRight, 0.7);
for (const f of [Finger.Middle, Finger.Ring, Finger.Pinky]) {
  signL.addCurl(f, FingerCurl.FullCurl, 1.0);
  signL.addCurl(f, FingerCurl.HalfCurl, 0.5);
}
allGestures.push(signL);

// --- Sign M: Thumb under 3 fingers (index, middle, ring) ---
const signM = createGesture('M');
signM.addCurl(Finger.Thumb, FingerCurl.FullCurl, 1.0);
signM.addCurl(Finger.Thumb, FingerCurl.HalfCurl, 0.8);
for (const f of [Finger.Index, Finger.Middle, Finger.Ring, Finger.Pinky]) {
  signM.addCurl(f, FingerCurl.FullCurl, 1.0);
  signM.addCurl(f, FingerCurl.HalfCurl, 0.6);
}
allGestures.push(signM);

// --- Sign N: Thumb under 2 fingers (index, middle) ---
const signN = createGesture('N');
signN.addCurl(Finger.Thumb, FingerCurl.FullCurl, 1.0);
signN.addCurl(Finger.Thumb, FingerCurl.HalfCurl, 0.8);
for (const f of [Finger.Index, Finger.Middle, Finger.Ring, Finger.Pinky]) {
  signN.addCurl(f, FingerCurl.FullCurl, 1.0);
  signN.addCurl(f, FingerCurl.HalfCurl, 0.6);
}
allGestures.push(signN);

// --- Sign O: All fingers curved to meet thumb tip in a circle ---
const signO = createGesture('O');
signO.addCurl(Finger.Thumb, FingerCurl.HalfCurl, 1.0);
for (const f of [Finger.Index, Finger.Middle, Finger.Ring, Finger.Pinky]) {
  signO.addCurl(f, FingerCurl.HalfCurl, 1.0);
  signO.addCurl(f, FingerCurl.FullCurl, 0.4);
}
allGestures.push(signO);

// --- Sign P: Downward K (index forward/down, middle down, thumb between) ---
const signP = createGesture('P');
signP.addCurl(Finger.Index, FingerCurl.NoCurl, 1.0);
signP.addDirection(Finger.Index, FingerDirection.HorizontalLeft, 1.0);
signP.addDirection(Finger.Index, FingerDirection.HorizontalRight, 1.0);
signP.addDirection(Finger.Index, FingerDirection.DiagonalDownLeft, 1.0);
signP.addDirection(Finger.Index, FingerDirection.DiagonalDownRight, 1.0);
signP.addDirection(Finger.Index, FingerDirection.VerticalDown, 0.8);
signP.addCurl(Finger.Middle, FingerCurl.NoCurl, 1.0);
signP.addCurl(Finger.Middle, FingerCurl.HalfCurl, 0.8);
signP.addDirection(Finger.Middle, FingerDirection.VerticalDown, 1.0);
signP.addDirection(Finger.Middle, FingerDirection.DiagonalDownLeft, 0.8);
signP.addDirection(Finger.Middle, FingerDirection.DiagonalDownRight, 0.8);
signP.addCurl(Finger.Thumb, FingerCurl.NoCurl, 1.0);
signP.addCurl(Finger.Thumb, FingerCurl.HalfCurl, 0.8);
for (const f of [Finger.Ring, Finger.Pinky]) {
  signP.addCurl(f, FingerCurl.FullCurl, 1.0);
  signP.addCurl(f, FingerCurl.HalfCurl, 0.5);
}
allGestures.push(signP);

// --- Sign Q: Downward G (index and thumb pointing downward) ---
const signQ = createGesture('Q');
signQ.addCurl(Finger.Index, FingerCurl.NoCurl, 1.0);
signQ.addDirection(Finger.Index, FingerDirection.VerticalDown, 1.0);
signQ.addDirection(Finger.Index, FingerDirection.DiagonalDownLeft, 0.8);
signQ.addDirection(Finger.Index, FingerDirection.DiagonalDownRight, 0.8);
signQ.addCurl(Finger.Thumb, FingerCurl.NoCurl, 1.0);
signQ.addCurl(Finger.Thumb, FingerCurl.HalfCurl, 0.8);
signQ.addDirection(Finger.Thumb, FingerDirection.VerticalDown, 1.0);
signQ.addDirection(Finger.Thumb, FingerDirection.DiagonalDownLeft, 0.8);
signQ.addDirection(Finger.Thumb, FingerDirection.DiagonalDownRight, 0.8);
for (const f of [Finger.Middle, Finger.Ring, Finger.Pinky]) {
  signQ.addCurl(f, FingerCurl.FullCurl, 1.0);
  signQ.addCurl(f, FingerCurl.HalfCurl, 0.5);
}
allGestures.push(signQ);

// --- Sign R: Index and middle upright and crossed over each other ---
const signR = createGesture('R');
for (const f of [Finger.Index, Finger.Middle]) {
  signR.addCurl(f, FingerCurl.NoCurl, 1.0);
  signR.addDirection(f, FingerDirection.VerticalUp, 1.0);
  signR.addDirection(f, FingerDirection.DiagonalUpLeft, 0.7);
  signR.addDirection(f, FingerDirection.DiagonalUpRight, 0.7);
}
signR.addCurl(Finger.Thumb, FingerCurl.FullCurl, 1.0);
signR.addCurl(Finger.Thumb, FingerCurl.HalfCurl, 0.8);
for (const f of [Finger.Ring, Finger.Pinky]) {
  signR.addCurl(f, FingerCurl.FullCurl, 1.0);
  signR.addCurl(f, FingerCurl.HalfCurl, 0.5);
}
allGestures.push(signR);

// --- Sign S: Tight fist with thumb wrapped across front knuckles ---
const signS = createGesture('S');
signS.addCurl(Finger.Thumb, FingerCurl.FullCurl, 1.0);
signS.addCurl(Finger.Thumb, FingerCurl.HalfCurl, 0.8);
signS.addDirection(Finger.Thumb, FingerDirection.HorizontalLeft, 1.0);
signS.addDirection(Finger.Thumb, FingerDirection.HorizontalRight, 1.0);
signS.addDirection(Finger.Thumb, FingerDirection.DiagonalUpLeft, 0.7);
signS.addDirection(Finger.Thumb, FingerDirection.DiagonalUpRight, 0.7);
for (const f of [Finger.Index, Finger.Middle, Finger.Ring, Finger.Pinky]) {
  signS.addCurl(f, FingerCurl.FullCurl, 1.0);
  signS.addCurl(f, FingerCurl.HalfCurl, 0.4);
}
allGestures.push(signS);

// --- Sign T: Thumb tucked between index and middle fingers in fist ---
const signT = createGesture('T');
signT.addCurl(Finger.Thumb, FingerCurl.HalfCurl, 1.0);
signT.addCurl(Finger.Thumb, FingerCurl.NoCurl, 0.8);
for (const f of [Finger.Index, Finger.Middle, Finger.Ring, Finger.Pinky]) {
  signT.addCurl(f, FingerCurl.FullCurl, 1.0);
  signT.addCurl(f, FingerCurl.HalfCurl, 0.5);
}
allGestures.push(signT);

// --- Sign U: Index and middle upright together, other 2 curled ---
const signU = createGesture('U');
for (const f of [Finger.Index, Finger.Middle]) {
  signU.addCurl(f, FingerCurl.NoCurl, 1.0);
  signU.addDirection(f, FingerDirection.VerticalUp, 1.0);
  signU.addDirection(f, FingerDirection.DiagonalUpLeft, 0.6);
  signU.addDirection(f, FingerDirection.DiagonalUpRight, 0.6);
}
signU.addCurl(Finger.Thumb, FingerCurl.FullCurl, 1.0);
signU.addCurl(Finger.Thumb, FingerCurl.HalfCurl, 0.8);
for (const f of [Finger.Ring, Finger.Pinky]) {
  signU.addCurl(f, FingerCurl.FullCurl, 1.0);
  signU.addCurl(f, FingerCurl.HalfCurl, 0.5);
}
allGestures.push(signU);

// --- Sign V: Index and middle upright spread (peace sign) ---
const signV = createGesture('V');
for (const f of [Finger.Index, Finger.Middle]) {
  signV.addCurl(f, FingerCurl.NoCurl, 1.0);
  signV.addDirection(f, FingerDirection.VerticalUp, 1.0);
  signV.addDirection(f, FingerDirection.DiagonalUpLeft, 0.8);
  signV.addDirection(f, FingerDirection.DiagonalUpRight, 0.8);
}
signV.addCurl(Finger.Thumb, FingerCurl.FullCurl, 1.0);
signV.addCurl(Finger.Thumb, FingerCurl.HalfCurl, 0.8);
for (const f of [Finger.Ring, Finger.Pinky]) {
  signV.addCurl(f, FingerCurl.FullCurl, 1.0);
  signV.addCurl(f, FingerCurl.HalfCurl, 0.5);
}
allGestures.push(signV);

// --- Sign W: Index, middle, ring upright spread, pinky curled ---
const signW = createGesture('W');
for (const f of [Finger.Index, Finger.Middle, Finger.Ring]) {
  signW.addCurl(f, FingerCurl.NoCurl, 1.0);
  signW.addDirection(f, FingerDirection.VerticalUp, 1.0);
  signW.addDirection(f, FingerDirection.DiagonalUpLeft, 0.8);
  signW.addDirection(f, FingerDirection.DiagonalUpRight, 0.8);
}
signW.addCurl(Finger.Pinky, FingerCurl.FullCurl, 1.0);
signW.addCurl(Finger.Pinky, FingerCurl.HalfCurl, 0.5);
signW.addCurl(Finger.Thumb, FingerCurl.FullCurl, 1.0);
signW.addCurl(Finger.Thumb, FingerCurl.HalfCurl, 0.8);
allGestures.push(signW);

// --- Sign X: Index finger hooked, other 3 curled into fist ---
const signX = createGesture('X');
signX.addCurl(Finger.Index, FingerCurl.HalfCurl, 1.0);
signX.addDirection(Finger.Index, FingerDirection.VerticalUp, 1.0);
signX.addDirection(Finger.Index, FingerDirection.DiagonalUpLeft, 0.8);
signX.addDirection(Finger.Index, FingerDirection.DiagonalUpRight, 0.8);
signX.addCurl(Finger.Thumb, FingerCurl.FullCurl, 1.0);
signX.addCurl(Finger.Thumb, FingerCurl.HalfCurl, 0.8);
for (const f of [Finger.Middle, Finger.Ring, Finger.Pinky]) {
  signX.addCurl(f, FingerCurl.FullCurl, 1.0);
  signX.addCurl(f, FingerCurl.HalfCurl, 0.5);
}
allGestures.push(signX);

// --- Sign Y: Thumb and pinky extended, middle 3 curled (hang loose) ---
const signY = createGesture('Y');
signY.addCurl(Finger.Thumb, FingerCurl.NoCurl, 1.0);
signY.addDirection(Finger.Thumb, FingerDirection.HorizontalLeft, 1.0);
signY.addDirection(Finger.Thumb, FingerDirection.HorizontalRight, 1.0);
signY.addDirection(Finger.Thumb, FingerDirection.DiagonalUpLeft, 0.9);
signY.addDirection(Finger.Thumb, FingerDirection.DiagonalUpRight, 0.9);
signY.addCurl(Finger.Pinky, FingerCurl.NoCurl, 1.0);
signY.addDirection(Finger.Pinky, FingerDirection.VerticalUp, 1.0);
signY.addDirection(Finger.Pinky, FingerDirection.DiagonalUpLeft, 0.9);
signY.addDirection(Finger.Pinky, FingerDirection.DiagonalUpRight, 0.9);
for (const f of [Finger.Index, Finger.Middle, Finger.Ring]) {
  signY.addCurl(f, FingerCurl.FullCurl, 1.0);
  signY.addCurl(f, FingerCurl.HalfCurl, 0.5);
}
allGestures.push(signY);

// --- Sign Z: Index finger extended (base for dynamic zigzag) ---
const signZ = createGesture('Z');
signZ.addCurl(Finger.Index, FingerCurl.NoCurl, 1.0);
signZ.addCurl(Finger.Thumb, FingerCurl.FullCurl, 1.0);
signZ.addCurl(Finger.Thumb, FingerCurl.HalfCurl, 0.8);
for (const f of [Finger.Middle, Finger.Ring, Finger.Pinky]) {
  signZ.addCurl(f, FingerCurl.FullCurl, 1.0);
  signZ.addCurl(f, FingerCurl.HalfCurl, 0.5);
}
allGestures.push(signZ);

// ==========================================
// NUMBERS (0 - 10)
// ==========================================

// --- Number 0: Same as O ---
const num0 = createGesture('0');
num0.addCurl(Finger.Thumb, FingerCurl.HalfCurl, 1.0);
for (const f of [Finger.Index, Finger.Middle, Finger.Ring, Finger.Pinky]) {
  num0.addCurl(f, FingerCurl.HalfCurl, 1.0);
}
allGestures.push(num0);

// --- Number 1: Index upright, thumb locks other 3 curled ---
const num1 = createGesture('1');
num1.addCurl(Finger.Index, FingerCurl.NoCurl, 1.0);
num1.addDirection(Finger.Index, FingerDirection.VerticalUp, 1.0);
num1.addCurl(Finger.Thumb, FingerCurl.FullCurl, 1.0);
num1.addCurl(Finger.Thumb, FingerCurl.HalfCurl, 0.8);
for (const f of [Finger.Middle, Finger.Ring, Finger.Pinky]) {
  num1.addCurl(f, FingerCurl.FullCurl, 1.0);
}
allGestures.push(num1);

// --- Number 2: Index and middle upright spread (V-shape) ---
const num2 = createGesture('2');
for (const f of [Finger.Index, Finger.Middle]) {
  num2.addCurl(f, FingerCurl.NoCurl, 1.0);
  num2.addDirection(f, FingerDirection.VerticalUp, 1.0);
}
num2.addCurl(Finger.Thumb, FingerCurl.FullCurl, 1.0);
num2.addCurl(Finger.Thumb, FingerCurl.HalfCurl, 0.8);
for (const f of [Finger.Ring, Finger.Pinky]) {
  num2.addCurl(f, FingerCurl.FullCurl, 1.0);
}
allGestures.push(num2);

// --- Number 3: Thumb, Index, Middle extended; Ring, Pinky curled ---
const num3 = createGesture('3');
num3.addCurl(Finger.Thumb, FingerCurl.NoCurl, 1.0);
num3.addCurl(Finger.Index, FingerCurl.NoCurl, 1.0);
num3.addDirection(Finger.Index, FingerDirection.VerticalUp, 1.0);
num3.addCurl(Finger.Middle, FingerCurl.NoCurl, 1.0);
num3.addDirection(Finger.Middle, FingerDirection.VerticalUp, 1.0);
for (const f of [Finger.Ring, Finger.Pinky]) {
  num3.addCurl(f, FingerCurl.FullCurl, 1.0);
}
allGestures.push(num3);

// --- Number 4: 4 fingers upright; thumb curled across palm ---
const num4 = createGesture('4');
num4.addCurl(Finger.Thumb, FingerCurl.FullCurl, 1.0);
num4.addCurl(Finger.Thumb, FingerCurl.HalfCurl, 0.8);
for (const f of [Finger.Index, Finger.Middle, Finger.Ring, Finger.Pinky]) {
  num4.addCurl(f, FingerCurl.NoCurl, 1.0);
  num4.addDirection(f, FingerDirection.VerticalUp, 1.0);
}
allGestures.push(num4);

// --- Number 5: All 5 fingers extended open hand ---
const num5 = createGesture('5');
for (const f of [Finger.Thumb, Finger.Index, Finger.Middle, Finger.Ring, Finger.Pinky]) {
  num5.addCurl(f, FingerCurl.NoCurl, 1.0);
}
allGestures.push(num5);

// --- Number 6: Index, Middle, Ring upright; Pinky and Thumb touching ---
const num6 = createGesture('6');
for (const f of [Finger.Index, Finger.Middle, Finger.Ring]) {
  num6.addCurl(f, FingerCurl.NoCurl, 1.0);
  num6.addDirection(f, FingerDirection.VerticalUp, 1.0);
}
num6.addCurl(Finger.Pinky, FingerCurl.HalfCurl, 1.0);
num6.addCurl(Finger.Pinky, FingerCurl.FullCurl, 0.8);
num6.addCurl(Finger.Thumb, FingerCurl.HalfCurl, 1.0);
num6.addCurl(Finger.Thumb, FingerCurl.FullCurl, 0.8);
allGestures.push(num6);

// --- Number 7: Index, Middle, Pinky upright; Ring and Thumb touching ---
const num7 = createGesture('7');
for (const f of [Finger.Index, Finger.Middle, Finger.Pinky]) {
  num7.addCurl(f, FingerCurl.NoCurl, 1.0);
  num7.addDirection(f, FingerDirection.VerticalUp, 1.0);
}
num7.addCurl(Finger.Ring, FingerCurl.HalfCurl, 1.0);
num7.addCurl(Finger.Ring, FingerCurl.FullCurl, 0.8);
num7.addCurl(Finger.Thumb, FingerCurl.HalfCurl, 1.0);
num7.addCurl(Finger.Thumb, FingerCurl.FullCurl, 0.8);
allGestures.push(num7);

// --- Number 8: Index, Ring, Pinky upright; Middle and Thumb touching ---
const num8 = createGesture('8');
for (const f of [Finger.Index, Finger.Ring, Finger.Pinky]) {
  num8.addCurl(f, FingerCurl.NoCurl, 1.0);
  num8.addDirection(f, FingerDirection.VerticalUp, 1.0);
}
num8.addCurl(Finger.Middle, FingerCurl.HalfCurl, 1.0);
num8.addCurl(Finger.Middle, FingerCurl.FullCurl, 0.8);
num8.addCurl(Finger.Thumb, FingerCurl.HalfCurl, 1.0);
num8.addCurl(Finger.Thumb, FingerCurl.FullCurl, 0.8);
allGestures.push(num8);

// --- Number 9: Middle, Ring, Pinky upright; Index and Thumb touching (like F) ---
const num9 = createGesture('9');
for (const f of [Finger.Middle, Finger.Ring, Finger.Pinky]) {
  num9.addCurl(f, FingerCurl.NoCurl, 1.0);
  num9.addDirection(f, FingerDirection.VerticalUp, 1.0);
}
num9.addCurl(Finger.Index, FingerCurl.HalfCurl, 1.0);
num9.addCurl(Finger.Index, FingerCurl.FullCurl, 0.8);
num9.addCurl(Finger.Thumb, FingerCurl.HalfCurl, 1.0);
num9.addCurl(Finger.Thumb, FingerCurl.FullCurl, 0.8);
allGestures.push(num9);

// --- Number 10: Fist with thumb upright (thumbs up) ---
const num10 = createGesture('10');
num10.addCurl(Finger.Thumb, FingerCurl.NoCurl, 1.0);
num10.addDirection(Finger.Thumb, FingerDirection.VerticalUp, 1.0);
for (const f of [Finger.Index, Finger.Middle, Finger.Ring, Finger.Pinky]) {
  num10.addCurl(f, FingerCurl.FullCurl, 1.0);
}
allGestures.push(num10);

// ==========================================
// WORDS & GREETINGS
// ==========================================

// --- HELLO: Open palm wave / salute ---
const wordHello = createGesture('HELLO');
for (const f of [Finger.Thumb, Finger.Index, Finger.Middle, Finger.Ring, Finger.Pinky]) {
  wordHello.addCurl(f, FingerCurl.NoCurl, 1.0);
}
allGestures.push(wordHello);

// --- THANK YOU: Open palm ---
const wordThankYou = createGesture('THANK YOU');
for (const f of [Finger.Thumb, Finger.Index, Finger.Middle, Finger.Ring, Finger.Pinky]) {
  wordThankYou.addCurl(f, FingerCurl.NoCurl, 1.0);
}
allGestures.push(wordThankYou);

// --- YES: Fist nodding ---
const wordYes = createGesture('YES');
for (const f of [Finger.Index, Finger.Middle, Finger.Ring, Finger.Pinky]) {
  wordYes.addCurl(f, FingerCurl.FullCurl, 1.0);
}
wordYes.addCurl(Finger.Thumb, FingerCurl.NoCurl, 0.9);
wordYes.addCurl(Finger.Thumb, FingerCurl.HalfCurl, 0.9);
allGestures.push(wordYes);

// --- NO: Index and Middle snap down to Thumb ---
const wordNo = createGesture('NO');
wordNo.addCurl(Finger.Index, FingerCurl.HalfCurl, 1.0);
wordNo.addCurl(Finger.Middle, FingerCurl.HalfCurl, 1.0);
wordNo.addCurl(Finger.Thumb, FingerCurl.HalfCurl, 1.0);
for (const f of [Finger.Ring, Finger.Pinky]) {
  wordNo.addCurl(f, FingerCurl.FullCurl, 1.0);
}
allGestures.push(wordNo);

// --- PLEASE: Flat open palm on chest ---
const wordPlease = createGesture('PLEASE');
for (const f of [Finger.Thumb, Finger.Index, Finger.Middle, Finger.Ring, Finger.Pinky]) {
  wordPlease.addCurl(f, FingerCurl.NoCurl, 1.0);
}
allGestures.push(wordPlease);

// --- SORRY: A fist on chest ---
const wordSorry = createGesture('SORRY');
wordSorry.addCurl(Finger.Thumb, FingerCurl.NoCurl, 1.0);
wordSorry.addCurl(Finger.Thumb, FingerCurl.HalfCurl, 0.8);
for (const f of [Finger.Index, Finger.Middle, Finger.Ring, Finger.Pinky]) {
  wordSorry.addCurl(f, FingerCurl.FullCurl, 1.0);
}
allGestures.push(wordSorry);

// --- HELP: Fist with thumb upright (thumbs up) ---
const wordHelp = createGesture('HELP');
wordHelp.addCurl(Finger.Thumb, FingerCurl.NoCurl, 1.0);
wordHelp.addDirection(Finger.Thumb, FingerDirection.VerticalUp, 1.0);
for (const f of [Finger.Index, Finger.Middle, Finger.Ring, Finger.Pinky]) {
  wordHelp.addCurl(f, FingerCurl.FullCurl, 1.0);
}
allGestures.push(wordHelp);

// --- MORE: Fingertips together (all fingers HalfCurl) ---
const wordMore = createGesture('MORE');
for (const f of [Finger.Thumb, Finger.Index, Finger.Middle, Finger.Ring, Finger.Pinky]) {
  wordMore.addCurl(f, FingerCurl.HalfCurl, 1.0);
}
allGestures.push(wordMore);

// --- I LOVE YOU: Thumb, Index, Pinky extended; Middle, Ring curled ---
const wordILY = createGesture('I LOVE YOU');
wordILY.addCurl(Finger.Thumb, FingerCurl.NoCurl, 1.0);
wordILY.addCurl(Finger.Index, FingerCurl.NoCurl, 1.0);
wordILY.addDirection(Finger.Index, FingerDirection.VerticalUp, 1.0);
wordILY.addCurl(Finger.Pinky, FingerCurl.NoCurl, 1.0);
wordILY.addDirection(Finger.Pinky, FingerDirection.VerticalUp, 1.0);
for (const f of [Finger.Middle, Finger.Ring]) {
  wordILY.addCurl(f, FingerCurl.FullCurl, 1.0);
}
allGestures.push(wordILY);

// --- WATER: W-hand (Index, Middle, Ring upright; Pinky curled; Thumb curled) ---
const wordWater = createGesture('WATER');
for (const f of [Finger.Index, Finger.Middle, Finger.Ring]) {
  wordWater.addCurl(f, FingerCurl.NoCurl, 1.0);
  wordWater.addDirection(f, FingerDirection.VerticalUp, 1.0);
}
wordWater.addCurl(Finger.Pinky, FingerCurl.FullCurl, 1.0);
wordWater.addCurl(Finger.Thumb, FingerCurl.FullCurl, 1.0);
wordWater.addCurl(Finger.Thumb, FingerCurl.HalfCurl, 0.8);
allGestures.push(wordWater);

// Instantiate the global GestureEstimator
export const aslGestureEstimator = new GestureEstimator(allGestures);

// Bilateral estimation helper that evaluates both original and horizontally reflected landmarks
export function estimateASLGesturesBilateral(
  landmarks: HandLandmark[],
  minConfidence: number = 6.0
): {
  scores: Record<string, number>;
  topMatch: { name: string; score: number } | null;
  poseData: [string, string, string][];
} {
  if (!landmarks || landmarks.length < 21) {
    return { scores: {}, topMatch: null, poseData: [] };
  }

  const normalPoints = landmarks.map(p => [p.x, p.y, p.z || 0]);
  const flippedPoints = landmarks.map(p => [1 - p.x, p.y, p.z || 0]);

  const resNormal = aslGestureEstimator.estimate(normalPoints, 1.0);
  const resFlipped = aslGestureEstimator.estimate(flippedPoints, 1.0);

  const scores: Record<string, number> = {};

  if (resNormal && resNormal.gestures) {
    for (const g of resNormal.gestures) {
      scores[g.name] = Math.max(scores[g.name] || 0, g.score);
    }
  }

  if (resFlipped && resFlipped.gestures) {
    for (const g of resFlipped.gestures) {
      scores[g.name] = Math.max(scores[g.name] || 0, g.score);
    }
  }

  let topMatch: { name: string; score: number } | null = null;
  for (const [name, score] of Object.entries(scores)) {
    if (score >= minConfidence) {
      if (!topMatch || score > topMatch.score) {
        topMatch = { name, score };
      }
    }
  }

  return {
    scores,
    topMatch,
    poseData: resNormal?.poseData || [],
  };
}
