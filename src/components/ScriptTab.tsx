import React, { useState, useRef } from 'react';
import { ScriptSettings } from '../types';
import { getActiveHighlights, cleanPunctuation } from '../utils/keywordExtractor';
import { FONT_FAMILIES_LIST, TEXT_STYLE_PRESETS, TextStylePreset } from '../utils/textStyles';
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  Sparkles,
  Type,
  RefreshCw,
  Plus,
  X,
  Move,
  RotateCcw,
  Highlighter,
  Check,
  Palette,
  Sliders,
  Tag,
  Bold,
  Italic,
} from 'lucide-react';

interface ScriptTabProps {
  script: ScriptSettings;
  onChange: (updated: Partial<ScriptSettings>) => void;
  onNext: () => void;
  onLoadPreset: (presetId: string) => void;
}

export const ScriptTab: React.FC<ScriptTabProps> = ({
  script,
  onChange,
  onNext,
  onLoadPreset,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [selectedText, setSelectedText] = useState<string>('');
  const [activeWordForColor, setActiveWordForColor] = useState<string | null>(null);
  const [newKeywordInput, setNewKeywordInput] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [showAiModal, setShowAiModal] = useState(false);
  const [selectedStyleCategory, setSelectedStyleCategory] = useState<
    'All' | 'Viral & Shorts' | 'Urdu & Calligraphy' | 'Cinema & Luxury' | 'Cyber & Creative'
  >('All');

  const QUICK_PALETTE = [
    { color: '#ef4444', name: 'Viral Red', emoji: '🔴' },
    { color: '#facc15', name: 'Hyper Yellow', emoji: '🟡' },
    { color: '#22c55e', name: 'Neon Lime', emoji: '🟢' },
    { color: '#38bdf8', name: 'Ice Cyan', emoji: '🔵' },
    { color: '#a855f7', name: 'Electric Purple', emoji: '🟣' },
    { color: '#f97316', name: 'Vibrant Orange', emoji: '🟠' },
    { color: '#ec4899', name: 'Hot Pink', emoji: '🌸' },
    { color: '#ffffff', name: 'Pure White', emoji: '⚪' },
  ];

  const wordCount = script.text.trim().split(/\s+/).filter(Boolean).length;
  const readingSpeedVerdict =
    wordCount < 20 ? 'Short & punchy' : wordCount <= 55 ? 'Perfect for 8s loop' : 'Slightly long for 8s';

  const highlightMode = script.highlightMode ?? (script.autoHighlightKeywords ? 'auto-and-manual' : 'manual-only');
  const highlightColor = script.highlightColor || '#ef4444';
  const highlightStyle = script.highlightStyle || 'text';
  const customKeywords = script.customKeywords || [];
  const wordColors = script.wordColors || {};

  // Active highlights
  const activeHighlights = getActiveHighlights(
    script.text,
    highlightMode,
    customKeywords,
    script.excludedKeywords || []
  );

  // Auto-fit text inside card to fix and prevent text from coming out of background
  const handleAutoFitText = () => {
    const textLen = script.text.trim().length;
    const words = wordCount;

    let targetFontSize = 32;
    let targetCardWidth = 88;
    let targetPadding = 24;
    let targetExtraHeight = 16;

    if (words > 60 || textLen > 300) {
      targetFontSize = 26;
      targetCardWidth = 92;
      targetPadding = 20;
      targetExtraHeight = 26;
    } else if (words > 40 || textLen > 200) {
      targetFontSize = 29;
      targetCardWidth = 90;
      targetPadding = 22;
      targetExtraHeight = 18;
    } else if (words > 25 || textLen > 120) {
      targetFontSize = 32;
      targetCardWidth = 88;
      targetPadding = 24;
      targetExtraHeight = 14;
    } else {
      targetFontSize = 35;
      targetCardWidth = 86;
      targetPadding = 26;
      targetExtraHeight = 8;
    }

    onChange({
      fontSize: targetFontSize,
      boxMaxWidth: targetCardWidth,
      boxPadding: targetPadding,
      boxHeightExtra: targetExtraHeight,
      lineHeight: 1.4,
    });
  };

  const boxBgColorsList = [
    { color: '#000000', name: 'Pure Black' },
    { color: '#09090b', name: 'Obsidian' },
    { color: '#18181b', name: 'Charcoal' },
    { color: '#0f172a', name: 'Navy Slate' },
    { color: '#020617', name: 'Midnight' },
    { color: '#2e0819', name: 'Dark Wine' },
    { color: '#042f2e', name: 'Forest Teal' },
    { color: '#2e1065', name: 'Dark Violet' },
    { color: '#27272a', name: 'Titanium' },
    { color: '#ffffff', name: 'Pure White' },
  ];

  const textColorsList = [
    { color: '#ffffff', name: 'White' },
    { color: '#fef08a', name: 'Warm Cream' },
    { color: '#e2e8f0', name: 'Soft Gray' },
    { color: '#a5f3fc', name: 'Ice Blue' },
    { color: '#000000', name: 'Black' },
  ];

  const currentBoxBg = script.boxBackgroundColor || '#000000';
  const currentTextColor = script.textColor || '#ffffff';

  // Monitor text selection in textarea
  const handleSelectTextarea = () => {
    if (!textareaRef.current) return;
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    if (start !== end) {
      const selected = textareaRef.current.value.substring(start, end).trim();
      setSelectedText(selected);
    } else {
      setSelectedText('');
    }
  };

  // Highlight currently selected text with optional specific color (only this word gets this color!)
  const handleHighlightSelection = (color?: string) => {
    if (!selectedText) return;
    const clean = cleanPunctuation(selectedText);
    if (!clean) return;

    const targetColor = color || highlightColor || '#ef4444';
    const nextWordColors = {
      ...wordColors,
      [clean]: targetColor,
    };
    const updatedKeywords = Array.from(new Set([...customKeywords, selectedText.trim()]));
    const nextExcluded = (script.excludedKeywords || []).filter((e) => cleanPunctuation(e) !== clean);

    onChange({
      customKeywords: updatedKeywords,
      wordColors: nextWordColors,
      excludedKeywords: nextExcluded,
      highlightMode: 'manual-only',
      autoHighlightKeywords: false,
    });
    setSelectedText('');
    setActiveWordForColor(null);
  };

  // Highlight ONLY this selected word/phrase (clearing any other preset highlights)
  const handleHighlightSelectionOnly = (color?: string) => {
    if (!selectedText) return;
    const clean = cleanPunctuation(selectedText);
    if (!clean) return;

    const targetColor = color || highlightColor || '#ef4444';
    onChange({
      customKeywords: [selectedText.trim()],
      wordColors: { [clean]: targetColor },
      highlightMode: 'manual-only',
      autoHighlightKeywords: false,
      excludedKeywords: [],
    });
    setSelectedText('');
    setActiveWordForColor(null);
  };

  // Assign custom color to a specific word or phrase - only THIS word changes color!
  const handleSetWordColor = (wordToColor: string, color: string) => {
    const clean = cleanPunctuation(wordToColor);
    if (!clean) return;

    const nextWordColors = {
      ...wordColors,
      [clean]: color,
    };
    const nextCustom = Array.from(new Set([...customKeywords, wordToColor.trim()]));
    const nextExcluded = (script.excludedKeywords || []).filter((e) => cleanPunctuation(e) !== clean);

    onChange({
      customKeywords: nextCustom,
      wordColors: nextWordColors,
      excludedKeywords: nextExcluded,
      highlightMode: 'manual-only',
      autoHighlightKeywords: false,
    });
  };

  // Remove custom color & highlight from a specific word - only this word resets!
  const handleRemoveWordColor = (wordToRemove: string) => {
    const clean = cleanPunctuation(wordToRemove);
    const nextWordColors = { ...wordColors };
    if (clean) delete nextWordColors[clean];

    const nextCustom = customKeywords.filter((k) => cleanPunctuation(k) !== clean);
    const nextExcluded = Array.from(new Set([...(script.excludedKeywords || []), clean]));

    onChange({
      customKeywords: nextCustom,
      wordColors: nextWordColors,
      excludedKeywords: nextExcluded,
    });

    if (activeWordForColor && cleanPunctuation(activeWordForColor) === clean) {
      setActiveWordForColor(null);
    }
  };

  // Wrap selected text directly with [bracket] syntax in textarea
  const handleWrapBrackets = () => {
    if (!textareaRef.current) return;
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const currentVal = textareaRef.current.value;

    if (start !== end) {
      const selected = currentVal.substring(start, end).trim();
      if (!selected) return;

      const before = currentVal.substring(0, start);
      const after = currentVal.substring(end);
      const newText = `${before}[${selected}]${after}`;

      onChange({
        text: newText,
        highlightMode: 'manual-only',
        autoHighlightKeywords: false,
      });
      setSelectedText('');
    }
  };

  // Toggle word highlight or open its color palette
  const handleToggleWordHighlight = (word: string, specificColor?: string) => {
    const clean = cleanPunctuation(word);
    if (!clean) return;

    const isAlreadyHighlighted = Boolean(wordColors[clean]) || customKeywords.some((k) => cleanPunctuation(k) === clean);

    if (isAlreadyHighlighted && !specificColor) {
      // If already active in color palette, toggle off / remove highlight
      if (activeWordForColor && cleanPunctuation(activeWordForColor) === clean) {
        handleRemoveWordColor(word);
        setActiveWordForColor(null);
      } else {
        // Activate word to pick or change its color!
        setActiveWordForColor(word);
      }
    } else {
      const chosenColor = specificColor || highlightColor || '#ef4444';
      handleSetWordColor(word, chosenColor);
      setActiveWordForColor(word);
    }
  };

  // Remove a specific custom keyword tag
  const handleRemoveCustomKeyword = (kwToRemove: string) => {
    const nextCustom = customKeywords.filter((k) => k !== kwToRemove);
    const nextExcluded = Array.from(new Set([...(script.excludedKeywords || []), cleanPunctuation(kwToRemove)]));
    onChange({
      customKeywords: nextCustom,
      excludedKeywords: nextExcluded,
    });
  };

  // Add custom keyword manually from input box
  const handleAddKeyword = () => {
    const trimmed = newKeywordInput.trim();
    if (!trimmed) return;
    const updatedKeywords = Array.from(new Set([...customKeywords, trimmed]));
    const nextExcluded = (script.excludedKeywords || []).filter((e) => cleanPunctuation(e) !== cleanPunctuation(trimmed));
    onChange({
      customKeywords: updatedKeywords,
      excludedKeywords: nextExcluded,
      highlightMode: highlightMode === 'none' ? 'manual-only' : highlightMode,
    });
    setNewKeywordInput('');
  };

  const handleQuickPreset = (presetId: string) => {
    onLoadPreset(presetId);
  };

  const handleGenerateAi = async () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    try {
      const topic = aiPrompt.trim();
      const mockTemplates: Record<string, { text: string; keywords: string[] }> = {
        history: {
          text: `In nineteen thirty two, an Australian farmer noticed something unusual in his wheat field. Within three days, over twenty thousand emus invaded the valley. The military was deployed with machine guns, but the emus outmaneuvered every ambush. It remains the only war a nation lost to birds.`,
          keywords: ['twenty thousand emus', 'machine guns', 'military', 'war', 'birds'],
        },
        space: {
          text: `In nineteen sixty nine, Apollo eleven had only twenty seconds of fuel remaining before landing on the lunar surface. Alarms were blaring inside the cabin as Neil Armstrong searched manually for a safe boulder-free crater. His heart rate hit one hundred and fifty beats per minute.`,
          keywords: ['Apollo eleven', 'twenty seconds', 'Neil Armstrong', 'heart rate'],
        },
        mystery: {
          text: `Deep beneath the Paris catacombs lies a doorway sealed with seven padlocks. In two thousand four, police discovered a fully equipped underground cinema with electricity, a restaurant bar, and surveillance cameras. When officers returned the next morning, everything had vanished.`,
          keywords: ['Paris catacombs', 'seven padlocks', 'underground cinema', 'vanished'],
        },
      };

      let chosen = {
        text: `Did you know this untold mystery about ${topic}? Back in the early twentieth century, an unexpected event changed history forever. Witnesses were sworn to absolute secrecy, and the official records vanished without a single trace.`,
        keywords: [topic, 'untold mystery', 'secrecy', 'vanished'],
      };

      const lower = topic.toLowerCase();
      if (lower.includes('emu') || lower.includes('war') || lower.includes('history')) {
        chosen = mockTemplates.history;
      } else if (lower.includes('space') || lower.includes('moon') || lower.includes('apollo')) {
        chosen = mockTemplates.space;
      } else if (lower.includes('catacomb') || lower.includes('paris') || lower.includes('secret')) {
        chosen = mockTemplates.mystery;
      }

      onChange({
        text: chosen.text,
        customKeywords: chosen.keywords,
      });
      setShowAiModal(false);
      setAiPrompt('');
    } finally {
      setIsGenerating(false);
    }
  };

  const highlightColorsList = [
    { color: '#ef4444', name: 'Viral Red' },
    { color: '#eab308', name: 'Gold Star' },
    { color: '#06b6d4', name: 'Cyber Cyan' },
    { color: '#22c55e', name: 'Neon Green' },
    { color: '#ec4899', name: 'Hot Pink' },
    { color: '#a855f7', name: 'Purple Electric' },
  ];

  // Tokenize story for interactive click-to-highlight view
  const storyTokens = script.text.split(/\s+/).filter(Boolean);

  return (
    <div className="space-y-6">
      {/* Quick Story Presets */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-neutral-300">
            Story Presets from your Examples:
          </label>
          <span className="text-[11px] text-neutral-400">Click to load</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => handleQuickPreset('preset-strongheart')}
            className="p-2.5 rounded-lg border border-neutral-800 bg-neutral-950/60 hover:bg-neutral-800/80 hover:border-neutral-700 text-left transition-all cursor-pointer group hover:scale-[1.01]"
          >
            <div className="text-xs font-semibold text-neutral-200 group-hover:text-rose-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5"><span>🐕</span> Strongheart (Dog Star)</span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-neutral-900 text-rose-300 border border-neutral-800">Hollywood</span>
            </div>
            <div className="text-[11px] text-neutral-400 line-clamp-1 mt-1">
              Berlin police dog turned Hollywood legend...
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleQuickPreset('preset-nat-king-cole')}
            className="p-2.5 rounded-lg border border-neutral-800 bg-neutral-950/60 hover:bg-neutral-800/80 hover:border-neutral-700 text-left transition-all cursor-pointer group hover:scale-[1.01]"
          >
            <div className="text-xs font-semibold text-neutral-200 group-hover:text-amber-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5"><span>🎹</span> Nat King Cole (1956)</span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-neutral-900 text-amber-300 border border-neutral-800">Drama</span>
            </div>
            <div className="text-[11px] text-neutral-400 line-clamp-1 mt-1">
              Men ran down the aisle and dragged him off his piano...
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleQuickPreset('preset-emu-war')}
            className="p-2.5 rounded-lg border border-neutral-800 bg-neutral-950/60 hover:bg-neutral-800/80 hover:border-neutral-700 text-left transition-all cursor-pointer group hover:scale-[1.01]"
          >
            <div className="text-xs font-semibold text-neutral-200 group-hover:text-lime-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5"><span>🐦</span> The Great Emu War (1932)</span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-neutral-900 text-lime-300 border border-neutral-800">History</span>
            </div>
            <div className="text-[11px] text-neutral-400 line-clamp-1 mt-1">
              When an army with machine guns surrendered to birds...
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleQuickPreset('preset-apollo-11')}
            className="p-2.5 rounded-lg border border-neutral-800 bg-neutral-950/60 hover:bg-neutral-800/80 hover:border-neutral-700 text-left transition-all cursor-pointer group hover:scale-[1.01]"
          >
            <div className="text-xs font-semibold text-neutral-200 group-hover:text-cyan-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5"><span>🚀</span> Apollo 11 (20s Clock)</span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-neutral-900 text-cyan-300 border border-neutral-800">Space</span>
            </div>
            <div className="text-[11px] text-neutral-400 line-clamp-1 mt-1">
              Only twenty seconds of fuel remaining over the moon...
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleQuickPreset('preset-paris-catacombs')}
            className="p-2.5 rounded-lg border border-neutral-800 bg-neutral-950/60 hover:bg-neutral-800/80 hover:border-neutral-700 text-left transition-all cursor-pointer group hover:scale-[1.01]"
          >
            <div className="text-xs font-semibold text-neutral-200 group-hover:text-red-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5"><span>🎬</span> Paris Secret Cinema</span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-neutral-900 text-red-300 border border-neutral-800">Mystery</span>
            </div>
            <div className="text-[11px] text-neutral-400 line-clamp-1 mt-1">
              Underground catacombs cinema that vanished overnight...
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleQuickPreset('preset-urdu-kohenoor')}
            className="p-2.5 rounded-lg border border-neutral-800 bg-neutral-950/60 hover:bg-neutral-800/80 hover:border-neutral-700 text-left transition-all cursor-pointer group hover:scale-[1.01]"
          >
            <div className="text-xs font-semibold text-neutral-200 group-hover:text-emerald-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5"><span>👑</span> کوہِ نور ہیرے کا راز</span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-neutral-900 text-emerald-300 border border-neutral-800">اردو</span>
            </div>
            <div className="text-[11px] text-neutral-400 line-clamp-1 mt-1 text-right font-urdu">
              جس بادشاہ کے پاس گیا، سلطنت برباد ہو گئی...
            </div>
          </button>
        </div>
      </div>

      {/* Script Text Area with Selection Tracking */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
            <Type className="w-3.5 h-3.5 text-rose-500" />
            Story / Hook Text
          </label>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-neutral-400 font-mono tabular-nums">
              {wordCount} words
            </span>
            <span className="text-neutral-600">·</span>
            <span
              className={
                wordCount <= 55
                  ? 'text-emerald-400 text-[11px]'
                  : 'text-amber-400 text-[11px]'
              }
            >
              {readingSpeedVerdict}
            </span>
          </div>
        </div>

        {/* Selected Text Quick Action Banner ("sirf selected text ko highlight karein or color dein") */}
        {selectedText ? (
          <div className="mb-2 p-3 rounded-xl bg-neutral-900 border border-rose-500/60 shadow-lg space-y-2 animate-in fade-in duration-150">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs overflow-hidden">
                <Highlighter className="w-4 h-4 text-rose-400 shrink-0" />
                <span className="text-neutral-300 truncate">
                  Selected Word: <strong className="text-rose-300 font-bold underline decoration-rose-500 text-sm">"{selectedText}"</strong>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedText('')}
                className="p-1 text-neutral-400 hover:text-white transition-colors cursor-pointer text-xs"
                title="Cancel selection"
              >
                ✕
              </button>
            </div>

            {/* Quick Color Swatches Bar for Selected Word */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-neutral-800">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-semibold text-neutral-400 mr-1">Choose Color:</span>
                {QUICK_PALETTE.map((p) => (
                  <button
                    key={p.color}
                    type="button"
                    onClick={() => handleSetWordColor(selectedText, p.color)}
                    className="w-6 h-6 rounded-full transition-transform hover:scale-115 active:scale-95 border-2 border-transparent hover:border-white cursor-pointer shadow-sm flex items-center justify-center"
                    style={{ backgroundColor: p.color }}
                    title={`Color "${selectedText}" in ${p.name}`}
                  />
                ))}
                <input
                  type="color"
                  value={wordColors[cleanPunctuation(selectedText)] || highlightColor}
                  onChange={(e) => handleSetWordColor(selectedText, e.target.value)}
                  className="w-6 h-6 rounded-full border border-neutral-700 bg-transparent cursor-pointer ml-0.5"
                  title="Pick custom color for this word"
                />
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => handleHighlightSelectionOnly()}
                  className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs rounded-md shadow-sm transition-colors cursor-pointer"
                  title="Only highlight this word (clear other highlights)"
                >
                  Only This Word
                </button>
                <button
                  type="button"
                  onClick={() => handleHighlightSelection()}
                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs rounded-md shadow-sm transition-colors cursor-pointer flex items-center gap-1"
                  title="Highlight this word"
                >
                  <span>Highlight</span>
                  <Check className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={handleWrapBrackets}
                  className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-mono font-bold text-xs rounded-md border border-neutral-700 transition-colors cursor-pointer"
                  title="Wrap with [ ] brackets in text"
                >
                  [ ]
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-[11px] text-neutral-400 mb-1.5 flex items-center gap-1">
            <span>💡</span>
            <span>Kisi bhi lafz ko mouse se select karein ya neeche click karein — sirf usi lafz ka color change hoga!</span>
          </div>
        )}

        <textarea
          ref={textareaRef}
          rows={6}
          value={script.text}
          onChange={(e) => onChange({ text: e.target.value, highlightMode: 'manual-only', autoHighlightKeywords: false })}
          onSelect={handleSelectTextarea}
          onMouseUp={handleSelectTextarea}
          onTouchEnd={handleSelectTextarea}
          onKeyUp={handleSelectTextarea}
          placeholder="Write or paste your story text here... Select any word to give it any color, or click words below."
          className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-rose-500 transition-colors resize-y leading-relaxed font-sans"
        />

        <div className="flex items-center justify-between mt-2">
          <button
            type="button"
            onClick={() => setShowAiModal(true)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-400 hover:text-rose-300 transition-colors py-1 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generate / Rewrite Hook with AI</span>
          </button>
          <span className="text-[11px] text-neutral-400">
            Recommended: 30-50 words for 8s loop
          </span>
        </div>
      </div>

      {/* Manual Highlighting Controls ("Text ko manual highlight kar sakon or sirf selected text ko") */}
      <div className="bg-neutral-950/80 border border-neutral-800 p-4 rounded-xl space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div>
            <h4 className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
              <Highlighter className="w-3.5 h-3.5 text-rose-500" />
              Manual & Selected Text Highlighting
            </h4>
            <p className="text-[11px] text-neutral-400 mt-0.5">
              Text ko apni marzi se manual highlight karein ya sirf selected lafzon ko highlight karein.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-rose-400 bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
            {activeHighlights.length} Highlights Active
          </span>
        </div>

        {/* 1. Highlight Mode Selector: 'manual-only' vs 'auto-and-manual' vs 'none' */}
        <div>
          <label className="text-xs font-medium text-neutral-300 block mb-2">
            Highlighting Mode:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => onChange({ highlightMode: 'manual-only', autoHighlightKeywords: false })}
              className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                highlightMode === 'manual-only'
                  ? 'border-rose-500 bg-rose-950/30 ring-1 ring-rose-500/50'
                  : 'border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-neutral-400'
              }`}
            >
              <div className="text-xs font-semibold flex items-center gap-1.5 text-neutral-200">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>Sirf Selected Text (Manual Only)</span>
              </div>
              <div className="text-[10px] text-neutral-400 mt-1 leading-snug">
                Sirf wahi lafz highlight honge jo aapne khud select kiye hain.
              </div>
            </button>

            <button
              type="button"
              onClick={() => onChange({ highlightMode: 'auto-and-manual', autoHighlightKeywords: true })}
              className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                highlightMode === 'auto-and-manual'
                  ? 'border-rose-500 bg-rose-950/30 ring-1 ring-rose-500/50'
                  : 'border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-neutral-400'
              }`}
            >
              <div className="text-xs font-semibold flex items-center gap-1.5 text-neutral-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Smart AI + Selected (Combined)</span>
              </div>
              <div className="text-[10px] text-neutral-400 mt-1 leading-snug">
                AI viral words bhi highlight karega aur aapke selected words bhi.
              </div>
            </button>

            <button
              type="button"
              onClick={() => onChange({ highlightMode: 'none', autoHighlightKeywords: false })}
              className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                highlightMode === 'none'
                  ? 'border-rose-500 bg-rose-950/30 ring-1 ring-rose-500/50'
                  : 'border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-neutral-400'
              }`}
            >
              <div className="text-xs font-semibold flex items-center gap-1.5 text-neutral-200">
                <span className="w-2 h-2 rounded-full bg-neutral-500" />
                <span>Highlighting Off (Plain)</span>
              </div>
              <div className="text-[10px] text-neutral-400 mt-1 leading-snug">
                Tamam text normal plain color mein dikhega.
              </div>
            </button>
          </div>
        </div>

        {/* 2. Interactive Word Highlighter (Click any word to toggle or pick its color!) */}
        {highlightMode !== 'none' && storyTokens.length > 0 && (
          <div className="space-y-2.5 pt-2 border-t border-neutral-800/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
                <span>👆</span>
                <span>Click Any Word to Color / Highlight:</span>
              </span>
              <span className="text-[11px] text-neutral-400">
                {activeWordForColor ? 'Palette open below' : 'Tap any word to choose its color'}
              </span>
            </div>

            {/* Active Word Dedicated Color Palette Bar */}
            {activeWordForColor && (
              <div className="p-3 bg-neutral-900 border border-rose-500/70 rounded-xl shadow-xl flex flex-wrap items-center justify-between gap-3 animate-in fade-in duration-150">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-neutral-200">
                    Color for: <strong className="text-rose-300 font-bold underline decoration-rose-500 text-sm">"{cleanPunctuation(activeWordForColor)}"</strong>
                  </span>
                  {wordColors[cleanPunctuation(activeWordForColor)] && (
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-white/60 shadow-sm inline-block"
                      style={{ backgroundColor: wordColors[cleanPunctuation(activeWordForColor)] }}
                    />
                  )}
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] text-neutral-400 mr-0.5">Pick Color:</span>
                  {QUICK_PALETTE.map((p) => {
                    const cleanWord = cleanPunctuation(activeWordForColor);
                    const isSelectedColor = wordColors[cleanWord]?.toLowerCase() === p.color.toLowerCase();
                    return (
                      <button
                        key={p.color}
                        type="button"
                        onClick={() => handleSetWordColor(activeWordForColor, p.color)}
                        className={`w-6 h-6 rounded-full transition-transform hover:scale-120 active:scale-95 border-2 cursor-pointer flex items-center justify-center shadow-sm ${
                          isSelectedColor
                            ? 'border-white scale-110 ring-2 ring-white/40'
                            : 'border-transparent hover:border-white/60'
                        }`}
                        style={{ backgroundColor: p.color }}
                        title={`${p.name} (${p.color})`}
                      >
                        {isSelectedColor && (
                          <Check className="w-3 h-3 text-black stroke-[3]" />
                        )}
                      </button>
                    );
                  })}
                  <input
                    type="color"
                    value={wordColors[cleanPunctuation(activeWordForColor)] || highlightColor}
                    onChange={(e) => handleSetWordColor(activeWordForColor, e.target.value)}
                    className="w-6 h-6 rounded-full border border-neutral-700 bg-transparent cursor-pointer ml-1"
                    title="Custom color picker"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveWordColor(activeWordForColor)}
                    className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-xs rounded-md border border-neutral-700 cursor-pointer ml-1 transition-colors"
                    title="Remove highlight from this word only"
                  >
                    Remove / Normal
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveWordForColor(null)}
                    className="p-1 text-neutral-400 hover:text-white cursor-pointer ml-1 text-xs"
                    title="Close color bar"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            {/* Interactive Words List */}
            <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 max-h-40 overflow-y-auto flex flex-wrap gap-1.5 leading-relaxed select-none">
              {storyTokens.map((rawWord, i) => {
                const clean = cleanPunctuation(rawWord);
                const displayWord = rawWord.replace(/^\[(?:#[0-9a-fA-F]{3,8}:)?|\]$/g, '');
                const isHighlighted = activeHighlights.some((h) => {
                  const cleanH = cleanPunctuation(h);
                  if (cleanH.includes(' ')) {
                    return cleanH.split(/\s+/).some((p) => p === clean);
                  }
                  return cleanH === clean;
                }) || Boolean(wordColors[clean]);

                const wordSpecificColor = wordColors[clean] || (isHighlighted ? highlightColor : undefined);
                const isCurrentlyActive = activeWordForColor && cleanPunctuation(activeWordForColor) === clean;

                return (
                  <button
                    key={`${clean}-${i}`}
                    type="button"
                    onClick={() => handleToggleWordHighlight(rawWord)}
                    style={
                      isHighlighted && wordSpecificColor
                        ? {
                            backgroundColor: highlightStyle === 'pill' || highlightStyle === 'both' ? `${wordSpecificColor}33` : `${wordSpecificColor}20`,
                            color: highlightStyle !== 'pill' ? wordSpecificColor : '#ffffff',
                            borderColor: `${wordSpecificColor}88`,
                          }
                        : {}
                    }
                    className={`px-2 py-0.5 rounded-md text-xs transition-all cursor-pointer border flex items-center gap-1 ${
                      isCurrentlyActive
                        ? 'ring-2 ring-white border-white scale-105 shadow-md z-10'
                        : isHighlighted
                        ? 'font-bold shadow-sm'
                        : 'border-transparent text-neutral-300 hover:text-white hover:bg-neutral-800'
                    }`}
                    title={isHighlighted ? `Colored (${wordSpecificColor}). Click to change color or remove.` : 'Click to color or highlight this word'}
                  >
                    {isHighlighted && wordSpecificColor && (
                      <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: wordSpecificColor }} />
                    )}
                    <span>{displayWord}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. Highlight Color & Style Controls */}
        {highlightMode !== 'none' && (
          <div className="pt-2 border-t border-neutral-800/80 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-medium text-neutral-300 block mb-1.5">
                  Highlight Color:
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {highlightColorsList.map((col) => (
                    <button
                      key={col.color}
                      type="button"
                      onClick={() => onChange({ highlightColor: col.color })}
                      className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
                        highlightColor.toLowerCase() === col.color.toLowerCase()
                          ? 'border-white shadow ring-2 ring-white/20'
                          : 'border-neutral-800 opacity-75 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: `${col.color}25`, color: col.color }}
                    >
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: col.color }} />
                      <span>{col.name}</span>
                    </button>
                  ))}
                  <input
                    type="color"
                    value={highlightColor}
                    onChange={(e) => onChange({ highlightColor: e.target.value })}
                    className="w-7 h-7 rounded border border-neutral-700 bg-transparent cursor-pointer ml-1"
                    title="Custom color"
                  />
                </div>
              </div>

              {/* Style: Text Color vs Highlighter Marker Pill vs Both */}
              <div>
                <span className="text-xs font-medium text-neutral-300 block mb-1.5">
                  Highlight Style:
                </span>
                <div className="flex items-center gap-1 bg-neutral-900 p-1 rounded-lg border border-neutral-800 text-xs">
                  <button
                    type="button"
                    onClick={() => onChange({ highlightStyle: 'text' })}
                    className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                      highlightStyle === 'text'
                        ? 'bg-rose-600 text-white font-semibold'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    Colored Font
                  </button>
                  <button
                    type="button"
                    onClick={() => onChange({ highlightStyle: 'pill' })}
                    className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                      highlightStyle === 'pill'
                        ? 'bg-rose-600 text-white font-semibold'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    Marker Pill
                  </button>
                  <button
                    type="button"
                    onClick={() => onChange({ highlightStyle: 'both' })}
                    className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                      highlightStyle === 'both'
                        ? 'bg-rose-600 text-white font-semibold'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    Both
                  </button>
                </div>
              </div>
            </div>

            {/* 4. Active Custom Highlights Tags & Manual Adder */}
            <div className="pt-2 border-t border-neutral-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-neutral-300 flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-rose-500" />
                  Your Manually Highlighted Words / Phrases ({customKeywords.length}):
                </span>
                {customKeywords.length > 0 && (
                  <button
                    type="button"
                    onClick={() => onChange({ customKeywords: [] })}
                    className="text-[11px] text-rose-400 hover:text-rose-300 cursor-pointer"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {/* Tag Badges with Word-Specific Color Pickers */}
              {customKeywords.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {customKeywords.map((kw) => {
                    const clean = cleanPunctuation(kw);
                    const tagColor = wordColors[clean] || highlightColor;
                    return (
                      <span
                        key={kw}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-neutral-900 border border-neutral-700 text-neutral-200 shadow-sm"
                      >
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: tagColor }} />
                        <span style={{ color: tagColor }}>{kw}</span>
                        <input
                          type="color"
                          value={tagColor}
                          onChange={(e) => handleSetWordColor(kw, e.target.value)}
                          className="w-4 h-4 rounded-full border-0 bg-transparent cursor-pointer p-0 ml-0.5"
                          title={`Change color for "${kw}"`}
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveWordColor(kw)}
                          className="text-neutral-400 hover:text-rose-400 ml-0.5 cursor-pointer text-xs"
                          title="Remove highlight from this word"
                        >
                          ✕
                        </button>
                      </span>
                    );
                  })}
                </div>
              ) : (
                <div className="text-[11px] text-neutral-500 italic">
                  Abhi koi manual highlight add nahi hua. Textarea mein koi lafz select karein ya neeche likhein.
                </div>
              )}

              {/* Add Custom Word or Phrase input */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={newKeywordInput}
                  onChange={(e) => setNewKeywordInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddKeyword();
                    }
                  }}
                  placeholder="Type word or phrase (e.g. German Shepherd)..."
                  className="flex-1 bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-rose-500"
                />
                <button
                  type="button"
                  onClick={handleAddKeyword}
                  disabled={!newKeywordInput.trim()}
                  className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-neutral-200 text-xs font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Highlight</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 20+ Visual Text Styles & Presets (1-Click Styles) */}
      <div className="border-t border-neutral-800/80 pt-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="text-xs font-bold text-neutral-100 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-rose-500" />
              <span>20+ Text Styles & Presets (1-Click Style)</span>
            </h4>
            <p className="text-[11px] text-neutral-400 mt-0.5">
              Viral Shorts, Urdu Nastaliq, Cyberpunk ya Cinema style 1-click mein apply karein.
            </p>
          </div>
          <div className="text-[10px] text-rose-400 font-mono font-bold bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded-full shrink-0 self-start sm:self-auto">
            {TEXT_STYLE_PRESETS.length} Styles Available
          </div>
        </div>

        {/* Style Category Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          {(['All', 'Viral & Shorts', 'Urdu & Calligraphy', 'Cinema & Luxury', 'Cyber & Creative'] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedStyleCategory(cat)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer shrink-0 border ${
                selectedStyleCategory === cat
                  ? 'bg-rose-600 text-white border-rose-500 shadow-sm'
                  : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-white hover:border-neutral-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Style Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-h-[220px] overflow-y-auto pr-1">
          {TEXT_STYLE_PRESETS.filter((p) =>
            selectedStyleCategory === 'All' ? true : p.category === selectedStyleCategory
          ).map((preset) => {
            const isMatch = script.fontFamily === preset.settings.fontFamily;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => onChange({ ...preset.settings })}
                style={{
                  backgroundColor: preset.previewBg,
                  borderColor: isMatch ? '#ef4444' : preset.previewBorderColor + '55',
                }}
                className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all hover:scale-[1.02] active:scale-95 flex flex-col justify-between min-h-[74px] shadow-sm relative group ${
                  isMatch ? 'ring-2 ring-rose-500/50 border-rose-500' : 'hover:border-neutral-600'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span
                    style={{ color: preset.previewTextColor }}
                    className="text-xs font-black truncate tracking-tight pr-1"
                  >
                    {preset.name}
                  </span>
                  <span
                    style={{
                      borderColor: preset.previewBorderColor,
                      color: preset.previewBorderColor,
                    }}
                    className="text-[9px] px-1 py-0.2 rounded font-mono font-bold uppercase border bg-black/40 shrink-0"
                  >
                    {preset.badge}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-2 pt-1 border-t border-white/10 w-full text-[10px]">
                  <span style={{ color: preset.previewTextColor }} className="font-semibold opacity-80">
                    Aa اردو Style
                  </span>
                  <span className="text-[10px] text-white/70 group-hover:text-white font-bold">
                    Apply →
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Typography Controls & Bold Options */}
      <div className="border-t border-neutral-800/80 pt-4 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-neutral-200 flex items-center gap-1.5">
            <Type className="w-3.5 h-3.5 text-rose-500" />
            <span>Text Bold, Font Family & Sizing</span>
          </h4>
          <span className="text-[11px] text-neutral-400">
            30+ Fonts & Weight Options
          </span>
        </div>

        {/* 1. TEXT BOLD, ITALIC, UPPERCASE & WEIGHT CONTROLS */}
        <div className="bg-neutral-950/70 border border-neutral-800 p-3 rounded-xl space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold text-neutral-200 flex items-center gap-1.5">
              <span>Text Format & Weight:</span>
            </span>

            {/* Quick Toggle Buttons: Bold, Italic, Uppercase */}
            <div className="flex items-center gap-1.5">
              {/* Bold Toggle Button */}
              <button
                type="button"
                onClick={() => {
                  const currentWeight = script.fontWeight || '700';
                  const isCurrentlyBold = currentWeight === 'bold' || Number(currentWeight) >= 700;
                  onChange({ fontWeight: isCurrentlyBold ? 'normal' : '800' });
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer border ${
                  (script.fontWeight === 'bold' || script.fontWeight === '800' || script.fontWeight === '900' || (script.fontWeight === '700'))
                    ? 'bg-rose-600 text-white border-rose-500 shadow-md ring-2 ring-rose-500/25'
                    : 'bg-neutral-900 text-neutral-300 border-neutral-800 hover:text-white hover:bg-neutral-800'
                }`}
                title="Toggle Text Bold (B)"
              >
                <Bold className="w-3.5 h-3.5 stroke-[3]" />
                <span>BOLD</span>
              </button>

              {/* Italic Toggle Button */}
              <button
                type="button"
                onClick={() => {
                  onChange({ fontStyle: script.fontStyle === 'italic' ? 'normal' : 'italic' });
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                  script.fontStyle === 'italic'
                    ? 'bg-rose-600 text-white border-rose-500 shadow-md ring-2 ring-rose-500/25'
                    : 'bg-neutral-900 text-neutral-300 border-neutral-800 hover:text-white hover:bg-neutral-800'
                }`}
                title="Toggle Italic"
              >
                <Italic className="w-3.5 h-3.5" />
                <span>Italic</span>
              </button>

              {/* Uppercase ALL CAPS Toggle Button */}
              <button
                type="button"
                onClick={() => {
                  onChange({ textTransform: script.textTransform === 'uppercase' ? 'none' : 'uppercase' });
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer border ${
                  script.textTransform === 'uppercase'
                    ? 'bg-rose-600 text-white border-rose-500 shadow-md ring-2 ring-rose-500/25'
                    : 'bg-neutral-900 text-neutral-300 border-neutral-800 hover:text-white hover:bg-neutral-800'
                }`}
                title="Toggle UPPERCASE (Viral Caps)"
              >
                <span>AA CAPS</span>
              </button>
            </div>
          </div>

          {/* Granular Weight Selector Chips */}
          <div>
            <div className="text-[11px] text-neutral-400 mb-1.5 flex items-center justify-between">
              <span>Font Weight (Thickness):</span>
              <span className="font-mono text-rose-400 font-bold">
                {script.fontWeight || '700'}
              </span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
              {[
                { weight: 'normal', label: 'Regular', num: '400' },
                { weight: '500', label: 'Medium', num: '500' },
                { weight: '600', label: 'SemiBold', num: '600' },
                { weight: '700', label: 'Bold', num: '700' },
                { weight: '800', label: 'ExtraBold', num: '800' },
                { weight: '900', label: 'Black', num: '900' },
              ].map((item) => {
                const isSelected = (script.fontWeight || '700') === item.weight || (script.fontWeight === 'bold' && item.weight === '700');
                return (
                  <button
                    key={item.weight}
                    type="button"
                    onClick={() => onChange({ fontWeight: item.weight as any })}
                    className={`py-1 px-1.5 rounded-md text-[11px] text-center transition-all cursor-pointer border flex flex-col items-center leading-tight ${
                      isSelected
                        ? 'bg-rose-600 text-white border-rose-500 font-black shadow-sm'
                        : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white hover:bg-neutral-800'
                    }`}
                  >
                    <span className="font-bold">{item.label}</span>
                    <span className="text-[9px] opacity-75 font-mono">{item.num}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 2. 30+ FONT FAMILIES SELECTION */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <label className="text-[11px] font-bold text-neutral-300">
              Font Family (30+ Fonts Available):
            </label>
            <span className="text-[11px] text-neutral-400 font-mono">
              {FONT_FAMILIES_LIST.find((f) => f.id === script.fontFamily)?.name || script.fontFamily}
            </span>
          </div>

          {/* Quick Popular Font Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none mb-2">
            {[
              { id: 'rubik', label: 'Rubik-Bold 🔥', weight: '800' },
              { id: 'impact', label: 'Impact' },
              { id: 'bebas-neue', label: 'Bebas Neue' },
              { id: 'oswald', label: 'Oswald' },
              { id: 'poppins', label: 'Poppins' },
              { id: 'montserrat', label: 'Montserrat' },
              { id: 'noto-nastaliq', label: 'نستعلیق Urdu' },
              { id: 'amiri', label: 'Amiri Naskh' },
              { id: 'cinzel', label: 'Cinzel' },
              { id: 'playfair', label: 'Playfair' },
              { id: 'caveat', label: 'Caveat' },
            ].map((chip) => (
              <button
                key={chip.id}
                type="button"
                onClick={() => onChange({ fontFamily: chip.id, ...(chip.weight ? { fontWeight: chip.weight as any } : {}) })}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer shrink-0 border ${
                  script.fontFamily === chip.id
                    ? 'bg-rose-600 text-white border-rose-500 shadow-sm'
                    : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-white hover:border-neutral-700'
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Categorized Dropdown Selector */}
          <select
            value={script.fontFamily}
            onChange={(e) => onChange({ fontFamily: e.target.value })}
            className="w-full bg-neutral-950 border border-neutral-800 text-xs text-neutral-100 rounded-lg p-2.5 focus:outline-none focus:border-rose-500 font-medium"
          >
            <optgroup label="🔥 Viral Impact (Shorts & Reels)">
              {FONT_FAMILIES_LIST.filter((f) => f.category === 'Viral Impact').map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </optgroup>
            <optgroup label="✨ Modern & Sans-Serif">
              {FONT_FAMILIES_LIST.filter((f) => f.category === 'Modern Sans').map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </optgroup>
            <optgroup label="👑 Elegant & Editorial Serif">
              {FONT_FAMILIES_LIST.filter((f) => f.category === 'Elegant Serif').map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </optgroup>
            <optgroup label="🇵🇰 Urdu & Arabic Calligraphy">
              {FONT_FAMILIES_LIST.filter((f) => f.category === 'Urdu & Arabic').map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </optgroup>
            <optgroup label="🎨 Display, Creative & Handwriting">
              {FONT_FAMILIES_LIST.filter((f) => f.category === 'Display & Handwriting').map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </optgroup>
          </select>
        </div>

        {/* Font Size & Line Height */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-neutral-400">Font Size</span>
              <span className="text-neutral-200 font-mono tabular-nums font-bold">
                {script.fontSize}px
              </span>
            </div>
            <input
              type="range"
              min={22}
              max={54}
              value={script.fontSize}
              onChange={(e) => onChange({ fontSize: Number(e.target.value) })}
              className="w-full accent-rose-600 h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-neutral-400">Line Spacing</span>
              <span className="text-neutral-200 font-mono tabular-nums font-bold">
                {script.lineHeight}x
              </span>
            </div>
            <input
              type="range"
              min={1.15}
              max={1.85}
              step={0.05}
              value={script.lineHeight}
              onChange={(e) => onChange({ lineHeight: Number(e.target.value) })}
              className="w-full accent-rose-600 h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>

        {/* Alignment & Reading Direction */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] text-neutral-400 block mb-1">
              Text Alignment
            </label>
            <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-lg border border-neutral-800">
              <button
                type="button"
                onClick={() => onChange({ textAlign: 'left' })}
                className={`flex-1 py-1 text-xs font-bold rounded flex items-center justify-center gap-1 ${
                  script.textAlign === 'left'
                    ? 'bg-neutral-800 text-white'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <AlignLeft className="w-3.5 h-3.5" />
                <span>Left</span>
              </button>
              <button
                type="button"
                onClick={() => onChange({ textAlign: 'center' })}
                className={`flex-1 py-1 text-xs font-bold rounded flex items-center justify-center gap-1 ${
                  script.textAlign === 'center'
                    ? 'bg-neutral-800 text-white'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <AlignCenter className="w-3.5 h-3.5" />
                <span>Center</span>
              </button>
              <button
                type="button"
                onClick={() => onChange({ textAlign: 'right' })}
                className={`flex-1 py-1 text-xs font-bold rounded flex items-center justify-center gap-1 ${
                  script.textAlign === 'right'
                    ? 'bg-neutral-800 text-white'
                    : 'text-neutral-400 hover:text-white'
                }`}
                title="Right alignment (Urdu / Arabic / Right)"
              >
                <AlignRight className="w-3.5 h-3.5" />
                <span>Right</span>
              </button>
            </div>
          </div>

          <div>
            <label className="text-[11px] text-neutral-400 block mb-1">
              Reading Flow (LTR / RTL)
            </label>
            <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-lg border border-neutral-800 text-xs">
              <button
                type="button"
                onClick={() => onChange({ textDirection: 'auto' })}
                className={`flex-1 py-1 rounded text-center transition-colors cursor-pointer font-bold ${
                  (script.textDirection || 'auto') === 'auto'
                    ? 'bg-neutral-800 text-white'
                    : 'text-neutral-400 hover:text-white'
                }`}
                title="Auto detect language"
              >
                Auto
              </button>
              <button
                type="button"
                onClick={() => onChange({ textDirection: 'ltr' })}
                className={`flex-1 py-1 rounded text-center transition-colors cursor-pointer font-bold ${
                  script.textDirection === 'ltr'
                    ? 'bg-neutral-800 text-white'
                    : 'text-neutral-400 hover:text-white'
                }`}
                title="Left to Right (English)"
              >
                LTR
              </button>
              <button
                type="button"
                onClick={() => onChange({ textDirection: 'rtl' })}
                className={`flex-1 py-1 rounded text-center transition-colors cursor-pointer font-bold ${
                  script.textDirection === 'rtl'
                    ? 'bg-rose-600 text-white'
                    : 'text-neutral-400 hover:text-white'
                }`}
                title="Right to Left (Urdu / Arabic - Right side first word)"
              >
                RTL (Urdu)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Text Background Box Card & Overflow Fit Adjustments */}
      <div className="border-t border-neutral-800/80 pt-4 space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div>
            <h4 className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-rose-500" />
              Text Background Card & Size Adjustments
            </h4>
            <p className="text-[11px] text-neutral-400 mt-0.5">
              Card ka background color apni marzi se badlein aur text ko background ke andar theek adjust karein.
            </p>
          </div>
          <button
            type="button"
            onClick={handleAutoFitText}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs rounded-lg shadow-sm transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
            title="Automatically adjust font size, card width, and padding so text never spills out"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Auto-Fit Text to Card</span>
          </button>
        </div>

        {/* 1. Background Color of Text Card (Manual color change requested) */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium text-neutral-300">
              Card Background Color:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={currentBoxBg}
                onChange={(e) => {
                  const newBg = e.target.value;
                  const isLight = newBg.toLowerCase() === '#ffffff' || newBg.toLowerCase() === '#f8fafc';
                  onChange({
                    boxBackgroundColor: newBg,
                    ...(isLight && currentTextColor === '#ffffff' ? { textColor: '#000000' } : {}),
                  });
                }}
                placeholder="#000000"
                className="w-20 bg-neutral-950 border border-neutral-700 rounded px-2 py-0.5 text-xs font-mono text-neutral-200 uppercase focus:outline-none focus:border-rose-500"
                title="Type any hex color code"
              />
              <input
                type="color"
                value={currentBoxBg.startsWith('#') && currentBoxBg.length === 7 ? currentBoxBg : '#000000'}
                onChange={(e) => {
                  const newBg = e.target.value;
                  const isLight = newBg.toLowerCase() === '#ffffff' || newBg.toLowerCase() === '#f8fafc';
                  onChange({
                    boxBackgroundColor: newBg,
                    ...(isLight && currentTextColor === '#ffffff' ? { textColor: '#000000' } : {}),
                  });
                }}
                className="w-7 h-7 rounded border border-neutral-700 bg-transparent cursor-pointer"
                title="Choose custom background color"
              />
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {boxBgColorsList.map((bg) => (
              <button
                key={bg.color}
                type="button"
                onClick={() => {
                  const isLight = bg.color === '#ffffff';
                  onChange({
                    boxBackgroundColor: bg.color,
                    ...(isLight && currentTextColor === '#ffffff' ? { textColor: '#000000' } : {}),
                    ...(bg.color === '#000000' && currentTextColor === '#000000' ? { textColor: '#ffffff' } : {}),
                  });
                }}
                style={{ backgroundColor: bg.color }}
                className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer border ${
                  currentBoxBg.toLowerCase() === bg.color.toLowerCase()
                    ? 'border-rose-500 ring-2 ring-rose-500/40 font-semibold'
                    : 'border-neutral-700 hover:border-neutral-500'
                } ${bg.color === '#ffffff' ? 'text-black' : 'text-white'}`}
              >
                <span>{bg.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 2. Text Font Color */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium text-neutral-300">
              Text Font Color (Normal Text):
            </label>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-neutral-400">
                {currentTextColor}
              </span>
              <input
                type="color"
                value={currentTextColor}
                onChange={(e) => onChange({ textColor: e.target.value })}
                className="w-7 h-7 rounded border border-neutral-700 bg-transparent cursor-pointer"
                title="Choose custom text font color"
              />
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {textColorsList.map((tc) => (
              <button
                key={tc.color}
                type="button"
                onClick={() => onChange({ textColor: tc.color })}
                className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer border ${
                  currentTextColor.toLowerCase() === tc.color.toLowerCase()
                    ? 'border-rose-500 ring-2 ring-rose-500/40 text-white font-semibold'
                    : 'border-neutral-800 bg-neutral-900 text-neutral-300 hover:text-white'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full border border-neutral-600" style={{ backgroundColor: tc.color }} />
                <span>{tc.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 3. Text Overflow Fix Sliders: Card Height & Width ("text background sa bahir aa raha ha") */}
        <div className="p-3.5 bg-neutral-900/80 border border-neutral-800 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-400 flex items-center gap-1">
              <span>📏</span>
              <span>Card Size & Padding (Text ko adjust karne ke liye)</span>
            </span>
            <span className="text-[10px] text-neutral-400">
              Clipping active: Text card se bahar nahi aayega
            </span>
          </div>

          {/* Extra Vertical Height / Breathing Room Slider */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-neutral-300">Card Vertical Height (Extra Room)</span>
              <span className="text-neutral-200 font-mono tabular-nums bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800 font-semibold">
                +{script.boxHeightExtra || 0}px
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={120}
              step={4}
              value={script.boxHeightExtra || 0}
              onChange={(e) => onChange({ boxHeightExtra: Number(e.target.value) })}
              className="w-full accent-rose-600 h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex items-center gap-1.5 mt-1">
              {[0, 20, 40, 60, 90].map((extra) => (
                <button
                  key={extra}
                  type="button"
                  onClick={() => onChange({ boxHeightExtra: extra })}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors cursor-pointer ${
                    (script.boxHeightExtra || 0) === extra
                      ? 'bg-rose-600 text-white font-semibold'
                      : 'bg-neutral-950 text-neutral-400 hover:text-white border border-neutral-800'
                  }`}
                >
                  +{extra}px
                </button>
              ))}
            </div>
          </div>

          {/* Card Width Slider */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-neutral-300">Card Width (% of Screen)</span>
              <span className="text-neutral-200 font-mono tabular-nums bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800 font-semibold">
                {script.boxMaxWidth}%
              </span>
            </div>
            <input
              type="range"
              min={65}
              max={98}
              step={1}
              value={script.boxMaxWidth}
              onChange={(e) => onChange({ boxMaxWidth: Number(e.target.value) })}
              className="w-full accent-rose-600 h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Card Inner Padding Slider */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-neutral-300">Inner Padding (Margins)</span>
              <span className="text-neutral-200 font-mono tabular-nums bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800 font-semibold">
                {script.boxPadding}px
              </span>
            </div>
            <input
              type="range"
              min={10}
              max={52}
              value={script.boxPadding}
              onChange={(e) => onChange({ boxPadding: Number(e.target.value) })}
              className="w-full accent-rose-600 h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>

        {/* 4. Opacity, Corner Radius & Gap */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-neutral-400">Box Opacity</span>
              <span className="text-neutral-200 font-mono tabular-nums">
                {Math.round(script.boxOpacity * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0.5}
              max={1.0}
              step={0.02}
              value={script.boxOpacity}
              onChange={(e) => onChange({ boxOpacity: Number(e.target.value) })}
              className="w-full accent-rose-600 h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-neutral-400">Corner Radius</span>
              <span className="text-neutral-200 font-mono tabular-nums">
                {script.boxBorderRadius}px
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={32}
              value={script.boxBorderRadius}
              onChange={(e) =>
                onChange({ boxBorderRadius: Number(e.target.value) })
              }
              className="w-full accent-rose-600 h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-neutral-400">Gap from Picture</span>
              <span className="text-neutral-200 font-mono tabular-nums">
                {script.boxMarginTop}px
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={50}
              value={script.boxMarginTop}
              onChange={(e) =>
                onChange({ boxMarginTop: Number(e.target.value) })
              }
              className="w-full accent-rose-600 h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Text Layer Position (Move anywhere on screen) */}
      <div className="bg-neutral-950/70 border border-neutral-800 p-4 rounded-xl space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
            <Move className="w-3.5 h-3.5 text-rose-500" />
            Text Layer Position (Move anywhere on screen)
          </h4>
          <span className="text-[11px] text-rose-400/90 font-medium">
            Interactive drag enabled
          </span>
        </div>

        {/* Move left / right */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-neutral-400">Move text left / right (X)</span>
            <span className="text-neutral-200 font-mono tabular-nums bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
              {(script.moveX ?? 0) > 0 ? `+${script.moveX}` : (script.moveX ?? 0)}
            </span>
          </div>
          <input
            type="range"
            min={-100}
            max={100}
            value={script.moveX ?? 0}
            onChange={(e) => onChange({ moveX: Number(e.target.value) })}
            className="w-full accent-rose-600 h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* Move up / down */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-neutral-400">Move text up / down (Y)</span>
            <span className="text-neutral-200 font-mono tabular-nums bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
              {(script.moveY ?? 0) > 0 ? `+${script.moveY}` : (script.moveY ?? 0)}
            </span>
          </div>
          <input
            type="range"
            min={-100}
            max={100}
            value={script.moveY ?? 0}
            onChange={(e) => onChange({ moveY: Number(e.target.value) })}
            className="w-full accent-rose-600 h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* Quick Position Shortcuts */}
        <div className="flex items-center justify-between gap-1.5 pt-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => onChange({ moveX: 0, moveY: 0 })}
              className="px-2.5 py-1 text-[11px] font-medium rounded-md bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 transition-colors cursor-pointer"
            >
              Default (0, 0)
            </button>
            <button
              type="button"
              onClick={() => onChange({ moveX: 0, moveY: -65 })}
              className="px-2.5 py-1 text-[11px] font-medium rounded-md bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 transition-colors cursor-pointer"
            >
              Top (Y: -65)
            </button>
            <button
              type="button"
              onClick={() => onChange({ moveX: 0, moveY: -20 })}
              className="px-2.5 py-1 text-[11px] font-medium rounded-md bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 transition-colors cursor-pointer"
            >
              Center (Y: -20)
            </button>
            <button
              type="button"
              onClick={() => onChange({ moveX: 0, moveY: 40 })}
              className="px-2.5 py-1 text-[11px] font-medium rounded-md bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 transition-colors cursor-pointer"
            >
              Bottom (Y: +40)
            </button>
          </div>

          <button
            type="button"
            onClick={() => onChange({ moveX: 0, moveY: 0 })}
            className="text-[11px] text-neutral-400 hover:text-white flex items-center gap-1 p-1 cursor-pointer transition-colors"
            title="Reset position to default"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Next Step CTA */}
      <div className="pt-2">
        <button
          type="button"
          onClick={onNext}
          className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm shadow-rose-950"
        >
          <span>Continue to Add Media</span>
          <span>→</span>
        </button>
      </div>

      {/* AI Hook Modal */}
      {showAiModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-neutral-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-rose-500" />
                Generate 8-Second Story Hook
              </h3>
              <button
                onClick={() => setShowAiModal(false)}
                className="text-neutral-400 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-neutral-400">
              Enter any topic, history mystery, or fact to automatically generate a
              concise 8-second story script with smart keyword highlights.
            </p>
            <input
              type="text"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="e.g. The Great Emu War, Apollo 11, Paris Catacombs..."
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-xs text-neutral-100 focus:outline-none focus:border-rose-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleGenerateAi();
              }}
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAiModal(false)}
                className="px-3 py-1.5 text-xs text-neutral-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleGenerateAi}
                disabled={isGenerating || !aiPrompt.trim()}
                className="px-4 py-1.5 text-xs bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-lg flex items-center gap-1.5 cursor-pointer font-medium"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Writing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate Hook</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
