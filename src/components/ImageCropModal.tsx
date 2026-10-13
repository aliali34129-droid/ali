import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  Check,
  RotateCw,
  Crop as CropIcon,
  Maximize2,
  ZoomIn,
  Sparkles,
  RotateCcw,
} from 'lucide-react';

export type AspectRatioOption = 'free' | '9:16' | '1:1' | '4:5' | '16:9' | '3:4';

interface ImageCropModalProps {
  isOpen: boolean;
  imageUrl: string;
  imageName: string;
  onClose: () => void;
  onApplyCrop: (croppedUrl: string, croppedName: string) => void;
}

export const ImageCropModal: React.FC<ImageCropModalProps> = ({
  isOpen,
  imageUrl,
  imageName,
  onClose,
  onApplyCrop,
}) => {
  const [aspect, setAspect] = useState<AspectRatioOption>('9:16');
  const [zoom, setZoom] = useState<number>(1.0);
  const [rotation, setRotation] = useState<number>(0); // 0, 90, 180, 270

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  // Normalized crop rectangle: 0 to 1 relative to displayed image dimensions
  const [crop, setCrop] = useState<{ x: number; y: number; width: number; height: number }>({
    x: 0.1,
    y: 0.05,
    width: 0.8,
    height: 0.9,
  });

  const [activeDrag, setActiveDrag] = useState<string | null>(null);
  const dragStartRef = useRef<{ clientX: number; clientY: number; initCrop: typeof crop } | null>(null);

  // Calculate aspect ratio decimal value
  const getAspectDecimal = useCallback((ratio: AspectRatioOption): number | null => {
    switch (ratio) {
      case '9:16':
        return 9 / 16;
      case '1:1':
        return 1.0;
      case '4:5':
        return 4 / 5;
      case '16:9':
        return 16 / 9;
      case '3:4':
        return 3 / 4;
      case 'free':
      default:
        return null;
    }
  }, []);

  // Initialize or re-constrain crop box based on selected aspect ratio
  const applyAspectToCrop = useCallback(
    (newAspect: AspectRatioOption, currentCrop: typeof crop) => {
      const dec = getAspectDecimal(newAspect);
      if (!dec) return currentCrop;

      let newW = currentCrop.width;
      let newH = newW / dec;

      if (newH > 0.96) {
        newH = 0.96;
        newW = newH * dec;
      }
      if (newW > 0.96) {
        newW = 0.96;
        newH = newW / dec;
      }

      const newX = Math.max(0.02, Math.min(1 - newW - 0.02, 0.5 - newW / 2));
      const newY = Math.max(0.02, Math.min(1 - newH - 0.02, 0.5 - newH / 2));

      return {
        x: Number(newX.toFixed(3)),
        y: Number(newY.toFixed(3)),
        width: Number(newW.toFixed(3)),
        height: Number(newH.toFixed(3)),
      };
    },
    [getAspectDecimal]
  );

  // When aspect ratio tab changes, update crop box
  const handleSelectAspect = (newAspect: AspectRatioOption) => {
    setAspect(newAspect);
    setCrop((prev) => applyAspectToCrop(newAspect, prev));
  };

  // Reset crop to full
  const handleReset = () => {
    setZoom(1.0);
    setRotation(0);
    setCrop(applyAspectToCrop(aspect, { x: 0.05, y: 0.05, width: 0.9, height: 0.9 }));
  };

  // Pointer down handler for handles & box
  const handlePointerDown = (handle: string, e: React.PointerEvent) => {
    e.stopPropagation();
    setActiveDrag(handle);
    dragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      initCrop: { ...crop },
    };

    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!activeDrag || !dragStartRef.current || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const deltaX = (e.clientX - dragStartRef.current.clientX) / rect.width;
    const deltaY = (e.clientY - dragStartRef.current.clientY) / rect.height;
    const { initCrop } = dragStartRef.current;
    const targetAspect = getAspectDecimal(aspect);

    let nextCrop = { ...initCrop };

    if (activeDrag === 'move') {
      // Pan crop box
      const maxX = 1 - initCrop.width;
      const maxY = 1 - initCrop.height;
      nextCrop.x = Math.max(0, Math.min(maxX, initCrop.x + deltaX));
      nextCrop.y = Math.max(0, Math.min(maxY, initCrop.y + deltaY));
    } else {
      // Handle corner and edge resizing
      let { x, y, width: w, height: h } = initCrop;

      if (activeDrag.includes('e')) {
        w = Math.max(0.15, Math.min(1 - x, initCrop.width + deltaX));
      }
      if (activeDrag.includes('s')) {
        h = Math.max(0.15, Math.min(1 - y, initCrop.height + deltaY));
      }
      if (activeDrag.includes('w')) {
        const potentialW = Math.max(0.15, Math.min(initCrop.x + initCrop.width, initCrop.width - deltaX));
        x = initCrop.x + (initCrop.width - potentialW);
        w = potentialW;
      }
      if (activeDrag.includes('n')) {
        const potentialH = Math.max(0.15, Math.min(initCrop.y + initCrop.height, initCrop.height - deltaY));
        y = initCrop.y + (initCrop.height - potentialH);
        h = potentialH;
      }

      // Constrain aspect ratio if locked
      if (targetAspect) {
        if (activeDrag === 'e' || activeDrag === 'w') {
          h = Math.min(1 - y, w / targetAspect);
          w = h * targetAspect;
        } else {
          w = Math.min(1 - x, h * targetAspect);
          h = w / targetAspect;
        }
      }

      nextCrop = {
        x: Math.max(0, Math.min(1 - w, x)),
        y: Math.max(0, Math.min(1 - h, y)),
        width: Math.max(0.15, Math.min(1, w)),
        height: Math.max(0.15, Math.min(1, h)),
      };
    }

    setCrop(nextCrop);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (activeDrag) {
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
      setActiveDrag(null);
      dragStartRef.current = null;
    }
  };

  // Execute exact crop on an offscreen canvas
  const handleApply = () => {
    const img = imageRef.current;
    if (!img) return;

    const naturalW = img.naturalWidth || 800;
    const naturalH = img.naturalHeight || 600;

    const sourceCropX = Math.round(crop.x * naturalW);
    const sourceCropY = Math.round(crop.y * naturalH);
    const sourceCropW = Math.round(crop.width * naturalW);
    const sourceCropH = Math.round(crop.height * naturalH);

    // Setup output canvas matching cropped resolution
    const outCanvas = document.createElement('canvas');
    if (rotation === 90 || rotation === 270) {
      outCanvas.width = sourceCropH;
      outCanvas.height = sourceCropW;
    } else {
      outCanvas.width = sourceCropW;
      outCanvas.height = sourceCropH;
    }

    const ctx = outCanvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Apply rotation if needed
    if (rotation !== 0) {
      ctx.translate(outCanvas.width / 2, outCanvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      if (rotation === 90 || rotation === 270) {
        ctx.drawImage(
          img,
          sourceCropX,
          sourceCropY,
          sourceCropW,
          sourceCropH,
          -sourceCropW / 2,
          -sourceCropH / 2,
          sourceCropW,
          sourceCropH
        );
      } else {
        ctx.drawImage(
          img,
          sourceCropX,
          sourceCropY,
          sourceCropW,
          sourceCropH,
          -sourceCropW / 2,
          -sourceCropH / 2,
          sourceCropW,
          sourceCropH
        );
      }
    } else {
      ctx.drawImage(
        img,
        sourceCropX,
        sourceCropY,
        sourceCropW,
        sourceCropH,
        0,
        0,
        sourceCropW,
        sourceCropH
      );
    }

    try {
      const croppedDataUrl = outCanvas.toDataURL('image/jpeg', 0.95);
      const croppedFileName = `cropped_${imageName.replace(/\.[^/.]+$/, '')}_${Date.now()}.jpg`;
      onApplyCrop(croppedDataUrl, croppedFileName);
      onClose();
    } catch (err) {
      console.warn('Could not export cropped image directly:', err);
      // Fallback
      onClose();
    }
  };

  if (!isOpen) return null;

  const aspectList: { id: AspectRatioOption; label: string; desc: string }[] = [
    { id: '9:16', label: '9:16', desc: 'Shorts & Reels' },
    { id: '1:1', label: '1:1', desc: 'Square' },
    { id: '4:5', label: '4:5', desc: 'Portrait' },
    { id: '16:9', label: '16:9', desc: 'Landscape' },
    { id: '3:4', label: '3:4', desc: 'Classic' },
    { id: 'free', label: 'Free', desc: 'Custom' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl relative flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-600/20 border border-rose-500/30 flex items-center justify-center text-rose-500">
              <CropIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                <span>Crop & Frame Image</span>
                <span className="text-[10px] bg-rose-600 text-white font-mono px-1.5 py-0.2 rounded font-bold">
                  {aspect}
                </span>
              </h3>
              <p className="text-[11px] text-neutral-400">
                Corner handles ko drag kar ke image crop karein ya aspect ratio chunein.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1.5 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Aspect Ratio Selector Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-2">
          {aspectList.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelectAspect(item.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 border flex flex-col items-center leading-tight ${
                aspect === item.id
                  ? 'bg-rose-600 text-white border-rose-500 shadow-md ring-2 ring-rose-500/25'
                  : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-white hover:border-neutral-700'
              }`}
            >
              <span>{item.label}</span>
              <span className="text-[9px] font-normal opacity-75">{item.desc}</span>
            </button>
          ))}
        </div>

        {/* Main Crop Viewport */}
        <div className="flex-1 min-h-[300px] max-h-[460px] bg-neutral-950 rounded-xl border border-neutral-800 flex items-center justify-center p-3 relative overflow-hidden select-none">
          <div
            ref={containerRef}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="relative inline-block max-h-full max-w-full select-none"
            style={{ touchAction: 'none' }}
          >
            <img
              ref={imageRef}
              src={imageUrl}
              alt="Crop target"
              crossOrigin="anonymous"
              style={{
                transform: `rotate(${rotation}deg) scale(${zoom})`,
                transition: 'transform 0.1s ease-out',
                maxHeight: '380px',
                maxWidth: '100%',
                display: 'block',
                objectFit: 'contain',
              }}
              className="pointer-events-none rounded shadow-lg"
            />

            {/* Dark Mask Overlay Outside Crop Box */}
            <div className="absolute inset-0 pointer-events-none">
              {/* Top Mask */}
              <div
                style={{ height: `${crop.y * 100}%` }}
                className="w-full bg-black/60 absolute top-0 left-0"
              />
              {/* Bottom Mask */}
              <div
                style={{ top: `${(crop.y + crop.height) * 100}%` }}
                className="w-full bg-black/60 absolute bottom-0 left-0"
              />
              {/* Left Mask */}
              <div
                style={{
                  top: `${crop.y * 100}%`,
                  height: `${crop.height * 100}%`,
                  width: `${crop.x * 100}%`,
                }}
                className="bg-black/60 absolute left-0"
              />
              {/* Right Mask */}
              <div
                style={{
                  top: `${crop.y * 100}%`,
                  height: `${crop.height * 100}%`,
                  left: `${(crop.x + crop.width) * 100}%`,
                  right: 0,
                }}
                className="bg-black/60 absolute"
              />
            </div>

            {/* Interactive Crop Box */}
            <div
              style={{
                left: `${crop.x * 100}%`,
                top: `${crop.y * 100}%`,
                width: `${crop.width * 100}%`,
                height: `${crop.height * 100}%`,
              }}
              onPointerDown={(e) => handlePointerDown('move', e)}
              className="absolute border-2 border-rose-500 shadow-2xl cursor-move touch-none"
            >
              {/* Rule of Thirds Grid Lines */}
              <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 opacity-40">
                <div className="border-r border-b border-white/60" />
                <div className="border-r border-b border-white/60" />
                <div className="border-b border-white/60" />
                <div className="border-r border-b border-white/60" />
                <div className="border-r border-b border-white/60" />
                <div className="border-b border-white/60" />
                <div className="border-r border-white/60" />
                <div className="border-r border-white/60" />
                <div />
              </div>

              {/* Center Drag Badge */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-0 hover:opacity-100 transition-opacity bg-neutral-950/80 px-2 py-0.5 rounded text-[10px] text-white font-mono">
                Drag to Reposition
              </div>

              {/* 4 Corner Drag Handles */}
              <div
                onPointerDown={(e) => handlePointerDown('nw', e)}
                title="Resize top-left"
                className="absolute -top-2 -left-2 w-4 h-4 bg-white border-2 border-rose-600 rounded-full shadow-lg cursor-nwse-resize hover:scale-125 transition-transform z-20"
              />
              <div
                onPointerDown={(e) => handlePointerDown('ne', e)}
                title="Resize top-right"
                className="absolute -top-2 -right-2 w-4 h-4 bg-white border-2 border-rose-600 rounded-full shadow-lg cursor-nesw-resize hover:scale-125 transition-transform z-20"
              />
              <div
                onPointerDown={(e) => handlePointerDown('sw', e)}
                title="Resize bottom-left"
                className="absolute -bottom-2 -left-2 w-4 h-4 bg-white border-2 border-rose-600 rounded-full shadow-lg cursor-nesw-resize hover:scale-125 transition-transform z-20"
              />
              <div
                onPointerDown={(e) => handlePointerDown('se', e)}
                title="Resize bottom-right"
                className="absolute -bottom-2 -right-2 w-4 h-4 bg-white border-2 border-rose-600 rounded-full shadow-lg cursor-nwse-resize hover:scale-125 transition-transform z-20"
              />

              {/* 4 Edge Handles */}
              <div
                onPointerDown={(e) => handlePointerDown('n', e)}
                title="Resize top edge"
                className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-8 h-2.5 bg-white border border-rose-600 rounded-full shadow cursor-ns-resize hover:scale-110 transition-transform z-10"
              />
              <div
                onPointerDown={(e) => handlePointerDown('s', e)}
                title="Resize bottom edge"
                className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-8 h-2.5 bg-white border border-rose-600 rounded-full shadow cursor-ns-resize hover:scale-110 transition-transform z-10"
              />
              <div
                onPointerDown={(e) => handlePointerDown('w', e)}
                title="Resize left edge"
                className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-2.5 h-8 bg-white border border-rose-600 rounded-full shadow cursor-ew-resize hover:scale-110 transition-transform z-10"
              />
              <div
                onPointerDown={(e) => handlePointerDown('e', e)}
                title="Resize right edge"
                className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-2.5 h-8 bg-white border border-rose-600 rounded-full shadow cursor-ew-resize hover:scale-110 transition-transform z-10"
              />
            </div>
          </div>
        </div>

        {/* Bottom Toolbar: Rotation, Zoom & Actions */}
        <div className="pt-3 border-t border-neutral-800 mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setRotation((prev) => (prev + 90) % 360)}
              className="px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Rotate 90° clockwise"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Rotate 90°</span>
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Reset crop to full"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleApply}
              className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-rose-600 to-violet-600 hover:from-rose-500 hover:to-violet-500 rounded-lg shadow-lg shadow-rose-950/40 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>Apply & Save Crop</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
