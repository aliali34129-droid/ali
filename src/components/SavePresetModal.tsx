import React, { useState, useEffect, useRef } from 'react';
import { VideoProject, SavedUserTemplate } from '../types';
import {
  getUserTemplates,
  saveUserTemplate,
  deleteUserTemplate,
  setDefaultUserTemplate,
  exportUserTemplatesJson,
  importUserTemplatesJson,
} from '../utils/userTemplates';
import {
  Bookmark,
  Sparkles,
  Check,
  Trash2,
  Star,
  X,
  Type,
  Sliders,
  Music,
  Clock,
  ArrowRight,
  Download,
  Upload,
} from 'lucide-react';

interface SavePresetModalProps {
  isOpen: boolean;
  project: VideoProject;
  onApplyTemplate: (template: SavedUserTemplate) => void;
  onClose: () => void;
}

export const SavePresetModal: React.FC<SavePresetModalProps> = ({
  isOpen,
  project,
  onApplyTemplate,
  onClose,
}) => {
  const [presetName, setPresetName] = useState('');
  const [isDefaultStartup, setIsDefaultStartup] = useState(false);
  const [templates, setTemplates] = useState<SavedUserTemplate[]>([]);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTemplates(getUserTemplates());
      setPresetName(`My ${project.script.fontFamily ? project.script.fontFamily.toUpperCase() : 'Custom'} Style`);
      setSaveSuccessMsg(null);
    }
  }, [isOpen, project.script.fontFamily]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const saved = saveUserTemplate(presetName, project, isDefaultStartup);
    setTemplates(getUserTemplates());
    setSaveSuccessMsg(`Preset "${saved.name}" successfully saved!`);
    setTimeout(() => {
      setSaveSuccessMsg(null);
    }, 2500);
  };

  const handleImportJsonFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const updated = importUserTemplatesJson(content);
        setTemplates(updated);
        setSaveSuccessMsg(`Presets successfully imported from ${file.name}!`);
        setTimeout(() => setSaveSuccessMsg(null), 3000);
      } catch (err) {
        alert('Could not import file: invalid JSON format');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = deleteUserTemplate(id);
    setTemplates(updated);
  };

  const handleToggleDefault = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDefaultUserTemplate(id);
    setTemplates(getUserTemplates());
  };

  const handleSelect = (tmpl: SavedUserTemplate) => {
    onApplyTemplate(tmpl);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-xl w-full p-5 sm:p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-600 to-amber-600 flex items-center justify-center text-white shadow-md">
              <Bookmark className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Save & Load Custom Settings (Templates)</span>
              </h3>
              <p className="text-[11px] text-neutral-400">
                Apni manually set ki hui tamam settings (Fonts, Colors, Margins, Zoom) ko 1-click preset mein save karein.
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

        {/* Section 1: Save Current Settings */}
        <form onSubmit={handleSave} className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-rose-500" />
              <span>Save Current Tool Settings as Preset</span>
            </span>
            <span className="text-[10px] text-neutral-400 font-mono">1-Click Reload</span>
          </div>

          <div>
            <label className="text-[11px] font-medium text-neutral-400 block mb-1">
              Preset / Template Name:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                placeholder="e.g. My Rubik Bold Style, Viral Shorts Preset..."
                className="flex-1 bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-1.5 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-rose-500"
                required
              />
              <button
                type="submit"
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer shrink-0 shadow-sm"
              >
                Save Preset
              </button>
            </div>
          </div>

          {/* Current Settings Snapshot summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[10px] bg-neutral-900/60 p-2.5 rounded-lg border border-neutral-800/80 text-neutral-300 font-mono">
            <div>
              <span className="text-neutral-500 block">Font:</span>
              <span className="font-bold text-white truncate block">{project.script.fontFamily} ({project.script.fontWeight || '800'})</span>
            </div>
            <div>
              <span className="text-neutral-500 block">Font Size:</span>
              <span className="font-bold text-white">{project.script.fontSize}px</span>
            </div>
            <div>
              <span className="text-neutral-500 block">Box Margin & Opacity:</span>
              <span className="font-bold text-white">{project.script.boxMaxWidth}% / {Math.round((project.script.boxOpacity ?? 0.96) * 100)}%</span>
            </div>
            <div>
              <span className="text-neutral-500 block">Duration / Scale:</span>
              <span className="font-bold text-white">{project.durationSeconds}s / {project.adjust.scale}x</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-neutral-300">
              <input
                type="checkbox"
                checked={isDefaultStartup}
                onChange={(e) => setIsDefaultStartup(e.target.checked)}
                className="accent-rose-600 w-3.5 h-3.5 rounded cursor-pointer"
              />
              <span>Har baar naye video par yeh setting automatically default load ho</span>
            </label>

            {saveSuccessMsg && (
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1 animate-in fade-in">
                <Check className="w-3.5 h-3.5" />
                <span>{saveSuccessMsg}</span>
              </span>
            )}
          </div>
        </form>

        {/* Section 2: Your Saved Presets List */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h4 className="text-xs font-bold text-neutral-200 flex items-center gap-1.5">
              <Bookmark className="w-3.5 h-3.5 text-rose-500" />
              <span>Your Saved Presets ({templates.length})</span>
            </h4>
            
            <div className="flex items-center gap-1.5">
              <input
                ref={importInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleImportJsonFile}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => importInputRef.current?.click()}
                className="px-2 py-1 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 rounded-lg text-[11px] font-medium transition-colors flex items-center gap-1 cursor-pointer"
                title="Import presets from JSON file"
              >
                <Upload className="w-3 h-3 text-neutral-400" />
                <span>Import JSON</span>
              </button>

              <button
                type="button"
                onClick={exportUserTemplatesJson}
                className="px-2 py-1 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 rounded-lg text-[11px] font-medium transition-colors flex items-center gap-1 cursor-pointer"
                title="Backup all presets to JSON file"
              >
                <Download className="w-3 h-3 text-neutral-400" />
                <span>Backup JSON</span>
              </button>
            </div>
          </div>

          <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
            {templates.length === 0 ? (
              <div className="text-center py-6 text-xs text-neutral-500 bg-neutral-950/50 rounded-xl border border-neutral-800">
                Abhi koi saved preset nahi hai. Upar apna pehla preset save karein!
              </div>
            ) : (
              templates.map((tmpl) => {
                const wordsCount = tmpl.script.wordColors ? Object.keys(tmpl.script.wordColors).length : 0;
                return (
                  <div
                    key={tmpl.id}
                    onClick={() => handleSelect(tmpl)}
                    className="p-3 bg-neutral-950/90 hover:bg-neutral-800/80 border border-neutral-800 hover:border-rose-500/60 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-3 group"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-neutral-200 group-hover:text-white truncate">
                          {tmpl.name}
                        </span>
                        {tmpl.isDefault && (
                          <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-mono font-bold flex items-center gap-0.5">
                            <Star className="w-2.5 h-2.5 fill-current" />
                            <span>DEFAULT</span>
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-neutral-400 mt-1 font-mono flex flex-wrap items-center gap-1.5">
                        <span className="bg-neutral-900 px-1.5 py-0.5 rounded border border-neutral-800 text-neutral-300">
                          {tmpl.script.fontFamily || 'rubik'} ({tmpl.script.fontWeight || '800'})
                        </span>
                        <span className="bg-neutral-900 px-1.5 py-0.5 rounded border border-neutral-800 text-neutral-300">
                          Card: {tmpl.script.boxMaxWidth || 86}%
                        </span>
                        <span className="bg-neutral-900 px-1.5 py-0.5 rounded border border-neutral-800 text-neutral-300">
                          Zoom: {tmpl.adjust.scale || 1.0}x
                        </span>
                        {wordsCount > 0 && (
                          <span className="bg-rose-950/60 text-rose-300 px-1.5 py-0.5 rounded border border-rose-800/60">
                            {wordsCount} colored words
                          </span>
                        )}
                        <span className="text-neutral-500">
                          {tmpl.durationSeconds || 8}s
                        </span>
                      </div>
                    </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => handleToggleDefault(tmpl.id, e)}
                      className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
                        tmpl.isDefault
                          ? 'bg-amber-600/30 text-amber-300 border-amber-500/50'
                          : 'bg-neutral-900 text-neutral-400 hover:text-amber-400 border-neutral-800'
                      }`}
                      title={tmpl.isDefault ? 'Default preset' : 'Set as default startup preset'}
                    >
                      <Star className={`w-3.5 h-3.5 ${tmpl.isDefault ? 'fill-current' : ''}`} />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleDelete(tmpl.id, e)}
                      className="p-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-rose-400 border border-neutral-800 rounded-lg transition-colors cursor-pointer"
                      title="Delete preset"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelect(tmpl)}
                      className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-sm"
                    >
                      <span>Apply</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
          </div>
        </div>
      </div>
    </div>
  );
};
