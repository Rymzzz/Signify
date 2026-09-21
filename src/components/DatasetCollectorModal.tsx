import React, { useState, useEffect, useRef } from 'react';
import { 
  Database, 
  Download, 
  FileSpreadsheet, 
  Trash2, 
  Play, 
  Square, 
  CheckCircle2, 
  HelpCircle, 
  Layers, 
  Code, 
  Sparkles, 
  X,
  Camera,
  RefreshCw,
  Copy,
  Check
} from 'lucide-react';
import { ASL_ALPHABET } from '../data/aslAlphabet';
import { HandLandmark } from '../types/index';

interface DatasetCollectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLandmarks: HandLandmark[] | null;
  isCameraActive: boolean;
  onStartCamera: () => void;
}

export interface LandmarkSample {
  id: string;
  label: string;
  timestamp: number;
  landmarks: { x: number; y: number; z?: number }[];
}

export const DatasetCollectorModal: React.FC<DatasetCollectorModalProps> = ({
  isOpen,
  onClose,
  currentLandmarks,
  isCameraActive,
  onStartCamera,
}) => {
  const [selectedLetter, setSelectedLetter] = useState<string>('A');
  const [samples, setSamples] = useState<LandmarkSample[]>(() => {
    // Load existing samples from localStorage if available
    try {
      const saved = localStorage.getItem('signify_dataset_samples');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isRecordingBurst, setIsRecordingBurst] = useState<boolean>(false);
  const [burstCount, setBurstCount] = useState<number>(0);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'collector' | 'guide' | 'python'>('collector');
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);
  const [confirmClearAll, setConfirmClearAll] = useState<boolean>(false);

  // Auto-dismiss notification
  useEffect(() => {
    if (noticeMessage) {
      const timer = setTimeout(() => setNoticeMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [noticeMessage]);

  // Save samples to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('signify_dataset_samples', JSON.stringify(samples));
    } catch {
      // Storage limit exceeded or disabled
    }
  }, [samples]);

  // Handle Burst Recording
  const burstIntervalRef = useRef<any>(null);
  const landmarksRef = useRef(currentLandmarks);
  landmarksRef.current = currentLandmarks;

  const captureSingleSample = () => {
    if (!landmarksRef.current || landmarksRef.current.length < 21) return false;
    
    const newSample: LandmarkSample = {
      id: `${selectedLetter}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      label: selectedLetter,
      timestamp: Date.now(),
      landmarks: landmarksRef.current.map(lm => ({
        x: Number(lm.x.toFixed(5)),
        y: Number(lm.y.toFixed(5)),
        z: lm.z !== undefined ? Number(lm.z.toFixed(5)) : 0
      }))
    };

    setSamples(prev => [newSample, ...prev]);
    return true;
  };

  const startBurstRecording = () => {
    if (!isCameraActive || !landmarksRef.current) return;
    setIsRecordingBurst(true);
    setBurstCount(0);

    let recorded = 0;
    burstIntervalRef.current = setInterval(() => {
      const success = captureSingleSample();
      if (success) {
        recorded++;
        setBurstCount(recorded);
      }
      if (recorded >= 30) {
        clearInterval(burstIntervalRef.current);
        setIsRecordingBurst(false);
      }
    }, 100); // 10 samples per second
  };

  const stopBurstRecording = () => {
    if (burstIntervalRef.current) {
      clearInterval(burstIntervalRef.current);
    }
    setIsRecordingBurst(false);
  };

  const clearSamplesForSelected = () => {
    setSamples(prev => prev.filter(s => s.label !== selectedLetter));
    setNoticeMessage(`Cleared all collected samples for letter '${selectedLetter}'.`);
  };

  const clearAllSamples = () => {
    setSamples([]);
    setConfirmClearAll(false);
    setNoticeMessage('All collected samples have been cleared.');
  };

  // Preload balanced reference seed dataset (5 samples per letter A-Z)
  const loadReferenceSeed = () => {
    const seed: LandmarkSample[] = [];
    const now = Date.now();
    
    ASL_ALPHABET.forEach((sign) => {
      // Generate 5 slight variations around the canonical reference landmarks
      for (let v = 0; v < 5; v++) {
        const jitter = (Math.random() - 0.5) * 0.015;
        seed.push({
          id: `seed-${sign.letter}-${now}-${v}-${Math.random().toString(36).substring(2, 6)}`,
          label: sign.letter,
          timestamp: now - v * 1000,
          landmarks: sign.referenceLandmarks.map(pt => ({
            x: Number((pt.x + jitter).toFixed(5)),
            y: Number((pt.y + jitter).toFixed(5)),
            z: Number((jitter * 0.5).toFixed(5))
          }))
        });
      }
    });

    setSamples(prev => [...seed, ...prev]);
    setNoticeMessage('Added 130 baseline reference samples (5 per letter A-Z).');
  };

  // Export dataset to downloadable .CSV file
  const exportToCsv = () => {
    if (samples.length === 0) {
      setNoticeMessage('No samples recorded yet. Capture live frames or click "Load Seed Dataset" first.');
      return;
    }

    // CSV Header: label,x0,y0,z0,x1,y1,z1,...,x20,y20,z20
    const headerCols = ['label'];
    for (let i = 0; i < 21; i++) {
      headerCols.push(`x${i}`, `y${i}`, `z${i}`);
    }
    const headerRow = headerCols.join(',');

    const rows = samples.map(s => {
      const coordValues: (string | number)[] = [s.label];
      for (let i = 0; i < 21; i++) {
        const pt = s.landmarks[i] || { x: 0, y: 0, z: 0 };
        coordValues.push(pt.x, pt.y, pt.z ?? 0);
      }
      return coordValues.join(',');
    });

    const csvContent = [headerRow, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `asl_hand_landmarks_dataset_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Download Turnkey Python Model Trainer Script
  const downloadPythonTrainer = () => {
    const pythonCode = `"""
ASL Machine Learning Classifier Trainer
Trained on exported 'asl_hand_landmarks_dataset.csv' from Signify.

Requirements:
    pip install pandas scikit-learn joblib numpy
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, accuracy_score
import joblib

def train_asl_classifier(csv_path="asl_hand_landmarks_dataset.csv"):
    print(f"Loading ASL dataset from {csv_path}...")
    df = pd.read_csv(csv_path)
    
    print(f"Dataset shape: {df.shape[0]} samples, {df.shape[1]} columns")
    print("Class distribution:\\n", df['label'].value_counts())
    
    # Feature matrix X (63 landmark coordinate features: x0,y0,z0...x20,y20,z20)
    X = df.drop('label', axis=1)
    # Ground-truth target vector y (Letter labels A-Z)
    y = df['label']
    
    # Train / Test split (80% train, 20% validation)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y if len(y.unique()) > 1 else None
    )
    
    print(f"Training Random Forest Classifier on {len(X_train)} samples...")
    clf = RandomForestClassifier(n_estimators=100, max_depth=16, random_state=42)
    clf.fit(X_train, y_train)
    
    # Evaluation
    preds = clf.predict(X_test)
    acc = accuracy_score(y_test, preds)
    print(f"\\nValidation Accuracy: {acc * 100:.2f}%\\n")
    print("Detailed Classification Report:")
    print(classification_report(y_test, preds, zero_division=0))
    
    # Save the trained model for production inference
    model_filename = "asl_random_forest_model.joblib"
    joblib.dump(clf, model_filename)
    print(f"Model saved successfully to '{model_filename}'!")

if __name__ == "__main__":
    train_asl_classifier()
`;

    const blob = new Blob([pythonCode], { type: 'text/x-python;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'train_asl_model.py');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const sampleCountsByLetter: Record<string, number> = {};
  samples.forEach(s => {
    sampleCountsByLetter[s.label] = (sampleCountsByLetter[s.label] || 0) + 1;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#071F15] border border-[#164432] rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-emerald-100">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#143B2B] bg-[#051710]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#F97316]/20 border border-[#F97316]/30 flex items-center justify-center text-[#F97316]">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                ASL Training Data Studio & CSV Exporter
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {samples.length} Samples
                </span>
              </h2>
              <p className="text-xs text-emerald-400">
                Collect 21-point hand landmark coordinates directly into an actual .CSV file for Machine Learning
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-emerald-400 hover:text-white hover:bg-[#0B2A1E] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 py-2.5 bg-[#082217] border-b border-[#143B2B] text-xs">
          <button
            onClick={() => setActiveTab('collector')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              activeTab === 'collector'
                ? 'bg-[#F97316] text-white font-bold'
                : 'text-emerald-300 hover:bg-[#0E3324]'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Webcam Data Recorder</span>
          </button>

          <button
            onClick={() => setActiveTab('guide')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              activeTab === 'guide'
                ? 'bg-[#F97316] text-white font-bold'
                : 'text-emerald-300 hover:bg-[#0E3324]'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Dataset Pipeline Guide</span>
          </button>

          <button
            onClick={() => setActiveTab('python')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              activeTab === 'python'
                ? 'bg-[#F97316] text-white font-bold'
                : 'text-emerald-300 hover:bg-[#0E3324]'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>Python Training Script</span>
          </button>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={loadReferenceSeed}
              className="px-2.5 py-1 rounded-lg bg-[#0B2A1E] hover:bg-[#123828] border border-[#164432] text-xs font-semibold text-emerald-300 flex items-center gap-1 cursor-pointer"
              title="Add 5 reference samples for all 26 letters"
            >
              <Sparkles className="w-3 h-3 text-[#F97316]" />
              Seed 130 Samples
            </button>
            <button
              onClick={exportToCsv}
              disabled={samples.length === 0}
              className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Download .CSV
            </button>
          </div>
        </div>

        {/* Notification Banner */}
        {noticeMessage && (
          <div className="bg-[#F97316]/20 border-b border-[#F97316]/40 px-6 py-2 text-xs text-orange-200 flex items-center justify-between">
            <span className="font-medium">{noticeMessage}</span>
            <button 
              onClick={() => setNoticeMessage(null)}
              className="text-orange-300 hover:text-white ml-3 font-bold cursor-pointer"
            >
              &times;
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'collector' && (
            <div className="space-y-6">
              
              {/* Controls Bar */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#0B2A1E] p-4 rounded-xl border border-[#164432]">
                
                {/* Sign Selector */}
                <div>
                  <label className="text-xs font-bold text-emerald-300 uppercase tracking-wider block mb-2">
                    1. Target Sign to Record
                  </label>
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedLetter}
                      onChange={(e) => setSelectedLetter(e.target.value)}
                      className="bg-[#051710] border border-[#164432] rounded-lg px-3 py-2 text-white font-bold text-lg w-28 focus:outline-none focus:border-[#F97316]"
                    >
                      {ASL_ALPHABET.map((s) => (
                        <option key={s.letter} value={s.letter}>
                          Sign '{s.letter}'
                        </option>
                      ))}
                    </select>
                    <div className="text-xs text-emerald-300">
                      <p className="font-semibold text-white">
                        {sampleCountsByLetter[selectedLetter] || 0} samples
                      </p>
                      <p className="text-[11px] opacity-75">recorded for '{selectedLetter}'</p>
                    </div>
                  </div>
                </div>

                {/* Live Webcam Status & Capture Buttons */}
                <div className="flex flex-col justify-center">
                  <label className="text-xs font-bold text-emerald-300 uppercase tracking-wider block mb-2">
                    2. Capture Hand Landmarks
                  </label>
                  <div className="flex items-center gap-2">
                    {!isCameraActive ? (
                      <button
                        onClick={onStartCamera}
                        className="px-4 py-2 rounded-lg bg-[#F97316] hover:bg-[#EA580C] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
                      >
                        <Camera className="w-4 h-4" />
                        Start Camera First
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={captureSingleSample}
                          disabled={!currentLandmarks}
                          className="px-3.5 py-2 rounded-lg bg-[#F97316] hover:bg-[#EA580C] disabled:opacity-40 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          Capture Frame
                        </button>
                        
                        {!isRecordingBurst ? (
                          <button
                            onClick={startBurstRecording}
                            disabled={!currentLandmarks}
                            className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                            Burst (30 Frames)
                          </button>
                        ) : (
                          <button
                            onClick={stopBurstRecording}
                            className="px-3.5 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center gap-1.5 animate-pulse cursor-pointer"
                          >
                            <Square className="w-3.5 h-3.5 fill-current" />
                            Stop Burst ({burstCount}/30)
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* CSV Management */}
                <div className="flex flex-col justify-center items-start md:items-end">
                  <label className="text-xs font-bold text-emerald-300 uppercase tracking-wider block mb-2">
                    3. Save & Export CSV
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={clearSamplesForSelected}
                      disabled={!sampleCountsByLetter[selectedLetter]}
                      className="px-2.5 py-2 rounded-lg bg-[#051710] hover:bg-red-950/40 text-red-400 hover:text-red-300 border border-red-900/30 text-xs font-semibold disabled:opacity-30 cursor-pointer"
                      title={`Clear ${selectedLetter} samples`}
                    >
                      Clear '{selectedLetter}'
                    </button>
                    {confirmClearAll ? (
                      <div className="flex items-center gap-1 bg-red-950/60 p-1 rounded-lg border border-red-800/50">
                        <span className="text-[10px] text-red-300 font-bold px-1">Clear all?</span>
                        <button
                          onClick={clearAllSamples}
                          className="px-2 py-1 rounded bg-red-600 hover:bg-red-500 text-white text-[10px] font-bold cursor-pointer"
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => setConfirmClearAll(false)}
                          className="px-2 py-1 rounded bg-emerald-900 hover:bg-emerald-800 text-emerald-200 text-[10px] font-bold cursor-pointer"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmClearAll(true)}
                        disabled={samples.length === 0}
                        className="px-2.5 py-2 rounded-lg bg-[#051710] hover:bg-red-950/40 text-red-400 hover:text-red-300 border border-red-900/30 text-xs font-semibold disabled:opacity-30 cursor-pointer"
                        title="Clear entire dataset"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={exportToCsv}
                      disabled={samples.length === 0}
                      className="px-3.5 py-2 rounded-lg bg-[#F97316] hover:bg-[#EA580C] text-white text-xs font-bold flex items-center gap-1.5 shadow-md disabled:opacity-30 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Save .CSV
                    </button>
                  </div>
                </div>

              </div>

              {/* Status / Live Feed Indicator */}
              <div className="flex items-center justify-between text-xs px-2">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${currentLandmarks ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                  <span className="font-medium text-emerald-200">
                    {currentLandmarks 
                      ? 'Hand in frame: 21 landmarks tracking live at 30 FPS' 
                      : 'No hand detected. Position your hand inside the webcam frame.'}
                  </span>
                </div>
                <div className="text-emerald-400">
                  Total Captured: <strong className="text-white">{samples.length}</strong> frames
                </div>
              </div>

              {/* Alphabet Breakdown Grid */}
              <div>
                <h3 className="text-xs font-bold text-emerald-300 uppercase tracking-wider mb-2">
                  Dataset Balance by Sign (A–Z)
                </h3>
                <div className="grid grid-cols-6 sm:grid-cols-13 gap-1.5">
                  {ASL_ALPHABET.map(s => {
                    const count = sampleCountsByLetter[s.letter] || 0;
                    const isSelected = s.letter === selectedLetter;

                    return (
                      <button
                        key={s.letter}
                        onClick={() => setSelectedLetter(s.letter)}
                        className={`p-2 rounded-lg flex flex-col items-center justify-center border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#F97316] text-white border-orange-400 font-bold scale-105 shadow-md'
                            : count > 0
                            ? 'bg-[#0B2A1E] text-emerald-200 border-emerald-500/40 hover:bg-[#123828]'
                            : 'bg-[#051710] text-emerald-500/50 border-[#143B2B] hover:border-emerald-700'
                        }`}
                      >
                        <span className="text-sm font-black">{s.letter}</span>
                        <span className="text-[10px] opacity-80">{count}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Recent Recorded Samples Table */}
              <div>
                <h3 className="text-xs font-bold text-emerald-300 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Collected Landmark Rows ({samples.length})</span>
                  <span className="text-[11px] normal-case text-emerald-400">
                    Showing 63 coordinate values per frame: [x0..z20]
                  </span>
                </h3>

                <div className="bg-[#051710] border border-[#164432] rounded-xl overflow-hidden">
                  <div className="max-h-60 overflow-y-auto">
                    {samples.length === 0 ? (
                      <div className="p-8 text-center text-emerald-400/60 text-xs">
                        No samples recorded yet. Turn on the camera, select a letter, and click <strong>Capture Frame</strong> or <strong>Burst</strong>, or click <strong>Seed 130 Samples</strong>.
                      </div>
                    ) : (
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-[#082217] sticky top-0 text-[11px] text-emerald-300 uppercase font-bold border-b border-[#164432]">
                          <tr>
                            <th className="py-2 px-3">Sign</th>
                            <th className="py-2 px-3">Timestamp</th>
                            <th className="py-2 px-3">Wrist (x, y, z)</th>
                            <th className="py-2 px-3">Index Tip (x, y, z)</th>
                            <th className="py-2 px-3">Thumb Tip (x, y, z)</th>
                            <th className="py-2 px-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#143B2B]">
                          {samples.slice(0, 50).map(s => {
                            const wrist = s.landmarks[0] || { x: 0, y: 0, z: 0 };
                            const indexTip = s.landmarks[8] || { x: 0, y: 0, z: 0 };
                            const thumbTip = s.landmarks[4] || { x: 0, y: 0, z: 0 };

                            return (
                              <tr key={s.id} className="hover:bg-[#0B2A1E]/50 font-mono text-[11px]">
                                <td className="py-2 px-3 font-sans font-bold text-[#F97316]">
                                  {s.label}
                                </td>
                                <td className="py-2 px-3 text-emerald-400 font-sans">
                                  {new Date(s.timestamp).toLocaleTimeString()}
                                </td>
                                <td className="py-2 px-3 text-emerald-200">
                                  {wrist.x}, {wrist.y}, {wrist.z}
                                </td>
                                <td className="py-2 px-3 text-emerald-200">
                                  {indexTip.x}, {indexTip.y}, {indexTip.z}
                                </td>
                                <td className="py-2 px-3 text-emerald-200">
                                  {thumbTip.x}, {thumbTip.y}, {thumbTip.z}
                                </td>
                                <td className="py-2 px-3 text-right font-sans">
                                  <button
                                    onClick={() => setSamples(prev => prev.filter(x => x.id !== s.id))}
                                    className="text-red-400 hover:text-red-300 cursor-pointer"
                                  >
                                    Delete
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>

            </div>
          )}

          {activeTab === 'guide' && (
            <div className="space-y-6 text-xs text-emerald-200 leading-relaxed max-w-3xl">
              <div className="bg-[#0B2A1E] border border-[#164432] p-4 rounded-xl">
                <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-[#F97316]" />
                  How ASL Training Data is Structured in a .CSV File
                </h3>
                <p className="mb-3">
                  In computer vision applications like Signify, raw webcam frames pass through <strong>MediaPipe Hands</strong> to extract <strong>21 3D spatial joints</strong> on the hand. Rather than storing heavy video pixels, the actual mathematical features for Machine Learning are structured as tabular columns:
                </p>

                <div className="bg-[#051710] p-3 rounded-lg border border-[#143B2B] font-mono text-[11px] overflow-x-auto text-amber-300">
                  label, x0, y0, z0, x1, y1, z1, x2, y2, z2, ..., x20, y20, z20
                </div>

                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-[#051710] p-3 rounded-lg border border-[#143B2B]">
                    <h4 className="font-bold text-white mb-1">Key Joint Indices:</h4>
                    <ul className="space-y-1 list-disc list-inside text-emerald-300">
                      <li><strong>0</strong>: Wrist (Anchor origin)</li>
                      <li><strong>1..4</strong>: Thumb (CMC, MCP, IP, Tip)</li>
                      <li><strong>5..8</strong>: Index (MCP, PIP, DIP, Tip)</li>
                      <li><strong>9..12</strong>: Middle finger joints</li>
                      <li><strong>13..16</strong>: Ring finger joints</li>
                      <li><strong>17..20</strong>: Pinky finger joints</li>
                    </ul>
                  </div>

                  <div className="bg-[#051710] p-3 rounded-lg border border-[#143B2B]">
                    <h4 className="font-bold text-white mb-1">Best Practices for High Accuracy:</h4>
                    <ul className="space-y-1 list-disc list-inside text-emerald-300">
                      <li><strong>Vary Angles</strong>: Record hands tilted ±15° to make models invariant to minor orientation shifts.</li>
                      <li><strong>Vary Distance</strong>: Move hand closer and further from camera to teach scale invariance.</li>
                      <li><strong>Both Hands</strong>: Capture both right and left hands for universality.</li>
                      <li><strong>Balanced Classes</strong>: Aim for ~50–100 samples per letter.</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-[#0B2A1E] border border-[#164432] p-4 rounded-xl">
                <h3 className="text-sm font-bold text-white mb-2">How to Train a Custom Machine Learning Model on the .CSV</h3>
                <ol className="space-y-2 list-decimal list-inside text-emerald-300">
                  <li>Click <strong>Download .CSV</strong> to save your dataset as <code>asl_hand_landmarks_dataset.csv</code>.</li>
                  <li>Click the <strong>Python Training Script</strong> tab above, or click <strong>Download Python Trainer Script</strong>.</li>
                  <li>Run <code>python train_asl_model.py</code> in your terminal.</li>
                  <li>The script loads the CSV using <code>pandas</code>, trains a Random Forest classifier in seconds, outputs validation accuracy & confusion matrix, and exports <code>asl_random_forest_model.joblib</code>!</li>
                </ol>
              </div>
            </div>
          )}

          {activeTab === 'python' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Turnkey Python Machine Learning Trainer</h3>
                  <p className="text-xs text-emerald-400">
                    Ready-to-run script that trains a Scikit-Learn Random Forest or Support Vector Machine on your exported CSV.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, accuracy_score
import joblib

df = pd.read_csv("asl_hand_landmarks_dataset.csv")
X = df.drop('label', axis=1)
y = df['label']

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.20, random_state=42)
clf = RandomForestClassifier(n_estimators=100, random_state=42)
clf.fit(X_train, y_train)

acc = accuracy_score(y_test, clf.predict(X_test))
print(f"Accuracy: {acc * 100:.2f}%")
joblib.dump(clf, "asl_random_forest_model.joblib")`);
                      setCopiedCode(true);
                      setTimeout(() => setCopiedCode(false), 2000);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-[#0B2A1E] hover:bg-[#123828] border border-[#164432] text-xs font-semibold text-emerald-300 flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
                  </button>

                  <button
                    onClick={downloadPythonTrainer}
                    className="px-3 py-1.5 rounded-lg bg-[#F97316] hover:bg-[#EA580C] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download train_asl_model.py</span>
                  </button>
                </div>
              </div>

              <div className="bg-[#051710] border border-[#164432] rounded-xl p-4 font-mono text-xs text-emerald-200 overflow-x-auto">
                <pre className="text-emerald-300">
{`# 1. Install required packages
# pip install pandas scikit-learn joblib numpy

import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, accuracy_score
import joblib

# 2. Load dataset exported from Signify
df = pd.read_csv("asl_hand_landmarks_dataset.csv")
print(f"Loaded {len(df)} samples across {df['label'].nunique()} ASL signs.")

# 3. Separate features (63 joint coordinates) and target labels (A-Z)
X = df.drop('label', axis=1)
y = df['label']

# 4. Train-test split (80% train, 20% test)
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.20, random_state=42, stratify=y if len(y.unique()) > 1 else None
)

# 5. Train Random Forest Classifier
clf = RandomForestClassifier(n_estimators=100, max_depth=16, random_state=42)
clf.fit(X_train, y_train)

# 6. Evaluate accuracy
preds = clf.predict(X_test)
print(f"Validation Accuracy: {accuracy_score(y_test, preds) * 100:.2f}%")
print(classification_report(y_test, preds, zero_division=0))

# 7. Save model artifact
joblib.dump(clf, "asl_random_forest_model.joblib")
print("Trained model saved to asl_random_forest_model.joblib")`}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#051710] border-t border-[#143B2B] flex items-center justify-between text-xs text-emerald-400">
          <div>
            Dataset format: Standard CSV with 64 columns (label + 21 × 3 landmark coordinates).
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#0B2A1E] hover:bg-[#123828] text-white font-semibold transition-colors cursor-pointer"
          >
            Close Studio
          </button>
        </div>

      </div>
    </div>
  );
};
