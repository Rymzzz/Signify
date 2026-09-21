import React from 'react';
import { 
  Users, 
  Target, 
  GraduationCap, 
  HelpCircle, 
  CheckCircle2, 
  Zap, 
  Layers, 
  FileText,
  HeartHandshake,
  Cpu
} from 'lucide-react';

export const CharterSdgView: React.FC = () => {
  const teamMembers = [
    { name: 'Christine Althea D. Barsatan', role: 'Group #9 Lead / Research' },
    { name: 'Francisco Alphonso M. Capio', role: 'Group #9 Software Architecture' },
    { name: 'Bryce Willand B. Tangalin', role: 'Group #9 Machine Learning & Vision' },
    { name: 'Raymond Augustine N. Venasquez', role: 'Group #9 Full-Stack & UI/UX' },
  ];

  return (
    <div className="space-y-6">
      
      {/* Title & Team Charter Header */}
      <div className="bg-white border border-[#E6E4DD] rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-serif font-bold uppercase tracking-wider text-[#5A5A40]">
              Activity Task: Project Conceptualization &bull; Group #9
            </span>
            <h1 className="text-xl sm:text-2xl font-serif font-bold text-[#5A5A40]">
              Signify: A Real-Time Gesture Recognition Application for ASL Learners
            </h1>
          </div>
          <div className="px-3.5 py-1.5 rounded-xl bg-[#F5F2ED] border border-[#E6E4DD] text-[#5A5A40] text-xs font-bold font-serif">
            SDG Target 4.5
          </div>
        </div>

        {/* Team Members List */}
        <div className="pt-3 border-t border-[#E6E4DD]">
          <h3 className="text-xs font-serif font-bold uppercase tracking-wider text-[#8A887C] mb-3 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-[#5A5A40]" />
            <span>Group #9 Contributors</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {teamMembers.map((member, idx) => (
              <div key={idx} className="p-3.5 rounded-2xl bg-[#F5F2ED] border border-[#E6E4DD]">
                <span className="font-serif font-bold text-[#3D3D3D] text-xs block truncate">{member.name}</span>
                <span className="text-[11px] text-[#8A887C] block mt-0.5">{member.role}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SDG 4 Section */}
      <div className="bg-[#F5F2ED] border border-[#E6E4DD] rounded-3xl p-6 shadow-sm space-y-3">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-white text-[#5A5A40] border border-[#E6E4DD] shadow-xs">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-serif font-bold uppercase tracking-wider text-[#8A887C]">Section 1: Sustainable Development Goal</span>
            <h2 className="text-base sm:text-lg font-serif font-bold text-[#5A5A40]">
              SDG 4 – Quality Education (Target 4.5)
            </h2>
          </div>
        </div>
        <p className="text-xs sm:text-sm text-[#3D3D3D] leading-relaxed pl-1">
          <strong>Target 4.5:</strong> Ensure equal access to education and foster inclusive learning environments for persons with disabilities. By empowering hearing individuals with active, interactive tools to learn American Sign Language, Signify bridges the everyday communication barriers faced by Deaf individuals in classrooms, public services, and society.
        </p>
      </div>

      {/* Problem & Rationale: 2 Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Section 3: Problem */}
        <div className="bg-white border border-[#E6E4DD] rounded-3xl p-6 space-y-3.5 shadow-sm">
          <div className="flex items-center space-x-2.5 text-[#994D38]">
            <HelpCircle className="w-5 h-5" />
            <h3 className="text-sm font-serif font-bold uppercase tracking-wider">Section 3: The Problem</h3>
          </div>
          <p className="text-xs text-[#3D3D3D] leading-relaxed">
            The core challenge is the communication gap between hearing individuals and the Deaf community. While ASL learning resources exist, they are often passive and non-interactive (e.g., static flashcards or video streams), making practice tedious and inconsistent.
          </p>
          <div className="p-3.5 rounded-2xl bg-[#F5F2ED] border border-[#E6E4DD] space-y-1.5">
            <span className="text-[11px] font-serif font-bold text-[#5A5A40] block">Why Event-Driven Architecture (EDA)?</span>
            <p className="text-[11px] text-[#8A887C] leading-relaxed">
              Traditional request-response architectures force learners to record video, click submit, and wait for server validation—abruptly interrupting the learning flow. Signify's event-driven pipeline continuously listens for recognized hand keypoints and publishes visual confirmation the instant a posture stabilizes.
            </p>
          </div>
        </div>

        {/* Section 4: Rationale */}
        <div className="bg-white border border-[#E6E4DD] rounded-3xl p-6 space-y-3.5 shadow-sm">
          <div className="flex items-center space-x-2.5 text-[#5A5A40]">
            <Target className="w-5 h-5" />
            <h3 className="text-sm font-serif font-bold uppercase tracking-wider">Section 4: The Rationale</h3>
          </div>
          <p className="text-xs text-[#3D3D3D] leading-relaxed">
            Signify delivers instantaneous feedback—specifically either <strong>"Correct"</strong> or <strong>"Try Again"</strong> with targeted anatomical tips. Real-time feedback reinforces proper finger positioning and accelerates vocabulary retention.
          </p>
          <div className="p-3.5 rounded-2xl bg-[#F5F2ED] border border-[#E6E4DD] space-y-1.5">
            <span className="text-[11px] font-serif font-bold text-[#5A5A40] block">Technical Feasibility in Java</span>
            <p className="text-[11px] text-[#8A887C] leading-relaxed">
              OpenCV for Java handles webcam capture and frame buffering, Microsoft ONNX Runtime evaluates the 42 normalized hand keypoints, and JavaFX (for desktop) / Android CameraX (for mobile) deliver 60 FPS visual confirmations with zero external cloud dependencies.
            </p>
          </div>
        </div>

      </div>

      {/* Event-Driven Pipeline Architecture Diagram */}
      <div className="bg-white border border-[#E6E4DD] rounded-3xl p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-serif font-bold uppercase tracking-wider text-[#5A5A40] flex items-center gap-2">
          <Zap className="w-4 h-4 text-[#5A5A40]" />
          <span>Signify Event-Driven Architecture (Publisher \u2192 EventBus \u2192 Subscribers)</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          
          <div className="p-4 rounded-2xl bg-[#F5F2ED] border border-[#E6E4DD] space-y-1.5 shadow-xs">
            <span className="text-[10px] font-mono font-bold text-[#5A5A40] uppercase">Stage 1 &bull; Capture</span>
            <h4 className="text-xs font-serif font-bold text-[#3D3D3D]">OpenCV Camera / CameraX</h4>
            <p className="text-[11px] text-[#8A887C]">
              Captures raw BGR frames asynchronously at 30 FPS without blocking the UI main thread.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#F5F2ED] border border-[#E6E4DD] space-y-1.5 shadow-xs">
            <span className="text-[10px] font-mono font-bold text-[#A68F6B] uppercase">Stage 2 &bull; Keypoints</span>
            <h4 className="text-xs font-serif font-bold text-[#3D3D3D]">21 Landmark Normalizer</h4>
            <p className="text-[11px] text-[#8A887C]">
              Calculates relative coordinates from wrist (landmark 0) and divides by maximum absolute distance.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#F5F2ED] border border-[#E6E4DD] space-y-1.5 shadow-xs">
            <span className="text-[10px] font-mono font-bold text-[#5A5A40] uppercase">Stage 3 &bull; Neural Inference</span>
            <h4 className="text-xs font-serif font-bold text-[#3D3D3D]">ONNX / TFLite Classifier</h4>
            <p className="text-[11px] text-[#8A887C]">
              Evaluates the 42-float feature vector against 26 ASL alphabet letters in &lt; 5 milliseconds.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#F5F2ED] border border-[#E6E4DD] space-y-1.5 shadow-xs">
            <span className="text-[10px] font-mono font-bold text-[#5A5A40] uppercase">Stage 4 &bull; Event Dispatch</span>
            <h4 className="text-xs font-serif font-bold text-[#3D3D3D]">Instant Visual Confirmation</h4>
            <p className="text-[11px] text-[#8A887C]">
              Publishes <code className="text-[#5A5A40] bg-white px-1 py-0.5 rounded border border-[#E6E4DD]">GestureEvent</code> to UI for instant "Correct!" or "Try Again" feedback.
            </p>
          </div>

        </div>
      </div>

    </div>
  );
};
