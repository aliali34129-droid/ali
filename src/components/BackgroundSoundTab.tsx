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
} from 'lucide-react';
import { createLoopAudioBuffer } from '../utils/audioGenerator';

interface BackgroundSoundTabProps {
  audio: AudioSettings;
  onChange: (updated: Partial<AudioSettings>) => void;
  onPreviewAndCreate: () => void;
}

export const BackgroundSoundTab: React.FC<BackgroundSoundTabProps> = ({
  audio,
  onChange,
  onPreviewAndCreate,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [activePresetPreview, setActivePresetPreview] = useState<string | null>(null);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);
  const synthSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const synthCtxRef = useRef<AudioContext | null>(null);

  // Stop any playing sound on unmount
  useEffect(() => {
    return () => {
      stopAllAudio();
    };
  }, []);

  const stopAllAudio = () => {
    if (audioPreviewRef.current) {
      audioPreviewRef.current.pause();
      audioPreviewRef.current.currentTime = 0;
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
    onChange({
      enabled: true,
      customAudioUrl: objectUrl,
      customAudioName: file.name,
      customAudioSize: file.size,
      ambientTrack: 'none',
      volume: audio.volume || 0.7,
      loop: true,
    });
    e.target.value = '';
  };

  const handleRemoveCustomAudio = () => {
    stopAllAudio();
    onChange({
      customAudioUrl: undefined,
      customAudioName: undefined,
      customAudioSize: undefined,
    });
  };

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
      audioPreviewRef.current.volume = audio.volume ?? 0.7;
      audioPreviewRef.current.loop = audio.loop ?? true;
      audioPreviewRef.current.play();
      setIsPlayingPreview(true);

      audioPreviewRef.current.onended = () => {
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

      const buffer = await createLoopAudioBuffer(ctx, track, 8.0);
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
              <span className="text-[11px] text-neutral-400">Any audio file</span>
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
                  Upload any song, background tune, or voiceover for the 8s loop
                </div>
              </div>
            ) : (
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3.5 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-rose-600/20 text-rose-400 flex items-center justify-center shrink-0">
                      <Disc3 className="w-4 h-4 animate-spin-slow" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-neutral-200 truncate">
                        {audio.customAudioName || 'Uploaded Audio'}
                      </div>
                      <div className="text-[10px] text-neutral-400">
                        {formatFileSize(audio.customAudioSize)} · Ready for loop
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={toggleCustomAudioPlay}
                      className="px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      {isPlayingPreview ? (
                        <>
                          <Pause className="w-3.5 h-3.5 fill-current" />
                          <span>Pause</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                          <span>Play</span>
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

                <div className="flex items-center gap-1.5 text-[11px] text-emerald-400">
                  <Check className="w-3.5 h-3.5" />
                  <span>Custom music will be embedded directly into downloaded loop video</span>
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
                <span className="text-xs text-neutral-300">Seamless Loop Audio for 8 Seconds</span>
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
