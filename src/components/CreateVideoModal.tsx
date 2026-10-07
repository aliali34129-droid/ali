import React, { useState, useRef } from 'react';
import { VideoProject, RenderProgress, ExportedVideo, AudioSettings } from '../types';
import { VideoRendererEngine, ExportResult } from '../utils/videoExporter';
import {
  X,
  Play,
  CheckCircle2,
  AlertCircle,
  Download,
  RotateCcw,
  Sparkles,
  Film,
  Camera,
  Check,
  Music,
  Clock,
} from 'lucide-react';

interface CreateVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: VideoProject;
  loadedMedia: HTMLImageElement | HTMLVideoElement | null;
  loadedBgMedia?: HTMLImageElement | HTMLVideoElement | null;
  onSaveExport: (video: ExportedVideo) => void;
  onUpdateDuration: (seconds: number) => void;
  onUpdateResolution: (res: '1080p' | '720p') => void;
  onOpenSoundTab?: () => void;
  onUpdateAudio?: (audio: Partial<AudioSettings>) => void;
}

export const CreateVideoModal: React.FC<CreateVideoModalProps> = ({
  isOpen,
  onClose,
  project,
  loadedMedia,
  loadedBgMedia,
  onSaveExport,
  onUpdateDuration,
  onUpdateResolution,
  onOpenSoundTab,
  onUpdateAudio,
}) => {
  const [renderProgress, setRenderProgress] = useState<RenderProgress | null>(null);
  const [exportResult, setExportResult] = useState<ExportResult | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const rendererEngineRef = useRef<VideoRendererEngine | null>(null);

  if (!isOpen) return null;

  const isMediaReady = !!loadedMedia;
  const isScriptReady = !!project.script.text.trim();
  const allChecksPass = isMediaReady && isScriptReady;

  const handleStartRender = async () => {
    if (!loadedMedia) return;
    setRenderError(null);

    // Clean up previous engine and object URLs to prevent memory bloat and duration duplication
    if (rendererEngineRef.current) {
      rendererEngineRef.current.cancel();
      rendererEngineRef.current = null;
    }

    if (exportResult) {
      try {
        URL.revokeObjectURL(exportResult.videoUrl);
      } catch {
        // ignore
      }
      setExportResult(null);
    }

    const engine = new VideoRendererEngine();
    rendererEngineRef.current = engine;

    try {
      const result = await engine.renderVideo(
        project,
        loadedMedia,
        (prog) => {
          setRenderProgress(prog);
        },
        loadedBgMedia
      );

      setExportResult(result);
      setRenderProgress(null);

      // Save to saved list
      const exported: ExportedVideo = {
        id: `export-${Date.now()}`,
        title: project.title,
        videoUrl: result.videoUrl,
        posterUrl: result.posterUrl,
        duration: result.durationSec,
        resolution: project.resolution === '1080p' ? '1080x1920' : '720x1280',
        sizeBytes: result.videoBlob.size,
        createdAt: new Date().toLocaleTimeString(),
      };
      onSaveExport(exported);
    } catch (err: unknown) {
      if ((err as Error)?.message?.includes('cancelled')) {
        setRenderProgress(null);
        setRenderError('Video generation stopped.');
      } else {
        console.error('Render error:', err);
        setRenderProgress(null);
        setRenderError('Failed to generate video. Please try again.');
      }
    }
  };

  const handleStopCreating = () => {
    if (rendererEngineRef.current) {
      rendererEngineRef.current.cancel();
    }
    setRenderProgress(null);
  };

  const handleDownload = () => {
    if (!exportResult) return;
    const a = document.createElement('a');
    a.href = exportResult.videoUrl;
    const ext = exportResult.mimeType.includes('mp4') ? 'mp4' : 'webm';
    a.download = `${project.title.replace(/[^a-zA-Z0-9]/g, '_')}_ShortXShortX.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-xl w-full p-6 md:p-7 shadow-2xl relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header matching ShortXShortX Studio */}
        <div className="mb-5">
          <div className="text-[11px] font-semibold text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-violet-400 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-violet-400" />
            <span>ShortXShortX Studio · High-Speed Render Engine</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-neutral-100 mt-0.5">
            Export Your 8s Seamless Video
          </h2>
        </div>

        {/* Video Parameters Box (Length Timeline & Output Resolution) */}
        <div className="space-y-4 p-4 rounded-xl bg-neutral-950/70 border border-neutral-800 mb-5">
          {/* Timeline Video Length (2s – 10s) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-rose-500" />
                Video Duration Timeline (2s – 10s)
              </label>
              <span className="text-xs font-mono font-bold text-rose-400 bg-neutral-900 px-2.5 py-0.5 rounded border border-neutral-800">
                {project.durationSeconds} Seconds Loop ({Math.round(project.durationSeconds * 30)} frames)
              </span>
            </div>

            {/* Quick buttons: 2s to 10s continuous */}
            <div className="grid grid-cols-9 gap-1 sm:gap-1.5 mt-2">
              {[2, 3, 4, 5, 6, 7, 8, 9, 10].map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => onUpdateDuration(sec)}
                  className={`py-1.5 px-0.5 rounded text-xs font-semibold text-center cursor-pointer transition-all ${
                    project.durationSeconds === sec
                      ? 'bg-rose-600 text-white shadow-sm ring-1 ring-rose-400 font-bold'
                      : 'bg-neutral-800/80 text-neutral-300 hover:text-white hover:bg-neutral-700'
                  }`}
                >
                  {sec}s
                </button>
              ))}
            </div>

            {/* Interactive Timeline Slider */}
            <div className="mt-3">
              <input
                type="range"
                min={2}
                max={10}
                step={1}
                value={project.durationSeconds}
                onChange={(e) => onUpdateDuration(Number(e.target.value))}
                className="w-full accent-rose-600 h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-neutral-500 font-mono mt-1 px-0.5">
                <span>2s (Ultra Fast)</span>
                <span>4s</span>
                <span>6s</span>
                <span className="text-rose-400/90 font-semibold">8s (Standard)</span>
                <span>10s (Long)</span>
              </div>
            </div>
          </div>

          {/* Output Quality & Aspect Ratio */}
          <div className="pt-3 border-t border-neutral-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-medium text-neutral-300 block">
                Output Format
              </span>
              <span className="text-[11px] text-neutral-400">
                9:16 Vertical video for Reels, Shorts & TikTok
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => onUpdateResolution('1080p')}
                className={`px-3 py-1.5 rounded text-xs font-semibold cursor-pointer transition-colors ${
                  project.resolution === '1080p'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'bg-neutral-800 text-neutral-300 hover:text-white'
                }`}
              >
                1080p · 9:16 (Full HD)
              </button>
              <button
                type="button"
                onClick={() => onUpdateResolution('720p')}
                className={`px-3 py-1.5 rounded text-xs font-semibold cursor-pointer transition-colors ${
                  project.resolution === '720p'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'bg-neutral-800 text-neutral-300 hover:text-white'
                }`}
              >
                720p (Fast)
              </button>
            </div>
          </div>
        </div>

        {/* Background Sound / Music Status Card */}
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-neutral-950/70 border border-neutral-800 mb-5">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
              project.audio.enabled ? 'bg-rose-600/20 text-rose-400' : 'bg-neutral-800 text-neutral-400'
            }`}>
              <Music className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-neutral-200 truncate">
                {project.audio.enabled
                  ? project.audio.customAudioName
                    ? `Track: ${project.audio.customAudioName}`
                    : project.audio.ambientTrack && project.audio.ambientTrack !== 'none'
                    ? `Ambient: ${project.audio.ambientTrack.replace('-', ' ')}`
                    : 'Background Music Enabled'
                  : 'Background Sound: Muted'}
              </div>
              <div className="text-[11px] text-neutral-400">
                {project.audio.enabled
                  ? `Volume ${Math.round((project.audio.volume ?? 0.7) * 100)}% · Embedded in 8s loop video`
                  : 'Video will be exported without audio'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onUpdateAudio && (
              <button
                type="button"
                onClick={() => onUpdateAudio({ enabled: !project.audio.enabled })}
                className={`px-2.5 py-1 text-xs rounded-lg font-medium cursor-pointer transition-colors ${
                  project.audio.enabled
                    ? 'bg-rose-950/40 text-rose-400 border border-rose-800/50 hover:bg-rose-900/40'
                    : 'bg-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-700'
                }`}
              >
                {project.audio.enabled ? 'Mute' : 'Enable'}
              </button>
            )}

            {onOpenSoundTab && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenSoundTab();
                }}
                className="px-2.5 py-1 text-xs rounded-lg font-medium bg-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-700 cursor-pointer transition-colors"
              >
                Change track
              </button>
            )}
          </div>
        </div>

        {/* Instruction Note */}
        <p className="text-xs text-neutral-400 leading-relaxed mb-5">
          Check the design preview then create your video. Keep this tab open until it finishes. You can watch the finished video before uploading or downloading.
        </p>

        {/* Video Checks Section (Directly from Laptop Screenshot 2) */}
        <div className="p-4 rounded-xl bg-neutral-950/60 border border-neutral-800/80 mb-6 space-y-2">
          <div className="text-xs font-semibold text-neutral-200">
            Video checks
          </div>

          <div className="space-y-1.5">
            <div className="flex items-start gap-2 text-xs">
              {isMediaReady ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              )}
              <span className={isMediaReady ? 'text-neutral-300' : 'text-amber-400'}>
                {isMediaReady
                  ? project.adjust.bgSource === 'custom'
                    ? `Media loaded · Custom background (${project.adjust.bgBlur === 0 ? 'Sharp 0px' : `${project.adjust.bgBlur}px blur`})`
                    : project.adjust.bgSource === 'preset'
                    ? `Media loaded · Backdrop preset (${project.adjust.bgPresetId})`
                    : project.adjust.bgSource === 'color'
                    ? `Media loaded · Solid background (${project.adjust.bgColor})`
                    : `All media loaded · ${project.adjust.bgBlur === 0 ? 'Sharp 0px blur' : `${project.adjust.bgBlur}px blurred background`}`
                  : 'Some video frames are empty. Add media or check if image is loaded'}
              </span>
            </div>

            <div className="flex items-start gap-2 text-xs">
              {isScriptReady ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              )}
              <span className={isScriptReady ? 'text-neutral-300' : 'text-amber-400'}>
                {isScriptReady
                  ? `Script formatted into black card (${project.script.text.split(' ').length} words)`
                  : 'Script is empty. Please enter story text'}
              </span>
            </div>

            <div className="flex items-start gap-2 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span className="text-neutral-300">
                Sine-wave seamless {project.durationSeconds}-second loop generator active
              </span>
            </div>

            <div className="flex items-start gap-2 text-xs">
              {project.audio.enabled ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-neutral-500 shrink-0 mt-0.5" />
              )}
              <span className={project.audio.enabled ? 'text-neutral-300' : 'text-neutral-400'}>
                {project.audio.enabled
                  ? `Background audio: ${project.audio.customAudioName || (project.audio.ambientTrack && project.audio.ambientTrack !== 'none' ? project.audio.ambientTrack.replace('-', ' ') : 'Active track')} (${Math.round((project.audio.volume ?? 0.7) * 100)}% vol) · ${
                      project.audio.trimMode === 'manual'
                        ? `Manual Slice (${(project.audio.startTime || 0).toFixed(1)}s - ${((project.audio.startTime || 0) + (project.durationSeconds || 8)).toFixed(1)}s)`
                        : 'Auto-Adjust Loop'
                    }`
                  : 'Background audio: Muted (silent loop video)'}
              </span>
            </div>
          </div>
        </div>

        {/* Error notification if any */}
        {renderError && (
          <div className="mb-5 p-3 rounded-lg bg-amber-950/30 border border-amber-800/50 text-xs text-amber-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
            <span>{renderError}</span>
          </div>
        )}

        {/* Rendering in progress indicator (Screenshot 2: 'Rendering 1 of 1...') */}
        {renderProgress && (
          <div className="mb-6 p-4 rounded-xl bg-neutral-950 border border-rose-950/40 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-rose-400 font-medium truncate">
                Rendering 1 of 1 — {project.title}
              </span>
              <span className="text-neutral-300 font-mono tabular-nums">
                {renderProgress.progressPercent}%
              </span>
            </div>

            <div className="w-full h-2.5 bg-neutral-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-linear-to-r from-rose-600 to-rose-400 transition-all duration-150"
                style={{ width: `${renderProgress.progressPercent}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-neutral-400 font-mono">
              <span>
                Frame {renderProgress.currentFrame} / {renderProgress.totalFrames}
              </span>
              <span>
                ~{renderProgress.timeRemainingSec}s remaining
              </span>
            </div>
          </div>
        )}

        {/* Finished Video Player & Download Box */}
        {exportResult && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-950/20 border border-emerald-900/40 space-y-4">
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Video ready! {exportResult.durationSec}-Second Seamless Loop Created</span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="aspect-9/16 w-32 rounded-lg overflow-hidden border border-neutral-800 bg-black shrink-0">
                <video
                  src={exportResult.videoUrl}
                  controls
                  autoPlay
                  loop
                  playsInline
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="space-y-2 flex-1 text-xs">
                <div className="text-neutral-300 font-medium truncate">
                  {project.title}
                </div>
                <div className="text-[11px] text-neutral-400 font-mono">
                  Length: {exportResult.durationSec}s · Resolution: {project.resolution} · Size: {(exportResult.videoBlob.size / (1024 * 1024)).toFixed(1)} MB
                </div>
                <div className="pt-1 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Loop Video</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons matching screenshot 2: 'Create video' and 'Stop creating' */}
        <div className="flex items-center justify-between gap-3 pt-2">
          {renderProgress ? (
            <button
              type="button"
              onClick={handleStopCreating}
              className="px-4 py-2.5 text-xs font-semibold text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors cursor-pointer"
            >
              Stop creating
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-neutral-400 hover:text-white transition-colors cursor-pointer"
            >
              Close
            </button>
          )}

          {!exportResult ? (
            <button
              type="button"
              disabled={!allChecksPass || !!renderProgress}
              onClick={handleStartRender}
              className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg shadow-sm shadow-rose-950 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              {renderProgress ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Creating {project.durationSeconds}s video...</span>
                </>
              ) : (
                <>
                  <Film className="w-4 h-4" />
                  <span>Create video</span>
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleStartRender}
              className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Render Again</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
