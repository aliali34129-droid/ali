export interface ScriptSettings {
  text: string;
  fontSize: number; // e.g. 34
  fontFamily: string; // 'sans-serif' | 'serif' | 'monospace' | specific font id
  fontWeight?: 'normal' | '500' | '600' | '700' | 'bold' | '800' | '900'; // Text bold control
  fontStyle?: 'normal' | 'italic'; // Italic style
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize'; // Case transform
  lineHeight: number; // e.g. 1.45
  // Text Flow and Alignment
  textAlign: 'left' | 'center' | 'right';
  textDirection?: 'auto' | 'ltr' | 'rtl'; // 'auto' (detects Urdu/Arabic) | 'ltr' | 'rtl' (Right-to-Left)
  textColor: string; // e.g. '#ffffff'
  boxBackgroundColor: string; // e.g. '#000000'
  boxOpacity: number; // 0 to 1, default 0.96
  boxBorderRadius: number; // e.g. 18
  boxPadding: number; // e.g. 26
  boxMarginTop: number; // gap between image and text box
  boxMaxWidth: number; // percentage of canvas width e.g. 86%
  boxHeightExtra?: number; // extra vertical breathing room / padding (0 to 80px)

  // Free Layer Positioning (Move anywhere on screen)
  moveX?: number; // -100 to 100, default 0 (Horizontal offset)
  moveY?: number; // -100 to 100, default 0 (Vertical offset)

  // Highlighting Controls (Auto, Manual, and Selected Text only)
  autoHighlightKeywords?: boolean; // default true
  highlightMode?: 'manual-only' | 'auto-and-manual' | 'none'; // 'manual-only' highlights ONLY user-selected text!
  highlightColor?: string; // default '#ef4444' (Red)
  highlightStyle?: 'text' | 'pill' | 'both'; // default 'text'
  customKeywords?: string[]; // additional custom / manually selected keywords
  wordColors?: Record<string, string>; // custom color for each specific word or phrase (e.g. { 'strongheart': '#ef4444', 'etzel': '#38bdf8' })
  excludedKeywords?: string[]; // keywords excluded by user
}

export interface AdjustSettings {
  // Manual picture zoom in / zoom out (Controlled by user manually)
  scale: number; // 0.4 to 3.0, default 1.00 (Zoom level)
  moveX: number; // -100 to 100, default 0 (Move left / right)
  moveY: number; // -100 to 100, default 0 (Move up / down)
  imageBorderRadius: number; // default 18
  imageShadow: boolean; // default true
  
  // Background customization and blur settings
  bgSource?: 'auto' | 'custom' | 'preset' | 'color'; // default 'auto'
  bgCustomUrl?: string; // custom background image/video URL
  bgCustomName?: string; // name of custom background file
  bgPresetId?: string; // 'studio-dark' | 'neon-glow' | 'vintage-warmth' | 'midnight-blue' | 'emerald-dark' | 'sunset-vibes'
  bgColor?: string; // e.g. '#0a0a0a'
  bgBlur: number; // 0 to 100 px, default 40 (0 = sharp / no blur!)
  bgDarkness: number; // 0 to 0.8, default 0.35 (dimming for contrast)
  bgScale: number; // 1.0 to 2.5, default 1.4
  
  // Loop motion option
  motionType: 'static' | 'subtle-drift' | 'ken-burns';
  motionIntensity: number; // default 0.03
}

export interface AudioSettings {
  enabled: boolean;
  ambientTrack: 'none' | 'cinematic-pulse' | 'subtle-mystery' | 'vintage-warmth';
  customAudioUrl?: string;
  customAudioName?: string;
  customAudioSize?: number;
  volume: number; // 0 to 1
  loop?: boolean; // default true
}

export interface VideoProject {
  id: string;
  title: string;
  durationSeconds: number; // default 8s
  fps: number; // 30
  resolution: '1080p' | '720p'; // 1080x1920 or 720x1280
  mediaUrl: string;
  mediaName: string;
  mediaType: 'image' | 'video';
  script: ScriptSettings;
  adjust: AdjustSettings;
  audio: AudioSettings;
}

export interface RenderProgress {
  isRendering: boolean;
  currentFrame: number;
  totalFrames: number;
  progressPercent: number;
  timeRemainingSec: number;
  error?: string;
}

export interface ExportedVideo {
  id: string;
  title: string;
  videoUrl: string;
  posterUrl: string;
  duration: number;
  resolution: string;
  sizeBytes: number;
  createdAt: string;
}
