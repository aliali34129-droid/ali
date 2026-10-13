import React, { useRef } from 'react';
import { AdjustSettings } from '../types';
import {
  Move,
  ZoomIn,
  Layers,
  RotateCcw,
  Sparkles,
  Upload,
  Image as ImageIcon,
  Palette,
  Eye,
  EyeOff,
  Trash2,
  Crop,
  Bookmark,
} from 'lucide-react';

interface AdjustPictureTabProps {
  adjust: AdjustSettings;
  onChange: (updated: Partial<AdjustSettings>) => void;
  onPreviewAndCreate: () => void;
  onNextToSound?: () => void;
  onOpenCrop?: () => void;
  onOpenSavePresetModal?: () => void;
}

export const AdjustPictureTab: React.FC<AdjustPictureTabProps> = ({
  adjust,
  onChange,
  onPreviewAndCreate,
  onNextToSound,
  onOpenCrop,
  onOpenSavePresetModal,
}) => {
  const bgFileInputRef = useRef<HTMLInputElement>(null);

  const handleCustomBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    onChange({
      bgSource: 'custom',
      bgCustomUrl: objectUrl,
      bgCustomName: file.name,
    });
  };

  const handleRemoveCustomBg = () => {
    onChange({
      bgSource: 'auto',
      bgCustomUrl: undefined,
      bgCustomName: undefined,
    });
  };

  const currentBgSource = adjust.bgSource || 'auto';

  const backdropPresets = [
    { id: 'studio-dark', name: 'Studio Dark', preview: 'bg-linear-to-b from-neutral-800 to-black' },
    { id: 'neon-glow', name: 'Neon Cyber', preview: 'bg-linear-to-b from-purple-900 via-indigo-950 to-black' },
    { id: 'vintage-warmth', name: 'Vintage Warm', preview: 'bg-linear-to-b from-amber-900 via-stone-900 to-black' },
    { id: 'midnight-blue', name: 'Midnight Blue', preview: 'bg-linear-to-b from-blue-900 via-slate-950 to-black' },
    { id: 'emerald-dark', name: 'Emerald Forest', preview: 'bg-linear-to-b from-emerald-950 to-neutral-950' },
    { id: 'sunset-vibes', name: 'Sunset Horizon', preview: 'bg-linear-to-b from-rose-900 via-pink-950 to-black' },
  ];

  const colorPresets = [
    { color: '#000000', name: 'Pure Black' },
    { color: '#0f172a', name: 'Deep Slate' },
    { color: '#18181b', name: 'Charcoal' },
    { color: '#020617', name: 'Navy' },
    { color: '#2e0819', name: 'Dark Wine' },
    { color: '#042f2e', name: 'Dark Teal' },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Corner Resize & Drag Info Card */}
      <div className="p-3.5 rounded-xl bg-linear-to-r from-rose-950/40 via-neutral-900 to-neutral-950 border border-rose-900/40 flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-rose-600/20 text-rose-400 flex items-center justify-center shrink-0 mt-0.5">
          <Sparkles className="w-4 h-4" />
        </div>
        <div className="text-xs">
          <div className="font-semibold text-rose-300">
            Image ke corners (kanron) par click kar ke resize karein!
          </div>
          <div className="text-neutral-400 text-[11px] mt-0.5 leading-relaxed">
            Preview screen par image ke <span className="text-white font-medium">4 white corner handles</span> ko mouse ya touch se drag kar ke zoom in ya zoom out kar sakte hain, aur center se pakar kar kisi bhi jagah move kar sakte hain.
          </div>
        </div>
      </div>

      {/* 2. Manual Image Zoom In / Zoom Out Setting */}
      <div className="bg-neutral-950/70 border border-neutral-800 p-4 rounded-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ZoomIn className="w-4 h-4 text-rose-500" />
            <span className="text-xs font-semibold text-neutral-200">
              Image Zoom & Size
            </span>
          </div>
          <span className="text-xs font-mono font-bold text-rose-400 bg-neutral-900 px-2.5 py-0.5 rounded border border-neutral-800">
            {adjust.scale.toFixed(2)}x
          </span>
        </div>

        {/* Zoom In & Out Controls with Buttons */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onChange({ scale: Math.max(0.35, Number((adjust.scale - 0.05).toFixed(2))) })}
            className="w-8 h-8 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 flex items-center justify-center font-bold text-sm cursor-pointer transition-colors"
            title="Zoom Out (-)"
          >
            -
          </button>

          <input
            type="range"
            min={0.35}
            max={2.6}
            step={0.02}
            value={adjust.scale}
            onChange={(e) => onChange({ scale: Number(e.target.value) })}
            className="flex-1 accent-rose-600 h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
          />

          <button
            type="button"
            onClick={() => onChange({ scale: Math.min(2.6, Number((adjust.scale + 0.05).toFixed(2))) })}
            className="w-8 h-8 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 flex items-center justify-center font-bold text-sm cursor-pointer transition-colors"
            title="Zoom In (+)"
          >
            +
          </button>
        </div>

        {/* Quick Zoom Presets */}
        <div className="flex items-center justify-between gap-1.5 pt-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            {[0.65, 0.85, 1.0, 1.25, 1.5, 2.0].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => onChange({ scale: preset })}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors cursor-pointer ${
                  Math.abs(adjust.scale - preset) < 0.03
                    ? 'bg-rose-600 text-white font-semibold'
                    : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800'
                }`}
              >
                {preset.toFixed(2)}x
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onChange({ scale: 1.0, moveX: 0, moveY: 0 })}
              className="text-[11px] text-neutral-400 hover:text-white flex items-center gap-1 p-1 cursor-pointer transition-colors"
              title="Reset to 1.00x default"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>

            {onOpenCrop && (
              <button
                type="button"
                onClick={onOpenCrop}
                className="px-2.5 py-1 text-[11px] font-bold bg-gradient-to-r from-rose-600 to-violet-600 hover:from-rose-500 hover:to-violet-500 text-white rounded-md flex items-center gap-1 shadow cursor-pointer transition-all active:scale-95"
                title="Open image crop tool"
              >
                <Crop className="w-3 h-3" />
                <span>✂️ Crop Photo</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. Position Alignment (Picture Position - Move anywhere on screen) */}
      <div className="bg-neutral-950/70 border border-neutral-800 p-4 rounded-xl space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
            <Move className="w-3.5 h-3.5 text-rose-500" />
            Picture Position (Move on screen)
          </h4>
          <span className="text-[11px] text-rose-400/90 font-medium">
            Drag directly on preview
          </span>
        </div>

        {/* Move left / right */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-neutral-400">Move left / right (X)</span>
            <span className="text-neutral-200 font-mono tabular-nums bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
              {adjust.moveX > 0 ? `+${adjust.moveX}` : adjust.moveX}
            </span>
          </div>
          <input
            type="range"
            min={-100}
            max={100}
            value={adjust.moveX}
            onChange={(e) => onChange({ moveX: Number(e.target.value) })}
            className="w-full accent-rose-600 h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* Move up / down */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-neutral-400">Move up / down (Y)</span>
            <span className="text-neutral-200 font-mono tabular-nums bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
              {adjust.moveY > 0 ? `+${adjust.moveY}` : adjust.moveY}
            </span>
          </div>
          <input
            type="range"
            min={-100}
            max={100}
            value={adjust.moveY}
            onChange={(e) => onChange({ moveY: Number(e.target.value) })}
            className="w-full accent-rose-600 h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* Image Corner Radius & Shadow */}
        <div className="grid grid-cols-2 gap-3 pt-1 border-t border-neutral-800/80">
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-neutral-400">Corner Radius</span>
              <span className="text-neutral-200 font-mono tabular-nums">
                {adjust.imageBorderRadius}px
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={32}
              value={adjust.imageBorderRadius}
              onChange={(e) =>
                onChange({ imageBorderRadius: Number(e.target.value) })
              }
              className="w-full accent-rose-600 h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between bg-neutral-900 p-2.5 rounded-lg border border-neutral-800">
            <span className="text-xs text-neutral-300">Drop Shadow</span>
            <input
              type="checkbox"
              checked={adjust.imageShadow}
              onChange={(e) => onChange({ imageShadow: e.target.checked })}
              className="accent-rose-600 w-4 h-4 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* 4. Background Customization & Blur Settings ("Background image change aur apni marzi se blur") */}
      <div className="bg-neutral-950/70 border border-neutral-800 p-4 rounded-xl space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div>
            <h4 className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-rose-500" />
              Background Image & Blur Controls
            </h4>
            <p className="text-[11px] text-neutral-400 mt-0.5">
              Background image ko change karein aur blur ko apni marzi se set karein.
            </p>
          </div>
          <span className="text-[11px] font-mono font-semibold text-rose-400 bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
            {adjust.bgBlur === 0 ? 'Clear (No Blur)' : `${adjust.bgBlur}px Blur`}
          </span>
        </div>

        {/* Background Source Selector Tabs */}
        <div>
          <label className="text-xs font-medium text-neutral-300 block mb-2">
            Background Source (Change Background):
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 bg-neutral-900 p-1 rounded-lg border border-neutral-800 text-xs">
            <button
              type="button"
              onClick={() => onChange({ bgSource: 'auto' })}
              className={`py-1.5 px-2 rounded-md font-medium text-center transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                currentBgSource === 'auto'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Same Photo</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (adjust.bgCustomUrl) {
                  onChange({ bgSource: 'custom' });
                } else {
                  bgFileInputRef.current?.click();
                }
              }}
              className={`py-1.5 px-2 rounded-md font-medium text-center transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                currentBgSource === 'custom'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Custom BG</span>
            </button>

            <button
              type="button"
              onClick={() => onChange({ bgSource: 'preset' })}
              className={`py-1.5 px-2 rounded-md font-medium text-center transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                currentBgSource === 'preset'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Backdrops</span>
            </button>

            <button
              type="button"
              onClick={() => onChange({ bgSource: 'color' })}
              className={`py-1.5 px-2 rounded-md font-medium text-center transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                currentBgSource === 'color'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>Solid Color</span>
            </button>
          </div>
        </div>

        {/* Custom Background Uploader Panel */}
        {currentBgSource === 'custom' && (
          <div className="p-3 bg-neutral-900/80 border border-neutral-800 rounded-xl space-y-2.5">
            <input
              ref={bgFileInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleCustomBgUpload}
              className="hidden"
            />
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-neutral-300">
                Uploaded Background Media:
              </span>
              {adjust.bgCustomUrl && (
                <button
                  type="button"
                  onClick={handleRemoveCustomBg}
                  className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Remove BG</span>
                </button>
              )}
            </div>

            {adjust.bgCustomUrl ? (
              <div className="flex items-center justify-between bg-neutral-950 p-2 rounded-lg border border-neutral-800">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="w-12 h-12 rounded overflow-hidden bg-black shrink-0 border border-neutral-800">
                    <img
                      src={adjust.bgCustomUrl}
                      alt="Custom BG"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="truncate">
                    <div className="text-xs text-neutral-200 font-medium truncate">
                      {adjust.bgCustomName || 'custom_background.jpg'}
                    </div>
                    <div className="text-[10px] text-emerald-400">
                      Active Background Layer
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => bgFileInputRef.current?.click()}
                  className="px-2.5 py-1 text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded cursor-pointer transition-colors shrink-0"
                >
                  Change
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => bgFileInputRef.current?.click()}
                className="w-full py-4 border-2 border-dashed border-neutral-700 hover:border-rose-500 rounded-lg bg-neutral-950 text-center cursor-pointer transition-colors flex flex-col items-center justify-center gap-1"
              >
                <Upload className="w-5 h-5 text-rose-500 mb-0.5" />
                <span className="text-xs font-medium text-neutral-200">
                  Click to choose a separate background image
                </span>
                <span className="text-[11px] text-neutral-400">
                  JPG, PNG, WEBP or MP4
                </span>
              </button>
            )}
          </div>
        )}

        {/* Preset Backdrops Panel */}
        {currentBgSource === 'preset' && (
          <div className="space-y-2">
            <span className="text-xs font-medium text-neutral-300 block">
              Choose Preset Backdrop:
            </span>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {backdropPresets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => onChange({ bgPresetId: preset.id })}
                  className={`h-14 rounded-lg overflow-hidden border-2 p-1 flex flex-col justify-end transition-all cursor-pointer relative ${preset.preview} ${
                    (adjust.bgPresetId || 'studio-dark') === preset.id
                      ? 'border-rose-500 ring-2 ring-rose-500/30'
                      : 'border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <span className="text-[10px] font-semibold text-white drop-shadow truncate block leading-tight">
                    {preset.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Solid Color Panel */}
        {currentBgSource === 'color' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-neutral-300">
                Choose Color:
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-neutral-400">
                  {adjust.bgColor || '#000000'}
                </span>
                <input
                  type="color"
                  value={adjust.bgColor || '#000000'}
                  onChange={(e) => onChange({ bgColor: e.target.value })}
                  className="w-6 h-6 rounded border border-neutral-700 cursor-pointer bg-transparent"
                />
              </div>
            </div>
            <div className="grid grid-cols-6 gap-2">
              {colorPresets.map((col) => (
                <button
                  key={col.color}
                  type="button"
                  onClick={() => onChange({ bgColor: col.color })}
                  style={{ backgroundColor: col.color }}
                  className={`h-9 rounded-lg border-2 transition-all cursor-pointer ${
                    (adjust.bgColor || '#000000') === col.color
                      ? 'border-rose-500 ring-2 ring-rose-500/30'
                      : 'border-neutral-800 hover:border-neutral-600'
                  }`}
                  title={col.name}
                />
              ))}
            </div>
          </div>
        )}

        {/* 5. Blur Intensity Slider & Quick Presets ("apni marzi sa blur") */}
        <div className="pt-2 border-t border-neutral-800/80 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              {adjust.bgBlur === 0 ? (
                <EyeOff className="w-3.5 h-3.5 text-neutral-400" />
              ) : (
                <Eye className="w-3.5 h-3.5 text-rose-500" />
              )}
              <span className="text-neutral-200 font-medium">
                Blur Intensity (0px = No blur / Sharp, 100px = Bokeh):
              </span>
            </div>
            <span className="text-neutral-200 font-mono tabular-nums bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800 font-bold">
              {adjust.bgBlur}px
            </span>
          </div>

          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={adjust.bgBlur}
            onChange={(e) => onChange({ bgBlur: Number(e.target.value) })}
            className="w-full accent-rose-600 h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
          />

          {/* Quick Blur Intensity Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            {[
              { val: 0, label: 'No Blur (0px)' },
              { val: 15, label: 'Soft (15px)' },
              { val: 38, label: 'Standard (38px)' },
              { val: 65, label: 'Deep (65px)' },
              { val: 95, label: 'Max Bokeh (95px)' },
            ].map((b) => (
              <button
                key={b.val}
                type="button"
                onClick={() => onChange({ bgBlur: b.val })}
                className={`px-2 py-1 text-[11px] font-medium rounded-md transition-colors cursor-pointer ${
                  adjust.bgBlur === b.val
                    ? 'bg-rose-600 text-white font-semibold shadow-sm'
                    : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800'
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>

        {/* 6. Background Dimming / Darkness & Background Scale */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-neutral-800/80">
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-neutral-400">Background Dimming (Contrast)</span>
              <span className="text-neutral-200 font-mono tabular-nums bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
                {Math.round(adjust.bgDarkness * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={0.8}
              step={0.05}
              value={adjust.bgDarkness}
              onChange={(e) => onChange({ bgDarkness: Number(e.target.value) })}
              className="w-full accent-rose-600 h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-neutral-400">Background Zoom / Scale</span>
              <span className="text-neutral-200 font-mono tabular-nums bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
                {(adjust.bgScale || 1.4).toFixed(2)}x
              </span>
            </div>
            <input
              type="range"
              min={1.0}
              max={2.5}
              step={0.05}
              value={adjust.bgScale || 1.4}
              onChange={(e) => onChange({ bgScale: Number(e.target.value) })}
              className="w-full accent-rose-600 h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Save Settings as Preset Bar */}
      {onOpenSavePresetModal && (
        <div className="p-3 bg-neutral-950/80 border border-neutral-800 rounded-xl flex items-center justify-between gap-3">
          <div>
            <div className="text-xs font-bold text-neutral-200 flex items-center gap-1.5">
              <Bookmark className="w-3.5 h-3.5 text-amber-400" />
              <span>Save Current Picture & Blur Setup</span>
            </div>
            <div className="text-[11px] text-neutral-400">
              Save your zoom, blur, and motion settings as a reusable template.
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenSavePresetModal}
            className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-amber-300 border border-neutral-700 hover:border-amber-500/60 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 shadow-sm"
          >
            Save Preset
          </button>
        </div>
      )}

      {/* Action Buttons */}
      <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
        {onNextToSound && (
          <button
            type="button"
            onClick={onNextToSound}
            className="w-full sm:w-1/2 py-2.5 px-4 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Next: Background Sound 🎵</span>
            <span>→</span>
          </button>
        )}
        <button
          type="button"
          onClick={onPreviewAndCreate}
          className={`${onNextToSound ? 'w-full sm:w-1/2' : 'w-full'} py-2.5 px-4 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm shadow-rose-950`}
        >
          <span>Preview & create</span>
          <span>→</span>
        </button>
      </div>
    </div>
  );
};
