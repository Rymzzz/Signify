import React, { useState } from 'react';
import { 
  CheckCircle2, 
  ArrowRight, 
  Code2, 
  Terminal, 
  Copy, 
  Check, 
  Layers, 
  Cpu, 
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { 
  PIPELINE_COMPARISONS, 
  PYTHON_CONVERTER_SCRIPT, 
  MATHEMATICAL_PROOF_COMPARISON 
} from '../data/conversionGuide';

export const ConversionPipelineView: React.FC = () => {
  const [copiedScript, setCopiedScript] = useState(false);

  const handleCopyScript = () => {
    navigator.clipboard.writeText(PYTHON_CONVERTER_SCRIPT);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  return (
    <div className="space-y-6">
      
      {/* Executive Answer Card */}
      <div className="bg-[#F5F2ED] border border-[#E6E4DD] rounded-3xl p-6 sm:p-7 shadow-sm space-y-5">
        <div className="flex items-start space-x-4">
          <div className="p-3 rounded-2xl bg-white border border-[#E6E4DD] text-[#5A5A40] shrink-0 shadow-xs">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-serif font-bold uppercase tracking-wider text-[#5A5A40]">
                Feasibility Assessment: 100% Feasible &amp; Production-Ready
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#5A5A40]">
              Converting Muhib-Mehdi's Python ASL System to Pure Java (Desktop &amp; Mobile)
            </h2>
            <p className="text-xs sm:text-sm text-[#3D3D3D] leading-relaxed max-w-4xl">
              <strong>Yes, it is completely possible and straightforward to convert the Python codebase to Java.</strong> The Python repository relies on three core primitives: (1) video stream capture via OpenCV, (2) 21-point hand landmark extraction via MediaPipe, and (3) a lightweight feed-forward classifier operating on 42 scale-normalized relative coordinates. All three components have official, high-performance native Java equivalents.
            </p>
          </div>
        </div>

        {/* 3 Key Breakthroughs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
          <div className="p-4 rounded-2xl bg-white border border-[#E6E4DD] space-y-1.5 shadow-xs">
            <span className="text-[#5A5A40] font-serif font-bold text-xs flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5" />
              <span>1. Zero Loss in Accuracy</span>
            </span>
            <p className="text-[11px] text-[#8A887C]">
              The 42-float landmark normalization algorithm is purely mathematical and maps with exact numerical parity into Java.
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-[#E6E4DD] space-y-1.5 shadow-xs">
            <span className="text-[#A68F6B] font-serif font-bold text-xs flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              <span>2. Faster Execution in Java</span>
            </span>
            <p className="text-[11px] text-[#8A887C]">
              Microsoft ONNX Runtime Java and Android TFLite run compiled C++ binaries, achieving lower inference latency than Python.
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-[#E6E4DD] space-y-1.5 shadow-xs">
            <span className="text-[#5A5A40] font-serif font-bold text-xs flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              <span>3. Event-Driven Architecture</span>
            </span>
            <p className="text-[11px] text-[#8A887C]">
              Replaces the rigid Python <code className="text-[#5A5A40] bg-[#F5F2ED] px-1 rounded">while True</code> loop with decoupled Java listeners, fulfilling Group #9's SDG 4 requirements.
            </p>
          </div>
        </div>
      </div>

      {/* Component-by-Component Mapping Table */}
      <div className="bg-white border border-[#E6E4DD] rounded-3xl p-6 space-y-4 shadow-sm">
        <h3 className="text-sm font-serif font-bold text-[#5A5A40] uppercase tracking-wider flex items-center gap-2">
          <Code2 className="w-4 h-4 text-[#5A5A40]" />
          <span>Architectural Component Mapping (Python \u2192 Java Desktop &amp; Mobile)</span>
        </h3>

        <div className="overflow-x-auto rounded-2xl border border-[#E6E4DD]">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#E6E4DD] bg-[#F5F2ED] text-[#5A5A40]">
                <th className="py-3 px-4 font-serif font-bold">Subsystem</th>
                <th className="py-3 px-4 font-semibold text-[#A68F6B]">Original Python Repo</th>
                <th className="py-3 px-4 font-semibold text-[#5A5A40]">Java Desktop (JavaFX)</th>
                <th className="py-3 px-4 font-semibold text-[#5A5A40]">Java Mobile (Android)</th>
                <th className="py-3 px-4 font-semibold text-[#8A887C]">Impact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6E4DD]">
              {PIPELINE_COMPARISONS.map((row, idx) => (
                <tr key={idx} className="hover:bg-[#F9F8F4] transition-colors">
                  <td className="py-3 px-4 font-bold text-[#3D3D3D]">{row.component}</td>
                  <td className="py-3 px-4 font-mono text-[11px] text-[#A68F6B]">{row.pythonOriginal}</td>
                  <td className="py-3 px-4 font-mono text-[11px] text-[#5A5A40]">{row.javaDesktop}</td>
                  <td className="py-3 px-4 font-mono text-[11px] text-[#5A5A40]">{row.javaMobile}</td>
                  <td className="py-3 px-4 text-[#8A887C] text-[11px]">{row.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Side-by-Side Mathematical Code Proof */}
      <div className="bg-white border border-[#E6E4DD] rounded-3xl p-6 space-y-4 shadow-sm">
        <div>
          <h3 className="text-sm font-serif font-bold text-[#5A5A40] uppercase tracking-wider">
            Mathematical Coordinate Equivalence (42-Dimensional Normalized Vector)
          </h3>
          <p className="text-xs text-[#8A887C] mt-1">
            Observe how the 21-point relative wrist normalization from <code className="text-[#5A5A40] bg-[#F5F2ED] px-1 rounded">Muhib-Mehdi/ASL-Recognition-System</code> translates line-for-line into Java:
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          
          {/* Python original */}
          <div className="bg-[#262624] border border-[#E6E4DD] rounded-2xl overflow-hidden shadow-xs">
            <div className="px-4 py-2.5 bg-[#F5F2ED] border-b border-[#E6E4DD] flex items-center justify-between">
              <span className="text-xs font-bold text-[#A68F6B] font-mono">Python (keypoint_classification.py)</span>
            </div>
            <div className="p-4 font-mono text-[11px] text-stone-200 overflow-x-auto leading-relaxed">
              <pre>{MATHEMATICAL_PROOF_COMPARISON.python}</pre>
            </div>
          </div>

          {/* Java Equivalent */}
          <div className="bg-[#262624] border border-[#E6E4DD] rounded-2xl overflow-hidden shadow-xs">
            <div className="px-4 py-2.5 bg-[#F5F2ED] border-b border-[#E6E4DD] flex items-center justify-between">
              <span className="text-xs font-bold text-[#5A5A40] font-mono">Java (OnnxHandClassifier.java)</span>
            </div>
            <div className="p-4 font-mono text-[11px] text-stone-200 overflow-x-auto leading-relaxed">
              <pre>{MATHEMATICAL_PROOF_COMPARISON.java}</pre>
            </div>
          </div>

        </div>
      </div>

      {/* Python-to-Java Model Export Script */}
      <div className="bg-white border border-[#E6E4DD] rounded-3xl p-6 space-y-3.5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-serif font-bold text-[#5A5A40] uppercase tracking-wider flex items-center gap-2">
              <Terminal className="w-4 h-4 text-[#5A5A40]" />
              <span>Model Exporter Script (convert_model.py)</span>
            </h3>
            <p className="text-xs text-[#8A887C] mt-0.5">
              Run this 15-line script inside the Muhib-Mehdi Python repository to generate <code className="text-[#5A5A40] bg-[#F5F2ED] px-1 rounded">asl_classifier.onnx</code> and <code className="text-[#5A5A40] bg-[#F5F2ED] px-1 rounded">asl_classifier.tflite</code>.
            </p>
          </div>

          <button
            onClick={handleCopyScript}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#F5F2ED] hover:bg-[#EAE6DF] text-[#5A5A40] text-xs font-medium cursor-pointer transition-all border border-[#E6E4DD]"
          >
            {copiedScript ? <Check className="w-3.5 h-3.5 text-[#5A5A40]" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedScript ? 'Copied!' : 'Copy Python Script'}</span>
          </button>
        </div>

        <div className="bg-[#262624] rounded-2xl p-4 font-mono text-xs text-stone-200 overflow-x-auto border border-[#3D3D3D]">
          <pre>{PYTHON_CONVERTER_SCRIPT}</pre>
        </div>
      </div>

    </div>
  );
};
