import { ScriptSettings } from '../types';

export interface FontFamilyOption {
  id: string;
  name: string;
  category: 'Viral Impact' | 'Modern Sans' | 'Elegant Serif' | 'Urdu & Arabic' | 'Display & Handwriting';
  cssFont: string;
  previewText?: string;
  isPopular?: boolean;
}

export const FONT_FAMILIES_LIST: FontFamilyOption[] = [
  // 1. Viral Impact (Shorts / Reels / TikTok)
  {
    id: 'impact',
    name: 'Impact Heavy (TikTok Classic)',
    category: 'Viral Impact',
    cssFont: 'Impact, "Bebas Neue", "Arial Black", sans-serif',
    isPopular: true,
  },
  {
    id: 'bebas-neue',
    name: 'Bebas Neue (Viral Reels)',
    category: 'Viral Impact',
    cssFont: '"Bebas Neue", Impact, sans-serif',
    isPopular: true,
  },
  {
    id: 'oswald',
    name: 'Oswald Bold (Punchy Titles)',
    category: 'Viral Impact',
    cssFont: '"Oswald", Impact, sans-serif',
    isPopular: true,
  },
  {
    id: 'anton',
    name: 'Anton (Heavy Headline)',
    category: 'Viral Impact',
    cssFont: '"Anton", Impact, sans-serif',
  },
  {
    id: 'archivo-black',
    name: 'Archivo Black (Ultra Thick)',
    category: 'Viral Impact',
    cssFont: '"Archivo Black", sans-serif',
    isPopular: true,
  },
  {
    id: 'russo-one',
    name: 'Russo One (Bold Gamer / Tech)',
    category: 'Viral Impact',
    cssFont: '"Russo One", sans-serif',
  },
  {
    id: 'righteous',
    name: 'Righteous (Retro Viral)',
    category: 'Viral Impact',
    cssFont: '"Righteous", sans-serif',
  },
  {
    id: 'bungee',
    name: 'Bungee (Billboard Cap)',
    category: 'Viral Impact',
    cssFont: '"Bungee", cursive, sans-serif',
  },

  // 2. Modern Sans
  {
    id: 'poppins',
    name: 'Poppins Bold (Clean Modern)',
    category: 'Modern Sans',
    cssFont: '"Poppins", system-ui, -apple-system, sans-serif',
    isPopular: true,
  },
  {
    id: 'montserrat',
    name: 'Montserrat (Geometric Sans)',
    category: 'Modern Sans',
    cssFont: '"Montserrat", system-ui, sans-serif',
    isPopular: true,
  },
  {
    id: 'inter',
    name: 'Inter (Clean Neutral)',
    category: 'Modern Sans',
    cssFont: '"Inter", system-ui, -apple-system, sans-serif',
    isPopular: true,
  },
  {
    id: 'outfit',
    name: 'Outfit (Trendy Luxury Sans)',
    category: 'Modern Sans',
    cssFont: '"Outfit", system-ui, sans-serif',
  },
  {
    id: 'syne',
    name: 'Syne (Avant-Garde Studio)',
    category: 'Modern Sans',
    cssFont: '"Syne", sans-serif',
  },
  {
    id: 'space-grotesk',
    name: 'Space Grotesk (Tech Modern)',
    category: 'Modern Sans',
    cssFont: '"Space Grotesk", sans-serif',
  },
  {
    id: 'sans-serif',
    name: 'System UI Sans (Fast Default)',
    category: 'Modern Sans',
    cssFont: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },

  // 3. Elegant Serif
  {
    id: 'playfair',
    name: 'Playfair Display (Vogue Luxury)',
    category: 'Elegant Serif',
    cssFont: '"Playfair Display", Georgia, "Times New Roman", serif',
    isPopular: true,
  },
  {
    id: 'cinzel',
    name: 'Cinzel (Royal Roman / Epic)',
    category: 'Elegant Serif',
    cssFont: '"Cinzel", Georgia, serif',
    isPopular: true,
  },
  {
    id: 'merriweather',
    name: 'Merriweather (Classic Editorial)',
    category: 'Elegant Serif',
    cssFont: '"Merriweather", Georgia, serif',
  },
  {
    id: 'lora',
    name: 'Lora (Literary Elegance)',
    category: 'Elegant Serif',
    cssFont: '"Lora", Georgia, serif',
  },
  {
    id: 'serif',
    name: 'Traditional Book Serif',
    category: 'Elegant Serif',
    cssFont: 'Georgia, "Times New Roman", Times, serif',
  },

  // 4. Urdu & Arabic Calligraphy
  {
    id: 'noto-nastaliq',
    name: 'Noto Nastaliq Urdu (خوشخط نستعلیق)',
    category: 'Urdu & Arabic',
    cssFont: '"Noto Nastaliq Urdu", "Jameel Noori Nastaleeq", "Urdu Typesetting", serif',
    previewText: 'اردو نستعلیق',
    isPopular: true,
  },
  {
    id: 'amiri',
    name: 'Amiri Naskh (عربی و اردو نسخ)',
    category: 'Urdu & Arabic',
    cssFont: '"Amiri", "Scheherazade New", serif',
    previewText: 'خطِ نسخ شریف',
    isPopular: true,
  },

  // 5. Display & Handwriting & Mono
  {
    id: 'caveat',
    name: 'Caveat (Casual Signature Marker)',
    category: 'Display & Handwriting',
    cssFont: '"Caveat", cursive',
    isPopular: true,
  },
  {
    id: 'pacifico',
    name: 'Pacifico (Fun Vintage Brush)',
    category: 'Display & Handwriting',
    cssFont: '"Pacifico", cursive',
  },
  {
    id: 'dancing-script',
    name: 'Dancing Script (Playful Script)',
    category: 'Display & Handwriting',
    cssFont: '"Dancing Script", cursive',
  },
  {
    id: 'permanent-marker',
    name: 'Permanent Marker (Graffiti / Bold)',
    category: 'Display & Handwriting',
    cssFont: '"Permanent Marker", cursive',
  },
  {
    id: 'orbitron',
    name: 'Orbitron (Sci-Fi Cyber)',
    category: 'Display & Handwriting',
    cssFont: '"Orbitron", sans-serif',
  },
  {
    id: 'jetbrains-mono',
    name: 'JetBrains Mono (Developer Code)',
    category: 'Display & Handwriting',
    cssFont: '"JetBrains Mono", Consolas, monospace',
    isPopular: true,
  },
  {
    id: 'monospace',
    name: 'Retro Typewriter Mono',
    category: 'Display & Handwriting',
    cssFont: '"Courier New", Courier, monospace',
  },
];

