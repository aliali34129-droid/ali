import React from 'react';
import { Palette, Check, X, Sparkles, Moon, Sun } from 'lucide-react';
import { ThemeId, STUDIO_THEMES, StudioTheme } from '../utils/themes';

interface ThemeSelectorModalProps {
  isOpen: boolean;
  activeThemeId: ThemeId;
  onSelectTheme: (id: ThemeId) => void;
  onClose: () => void;
}

export const ThemeSelectorModal: React.FC<ThemeSelectorModalProps> = ({
  isOpen,
  activeThemeId,
  onSelectTheme,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-xl w-full p-5 sm:p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-600 to-violet-600 flex items-center justify-center text-white shadow-md">
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Studio Themes</span>
                <span className="text-[10px] bg-neutral-800 text-neutral-300 font-mono px-2 py-0.5 rounded-full font-semibold">
                  {STUDIO_THEMES.length} Available
                </span>
              </h3>
              <p className="text-[11px] text-neutral-400">
                Apna pasandeeda UI color palette chunein (Theme instantly apply ho jayegi).
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Theme Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-1">
          {STUDIO_THEMES.map((theme: StudioTheme) => {
            const isSelected = theme.id === activeThemeId;

            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => {
                  onSelectTheme(theme.id);
                  onClose();
                }}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative group flex flex-col justify-between ${
                  isSelected
                    ? 'border-rose-500 bg-neutral-800/80 ring-2 ring-rose-500/30 shadow-lg'
                    : 'border-neutral-800 bg-neutral-950/60 hover:border-neutral-700 hover:bg-neutral-800/40'
                }`}
              >
                <div>
                  {/* Top: Swatch circles & Category icon */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5 p-1 rounded-full bg-neutral-900 border border-neutral-800">
                      {theme.previewSwatches.map((color, idx) => (
                        <span
                          key={idx}
                          className="w-3.5 h-3.5 rounded-full shadow-sm border border-black/20"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>

                    <div className="flex items-center gap-1">
                      {theme.category === 'light' ? (
                        <Sun className="w-3.5 h-3.5 text-amber-400" />
                      ) : (
                        <Moon className="w-3.5 h-3.5 text-neutral-400" />
                      )}
                      {isSelected && (
                        <span className="w-4 h-4 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px]">
                          <Check className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>{theme.name}</span>
                    {theme.id === 'obsidian-rose' && (
                      <span className="text-[9px] text-rose-400 bg-rose-500/10 px-1 rounded font-mono">
                        DEFAULT
                      </span>
                    )}
                  </h4>
                  <p className="text-[10px] text-neutral-400 mt-0.5 line-clamp-2 leading-relaxed">
                    {theme.description}
                  </p>
                </div>

                {/* Bottom preview bar */}
                <div className="mt-3 pt-2 border-t border-neutral-800/60 flex items-center justify-between text-[10px] text-neutral-500 font-mono">
                  <span>{theme.category.toUpperCase()}</span>
                  <span className={isSelected ? 'text-rose-400 font-bold' : 'group-hover:text-neutral-300'}>
                    {isSelected ? '✓ Active Theme' : 'Click to Apply'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-neutral-800 mt-4 flex items-center justify-between text-xs text-neutral-400">
          <span className="text-[11px] flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-rose-400" />
            <span>Theme auto-saves in your browser</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold cursor-pointer transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
