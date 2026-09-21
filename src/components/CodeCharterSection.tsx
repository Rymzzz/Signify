import React, { useState } from 'react';
import { Laptop, Smartphone, GitBranch, HeartHandshake, Download } from 'lucide-react';
import { CodeExplorer } from './CodeExplorer';
import { ConversionPipelineView } from './ConversionPipelineView';
import { CharterSdgView } from './CharterSdgView';
import { JAVA_DESKTOP_FILES } from '../data/javaDesktopCode';
import { JAVA_MOBILE_FILES } from '../data/javaMobileCode';
import { downloadJavaProjectsZip } from '../utils/zipExport';

type SubTab = 'desktop' | 'mobile' | 'pipeline' | 'charter';

export const CodeCharterSection: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('desktop');
  const [downloading, setDownloading] = useState(false);

  const handleDownloadAll = async () => {
    setDownloading(true);
    try {
      await downloadJavaProjectsZip();
    } catch {
      // ignore
    } finally {
      setDownloading(false);
    }
  };

  const subTabs = [
    { id: 'desktop', label: 'Java Desktop (JavaFX + EventBus)', icon: Laptop },
    { id: 'mobile', label: 'Java Mobile (Android CameraX)', icon: Smartphone },
    { id: 'pipeline', label: 'Python → Java Conversion Pipeline', icon: GitBranch },
    { id: 'charter', label: 'SDG 4 Charter & Group #9', icon: HeartHandshake },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="bg-[#0B2A1E] border border-[#164432] rounded-3xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Code Architectures &amp; SDG 4 Inclusivity Charter
          </h2>
          <p className="text-xs text-emerald-300/90 mt-1">
            Production Java desktop (JavaFX) and mobile (Android) implementations with event-driven pipeline architecture.
          </p>
        </div>

        <button
          onClick={handleDownloadAll}
          disabled={downloading}
          className="px-4 py-2.5 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white font-bold text-xs flex items-center gap-2 shadow-lg transition-all cursor-pointer disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          <span>{downloading ? 'Creating ZIP...' : 'Download All Java Code (.zip)'}</span>
        </button>
      </div>

      {/* Sub navigation pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {subTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as SubTab)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#F97316] text-white shadow-md shadow-orange-600/20'
                  : 'bg-[#0B2A1E] border border-[#164432] text-emerald-200 hover:bg-[#123828]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Sub tab contents */}
      <div className="mt-4">
        {activeSubTab === 'desktop' && (
          <CodeExplorer platform="desktop" files={JAVA_DESKTOP_FILES} />
        )}
        {activeSubTab === 'mobile' && (
          <CodeExplorer platform="mobile" files={JAVA_MOBILE_FILES} />
        )}
        {activeSubTab === 'pipeline' && (
          <ConversionPipelineView />
        )}
        {activeSubTab === 'charter' && (
          <CharterSdgView />
        )}
      </div>
    </div>
  );
};