export interface TextStylePreset {
  id: string;
  name: string;
  badge: string;
  category: 'Viral & Shorts' | 'Urdu & Calligraphy' | 'Cinema & Luxury' | 'Cyber & Creative';
  previewBg: string;
  previewTextColor: string;
  previewBorderColor: string;
  settings: Partial<ScriptSettings>;
}

export const TEXT_STYLE_PRESETS: TextStylePreset[] = [
  // Viral & Shorts
  {
    id: 'viral-tiktok-punch',
    name: 'Viral TikTok Red',
    badge: 'Trending',
    category: 'Viral & Shorts',
    previewBg: '#000000',
    previewTextColor: '#ffffff',
    previewBorderColor: '#ef4444',
    settings: {
      fontFamily: 'bebas-neue',
      fontWeight: '800',
      textTransform: 'uppercase',
      textColor: '#ffffff',
      boxBackgroundColor: '#000000',
      boxOpacity: 0.98,
      boxBorderRadius: 16,
      highlightColor: '#ef4444',
      highlightStyle: 'text',
      textAlign: 'center',
    },
  },
  {
    id: 'shorts-yellow-box',
    name: 'Shorts Electric Yellow',
    badge: 'Viral',
    category: 'Viral & Shorts',
    previewBg: '#09090b',
    previewTextColor: '#facc15',
    previewBorderColor: '#facc15',
    settings: {
      fontFamily: 'impact',
      fontWeight: 'bold',
      textTransform: 'none',
      textColor: '#ffffff',
      boxBackgroundColor: '#0a0a0a',
      boxOpacity: 0.96,
      boxBorderRadius: 18,
      highlightColor: '#facc15',
      highlightStyle: 'pill',
      textAlign: 'center',
    },
  },
  {
    id: 'neon-cyber-cyan',
    name: 'Neon Cyber Glow',
    badge: 'Cyber',
    category: 'Cyber & Creative',
    previewBg: '#030712',
    previewTextColor: '#22d3ee',
    previewBorderColor: '#06b6d4',
    settings: {
      fontFamily: 'orbitron',
      fontWeight: 'bold',
      textTransform: 'uppercase',
      textColor: '#ffffff',
      boxBackgroundColor: '#020617',
      boxOpacity: 0.94,
      boxBorderRadius: 14,
      highlightColor: '#06b6d4',
      highlightStyle: 'text',
      textAlign: 'center',
    },
  },
  {
    id: 'urdu-nastaliq-emerald',
    name: 'Urdu Khushkhat (نستعلیق شاہی)',
    badge: 'Urdu',
    category: 'Urdu & Calligraphy',
    previewBg: '#022c22',
    previewTextColor: '#fef08a',
    previewBorderColor: '#10b981',
    settings: {
      fontFamily: 'noto-nastaliq',
      fontWeight: 'bold',
      textDirection: 'rtl',
      textAlign: 'right',
      textColor: '#ffffff',
      boxBackgroundColor: '#022c22',
      boxOpacity: 0.96,
      boxBorderRadius: 20,
      highlightColor: '#facc15',
      highlightStyle: 'text',
    },
  },
  {
    id: 'urdu-naskh-gold',
    name: 'Urdu Naskh Golden (عربی و اردو)',
    badge: 'Urdu',
    category: 'Urdu & Calligraphy',
    previewBg: '#18181b',
    previewTextColor: '#fbbf24',
    previewBorderColor: '#d97706',
    settings: {
      fontFamily: 'amiri',
      fontWeight: 'bold',
      textDirection: 'rtl',
      textAlign: 'right',
      textColor: '#ffffff',
      boxBackgroundColor: '#18181b',
      boxOpacity: 0.96,
      boxBorderRadius: 16,
      highlightColor: '#fbbf24',
      highlightStyle: 'pill',
    },
  },
  {
    id: 'golden-luxury-royal',
    name: 'Golden Luxury Royal',
    badge: 'Luxury',
    category: 'Cinema & Luxury',
    previewBg: '#1c1917',
    previewTextColor: '#fbbf24',
    previewBorderColor: '#eab308',
    settings: {
      fontFamily: 'cinzel',
      fontWeight: '800',
      textTransform: 'uppercase',
      textColor: '#fef3c7',
      boxBackgroundColor: '#0c0a09',
      boxOpacity: 0.96,
      boxBorderRadius: 12,
      highlightColor: '#f59e0b',
      highlightStyle: 'text',
      textAlign: 'center',
    },
  },
  {
    id: 'editorial-vogue',
    name: 'Vogue Editorial',
    badge: 'Editorial',
    category: 'Cinema & Luxury',
    previewBg: '#18181b',
    previewTextColor: '#f43f5e',
    previewBorderColor: '#e11d48',
    settings: {
      fontFamily: 'playfair',
      fontWeight: 'bold',
      fontStyle: 'normal',
      textColor: '#ffffff',
      boxBackgroundColor: '#09090b',
      boxOpacity: 0.95,
      boxBorderRadius: 8,
      highlightColor: '#f43f5e',
      highlightStyle: 'text',
      textAlign: 'center',
    },
  },
  {
    id: 'true-crime-noir',
    name: 'True Crime Mystery',
    badge: 'Noir',
    category: 'Cinema & Luxury',
    previewBg: '#09090b',
    previewTextColor: '#dc2626',
    previewBorderColor: '#991b1b',
    settings: {
      fontFamily: 'merriweather',
      fontWeight: '900',
      textColor: '#f5f5f5',
      boxBackgroundColor: '#09090b',
      boxOpacity: 0.98,
      boxBorderRadius: 16,
      highlightColor: '#dc2626',
      highlightStyle: 'pill',
      textAlign: 'left',
    },
  },
  {
    id: 'clean-poppins-white',
    name: 'Clean Modern Studio',
    badge: 'Clean',
    category: 'Viral & Shorts',
    previewBg: '#18181b',
    previewTextColor: '#ffffff',
    previewBorderColor: '#38bdf8',
    settings: {
      fontFamily: 'poppins',
      fontWeight: 'bold',
      textTransform: 'none',
      textColor: '#ffffff',
      boxBackgroundColor: '#18181b',
      boxOpacity: 0.95,
      boxBorderRadius: 20,
      highlightColor: '#38bdf8',
      highlightStyle: 'text',
      textAlign: 'left',
    },
  },
  {
    id: 'comic-pop-punch',
    name: 'Comic Pop Explosion',
    badge: 'Fun',
    category: 'Cyber & Creative',
    previewBg: '#000000',
    previewTextColor: '#f97316',
    previewBorderColor: '#f97316',
    settings: {
      fontFamily: 'russo-one',
      fontWeight: '900',
      textTransform: 'uppercase',
      textColor: '#ffffff',
      boxBackgroundColor: '#000000',
      boxOpacity: 0.98,
      boxBorderRadius: 24,
      highlightColor: '#f97316',
      highlightStyle: 'pill',
      textAlign: 'center',
    },
  },
  {
    id: 'midnight-violet',
    name: 'Midnight Purple Drip',
    badge: 'Vibe',
    category: 'Cyber & Creative',
    previewBg: '#1e1b4b',
    previewTextColor: '#c084fc',
    previewBorderColor: '#a855f7',
    settings: {
      fontFamily: 'syne',
      fontWeight: '800',
      textColor: '#fdf4ff',
      boxBackgroundColor: '#0f0e26',
      boxOpacity: 0.96,
      boxBorderRadius: 18,
      highlightColor: '#c084fc',
      highlightStyle: 'text',
      textAlign: 'center',
    },
  },
  {
    id: 'retro-typewriter-sepia',
    name: 'Retro Typewriter 1920',
    badge: 'Vintage',
    category: 'Cinema & Luxury',
    previewBg: '#29180b',
    previewTextColor: '#fed7aa',
    previewBorderColor: '#d97706',
    settings: {
      fontFamily: 'monospace',
      fontWeight: 'bold',
      textColor: '#ffedd5',
      boxBackgroundColor: '#1f1309',
      boxOpacity: 0.95,
      boxBorderRadius: 10,
      highlightColor: '#ea580c',
      highlightStyle: 'text',
      textAlign: 'left',
    },
  },
  {
    id: 'hacker-matrix-green',
    name: 'Hacker Matrix Terminal',
    badge: 'Terminal',
    category: 'Cyber & Creative',
    previewBg: '#022c22',
    previewTextColor: '#4ade80',
    previewBorderColor: '#22c55e',
    settings: {
      fontFamily: 'jetbrains-mono',
      fontWeight: 'bold',
      textTransform: 'none',
      textColor: '#86efac',
      boxBackgroundColor: '#021811',
      boxOpacity: 0.97,
      boxBorderRadius: 12,
      highlightColor: '#22c55e',
      highlightStyle: 'pill',
      textAlign: 'left',
    },
  },
  {
    id: 'sweet-handwritten',
    name: 'Aesthetic Handwritten Note',
    badge: 'Aesthetic',
    category: 'Cyber & Creative',
    previewBg: '#18181b',
    previewTextColor: '#f472b6',
    previewBorderColor: '#ec4899',
    settings: {
      fontFamily: 'caveat',
      fontWeight: 'bold',
      textColor: '#ffffff',
      boxBackgroundColor: '#18181b',
      boxOpacity: 0.94,
      boxBorderRadius: 18,
      highlightColor: '#f472b6',
      highlightStyle: 'text',
      textAlign: 'center',
    },
  },
  {
    id: 'clean-slate-minimal',
    name: 'Minimal Deep Slate',
    badge: 'Minimal',
    category: 'Viral & Shorts',
    previewBg: '#0f172a',
    previewTextColor: '#38bdf8',
    previewBorderColor: '#0ea5e9',
    settings: {
      fontFamily: 'inter',
      fontWeight: 'bold',
      textColor: '#f8fafc',
      boxBackgroundColor: '#0f172a',
      boxOpacity: 0.96,
      boxBorderRadius: 16,
      highlightColor: '#38bdf8',
      highlightStyle: 'text',
      textAlign: 'left',
    },
  },
  {
    id: 'sunset-amber-glow',
    name: 'Sunset Horizon Amber',
    badge: 'Sunset',
    category: 'Cinema & Luxury',
    previewBg: '#451a03',
    previewTextColor: '#fbbf24',
    previewBorderColor: '#f59e0b',
    settings: {
      fontFamily: 'outfit',
      fontWeight: '800',
      textColor: '#fffbeb',
      boxBackgroundColor: '#240d02',
      boxOpacity: 0.96,
      boxBorderRadius: 20,
      highlightColor: '#f59e0b',
      highlightStyle: 'text',
      textAlign: 'center',
    },
  },
  {
    id: 'heavy-bangers-comic',
    name: 'Heavy Action Comic',
    badge: 'Action',
    category: 'Viral & Shorts',
    previewBg: '#000000',
    previewTextColor: '#ef4444',
    previewBorderColor: '#dc2626',
    settings: {
      fontFamily: 'archivo-black',
      fontWeight: '900',
      textTransform: 'uppercase',
      textColor: '#ffffff',
      boxBackgroundColor: '#09090b',
      boxOpacity: 0.98,
      boxBorderRadius: 14,
      highlightColor: '#ef4444',
      highlightStyle: 'pill',
      textAlign: 'center',
    },
  },
  {
    id: 'dark-wine-romance',
    name: 'Dark Wine Romance',
    badge: 'Romance',
    category: 'Cinema & Luxury',
    previewBg: '#4c0519',
    previewTextColor: '#fda4af',
    previewBorderColor: '#fb7185',
    settings: {
      fontFamily: 'playfair',
      fontWeight: 'bold',
      fontStyle: 'italic',
      textColor: '#fff1f2',
      boxBackgroundColor: '#24020b',
      boxOpacity: 0.96,
      boxBorderRadius: 18,
      highlightColor: '#fb7185',
      highlightStyle: 'text',
      textAlign: 'center',
    },
  },
  {
    id: 'streetwear-graffiti',
    name: 'Streetwear Marker',
    badge: 'Street',
    category: 'Cyber & Creative',
    previewBg: '#121212',
    previewTextColor: '#a3e635',
    previewBorderColor: '#84cc16',
    settings: {
      fontFamily: 'permanent-marker',
      fontWeight: 'bold',
      textTransform: 'uppercase',
      textColor: '#ffffff',
      boxBackgroundColor: '#0c0c0c',
      boxOpacity: 0.98,
      boxBorderRadius: 16,
      highlightColor: '#a3e635',
      highlightStyle: 'text',
      textAlign: 'center',
    },
  },
  {
    id: 'classic-righteous-retro',
    name: '1980s Retro Arcade',
    badge: '80s',
    category: 'Cyber & Creative',
    previewBg: '#050510',
    previewTextColor: '#38bdf8',
    previewBorderColor: '#ec4899',
    settings: {
      fontFamily: 'righteous',
      fontWeight: 'bold',
      textColor: '#fdf2f8',
      boxBackgroundColor: '#060614',
      boxOpacity: 0.97,
      boxBorderRadius: 16,
      highlightColor: '#ec4899',
      highlightStyle: 'pill',
      textAlign: 'center',
    },
  },
];

/**
 * Resolves CSS font stack for Canvas rendering from ScriptSettings
 */
export function resolveFontFamilyCss(fontFamilyId: string): string {
  const match = FONT_FAMILIES_LIST.find((f) => f.id === fontFamilyId);
  if (match) return match.cssFont;

  if (fontFamilyId === 'serif') return 'Georgia, "Times New Roman", serif';
  if (fontFamilyId === 'monospace') return '"JetBrains Mono", Consolas, monospace';
  if (fontFamilyId === 'sans-serif') return 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

  return `"${fontFamilyId}", system-ui, -apple-system, sans-serif`;
}

/**
 * Generates exact canvas context font string with font weight & style
 */
export function getCanvasFontString(
  script: ScriptSettings,
  adjustedFontSize: number
): string {
  const weight = script.fontWeight || '700'; // Default bold/punchy
  const style = script.fontStyle || 'normal';
  const familyCss = resolveFontFamilyCss(script.fontFamily || 'sans-serif');

  return `${style} ${weight} ${adjustedFontSize}px ${familyCss}`;
}
