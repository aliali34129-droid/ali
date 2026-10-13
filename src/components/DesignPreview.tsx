import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { VideoProject, AdjustSettings, ScriptSettings } from '../types';
import { renderCanvasFrame, getCanvasLayerBounds } from '../utils/canvasRenderer';
import {
  Play,
  Pause,
  RotateCcw,
  Camera,
  Sparkles,
  Music,
  Volume2,
  VolumeX,
  Clock,
  Move,
  Layers,
  Maximize2,
} from 'lucide-react';

interface DesignPreviewProps {
  project: VideoProject;
  loadedMedia: HTMLImageElement | HTMLVideoElement | null;
  loadedBgMedia?: HTMLImageElement | HTMLVideoElement | null;
  onOpenCreateModal: () => void;
  onZoomStep?: (delta: number) => void;
  onUpdateDuration?: (sec: number) => void;
  onUpdateAdjust?: (updated: Partial<AdjustSettings>) => void;
  onUpdateScript?: (updated: Partial<ScriptSettings>) => void;
}

type CornerId = 'nw' | 'ne' | 'sw' | 'se';

export const DesignPreview: React.FC<DesignPreviewProps> = ({
  project,
  loadedMedia,
  loadedBgMedia,
  onOpenCreateModal,
  onZoomStep,
  onUpdateDuration,
  onUpdateAdjust,
  onUpdateScript,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const scrubberRef = useRef<HTMLInputElement>(null);
  const timecodeDisplayRef = useRef<HTMLSpanElement>(null);

  const [isPlaying, setIsPlaying] = useState(true);
  const [isPreviewMuted, setIsPreviewMuted] = useState(false);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  // Layer selection and direct dragging state
  const [selectedLayer, setSelectedLayer] = useState<'image' | 'text'>('image');
  const [hoveredLayer, setHoveredLayer] = useState<'image' | 'text' | null>(null);

  // Active interaction: 'move' or 'corner-resize'
  const [activeInteraction, setActiveInteraction] = useState<{
    type: 'move' | 'resize';
    layer: 'image' | 'text';
    corner?: CornerId;
    startScale?: number;
    startDist?: number;
    liveScale?: number;
  } | null>(null);

  const dragStartRef = useRef<{
    clientX: number;
    clientY: number;
    initX: number;
    initY: number;
    centerClientX: number;
    centerClientY: number;
    startScale: number;
    startDist: number;
  } | null>(null);

  const durationSec = project.durationSeconds || 8.0;
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const currentTimeRef = useRef<number>(0);

  // High performance preview resolution (540x960 is 4x faster to draw than 1080x1920 with identical visual quality on screen)
  const canvasW = 540;
  const canvasH = 960;

  const naturalWidth = (loadedMedia as HTMLImageElement)?.naturalWidth || (loadedMedia as HTMLVideoElement)?.videoWidth || 800;
  const naturalHeight = (loadedMedia as HTMLImageElement)?.naturalHeight || (loadedMedia as HTMLVideoElement)?.videoHeight || 600;

  // Calculate layer bounds for 540x960 preview canvas
  const layerBounds = useMemo(() => {
    return getCanvasLayerBounds(canvasW, canvasH, project, naturalWidth, naturalHeight);
  }, [canvasW, canvasH, project, naturalWidth, naturalHeight]);

  // Handle Corner Resize Pointer Down
  const handleCornerDown = (corner: CornerId, e: React.PointerEvent) => {
    e.stopPropagation();
    const rect = viewportRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Center of image in viewport client coordinates
    const imgCenterX = rect.left + ((layerBounds.image.x + layerBounds.image.width / 2) / canvasW) * rect.width;
    const imgCenterY = rect.top + ((layerBounds.image.y + layerBounds.image.height / 2) / canvasH) * rect.height;

    const startDist = Math.max(10, Math.hypot(e.clientX - imgCenterX, e.clientY - imgCenterY));
    const startScale = project.adjust.scale || 1.0;

    dragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      initX: project.adjust.moveX || 0,
      initY: project.adjust.moveY || 0,
      centerClientX: imgCenterX,
      centerClientY: imgCenterY,
      startScale,
      startDist,
    };

    setActiveInteraction({
      type: 'resize',
      layer: 'image',
      corner,
      startScale,
      startDist,
      liveScale: startScale,
    });
    setSelectedLayer('image');

    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
  };

  // Pointer drag event handlers for direct on-screen manipulation
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = viewportRef.current?.getBoundingClientRect();
    if (!rect) return;

    const canvasX = ((e.clientX - rect.left) / rect.width) * canvasW;
    const canvasY = ((e.clientY - rect.top) / rect.height) * canvasH;

    const isInsideText = (
      canvasX >= layerBounds.text.x &&
      canvasX <= layerBounds.text.x + layerBounds.text.width &&
      canvasY >= layerBounds.text.y &&
      canvasY <= layerBounds.text.y + layerBounds.text.height
    );
    const isInsideImage = (
      canvasX >= layerBounds.image.x &&
      canvasX <= layerBounds.image.x + layerBounds.image.width &&
      canvasY >= layerBounds.image.y &&
      canvasY <= layerBounds.image.y + layerBounds.image.height
    );

    let targetLayer: 'image' | 'text' | null = null;
    if (isInsideText) {
      targetLayer = 'text';
    } else if (isInsideImage) {
      targetLayer = 'image';
    } else {
      targetLayer = selectedLayer;
    }

    if (targetLayer) {
      setSelectedLayer(targetLayer);
      setActiveInteraction({
        type: 'move',
        layer: targetLayer,
      });

      const initX = targetLayer === 'image' ? (project.adjust.moveX || 0) : (project.script.moveX || 0);
      const initY = targetLayer === 'image' ? (project.adjust.moveY || 0) : (project.script.moveY || 0);

      dragStartRef.current = {
        clientX: e.clientX,
        clientY: e.clientY,
        initX,
        initY,
        centerClientX: 0,
        centerClientY: 0,
        startScale: project.adjust.scale || 1.0,
        startDist: 100,
      };

      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {}
    }
  };

  const moveRafRef = useRef<number | null>(null);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = viewportRef.current?.getBoundingClientRect();
    if (!rect) return;

    if (activeInteraction && dragStartRef.current) {
      const clientX = e.clientX;
      const clientY = e.clientY;

      if (moveRafRef.current) return;
      moveRafRef.current = requestAnimationFrame(() => {
        moveRafRef.current = null;
        if (!dragStartRef.current || !viewportRef.current) return;
        const currentRect = viewportRef.current.getBoundingClientRect();

        if (activeInteraction.type === 'resize' && activeInteraction.layer === 'image') {
          // Dragging a corner handle scales the image dynamically
          const currentDist = Math.hypot(
            clientX - dragStartRef.current.centerClientX,
            clientY - dragStartRef.current.centerClientY
          );
          const ratio = currentDist / dragStartRef.current.startDist;
          const newScale = Math.max(0.35, Math.min(2.8, Number((dragStartRef.current.startScale * ratio).toFixed(2))));

          setActiveInteraction((prev) => prev ? { ...prev, liveScale: newScale } : null);
          onUpdateAdjust?.({ scale: newScale });
        } else if (activeInteraction.type === 'move') {
          // Dragging the body moves the layer
          const deltaPxX = clientX - dragStartRef.current.clientX;
          const deltaPxY = clientY - dragStartRef.current.clientY;

          const pctDeltaX = (deltaPxX / currentRect.width) * 100 * (1 / 0.85);
          const pctDeltaY = (deltaPxY / currentRect.height) * 100 * (1 / 0.85);

          const newMoveX = Math.round(Math.max(-100, Math.min(100, dragStartRef.current.initX + pctDeltaX)));
          const newMoveY = Math.round(Math.max(-100, Math.min(100, dragStartRef.current.initY + pctDeltaY)));

          if (activeInteraction.layer === 'image') {
            onUpdateAdjust?.({ moveX: newMoveX, moveY: newMoveY });
          } else {
            onUpdateScript?.({ moveX: newMoveX, moveY: newMoveY });
          }
        }
      });
    } else {
      // Hover detection
      const canvasX = ((e.clientX - rect.left) / rect.width) * canvasW;
      const canvasY = ((e.clientY - rect.top) / rect.height) * canvasH;

      const isInsideText = (
        canvasX >= layerBounds.text.x &&
        canvasX <= layerBounds.text.x + layerBounds.text.width &&
        canvasY >= layerBounds.text.y &&
        canvasY <= layerBounds.text.y + layerBounds.text.height
      );
      const isInsideImage = (
        canvasX >= layerBounds.image.x &&
        canvasX <= layerBounds.image.x + layerBounds.image.width &&
        canvasY >= layerBounds.image.y &&
        canvasY <= layerBounds.image.y + layerBounds.image.height
      );

      if (isInsideText) {
        setHoveredLayer('text');
      } else if (isInsideImage) {
        setHoveredLayer('image');
      } else {
        setHoveredLayer(null);
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activeInteraction) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {}
      setActiveInteraction(null);
      dragStartRef.current = null;
    }
  };

  // Sync preview audio playback with trim start offset
  useEffect(() => {
    if (!project.audio.customAudioUrl || !project.audio.enabled || isPreviewMuted) {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
      }
      return;
    }

    if (!previewAudioRef.current) {
      previewAudioRef.current = new Audio(project.audio.customAudioUrl);
    } else if (previewAudioRef.current.src !== project.audio.customAudioUrl) {
      previewAudioRef.current.src = project.audio.customAudioUrl;
    }

    const audioEl = previewAudioRef.current;
    const startSec = Math.max(0, project.audio.startTime || 0);
    const endSec = startSec + durationSec;

    audioEl.volume = Math.max(0, Math.min(1, project.audio.volume ?? 0.7));

    // Handle time update to loop within the trimmed window
    const handleTimeUpdate = () => {
      if (audioEl.currentTime >= endSec || audioEl.currentTime < startSec - 0.5) {
        audioEl.currentTime = startSec;
      }
    };

    audioEl.addEventListener('timeupdate', handleTimeUpdate);

    if (isPlaying) {
      if (Math.abs(audioEl.currentTime - startSec) > durationSec || audioEl.currentTime < startSec) {
        audioEl.currentTime = startSec;
      }
      audioEl.play().catch(() => {});
    } else {
      audioEl.pause();
    }

    return () => {
      audioEl.removeEventListener('timeupdate', handleTimeUpdate);
      if (audioEl) {
        audioEl.pause();
      }
    };
  }, [
    isPlaying,
    project.audio.customAudioUrl,
    project.audio.enabled,
    project.audio.volume,
    project.audio.loop,
    project.audio.startTime,
    durationSec,
    isPreviewMuted,
  ]);

  // High-performance animation loop: decoupled from React state to avoid lag
  useEffect(() => {
    let currentT = currentTimeRef.current;
    const hasMotion = project.adjust.motionType !== 'static' || project.mediaType === 'video';

    // Immediate draw on any project or media update
    if (canvasRef.current) {
      const normalized = durationSec > 0 ? currentT / durationSec : 0;
      renderCanvasFrame(canvasRef.current, project, loadedMedia, normalized, loadedBgMedia);
    }

    if (!isPlaying) {
      // When paused, do not loop RAF continuously to keep main thread completely free!
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      lastTimeRef.current = null;
      return;
    }

    let lastDrawTime = 0;
    const tick = (now: number) => {
      if (lastTimeRef.current !== null) {
        const deltaSec = (now - lastTimeRef.current) / 1000;
        currentT = (currentT + deltaSec) % durationSec;
        currentTimeRef.current = currentT;

        // Directly update DOM elements without triggering React re-renders!
        if (scrubberRef.current) {
          scrubberRef.current.value = String(currentT);
        }
        if (timecodeDisplayRef.current) {
          timecodeDisplayRef.current.textContent = `${currentT.toFixed(2)}s / ${durationSec.toFixed(1)}s`;
        }
      }
      lastTimeRef.current = now;

      // Redraw canvas only when dynamic motion or video is playing
      if (canvasRef.current && hasMotion) {
        if (now - lastDrawTime >= 28) {
          const normalized = durationSec > 0 ? currentT / durationSec : 0;
          renderCanvasFrame(canvasRef.current, project, loadedMedia, normalized, loadedBgMedia);
          lastDrawTime = now;
        }
      }

      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      lastTimeRef.current = null;
    };
  }, [isPlaying, project, loadedMedia, loadedBgMedia, durationSec]);

  // Handle Snapshot download
  const handleDownloadSnapshot = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `${project.title.replace(/[^a-zA-Z0-9]/g, '_')}_poster.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  const isResizing = activeInteraction?.type === 'resize';
  const isMoving = activeInteraction?.type === 'move';

  return (
    <div className="flex flex-col h-full bg-neutral-900 border border-neutral-800 rounded-xl p-4 md:p-5">
      {/* Header bar matching screenshot: "Design preview 9:16  1080 x 1920" */}
      <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-neutral-200">
              Design preview
            </span>
            <span className="text-[11px] font-mono text-neutral-400 bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800">
              9:16 · {project.resolution === '1080p' ? '1080 × 1920' : '720 × 1280'}
            </span>
          </div>
          <div className="text-[11px] text-neutral-400 mt-0.5">
            CHANNEL DESIGN 9:16 <span className="text-neutral-600">·</span> Output length{' '}
            <span className="text-rose-400 font-mono font-medium">{durationSec.toFixed(1)}s</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Zoom buttons right next to preview */}
          {onZoomStep && (
            <div className="flex items-center bg-neutral-950 border border-neutral-800 rounded-lg p-0.5">
              <button
                type="button"
                onClick={() => onZoomStep(-0.05)}
                className="w-6 h-6 rounded flex items-center justify-center text-xs text-neutral-300 hover:text-white hover:bg-neutral-800 font-bold transition-colors cursor-pointer"
                title="Zoom Out Image (-)"
              >
                -
              </button>
              <span className="px-1.5 text-[11px] font-mono font-bold text-rose-400">
                {project.adjust.scale.toFixed(2)}x
              </span>
              <button
                type="button"
                onClick={() => onZoomStep(0.05)}
                className="w-6 h-6 rounded flex items-center justify-center text-xs text-neutral-300 hover:text-white hover:bg-neutral-800 font-bold transition-colors cursor-pointer"
                title="Zoom In Image (+)"
              >
                +
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={handleDownloadSnapshot}
            title="Download high-res snapshot"
            className="p-1.5 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded-lg text-xs transition-colors cursor-pointer"
          >
            <Camera className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Interactive Layer Toolbar */}
      <div className="flex items-center justify-between pb-2 border-b border-neutral-800/80 mb-2">
        <div className="flex items-center gap-1.5 bg-neutral-950 p-1 rounded-lg border border-neutral-800 text-[11px]">
          <span className="text-neutral-400 font-medium px-1 flex items-center gap-1">
            <Layers className="w-3 h-3 text-rose-500" />
            Layers:
          </span>
          <button
            type="button"
            onClick={() => setSelectedLayer('image')}
            className={`px-2 py-0.5 rounded font-medium flex items-center gap-1 transition-colors cursor-pointer ${
              selectedLayer === 'image'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <span>🖼️</span> Image
            <span className="font-mono text-[10px] opacity-75">
              ({project.adjust.scale.toFixed(2)}x)
            </span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedLayer('text')}
            className={`px-2 py-0.5 rounded font-medium flex items-center gap-1 transition-colors cursor-pointer ${
              selectedLayer === 'text'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <span>📝</span> Text Card
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            if (selectedLayer === 'image') {
              onUpdateAdjust?.({ moveX: 0, moveY: 0, scale: 1.0 });
            } else {
              onUpdateScript?.({ moveX: 0, moveY: 0 });
            }
          }}
          className="text-[10px] text-neutral-400 hover:text-white bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 px-2 py-1 rounded transition-colors cursor-pointer flex items-center gap-1"
          title={`Reset ${selectedLayer} to default`}
        >
          <RotateCcw className="w-2.5 h-2.5" />
          <span>Reset {selectedLayer === 'image' ? 'Image' : 'Text'}</span>
        </button>
      </div>

      {/* Main Canvas Viewport with 9:16 Phone Aspect Ratio */}
      <div className="flex-1 flex flex-col items-center justify-center min-h-[420px] max-h-[640px] py-1">
        <div
          ref={viewportRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          style={{
            cursor: isResizing ? 'nwse-resize' : isMoving ? 'grabbing' : hoveredLayer ? 'grab' : 'default',
            touchAction: 'none',
          }}
          className="relative aspect-9/16 h-full max-h-[580px] rounded-2xl overflow-hidden shadow-2xl border-4 border-neutral-800 bg-neutral-950 flex items-center justify-center select-none"
        >
          {/* Hardware-accelerated canvas (540x960 for instantaneous 60fps response) */}
          <canvas
            ref={canvasRef}
            width={canvasW}
            height={canvasH}
            className="w-full h-full object-contain pointer-events-none"
          />

          {/* Interactive Bounding Box for Image Layer with Corner Resize Handles */}
          <div
            style={{
              left: `${(layerBounds.image.x / canvasW) * 100}%`,
              top: `${(layerBounds.image.y / canvasH) * 100}%`,
              width: `${(layerBounds.image.width / canvasW) * 100}%`,
              height: `${(layerBounds.image.height / canvasH) * 100}%`,
            }}
            className={`absolute pointer-events-none rounded-xl transition-all duration-75 ${
              isResizing || (isMoving && activeInteraction?.layer === 'image')
                ? 'border-2 border-rose-500 shadow-xl ring-4 ring-rose-500/25 bg-rose-500/10'
                : selectedLayer === 'image'
                ? 'border-2 border-rose-500/80 ring-2 ring-rose-500/20'
                : hoveredLayer === 'image'
                ? 'border border-dashed border-rose-400/70 bg-rose-500/5'
                : 'border border-transparent'
            }`}
          >
            {/* Live Size & Action Tag */}
            {(selectedLayer === 'image' || activeInteraction?.layer === 'image' || hoveredLayer === 'image') && (
              <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-neutral-950/95 backdrop-blur border border-rose-500 text-rose-300 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full shadow-lg flex items-center gap-1.5 whitespace-nowrap pointer-events-none z-20">
                <Maximize2 className="w-2.5 h-2.5 text-rose-400" />
                <span>
                  {activeInteraction?.liveScale
                    ? `Zoom: ${activeInteraction.liveScale.toFixed(2)}x`
                    : `Image · ${project.adjust.scale.toFixed(2)}x`}
                </span>
                <span className="text-neutral-500">|</span>
                <span className="text-neutral-300 text-[9px]">Drag corners to resize</span>
              </div>
            )}

            {/* 4 Interactive Corner Resize Handles for Image ("image ke kanron par click karke adjust") */}
            {(selectedLayer === 'image' || activeInteraction?.layer === 'image') && (
              <>
                {/* Top-Left Corner Handle */}
                <div
                  onPointerDown={(e) => handleCornerDown('nw', e)}
                  title="Drag corner to zoom in / out"
                  style={{ touchAction: 'none' }}
                  className="absolute -top-2 -left-2 w-4 h-4 bg-white border-2 border-rose-600 rounded-full shadow-lg cursor-nwse-resize pointer-events-auto hover:scale-125 transition-transform active:scale-135 z-30"
                />

                {/* Top-Right Corner Handle */}
                <div
                  onPointerDown={(e) => handleCornerDown('ne', e)}
                  title="Drag corner to zoom in / out"
                  style={{ touchAction: 'none' }}
                  className="absolute -top-2 -right-2 w-4 h-4 bg-white border-2 border-rose-600 rounded-full shadow-lg cursor-nesw-resize pointer-events-auto hover:scale-125 transition-transform active:scale-135 z-30"
                />

                {/* Bottom-Left Corner Handle */}
                <div
                  onPointerDown={(e) => handleCornerDown('sw', e)}
                  title="Drag corner to zoom in / out"
                  style={{ touchAction: 'none' }}
                  className="absolute -bottom-2 -left-2 w-4 h-4 bg-white border-2 border-rose-600 rounded-full shadow-lg cursor-nesw-resize pointer-events-auto hover:scale-125 transition-transform active:scale-135 z-30"
                />

                {/* Bottom-Right Corner Handle */}
                <div
                  onPointerDown={(e) => handleCornerDown('se', e)}
                  title="Drag corner to zoom in / out"
                  style={{ touchAction: 'none' }}
                  className="absolute -bottom-2 -right-2 w-4 h-4 bg-white border-2 border-rose-600 rounded-full shadow-lg cursor-nwse-resize pointer-events-auto hover:scale-125 transition-transform active:scale-135 z-30"
                />
              </>
            )}
          </div>

          {/* Interactive Bounding Box for Text Layer */}
          <div
            style={{
              left: `${(layerBounds.text.x / canvasW) * 100}%`,
              top: `${(layerBounds.text.y / canvasH) * 100}%`,
              width: `${(layerBounds.text.width / canvasW) * 100}%`,
              height: `${(layerBounds.text.height / canvasH) * 100}%`,
            }}
            className={`absolute pointer-events-none rounded-xl transition-all duration-75 ${
              isMoving && activeInteraction?.layer === 'text'
                ? 'border-2 border-blue-500 shadow-xl ring-4 ring-blue-500/25 bg-blue-500/10'
                : selectedLayer === 'text'
                ? 'border-2 border-blue-400/90 ring-2 ring-blue-500/20'
                : hoveredLayer === 'text'
                ? 'border border-dashed border-blue-400/70 bg-blue-500/5'
                : 'border border-transparent'
            }`}
          >
            {(selectedLayer === 'text' || (isMoving && activeInteraction?.layer === 'text') || hoveredLayer === 'text') && (
              <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-neutral-950/95 backdrop-blur border border-blue-500 text-blue-300 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full shadow-lg flex items-center gap-1 whitespace-nowrap pointer-events-none z-10">
                <Move className="w-2.5 h-2.5 text-blue-400" />
                <span>Text Card · Drag to position</span>
              </div>
            )}
            {(selectedLayer === 'text' || (isMoving && activeInteraction?.layer === 'text')) && (
              <>
                <span className="absolute -top-1 -left-1 w-2.5 h-2.5 bg-blue-500 border border-white rounded-full shadow" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-500 border border-white rounded-full shadow" />
                <span className="absolute -bottom-1 -left-1 w-2.5 h-2.5 bg-blue-500 border border-white rounded-full shadow" />
                <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-blue-500 border border-white rounded-full shadow" />
              </>
            )}
          </div>

          {/* Floating Live Badge */}
          <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/10 text-[10px] font-medium text-white/90 flex items-center gap-1.5 pointer-events-none">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            <span>ShortXShortX · {Math.round(durationSec)}s Fast 60FPS</span>
          </div>
        </div>

        {/* Intuitive visual instruction */}
        <div className="text-[11px] text-neutral-400 mt-1.5 flex items-center gap-1.5 font-medium">
          <span className="text-rose-400">✨</span>
          <span>Image ke corners (kanron) par click & drag kar ke zoom karein, ya image ko move karein</span>
        </div>
      </div>

      {/* Timecode & Playback Control Bar (Optimized direct DOM sync for zero lag) */}
      <div className="pt-3 border-t border-neutral-800 mt-2 space-y-2.5">
        <div className="flex items-center justify-between text-xs text-neutral-400">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-7 h-7 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              {isPlaying ? (
                <Pause className="w-3.5 h-3.5 fill-current" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                currentTimeRef.current = 0;
                if (scrubberRef.current) scrubberRef.current.value = '0';
                if (timecodeDisplayRef.current) timecodeDisplayRef.current.textContent = `0.00s / ${durationSec.toFixed(1)}s`;
              }}
              title="Reset time"
              className="p-1 hover:text-neutral-200 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <span
              ref={timecodeDisplayRef}
              className="font-mono text-neutral-200 text-xs tabular-nums"
            >
              0.00s / {durationSec.toFixed(1)}s
            </span>
            {project.audio.enabled && (
              <button
                type="button"
                onClick={() => setIsPreviewMuted(!isPreviewMuted)}
                className={`p-1 rounded transition-colors cursor-pointer ml-1 ${
                  isPreviewMuted ? 'text-neutral-500 hover:text-neutral-300' : 'text-rose-400 hover:text-rose-300'
                }`}
                title={isPreviewMuted ? 'Unmute preview sound' : 'Mute preview sound'}
              >
                {isPreviewMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {project.adjust.bgSource === 'custom' && (
              <span className="text-[10px] bg-emerald-950/50 border border-emerald-800/60 text-emerald-300 px-2 py-0.5 rounded-full font-medium">
                Custom BG Active
              </span>
            )}
            {project.adjust.bgBlur === 0 && (
              <span className="text-[10px] bg-neutral-800 text-neutral-300 px-2 py-0.5 rounded-full font-medium">
                BG Blur: 0px (Clear)
              </span>
            )}
            <span className="text-[11px] text-emerald-400 font-medium">
              Seamless {Math.round(durationSec)}s Loop Ready
            </span>
          </div>
        </div>

        {/* Direct Scrubber Bar without frame-by-frame state lag */}
        <div className="w-full">
          <input
            ref={scrubberRef}
            type="range"
            min={0}
            max={durationSec}
            step={0.05}
            defaultValue={0}
            onChange={(e) => {
              const val = Number(e.target.value);
              currentTimeRef.current = val;
              if (timecodeDisplayRef.current) {
                timecodeDisplayRef.current.textContent = `${val.toFixed(2)}s / ${durationSec.toFixed(1)}s`;
              }
              if (canvasRef.current) {
                const norm = durationSec > 0 ? val / durationSec : 0;
                renderCanvasFrame(canvasRef.current, project, loadedMedia, norm, loadedBgMedia);
              }
            }}
            className="w-full accent-rose-600 h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* Timeline Duration Selector: 2s to 10s */}
        <div className="pt-2 pb-0.5">
          <div className="flex items-center justify-between text-[11px] mb-1.5">
            <span className="text-neutral-400 font-medium flex items-center gap-1">
              <Clock className="w-3 h-3 text-rose-500" />
              Timeline Duration (2s – 10s):
            </span>
            <span className="font-mono text-rose-400 font-bold text-[11px] bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800">
              {Math.round(durationSec)}s loop
            </span>
          </div>
          <div className="grid grid-cols-9 gap-1">
            {[2, 3, 4, 5, 6, 7, 8, 9, 10].map((sec) => (
              <button
                key={sec}
                type="button"
                onClick={() => onUpdateDuration && onUpdateDuration(sec)}
                className={`py-1 rounded text-[11px] font-semibold font-mono text-center cursor-pointer transition-all ${
                  Math.round(durationSec) === sec
                    ? 'bg-rose-600 text-white shadow-sm ring-1 ring-rose-400 font-bold'
                    : 'bg-neutral-950 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800/80'
                }`}
                title={`Set loop duration to ${sec}s`}
              >
                {sec}s
              </button>
            ))}
          </div>
        </div>

        {/* Bottom Action Prompt */}
        <div className="pt-2 flex items-center justify-between gap-3">
          <div className="text-[11px] text-neutral-400 truncate">
            Current Zoom: <span className="text-neutral-200 font-mono font-medium">{project.adjust.scale.toFixed(2)}x</span>
            {project.adjust.bgBlur > 0 ? (
              <span className="text-neutral-400 ml-2">· Blur: <span className="text-neutral-200 font-mono">{project.adjust.bgBlur}px</span></span>
            ) : (
              <span className="text-emerald-400 ml-2">· Blur: Clear</span>
            )}
          </div>
          <button
            type="button"
            onClick={onOpenCreateModal}
            className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white rounded-lg shadow-sm shadow-rose-950 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Create your video</span>
          </button>
        </div>
      </div>
    </div>
  );
};
