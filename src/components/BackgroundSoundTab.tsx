import React, { useRef, useState, useEffect } from 'react';
import { AudioSettings } from '../types';
import {
  Music,
  Upload,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Trash2,
  Sparkles,
  Check,
  Disc3,
  Repeat,
  Sliders,
  Scissors,
  Zap,
  RotateCcw,
  FastForward,
  Rewind,
  Volume1,
} from 'lucide-react';
import { createLoopAudioBuffer } from '../utils/audioGenerator';

interface BackgroundSoundTabProps {
  audio: AudioSettings;
  durationSeconds?: number;
  onChange: (updated: Partial<AudioSettings>) => void;
  onPreviewAndCreate: () => void;
}

export const BackgroundSoundTab: React.FC<BackgroundSoundTabProps> = ({
  audio,
  durationSeconds = 8.0,
  onChange,
  onPreviewAndCreate,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [activePresetPreview, setActivePresetPreview] = useState<string | null>(null);
  const [previewCurrentTime, setPreviewCurrentTime] = useState(0);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);
  const synthSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const synthCtxRef = useRef<AudioContext | null>(null);

  const trimMode = audio.trimMode || 'auto';
  const startTime = Math.max(0, audio.startTime || 0);
  const totalDuration = audio.totalAudioDuration || 0;
  const targetDuration = durationSeconds || 8.0;

  // Inspect audio metadata when custom audio is present
  useEffect(() => {
    if (audio.customAudioUrl && !audio.totalAudioDuration) {
      const probe = new Audio(audio.customAudioUrl);
      probe.onloadedmetadata = () => {
        if (isFinite(probe.duration) && probe.duration > 0) {
          onChange({
            totalAudioDuration: Math.round(probe.duration * 10) / 10,
          });
        }
      };
    }
  }, [audio.customAudioUrl, audio.totalAudioDuration, onChange]);

  // Stop any playing sound on unmount
  useEffect(() => {
    return () => {
      stopAllAudio();
    };
  }, []);

  const stopAllAudio = () => {
    if (audioPreviewRef.current) {
      audioPreviewRef.current.pause();
    }
    if (synthSourceRef.current) {
      try {
        synthSourceRef.current.stop();
      } catch {
        // ignore
      }
      synthSourceRef.current = null;
    }
    if (synthCtxRef.current) {
      try {
        synthCtxRef.current.close();
      } catch {
        // ignore
      }
      synthCtxRef.current = null;
    }
    setIsPlayingPreview(false);
    setActivePresetPreview(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    stopAllAudio();

    const objectUrl = URL.createObjectURL(file);

    // Probe duration
    const probe = new Audio(objectUrl);
    probe.onloadedmetadata = () => {
      const detectedDuration = isFinite(probe.duration) ? Math.round(probe.duration * 10) / 10 : 0;
      onChange({
        enabled: true,
        customAudioUrl: objectUrl,
        customAudioName: file.name,
        customAudioSize: file.size,
        totalAudioDuration: detectedDuration,
        trimMode: detectedDuration > targetDuration + 1 ? 'auto' : 'auto',
        startTime: 0,
        ambientTrack: 'none',
        volume: audio.volume ?? 0.7,
        loop: true,
        fadeIn: true,
        fadeOut: true,
      });
    };

    probe.onerror = () => {
      onChange({
        enabled: true,
        customAudioUrl: objectUrl,
        customAudioName: file.name,
        customAudioSize: file.size,
        ambientTrack: 'none',
        volume: audio.volume ?? 0.7,
        loop: true,
        trimMode: 'auto',
        startTime: 0,
      });
    };

    e.target.value = '';
  };

  const handleRemoveCustomAudio = () => {
    stopAllAudio();
    onChange({
      customAudioUrl: undefined,
      customAudioName: undefined,
      customAudioSize: undefined,
      totalAudioDuration: undefined,
      startTime: 0,
    });
  };

  // Preview custom audio trimmed slice
  const toggleCustomAudioPlay = () => {
    if (!audio.customAudioUrl) return;

    if (isPlayingPreview) {
      stopAllAudio();
    } else {
      stopAllAudio();
      if (!audioPreviewRef.current) {
        audioPreviewRef.current = new Audio(audio.customAudioUrl);
      } else {
        audioPreviewRef.current.src = audio.customAudioUrl;
      }

      const audioEl = audioPreviewRef.current;
      const startSec = trimMode === 'manual' ? startTime : 0;
      const endSec = startSec + targetDuration;

      audioEl.volume = audio.volume ?? 0.7;
      audioEl.currentTime = startSec;

      const handleTimeUpdate = () => {
        setPreviewCurrentTime(audioEl.currentTime);
        if (audioEl.currentTime >= endSec) {
          if (audio.loop ?? true) {
            audioEl.currentTime = startSec;
          } else {
            audioEl.pause();
            setIsPlayingPreview(false);
          }
        }
      };

      audioEl.ontimeupdate = handleTimeUpdate;
      audioEl.play().catch(() => {});
      setIsPlayingPreview(true);

      audioEl.onended = () => {
        if (!audio.loop) {
          setIsPlayingPreview(false);
        }
      };
    }
  };

  const playPresetPreview = async (track: 'cinematic-pulse' | 'subtle-mystery' | 'vintage-warmth') => {
    if (activePresetPreview === track) {
      stopAllAudio();
      return;
    }

    stopAllAudio();
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioContextClass();
      synthCtxRef.current = ctx;

      const buffer = await createLoopAudioBuffer(ctx, track, targetDuration);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      const gain = ctx.createGain();
      gain.gain.value = audio.volume ?? 0.7;
      source.connect(gain);
      gain.connect(ctx.destination);

      source.start();
      synthSourceRef.current = source;
      setActivePresetPreview(track);
      setIsPlayingPreview(true);
    } catch (err) {
      console.error('Failed to preview synth track:', err);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatTime = (sec: number = 0) => {
    const m = Math.floor(sec / 60);
    const s = (sec % 60).toFixed(1);
    return `${m < 10 ? '0' : ''}${m}:${Number(s) < 10 ? '0' : ''}${s}`;
  };

  const maxStartTime = Math.max(0, (totalDuration || 120) - targetDuration);

  const handleStepStart = (delta: number) => {
    const next = Math.max(0, Math.min(maxStartTime, Math.round((startTime + delta) * 10) / 10));
    onChange({ startTime: next });
    if (audioPreviewRef.current && isPlayingPreview) {
      audioPreviewRef.current.currentTime = next;
    }
  };

  const handleJumpPercent = (pct: number) => {
    const next = Math.max(0, Math.min(maxStartTime, Math.round((maxStartTime * pct) * 10) / 10));
    onChange({ startTime: next });
    if (audioPreviewRef.current && isPlayingPreview) {
      audioPreviewRef.current.currentTime = next;
    }
  };

  const isLongAudio = totalDuration > targetDuration + 1;

  return (
    <div className="space-y-6">
      {/* 1. Master Audio Enable / Disable Switch */}
      <div className="bg-neutral-950/70 border border-neutral-800 p-4 rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
            audio.enabled ? 'bg-rose-600 text-white' : 'bg-neutral-900 text-neutral-400'
          }`}>
            <Music className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-neutral-200">
              Background Sound / Music
            </div>
            <div className="text-[11px] text-neutral-400">
              {audio.enabled ? 'Music enabled in loop video' : 'Video is currently muted'}
            </div>
          </div>
        </div>

        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={audio.enabled}
            onChange={(e) => onChange({ enabled: e.target.checked })}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
        </label>
      </div>

      {audio.enabled && (
        <>
          {/* 2. Upload Any Custom Music / Sound (User's own music file) */}
          <div className="bg-neutral-950/70 border border-neutral-800 p-4 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5 text-rose-500" />
                Upload Your Music (MP3, WAV, M4A, OGG)
              </h4>
              <span className="text-[11px] text-neutral-400">Any audio / full song</span>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*,.mp3,.wav,.m4a,.ogg,.aac"
              onChange={handleFileUpload}
              className="hidden"
            />

            {!audio.customAudioUrl ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-neutral-800 hover:border-neutral-700 bg-neutral-900/40 hover:bg-neutral-900/70 rounded-xl p-5 text-center cursor-pointer transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto mb-2 text-rose-500">
                  <Music className="w-5 h-5" />
                </div>
                <div className="text-xs font-semibold text-neutral-200">
                  Click to select audio from your device
                </div>
                <div className="text-[11px] text-neutral-400 mt-1">
                  Long songs will be automatically auto-adjusted with manual trimming options available
                </div>
              </div>
            ) : (
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3.5 space-y-4">
                {/* Audio Info Bar */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-rose-600/20 text-rose-400 flex items-center justify-center shrink-0">
                      <Disc3 className="w-4 h-4 animate-spin-slow" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-neutral-200 truncate">
                        {audio.customAudioName || 'Uploaded Audio'}
                      </div>
                      <div className="text-[10px] text-neutral-400 font-mono">
                        {formatFileSize(audio.customAudioSize)} · Total: {totalDuration > 0 ? formatTime(totalDuration) : 'Calculating...'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={toggleCustomAudioPlay}
                      className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium rounded-lg flex items-center gap-1 transition-colors cursor-pointer shadow-sm"
                    >
                      {isPlayingPreview ? (
                        <>
                          <Pause className="w-3.5 h-3.5 fill-current" />
                          <span>Pause</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                          <span>Preview</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs rounded-lg transition-colors cursor-pointer"
                    >
                      Replace
                    </button>

                    <button
                      type="button"
                      onClick={handleRemoveCustomAudio}
                      className="p-1.5 text-neutral-400 hover:text-rose-400 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
                      title="Remove audio"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Long Audio Trimming (Auto vs Manual Options) */}
                <div className="pt-3 border-t border-neutral-800/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Scissors className="w-3.5 h-3.5 text-rose-400" />
                      <span className="text-xs font-bold text-neutral-200">
                        Long Music Trimming ({targetDuration}s Loop Video)
                      </span>
                    </div>

                    {/* Auto vs Manual Switch Pills */}
                    <div className="flex items-center bg-neutral-950 p-1 rounded-lg border border-neutral-800 text-xs font-semibold">
                      <button
                        type="button"
                        onClick={() => onChange({ trimMode: 'auto' })}
                        className={`px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                          trimMode === 'auto'
                            ? 'bg-rose-600 text-white shadow-sm'
                            : 'text-neutral-400 hover:text-white'
                        }`}
                      >
                        <Zap className="w-3 h-3" />
                        <span>Auto-Adjust</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onChange({ trimMode: 'manual' })}
                        className={`px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                          trimMode === 'manual'
                            ? 'bg-rose-600 text-white shadow-sm'
                            : 'text-neutral-400 hover:text-white'
                        }`}
                      >
                        <Sliders className="w-3 h-3" />
                        <span>Manual Adjust</span>
                      </button>
                    </div>
                  </div>

                  {trimMode === 'auto' ? (
                    <div className="bg-neutral-950/70 p-3 rounded-lg border border-neutral-800/80 text-xs text-neutral-300 space-y-1.5">
                      <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                        <Check className="w-3.5 h-3.5" />
                        <span>Auto-Adjust Active (Seamless Loop)</span>
                      </div>
                      <p className="text-[11px] text-neutral-400 leading-relaxed">
                        Track automatically loops the beginning {targetDuration.toFixed(1)} seconds to fit your video duration. Agar aap gaane ke kisi khas hissay (drop, chorus, beat) se chalana chahein to upar <strong>"Manual Adjust"</strong> select karein.
                      </p>
                    </div>
                  ) : (
                    /* Manual Adjust Controls */
                    <div className="bg-neutral-950 p-3.5 rounded-xl border border-neutral-800 space-y-3.5">
                      {/* Timeline Scrubber */}
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="text-neutral-300 font-medium">Selected Sliced Segment:</span>
                          <span className="font-mono text-rose-400 font-bold bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
                            {formatTime(startTime)} → {formatTime(startTime + targetDuration)} ({targetDuration.toFixed(1)}s)
                          </span>
                        </div>

                        {/* Interactive Waveform Track Representation */}
                        <div className="relative w-full h-8 bg-neutral-900 rounded-lg border border-neutral-800 overflow-hidden flex items-center px-1">
                          {/* Faux Waveform Bars */}
                          <div className="absolute inset-0 flex items-center justify-between px-2 opacity-25 pointer-events-none">
                            {Array.from({ length: 48 }).map((_, i) => (
                              <div
                                key={i}
                                className="w-1 bg-white rounded-full"
                                style={{
                                  height: `${20 + Math.sin(i * 0.4) * 16 + (i % 3) * 10}%`,
                                }}
                              />
                            ))}
                          </div>

                          {/* Highlighted Window */}
                          {totalDuration > 0 && (
                            <div
                              className="absolute top-0 bottom-0 bg-rose-600/30 border-x-2 border-rose-500 rounded pointer-events-none"
                              style={{
                                left: `${Math.min(95, (startTime / totalDuration) * 100)}%`,
                                width: `${Math.max(5, (targetDuration / totalDuration) * 100)}%`,
                              }}
                            />
                          )}

                          {/* Range slider input on top */}
                          <input
                            type="range"
                            min={0}
                            max={maxStartTime || 60}
                            step={0.1}
                            value={startTime}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              onChange({ startTime: val });
                              if (audioPreviewRef.current && isPlayingPreview) {
                                audioPreviewRef.current.currentTime = val;
                              }
                            }}
                            className="w-full accent-rose-500 relative z-10 opacity-70 hover:opacity-100 cursor-pointer h-2"
                          />
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-neutral-500 font-mono mt-1">
                          <span>00:00.0</span>
                          <span>Total Track: {totalDuration > 0 ? formatTime(totalDuration) : 'Long Track'}</span>
                        </div>
                      </div>

                      {/* Quick Jump Markers (Intro, Drop, Chorus, Bridge) */}
                      <div>
                        <span className="text-[11px] text-neutral-400 block mb-1">Quick Jump to Song Section:</span>
                        <div className="grid grid-cols-4 gap-1.5">
                          {[
                            { label: '0% Intro', pct: 0 },
                            { label: '25% Beat Drop', pct: 0.25 },
                            { label: '50% Chorus', pct: 0.5 },
                            { label: '75% Climax', pct: 0.75 },
                          ].map((marker) => (
                            <button
                              key={marker.label}
                              type="button"
                              onClick={() => handleJumpPercent(marker.pct)}
                              className="py-1 px-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 rounded-lg text-[10px] font-semibold transition-colors cursor-pointer"
                            >
                              {marker.label}
                            </button>
                          ))}
                        </div>
                      </div>

                        {/* Fine Tune Buttons (+/- 5.0s, +/- 1.0s, +/- 0.1s, Reset) */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-neutral-800/80">
                          <div className="flex flex-wrap items-center gap-1">
                            <span className="text-[11px] text-neutral-400 mr-1">Fine-tune:</span>
                            <button
                              type="button"
                              onClick={() => handleStepStart(-5.0)}
                              className="px-1.5 py-1 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-xs rounded border border-neutral-800 cursor-pointer font-mono"
                              title="Back 5 seconds"
                            >
                              -5s
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStepStart(-1.0)}
                              className="px-1.5 py-1 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-xs rounded border border-neutral-800 cursor-pointer font-mono"
                              title="Back 1 second"
                            >
                              -1s
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStepStart(-0.1)}
                              className="px-1.5 py-1 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-xs rounded border border-neutral-800 cursor-pointer font-mono"
                              title="Back 0.1 second"
                            >
                              -0.1s
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStepStart(0.1)}
                              className="px-1.5 py-1 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-xs rounded border border-neutral-800 cursor-pointer font-mono"
                              title="Forward 0.1 second"
                            >
                              +0.1s
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStepStart(1.0)}
                              className="px-1.5 py-1 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-xs rounded border border-neutral-800 cursor-pointer font-mono"
                              title="Forward 1 second"
                            >
                              +1s
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStepStart(5.0)}
                              className="px-1.5 py-1 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-xs rounded border border-neutral-800 cursor-pointer font-mono"
                              title="Forward 5 seconds"
                            >
                              +5s
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                onChange({ startTime: 0 });
                                if (audioPreviewRef.current && isPlayingPreview) {
                                  audioPreviewRef.current.currentTime = 0;
                                }
                              }}
                              className="px-2 py-1 bg-neutral-900 hover:bg-neutral-800 text-rose-400 text-xs rounded border border-neutral-800 cursor-pointer font-medium flex items-center gap-1"
                              title="Reset start time to 0.0s"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Reset (0s)</span>
                            </button>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <label className="text-[11px] text-neutral-400">Start (sec):</label>
                            <input
                              type="number"
                              min={0}
                              max={maxStartTime}
                              step={0.1}
                              value={startTime}
                              onChange={(e) => {
                                const val = Math.max(0, Number(e.target.value));
                                onChange({ startTime: val });
                              }}
                              className="w-16 bg-neutral-900 border border-neutral-700 rounded px-1.5 py-0.5 text-xs text-white font-mono text-center focus:outline-none focus:border-rose-500"
                            />
                          </div>
                        </div>

                      {/* Smooth Transitions: Fade In & Fade Out */}
                      <div className="pt-2 border-t border-neutral-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                        <label className="flex items-center gap-2 text-neutral-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={audio.fadeIn ?? true}
                            onChange={(e) => onChange({ fadeIn: e.target.checked })}
                            className="accent-rose-600 w-3.5 h-3.5 rounded cursor-pointer"
                          />
                          <span>Fade-In (Smooth 0.5s entry)</span>
                        </label>

                        <label className="flex items-center gap-2 text-neutral-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={audio.fadeOut ?? true}
                            onChange={(e) => onChange({ fadeOut: e.target.checked })}
                            className="accent-rose-600 w-3.5 h-3.5 rounded cursor-pointer"
                          />
                          <span>Fade-Out (Seamless loop closure)</span>
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 3. Ready-Made Ambient Music Presets */}
          <div className="bg-neutral-950/70 border border-neutral-800 p-4 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-rose-500" />
                Or Pick a Seamless Ambient Loop Track:
              </h4>
              <span className="text-[11px] text-neutral-400">Royalty-Free</span>
            </div>

            <div className="space-y-2">
              {[
                {
                  id: 'cinematic-pulse' as const,
                  name: 'Cinematic Pulse',
                  desc: 'Deep warm sub drone with gentle rhythm — ideal for mystery hooks',
                },
                {
                  id: 'subtle-mystery' as const,
                  name: 'Subtle Mystery',
                  desc: 'Ethereal ambient fifth chord shimmer — ideal for history & facts',
                },
                {
                  id: 'vintage-warmth' as const,
                  name: 'Vintage Warmth',
                  desc: 'Lo-fi vinyl tape warmth — ideal for archival photos',
                },
              ].map((track) => {
                const isSelected = !audio.customAudioUrl && audio.ambientTrack === track.id;
                const isPlayingThis = activePresetPreview === track.id;

                return (
                  <div
                    key={track.id}
                    onClick={() => {
                      stopAllAudio();
                      onChange({
                        ambientTrack: track.id,
                        customAudioUrl: undefined,
                        customAudioName: undefined,
                        enabled: true,
                      });
                    }}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-rose-500 bg-rose-950/20 ring-1 ring-rose-500/40'
                        : 'border-neutral-800 bg-neutral-900/50 hover:bg-neutral-900 hover:border-neutral-700'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-neutral-200 flex items-center gap-2">
                        <span>{track.name}</span>
                        {isSelected && (
                          <span className="px-1.5 py-0.2 rounded bg-rose-600 text-white text-[10px] font-medium">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-neutral-400 mt-0.5">
                        {track.desc}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        playPresetPreview(track.id);
                      }}
                      className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 shrink-0 transition-colors cursor-pointer"
                      title={isPlayingThis ? 'Pause preview' : 'Play preview'}
                    >
                      {isPlayingThis ? (
                        <Pause className="w-3.5 h-3.5 fill-current text-rose-500" />
                      ) : (
                        <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4. Volume & Audio Adjustments */}
          <div className="bg-neutral-950/70 border border-neutral-800 p-4 rounded-xl space-y-4">
            <h4 className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-rose-500" />
              Music Volume & Loop Settings
            </h4>

            {/* Volume Slider */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-neutral-400">Master Volume</span>
                <span className="text-neutral-200 font-mono tabular-nums bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
                  {Math.round((audio.volume ?? 0.7) * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={audio.volume ?? 0.7}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  onChange({ volume: val });
                  if (audioPreviewRef.current) {
                    audioPreviewRef.current.volume = val;
                  }
                }}
                className="w-full accent-rose-600 h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Seamless Loop Toggle */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <Repeat className="w-3.5 h-3.5 text-neutral-400" />
                <span className="text-xs text-neutral-300">Seamless Loop Audio for {targetDuration.toFixed(1)} Seconds</span>
              </div>
              <input
                type="checkbox"
                checked={audio.loop ?? true}
                onChange={(e) => onChange({ loop: e.target.checked })}
                className="accent-rose-600 w-4 h-4 cursor-pointer"
              />
            </div>
          </div>
        </>
      )}

      {/* Main Rose CTA Button */}
      <div className="pt-2">
        <button
          type="button"
          onClick={() => {
            stopAllAudio();
            onPreviewAndCreate();
          }}
          className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm shadow-rose-950"
        >
          <span>Preview & create video</span>
          <span>→</span>
        </button>
      </div>
    </div>
  );
};
