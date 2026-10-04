export type ThemeId =
  | 'obsidian-rose'
  | 'cyber-neon'
  | 'midnight-navy'
  | 'emerald-matrix'
  | 'sunset-amber'
  | 'titanium-monochrome'
  | 'studio-bright';

export interface StudioTheme {
  id: ThemeId;
  name: string;
  category: 'dark' | 'light';
  description: string;
  previewSwatches: [string, string, string]; // 3 colors for swatch preview
  // Tailwind class mappings for clean, zero-runtime theme application
  rootBg: string;
  mainText: string;
  cardBg: string;
  cardBorder: string;
  subtleBg: string;
  headerBg: string;
  accentGradient: string;
  accentText: string;
  accentBorder: string;
  accentBg: string;
  activePillBg: string;
  badgeBg: string;
  badgeText: string;
  glowShadow: string;
}

export const STUDIO_THEMES: StudioTheme[] = [
  {
    id: 'obsidian-rose',
    name: 'Obsidian Rose',
    category: 'dark',
    description: 'Deep obsidian & charcoal with vibrant electric crimson accents (Default Pro)',
    previewSwatches: ['#09090b', '#e11d48', '#8b5cf6'],
    rootBg: 'bg-neutral-950',
    mainText: 'text-neutral-100',
    cardBg: 'bg-neutral-900',
    cardBorder: 'border-neutral-800',
    subtleBg: 'bg-neutral-950',
    headerBg: 'bg-neutral-950/90',
    accentGradient: 'from-rose-600 via-rose-500 to-violet-600',
    accentText: 'text-rose-500',
    accentBorder: 'border-rose-500',
    accentBg: 'bg-rose-600',
    activePillBg: 'bg-rose-600',
    badgeBg: 'bg-rose-500/20',
    badgeText: 'text-rose-300',
    glowShadow: 'shadow-rose-950/50',
  },
  {
    id: 'cyber-neon',
    name: 'Cyber Neon',
    category: 'dark',
    description: 'High-tech cyberpunk aesthetic with electric cyan and magenta glows',
    previewSwatches: ['#020617', '#06b6d4', '#d946ef'],
    rootBg: 'bg-[#030712]',
    mainText: 'text-slate-100',
    cardBg: 'bg-[#0b1329]',
    cardBorder: 'border-cyan-900/60',
    subtleBg: 'bg-[#040817]',
    headerBg: 'bg-[#030712]/95',
    accentGradient: 'from-cyan-500 via-teal-500 to-fuchsia-500',
    accentText: 'text-cyan-400',
    accentBorder: 'border-cyan-400',
    accentBg: 'bg-cyan-500',
    activePillBg: 'bg-cyan-500',
    badgeBg: 'bg-cyan-500/20',
    badgeText: 'text-cyan-300',
    glowShadow: 'shadow-cyan-950/60',
  },
  {
    id: 'midnight-navy',
    name: 'Midnight Navy',
    category: 'dark',
    description: 'Deep oceanic blue with sapphire borders and ice blue highlights',
    previewSwatches: ['#020817', '#2563eb', '#38bdf8'],
    rootBg: 'bg-[#020817]',
    mainText: 'text-slate-100',
    cardBg: 'bg-[#0b1528]',
    cardBorder: 'border-blue-900/50',
    subtleBg: 'bg-[#050c1e]',
    headerBg: 'bg-[#020817]/95',
    accentGradient: 'from-blue-600 via-indigo-600 to-sky-500',
    accentText: 'text-sky-400',
    accentBorder: 'border-sky-500',
    accentBg: 'bg-blue-600',
    activePillBg: 'bg-blue-600',
    badgeBg: 'bg-blue-500/20',
    badgeText: 'text-sky-300',
    glowShadow: 'shadow-blue-950/60',
  },
  {
    id: 'emerald-matrix',
    name: 'Emerald Matrix',
    category: 'dark',
    description: 'Dark forest graphite with radiant emerald green and mint glow',
    previewSwatches: ['#02120e', '#059669', '#34d399'],
    rootBg: 'bg-[#02130e]',
    mainText: 'text-emerald-50',
    cardBg: 'bg-[#08221b]',
    cardBorder: 'border-emerald-900/60',
    subtleBg: 'bg-[#031812]',
    headerBg: 'bg-[#02130e]/95',
    accentGradient: 'from-emerald-600 via-teal-500 to-green-500',
    accentText: 'text-emerald-400',
    accentBorder: 'border-emerald-400',
    accentBg: 'bg-emerald-600',
    activePillBg: 'bg-emerald-600',
    badgeBg: 'bg-emerald-500/20',
    badgeText: 'text-emerald-300',
    glowShadow: 'shadow-emerald-950/60',
  },
  {
    id: 'sunset-amber',
    name: 'Sunset Amber',
    category: 'dark',
    description: 'Warm espresso and dark chocolate with molten golden amber highlights',
    previewSwatches: ['#120804', '#d97706', '#f59e0b'],
    rootBg: 'bg-[#120804]',
    mainText: 'text-amber-50',
    cardBg: 'bg-[#1f1107]',
    cardBorder: 'border-amber-900/50',
    subtleBg: 'bg-[#170a03]',
    headerBg: 'bg-[#120804]/95',
    accentGradient: 'from-amber-600 via-orange-500 to-yellow-500',
    accentText: 'text-amber-400',
    accentBorder: 'border-amber-400',
    accentBg: 'bg-amber-600',
    activePillBg: 'bg-amber-600',
    badgeBg: 'bg-amber-500/20',
    badgeText: 'text-amber-300',
    glowShadow: 'shadow-amber-950/60',
  },
  {
    id: 'titanium-monochrome',
    name: 'Titanium Slate',
    category: 'dark',
    description: 'Industrial gunmetal and cool silver with clean high-contrast white',
    previewSwatches: ['#0f1115', '#64748b', '#e2e8f0'],
    rootBg: 'bg-[#0b0d11]',
    mainText: 'text-neutral-100',
    cardBg: 'bg-[#161a22]',
    cardBorder: 'border-neutral-700/60',
    subtleBg: 'bg-[#10131a]',
    headerBg: 'bg-[#0b0d11]/95',
    accentGradient: 'from-zinc-500 via-neutral-400 to-slate-200',
    accentText: 'text-zinc-200',
    accentBorder: 'border-zinc-300',
    accentBg: 'bg-zinc-700',
    activePillBg: 'bg-zinc-600',
    badgeBg: 'bg-zinc-500/20',
    badgeText: 'text-zinc-200',
    glowShadow: 'shadow-zinc-950/50',
  },
  {
    id: 'studio-bright',
    name: 'Studio Bright (Light)',
    category: 'light',
    description: 'Daylight editing canvas with crisp paper backgrounds and deep violet contrast',
    previewSwatches: ['#f8fafc', '#7c3aed', '#0284c7'],
    rootBg: 'bg-slate-100',
    mainText: 'text-slate-900',
    cardBg: 'bg-white',
    cardBorder: 'border-slate-200',
    subtleBg: 'bg-slate-50',
    headerBg: 'bg-white/95',
    accentGradient: 'from-violet-600 via-purple-600 to-sky-600',
    accentText: 'text-violet-600',
    accentBorder: 'border-violet-500',
    accentBg: 'bg-violet-600',
    activePillBg: 'bg-violet-600',
    badgeBg: 'bg-violet-100',
    badgeText: 'text-violet-700',
    glowShadow: 'shadow-violet-900/20',
  },
];

export const DEFAULT_THEME_ID: ThemeId = 'obsidian-rose';

export function getTheme(id: ThemeId): StudioTheme {
  return STUDIO_THEMES.find((t) => t.id === id) || STUDIO_THEMES[0];
}
