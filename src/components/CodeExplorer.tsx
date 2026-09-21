import React, { useState } from 'react';
import { 
  Download, 
  Copy, 
  Check, 
  FileCode, 
  Folder, 
  Terminal, 
  Search, 
  Layers, 
  Sparkles,
  ExternalLink,
  Laptop,
  Smartphone
} from 'lucide-react';
import { CodeFile } from '../types';
import { exportDesktopJavaZip, exportMobileAndroidZip } from '../utils/zipExport';

interface CodeExplorerProps {
  platform: 'desktop' | 'mobile';
  files: CodeFile[];
}

export const CodeExplorer: React.FC<CodeExplorerProps> = ({ platform, files }) => {
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [downloading, setDownloading] = useState(false);

  const filteredFiles = files.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentFile = filteredFiles[selectedFileIndex] || files[0];

  const handleCopy = () => {
    if (currentFile) {
      navigator.clipboard.writeText(currentFile.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      if (platform === 'desktop') {
        await exportDesktopJavaZip();
      } else {
        await exportMobileAndroidZip();
      }
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="bg-white border border-[#E6E4DD] rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 rounded-xl bg-[#F5F2ED] text-[#5A5A40] border border-[#E6E4DD]">
            {platform === 'desktop' ? <Laptop className="w-6 h-6" /> : <Smartphone className="w-6 h-6" />}
          </div>
          <div>
            <h2 className="text-base font-serif font-bold text-[#5A5A40] flex items-center gap-2">
              <span>{platform === 'desktop' ? 'Java Desktop Application' : 'Java Mobile Application (Android)'}</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#F5F2ED] text-[#5A5A40] border border-[#E6E4DD] font-mono">
                {platform === 'desktop' ? 'JavaFX 21 + OpenCV + ONNX' : 'CameraX + MediaPipe + TFLite'}
              </span>
            </h2>
            <p className="text-xs text-[#8A887C] mt-0.5">
              {platform === 'desktop' 
                ? 'Complete cross-platform desktop Java codebase for IntelliJ IDEA / Eclipse / NetBeans / VS Code.'
                : 'Production-ready Android Studio Java codebase with CameraX and real-time landmark tracking.'}
            </p>
          </div>
        </div>

        <button
          onClick={handleDownload}
          disabled={downloading}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-white text-xs font-semibold bg-[#5A5A40] hover:bg-[#474732] shadow-sm transition-all cursor-pointer disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          <span>{downloading ? 'Preparing ZIP...' : `Download ${platform === 'desktop' ? 'Desktop' : 'Android'} Project (.zip)`}</span>
        </button>
      </div>

      {/* Main IDE Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 bg-white border border-[#E6E4DD] rounded-3xl overflow-hidden shadow-sm">
        
        {/* Left File Tree Sidebar */}
        <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-[#E6E4DD] p-4 space-y-3 bg-[#F5F2ED]">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#8A887C]" />
            <input
              type="text"
              placeholder="Search source files..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSelectedFileIndex(0);
              }}
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-[#E6E4DD] rounded-xl text-xs text-[#3D3D3D] placeholder-[#8A887C] focus:outline-none focus:border-[#5A5A40]"
            />
          </div>

          <div className="text-[11px] font-bold text-[#8A887C] uppercase tracking-wider px-1 pt-1 flex items-center justify-between">
            <span>Project Explorer ({filteredFiles.length} files)</span>
          </div>

          <div className="space-y-1 max-h-[500px] overflow-y-auto scrollbar-thin">
            {filteredFiles.map((file, idx) => {
              const isSelected = currentFile.path === file.path;
              return (
                <button
                  key={file.path}
                  onClick={() => setSelectedFileIndex(idx)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center space-x-2.5 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-white text-[#5A5A40] border border-[#E6E4DD] font-semibold shadow-xs'
                      : 'text-[#3D3D3D] hover:text-[#5A5A40] hover:bg-white/60 border border-transparent'
                  }`}
                >
                  <FileCode className={`w-4 h-4 shrink-0 ${isSelected ? 'text-[#5A5A40]' : 'text-[#8A887C]'}`} />
                  <div className="truncate">
                    <span className="block truncate font-mono text-[11px]">{file.name}</span>
                    <span className="block text-[10px] text-[#8A887C] truncate">{file.path}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Setup Tip Box */}
          <div className="p-3.5 rounded-2xl bg-white border border-[#E6E4DD] text-xs space-y-1.5 mt-4 shadow-xs">
            <div className="flex items-center space-x-1.5 text-[#5A5A40] font-semibold text-[11px]">
              <Terminal className="w-3.5 h-3.5" />
              <span>Quick Run Instructions</span>
            </div>
            <p className="text-[11px] text-[#5A5A40] font-mono bg-[#F5F2ED] p-2 rounded-xl border border-[#E6E4DD]">
              {platform === 'desktop' ? 'mvn clean compile javafx:run' : 'Import project into Android Studio -> Run \'app\''}
            </p>
          </div>
        </div>

        {/* Right Code Viewer */}
        <div className="lg:col-span-8 flex flex-col h-full bg-[#262624]">
          {/* File Tab Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#3D3D3D] bg-[#21211F]">
            <div className="flex items-center space-x-2 truncate">
              <FileCode className="w-4 h-4 text-[#A68F6B] shrink-0" />
              <span className="font-mono text-xs text-stone-200 font-semibold truncate">{currentFile.path}</span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleCopy}
                className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-[#333330] hover:bg-[#3D3D3A] text-stone-200 text-xs font-medium cursor-pointer transition-all border border-[#4A4A46]"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Code</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* File Description */}
          <div className="px-4 py-2 bg-[#1C1C1A] border-b border-[#333330] text-[11px] text-[#A68F6B]">
            {currentFile.description}
          </div>

          {/* Syntax Highlighted Code Viewer */}
          <div className="p-4 overflow-x-auto max-h-[520px] overflow-y-auto bg-[#262624] font-mono text-xs leading-relaxed text-stone-200 scrollbar-thin">
            <pre>
              <code>{currentFile.content}</code>
            </pre>
          </div>
        </div>

      </div>
    </div>
  );
};
