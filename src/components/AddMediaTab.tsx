import React, { useRef, useState } from 'react';
import { Upload, Image as ImageIcon, X, Check, Film, Plus, Layers, Sparkles, Crop } from 'lucide-react';
import { ImageCropModal } from './ImageCropModal';

interface MediaItem {
  id: string;
  url: string;
  name: string;
  type: 'image' | 'video';
}

interface AddMediaTabProps {
  currentMediaUrl: string;
  currentMediaName: string;
  customBgUrl?: string;
  onSelectMedia: (url: string, name: string, type: 'image' | 'video') => void;
  onSelectCustomBg?: (url?: string, name?: string) => void;
  onNext: () => void;
}

export const AddMediaTab: React.FC<AddMediaTabProps> = ({
  currentMediaUrl,
  currentMediaName,
  customBgUrl,
  onSelectMedia,
  onSelectCustomBg,
  onNext,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bgFileInputRef = useRef<HTMLInputElement>(null);

  const [mediaList, setMediaList] = useState<MediaItem[]>([
    {
      id: 'default-dog',
      url: '/src/assets/images/vintage_german_shepherd_etzel_1790500289989.jpg',
      name: 'vintage_german_shepherd_etzel.jpg',
      type: 'image',
    },
    {
      id: 'default-jazz',
      url: '/src/assets/images/vintage_jazz_singer_stage_1790500311794.jpg',
      name: 'vintage_jazz_singer_stage.jpg',
      type: 'image',
    },
  ]);

  const [dragOver, setDragOver] = useState(false);

  // Crop modal state
  const [cropTarget, setCropTarget] = useState<{ isOpen: boolean; url: string; name: string } | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const objectUrl = URL.createObjectURL(file);
      const isVideo = file.type.startsWith('video');
      const newItem: MediaItem = {
        id: `upload-${Date.now()}-${i}`,
        url: objectUrl,
        name: file.name,
        type: isVideo ? 'video' : 'image',
      };

      setMediaList((prev) => [newItem, ...prev]);
      if (i === 0) {
        onSelectMedia(newItem.url, newItem.name, newItem.type);
      }
    }
  };

  const handleBgFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    onSelectCustomBg?.(objectUrl, file.name);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const objectUrl = URL.createObjectURL(file);
      const isVideo = file.type.startsWith('video');
      const newItem: MediaItem = {
        id: `drop-${Date.now()}-${i}`,
        url: objectUrl,
        name: file.name,
        type: isVideo ? 'video' : 'image',
      };

      setMediaList((prev) => [newItem, ...prev]);
      if (i === 0) {
        onSelectMedia(newItem.url, newItem.name, newItem.type);
      }
    }
  };

  const handleRemoveItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setMediaList((prev) => {
      const updated = prev.filter((m) => m.id !== id);
      if (currentMediaUrl === prev.find((m) => m.id === id)?.url && updated.length > 0) {
        onSelectMedia(updated[0].url, updated[0].name, updated[0].type);
      }
      return updated;
    });
  };

  const handleApplyCrop = (croppedUrl: string, croppedName: string) => {
    const newItem: MediaItem = {
      id: `cropped-${Date.now()}`,
      url: croppedUrl,
      name: croppedName,
      type: 'image',
    };

    setMediaList((prev) => [newItem, ...prev]);
    onSelectMedia(croppedUrl, croppedName, 'image');
  };

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-neutral-300">
            Upload Image or Video Clip:
          </label>
          <span className="text-[11px] text-neutral-400">JPG, PNG, WEBP, MP4</span>
        </div>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
            dragOver
              ? 'border-rose-500 bg-rose-950/20'
              : 'border-neutral-800 bg-neutral-950/50 hover:border-neutral-700 hover:bg-neutral-900/60'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={handleFileUpload}
            className="hidden"
          />
          <div className="w-10 h-10 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto mb-2.5 text-rose-500">
            <Upload className="w-5 h-5" />
          </div>
          <div className="text-xs font-semibold text-neutral-200">
            Click to upload or drag & drop files
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">
            Media stays in this browser tab. Download your finished loop video before leaving.
          </div>
          <div className="mt-3">
            <button
              type="button"
              className="px-3.5 py-1.5 text-xs font-medium bg-rose-600 hover:bg-rose-500 text-white rounded-lg inline-flex items-center gap-1.5 transition-colors cursor-pointer pointer-events-none"
            >
              <span>Choose files</span>
              <span>→</span>
            </button>
          </div>
        </div>
      </div>

      {/* Prominent Image Crop Feature Card */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-neutral-900 via-neutral-950 to-neutral-900 border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-600/30 to-violet-600/30 text-rose-400 border border-rose-500/30 flex items-center justify-center shrink-0 shadow-sm">
            <Crop className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-neutral-100 flex items-center gap-2">
              <span>Photo Cropping Tool</span>
              <span className="text-[10px] bg-rose-600/25 text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded-full font-bold">
                9:16 Shorts · 1:1 Square · Free
              </span>
            </div>
            <div className="text-[11px] text-neutral-400 mt-0.5 leading-relaxed">
              Tasweer ko 9:16 vertical ya apni marzi ke size par crop karein taake video frame par fit aaye.
            </div>
          </div>
        </div>

        {currentMediaUrl && (
          <button
            type="button"
            onClick={() =>
              setCropTarget({
                isOpen: true,
                url: currentMediaUrl,
                name: currentMediaName || 'photo.jpg',
              })
            }
            className="px-4 py-2 bg-gradient-to-r from-rose-600 to-violet-600 hover:from-rose-500 hover:to-violet-500 text-white text-xs font-extrabold rounded-lg shadow-lg shadow-rose-950/40 transition-all cursor-pointer flex items-center gap-2 shrink-0 active:scale-95"
            title="Crop and frame active image"
          >
            <Crop className="w-4 h-4" />
            <span>✂️ Crop Active Photo</span>
          </button>
        )}
      </div>

      {/* Media Gallery with Dual Targets & Crop Option */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
          <div>
            <h4 className="text-xs font-bold text-neutral-200">
              My photos and videos ({mediaList.length})
            </h4>
            <span className="text-[11px] text-neutral-400">
              Select one for main picture, crop to 9:16 / 1:1, or set as background
            </span>
          </div>

          {/* Quick Crop Button for Current Media */}
          {currentMediaUrl && (
            <button
              type="button"
              onClick={() =>
                setCropTarget({
                  isOpen: true,
                  url: currentMediaUrl,
                  name: currentMediaName,
                })
              }
              className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white text-xs font-bold rounded-lg border border-neutral-700 transition-all cursor-pointer flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
              title="Crop active image"
            >
              <Crop className="w-3.5 h-3.5 text-rose-400" />
              <span>Crop Picture</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {mediaList.map((item) => {
            const isSelected = item.url === currentMediaUrl;
            const isBgSelected = item.url === customBgUrl;

            return (
              <div
                key={item.id}
                onClick={() => onSelectMedia(item.url, item.name, item.type)}
                className={`relative aspect-4/3 rounded-lg overflow-hidden border-2 cursor-pointer group transition-all ${
                  isSelected
                    ? 'border-rose-500 ring-2 ring-rose-500/30'
                    : isBgSelected
                    ? 'border-blue-500 ring-2 ring-blue-500/30'
                    : 'border-neutral-800 hover:border-neutral-700'
                }`}
              >
                {item.type === 'video' ? (
                  <video
                    src={item.url}
                    className="w-full h-full object-cover"
                    muted
                    loop
                  />
                ) : (
                  <img
                    src={item.url}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                )}

                {/* Remove button 'x' */}
                <button
                  type="button"
                  onClick={(e) => handleRemoveItem(item.id, e)}
                  title="Remove this image"
                  className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/70 hover:bg-rose-600 text-white flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10"
                >
                  <X className="w-3 h-3" />
                </button>

                {/* Always-visible Crop Button for images */}
                {item.type !== 'video' && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCropTarget({ isOpen: true, url: item.url, name: item.name });
                    }}
                    title="Crop this photo"
                    className="absolute bottom-1.5 right-1.5 px-2 py-1 rounded-md bg-neutral-950/90 hover:bg-rose-600 text-white text-[10px] font-black border border-white/20 transition-all cursor-pointer z-10 flex items-center gap-1 shadow-md hover:scale-105 active:scale-95"
                  >
                    <Crop className="w-3 h-3 text-rose-400" />
                    <span>✂️ Crop</span>
                  </button>
                )}

                {/* Quick 'Set as BG' hover button */}
                {onSelectCustomBg && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isBgSelected) {
                        onSelectCustomBg(undefined, undefined);
                      } else {
                        onSelectCustomBg(item.url, item.name);
                      }
                    }}
                    title={isBgSelected ? 'Remove from background' : 'Set as background image'}
                    className={`absolute top-1.5 left-1.5 text-[9px] px-1.5 py-0.5 rounded font-medium transition-all z-10 flex items-center gap-1 ${
                      isBgSelected
                        ? 'bg-blue-600 text-white shadow'
                        : 'bg-black/70 text-neutral-300 opacity-0 group-hover:opacity-100 hover:bg-neutral-800'
                    }`}
                  >
                    <Layers className="w-2.5 h-2.5" />
                    <span>{isBgSelected ? 'BG Active' : 'Set as BG'}</span>
                  </button>
                )}

                {/* Selected Indicator */}
                {isSelected && (
                  <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-rose-600 text-white text-[10px] font-medium flex items-center gap-1 shadow-sm">
                    <Check className="w-2.5 h-2.5" />
                    <span>Main Picture</span>
                  </div>
                )}
              </div>
            );
          })}

          {/* Quick Add Placeholder */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="aspect-4/3 rounded-lg border border-dashed border-neutral-800 hover:border-neutral-700 flex flex-col items-center justify-center text-neutral-400 hover:text-neutral-200 transition-colors cursor-pointer bg-neutral-950/40"
          >
            <Plus className="w-6 h-6 mb-1 text-neutral-500" />
            <span className="text-xs font-medium">Add more</span>
          </button>
        </div>
      </div>

      {/* Background Media Uploader / Override */}
      <div className="p-4 rounded-xl bg-neutral-950/60 border border-neutral-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded bg-neutral-900 border border-neutral-800 flex items-center justify-center text-rose-500">
            <Layers className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-neutral-200">
              Separate Background Picture
            </div>
            <div className="text-[11px] text-neutral-400">
              {customBgUrl ? 'Custom background is set' : 'Currently using blurred foreground picture'}
            </div>
          </div>
        </div>

        <input
          ref={bgFileInputRef}
          type="file"
          accept="image/*,video/*"
          onChange={handleBgFileUpload}
          className="hidden"
        />

        <div className="flex items-center gap-2">
          {customBgUrl && onSelectCustomBg && (
            <button
              type="button"
              onClick={() => onSelectCustomBg(undefined, undefined)}
              className="px-2.5 py-1 text-xs text-neutral-400 hover:text-white bg-neutral-900 hover:bg-neutral-800 rounded border border-neutral-800 cursor-pointer transition-colors"
            >
              Reset BG
            </button>
          )}
          <button
            type="button"
            onClick={() => bgFileInputRef.current?.click()}
            className="px-3 py-1.5 text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg cursor-pointer transition-colors flex items-center gap-1.5"
          >
            <Upload className="w-3 h-3" />
            <span>Upload BG</span>
          </button>
        </div>
      </div>

      {/* Continue CTA */}
      <div className="pt-2">
        <button
          type="button"
          onClick={onNext}
          className="w-full py-2.5 px-4 bg-gradient-to-r from-rose-600 to-violet-600 hover:from-rose-500 hover:to-violet-500 text-white font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-rose-950/40"
        >
          <span>Adjust picture & background</span>
          <span>→</span>
        </button>
      </div>

      {/* Interactive Image Crop Modal */}
      {cropTarget && (
        <ImageCropModal
          isOpen={cropTarget.isOpen}
          imageUrl={cropTarget.url}
          imageName={cropTarget.name}
          onClose={() => setCropTarget(null)}
          onApplyCrop={handleApplyCrop}
        />
      )}
    </div>
  );
};
