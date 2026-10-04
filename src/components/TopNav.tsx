import React, { useState } from 'react';
import { Film, Play, Sparkles, History, Palette } from 'lucide-react';
import { ThemeId, StudioTheme } from '../utils/themes';
import { ThemeSelectorModal } from './ThemeSelectorModal';

interface TopNavProps {
  title: string;
  onTitleChange: (newTitle: string) => void;
  activeTab: 'create' | 'export' | 'history';
  onTabChange: (tab: 'create' | 'export' | 'history') => void;
  onOpenCreateModal: () => void;
  savedCount: number;
  activeTheme: StudioTheme;
  onSelectTheme: (id: ThemeId) => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  title,
  onTitleChange,
  activeTab,
  onTabChange,
  onOpenCreateModal,
  savedCount,
  activeTheme,
  onSelectTheme,
}) => {
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);

  return (
    <>
      <header
        className={`${activeTheme.headerBg} backdrop-blur-md border-b ${activeTheme.cardBorder} sticky top-0 z-30 px-4 md:px-6 py-2.5 transition-colors duration-200`}
      >
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Zone 1: ShortXShortX Brand & Project Name */}
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-600 via-violet-600 to-indigo-600 p-[1px] shadow-lg shadow-rose-950/40">
                <div className="w-full h-full bg-neutral-950 rounded-[11px] flex items-center justify-center">
                  <span className="font-black text-xs tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-violet-400">
                    SX
                  </span>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm md:text-base font-extrabold tracking-tight text-white flex items-center">
                    Short<span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-violet-400">X</span>Short<span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-violet-400">X</span>
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider bg-gradient-to-r from-rose-500/20 to-violet-500/20 text-rose-300 border border-rose-500/30">
                    PRO
                  </span>
                </div>
                <div className="text-[11px] text-neutral-400 flex items-center gap-1">
                  <span>8s Vertical Reel Engine</span>
                  <span className="text-neutral-600">·</span>
                  <span className="text-neutral-500 font-mono text-[10px]">9:16 Shorts</span>
                </div>
              </div>
            </div>

            <div className="h-6 w-[1px] bg-neutral-800 hidden sm:block" />

            {/* Project Title Input */}
            <div className="min-w-0 flex-1 max-w-xs md:max-w-sm">
              <input
                type="text"
                value={title}
                onChange={(e) => onTitleChange(e.target.value)}
                placeholder="Enter video project title..."
                className="w-full bg-neutral-900/60 hover:bg-neutral-900 focus:bg-neutral-900 text-xs md:text-sm font-semibold text-neutral-200 border border-neutral-800/80 hover:border-neutral-700 focus:border-rose-500/80 rounded-lg px-2.5 py-1.5 transition-colors truncate focus:outline-none"
                title="Click to rename project"
              />
            </div>
          </div>

          {/* Zone 2: Step Navigation */}
          <div className="flex items-center gap-1 bg-neutral-900/80 p-1 rounded-xl border border-neutral-800 self-start md:self-auto overflow-x-auto max-w-full">
            <button
              onClick={() => onTabChange('create')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'create'
                  ? `bg-gradient-to-r ${activeTheme.accentGradient} text-white shadow-md ${activeTheme.glowShadow}`
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
              }`}
            >
              <span>1. Studio Workspace</span>
            </button>
            <button
              onClick={() => {
                onTabChange('create');
                onOpenCreateModal();
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'export'
                  ? `bg-gradient-to-r ${activeTheme.accentGradient} text-white shadow-md ${activeTheme.glowShadow}`
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-violet-400" />
              <span>2. Video Checks & Export</span>
            </button>
            <button
              onClick={() => onTabChange('history')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'history'
                  ? `bg-gradient-to-r ${activeTheme.accentGradient} text-white shadow-md ${activeTheme.glowShadow}`
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>3. Saved Loops ({savedCount})</span>
            </button>
          </div>

          {/* Zone 3: Actions (Theme Changer & Export Button) */}
          <div className="flex items-center gap-2">
            {/* Theme Selector Button */}
            <button
              type="button"
              onClick={() => setIsThemeModalOpen(true)}
              className="px-2.5 sm:px-3 py-1.5 rounded-lg bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-xs font-semibold text-neutral-200 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
              title="Change Studio UI Theme"
            >
              <div className="flex items-center -space-x-1">
                <span
                  className="w-2.5 h-2.5 rounded-full border border-black/40 shadow-sm"
                  style={{ backgroundColor: activeTheme.previewSwatches[1] }}
                />
                <span
                  className="w-2.5 h-2.5 rounded-full border border-black/40 shadow-sm"
                  style={{ backgroundColor: activeTheme.previewSwatches[2] }}
                />
              </div>
              <span className="hidden sm:inline font-mono text-[11px]">{activeTheme.name}</span>
              <Palette className="w-3.5 h-3.5 text-neutral-400" />
            </button>

            {/* Primary Export Action */}
            <button
              onClick={onOpenCreateModal}
              className={`w-full md:w-auto px-4 py-2 text-xs font-bold text-white bg-gradient-to-r ${activeTheme.accentGradient} hover:opacity-95 rounded-lg shadow-lg ${activeTheme.glowShadow} border border-white/10 transition-all flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer active:scale-95`}
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Generate 8s Video</span>
            </button>
          </div>
        </div>
      </header>

      {/* Theme Selector Modal */}
      <ThemeSelectorModal
        isOpen={isThemeModalOpen}
        activeThemeId={activeTheme.id}
        onSelectTheme={onSelectTheme}
        onClose={() => setIsThemeModalOpen(false)}
      />
    </>
  );
};
