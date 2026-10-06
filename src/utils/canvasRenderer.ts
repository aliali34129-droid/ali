import { VideoProject } from '../types';
import { getActiveHighlights, isWordKeyword, cleanPunctuation } from './keywordExtractor';
import { getCanvasFontString } from './textStyles';

/**
 * Draws a rounded rectangle path on a 2D canvas context.
 */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/**
 * Convert Hex color to RGBA string
 */
function hexToRgba(hex: string, alpha: number): string {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2) || 'ef', 16);
  const g = parseInt(cleanHex.substring(2, 4) || '44', 16);
  const b = parseInt(cleanHex.substring(4, 6) || '44', 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Detects if string contains Right-to-Left (Urdu / Arabic / Persian) characters
 */
export function isRtlText(text: string): boolean {
  if (!text) return false;
  return /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text);
}

export interface RenderWord {
  text: string;
  isHighlighted: boolean;
  width: number;
}

export interface RenderLine {
  words: RenderWord[];
  totalWidth: number;
}

// Reusable measurement canvas to avoid DOM allocations
let sharedMeasureCanvas: HTMLCanvasElement | null = null;
let sharedMeasureCtx: CanvasRenderingContext2D | null = null;
function getSharedMeasureCtx(): CanvasRenderingContext2D | null {
  if (!sharedMeasureCanvas) {
    sharedMeasureCanvas = document.createElement('canvas');
    sharedMeasureCtx = sharedMeasureCanvas.getContext('2d');
  }
  return sharedMeasureCtx;
}

// Ultra-fast memoization cache for wrapped lines
const wrapCache = new Map<string, RenderLine[]>();
const MAX_WRAP_CACHE = 60;

/**
 * Calculates wrapped lines of text word-by-word with highlight metadata.
 * Strips bracket syntax [word] from display while marking them as highlighted.
 */
export function wrapFormattedWords(
  ctx: CanvasRenderingContext2D,
  rawText: string,
  maxWidth: number,
  activeKeywords: string[]
): RenderLine[] {
  if (!rawText) return [];

  const roundedMaxWidth = Math.round(maxWidth);
  const cacheKey = `${ctx.font}_${roundedMaxWidth}_${activeKeywords.join(',')}__${rawText}`;
  const cached = wrapCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const lines: RenderLine[] = [];
  const spaceWidth = ctx.measureText(' ').width;
  // Conservative safety buffer to guarantee words never clip right card boundary
  const safeMaxWidth = Math.max(80, roundedMaxWidth - 8);

  const paragraphs = rawText.split('\n');

  for (const paragraph of paragraphs) {
    if (paragraph.trim() === '') {
      lines.push({ words: [], totalWidth: 0 });
      continue;
    }

    // Tokenize words, detecting bracket markup [word] or [multi word phrase]
    const rawTokens = paragraph.split(/\s+/).filter(Boolean);
    let currentLineWords: RenderWord[] = [];
    let currentLineWidth = 0;
    let isInsideBracket = false;

    for (let i = 0; i < rawTokens.length; i++) {
      let rawToken = rawTokens[i];
      let wordHighlighted = false;

      // Check if starting a bracket [phrase
      if (rawToken.startsWith('[')) {
        isInsideBracket = true;
        rawToken = rawToken.substring(1);
      }

      // Check if closing bracket phrase]
      let endsBracket = false;
      if (rawToken.endsWith(']')) {
        endsBracket = true;
        rawToken = rawToken.slice(0, -1);
      }

      if (isInsideBracket) {
        wordHighlighted = true;
      } else {
        wordHighlighted = isWordKeyword(rawToken, activeKeywords);
        if (!wordHighlighted && activeKeywords.some((k) => k.includes(' '))) {
          // Check if rawToken is part of an exact multi-word phrase match at this exact sequence
          for (const kw of activeKeywords) {
            if (kw.includes(' ')) {
              const kwParts = kw.split(/\s+/).map((p) => cleanPunctuation(p)).filter(Boolean);
              for (let startOffset = 0; startOffset < kwParts.length; startOffset++) {
                const startIndex = i - startOffset;
                if (startIndex >= 0 && startIndex + kwParts.length <= rawTokens.length) {
                  let matchesPhrase = true;
                  for (let k = 0; k < kwParts.length; k++) {
                    const tokenClean = cleanPunctuation(rawTokens[startIndex + k]);
                    if (tokenClean !== kwParts[k]) {
                      matchesPhrase = false;
                      break;
                    }
                  }
                  if (matchesPhrase) {
                    wordHighlighted = true;
                    break;
                  }
                }
              }
            }
            if (wordHighlighted) break;
          }
        }
      }

      if (endsBracket) {
        isInsideBracket = false;
      }

      const wordWidth = ctx.measureText(rawToken).width;

      // Prevent single extremely long word from spilling horizontally outside card
      if (wordWidth > safeMaxWidth && rawToken.length > 12) {
        const mid = Math.ceil(rawToken.length / 2);
        const part1 = rawToken.substring(0, mid) + '-';
        const part2 = rawToken.substring(mid);
        rawTokens.splice(i, 1, part1, part2);
        i--;
        continue;
      }

      const neededWidth = currentLineWords.length === 0 ? wordWidth : currentLineWidth + spaceWidth + wordWidth;

      if (neededWidth > safeMaxWidth && currentLineWords.length > 0) {
        lines.push({
          words: currentLineWords,
          totalWidth: currentLineWidth,
        });
        currentLineWords = [{ text: rawToken, isHighlighted: wordHighlighted, width: wordWidth }];
        currentLineWidth = wordWidth;
      } else {
        currentLineWords.push({ text: rawToken, isHighlighted: wordHighlighted, width: wordWidth });
        currentLineWidth = neededWidth;
      }
    }

    if (currentLineWords.length > 0) {
      lines.push({
        words: currentLineWords,
        totalWidth: currentLineWidth,
      });
    }
  }

  if (wrapCache.size >= MAX_WRAP_CACHE) {
    const firstKey = wrapCache.keys().next().value;
    if (firstKey) wrapCache.delete(firstKey);
  }
  wrapCache.set(cacheKey, lines);

  return lines;
}

// High-performance background blur and preset cache
let cachedBgCanvas: HTMLCanvasElement | null = null;
let downscaleCanvas: HTMLCanvasElement | null = null;
let cachedBgKey: string = '';

/**
 * Draws preset backdrop gradient onto context
 */
function drawPresetBackdrop(
  ctx: CanvasRenderingContext2D,
  presetId: string | undefined,
  width: number,
  height: number
) {
  const cx = width / 2;
  const cy = height * 0.45;
  const maxRadius = Math.max(width, height) * 0.85;

  let gradient: CanvasGradient;

  switch (presetId) {
    case 'neon-glow': {
      gradient = ctx.createRadialGradient(cx, cy, 20, cx, cy, maxRadius);
      gradient.addColorStop(0, '#581c87');
      gradient.addColorStop(0.4, '#1e1b4b');
      gradient.addColorStop(0.85, '#09090b');
      gradient.addColorStop(1, '#020205');
      break;
    }
    case 'vintage-warmth': {
      gradient = ctx.createRadialGradient(cx, cy, 20, cx, cy, maxRadius);
      gradient.addColorStop(0, '#78350f');
      gradient.addColorStop(0.45, '#29180b');
      gradient.addColorStop(0.85, '#120d09');
      gradient.addColorStop(1, '#080503');
      break;
    }
    case 'midnight-blue': {
      gradient = ctx.createRadialGradient(cx, cy, 20, cx, cy, maxRadius);
      gradient.addColorStop(0, '#1e3a8a');
      gradient.addColorStop(0.4, '#0f172a');
      gradient.addColorStop(0.85, '#020617');
      gradient.addColorStop(1, '#010409');
      break;
    }
    case 'emerald-dark': {
      gradient = ctx.createRadialGradient(cx, cy, 20, cx, cy, maxRadius);
      gradient.addColorStop(0, '#064e3b');
      gradient.addColorStop(0.4, '#022c22');
      gradient.addColorStop(0.85, '#061712');
      gradient.addColorStop(1, '#020907');
      break;
    }
    case 'sunset-vibes': {
      gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, '#831843');
      gradient.addColorStop(0.4, '#4c0519');
      gradient.addColorStop(0.7, '#1c1917');
      gradient.addColorStop(1, '#0c0a09');
      break;
    }
    case 'studio-dark':
    default: {
      gradient = ctx.createRadialGradient(cx, cy, 20, cx, cy, maxRadius);
      gradient.addColorStop(0, '#262626');
      gradient.addColorStop(0.5, '#171717');
      gradient.addColorStop(0.9, '#0a0a0a');
      gradient.addColorStop(1, '#050505');
      break;
    }
  }

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

/**
 * Ultra-fast background renderer using downscaled GPU-friendly blur
 */
function getBlurredBackgroundCanvas(
  sourceMedia: HTMLImageElement | HTMLVideoElement | null,
  width: number,
  height: number,
  project: VideoProject
): HTMLCanvasElement {
  const bgSource = project.adjust.bgSource || 'auto';
  const bgBlur = Math.max(0, project.adjust.bgBlur ?? 40);
  const bgDarkness = Math.max(0, Math.min(0.9, project.adjust.bgDarkness ?? 0.35));
  const bgScale = project.adjust.bgScale || 1.4;
  const bgPresetId = project.adjust.bgPresetId || 'studio-dark';
  const bgColor = project.adjust.bgColor || '#0a0a0a';

  let mediaIdentifier = 'none';
  if (sourceMedia) {
    mediaIdentifier = (sourceMedia as HTMLImageElement).src || (sourceMedia as HTMLVideoElement).currentSrc || 'media';
  }

  const key = `${bgSource}_${mediaIdentifier}_${bgPresetId}_${bgColor}_${width}x${height}_${bgBlur}_${bgDarkness}_${bgScale}`;

  if (cachedBgCanvas && cachedBgKey === key && cachedBgCanvas.width === width && cachedBgCanvas.height === height) {
    return cachedBgCanvas;
  }

  if (!cachedBgCanvas) {
    cachedBgCanvas = document.createElement('canvas');
  }
  cachedBgCanvas.width = width;
  cachedBgCanvas.height = height;

  const bgCtx = cachedBgCanvas.getContext('2d', { alpha: false });
  if (!bgCtx) return cachedBgCanvas;

  bgCtx.imageSmoothingEnabled = true;
  bgCtx.imageSmoothingQuality = 'medium';

  // 1. Handle Solid Color mode
  if (bgSource === 'color') {
    bgCtx.fillStyle = bgColor;
    bgCtx.fillRect(0, 0, width, height);
    if (bgDarkness > 0) {
      bgCtx.fillStyle = `rgba(0, 0, 0, ${bgDarkness})`;
      bgCtx.fillRect(0, 0, width, height);
    }
    cachedBgKey = key;
    return cachedBgCanvas;
  }

  // 2. Handle Preset Gradient mode
  if (bgSource === 'preset') {
    drawPresetBackdrop(bgCtx, bgPresetId, width, height);
    if (bgDarkness > 0) {
      bgCtx.fillStyle = `rgba(0, 0, 0, ${bgDarkness})`;
      bgCtx.fillRect(0, 0, width, height);
    }
    cachedBgKey = key;
    return cachedBgCanvas;
  }

  // 3. Handle Media Background (auto or custom)
  if (!sourceMedia) {
    drawPresetBackdrop(bgCtx, 'studio-dark', width, height);
    cachedBgKey = key;
    return cachedBgCanvas;
  }

  const naturalWidth = (sourceMedia as HTMLImageElement).naturalWidth || (sourceMedia as HTMLVideoElement).videoWidth || 800;
  const naturalHeight = (sourceMedia as HTMLImageElement).naturalHeight || (sourceMedia as HTMLVideoElement).videoHeight || 600;

  const bgBaseScale = Math.max(width / naturalWidth, height / naturalHeight) * bgScale;
  const bgW = naturalWidth * bgBaseScale;
  const bgH = naturalHeight * bgBaseScale;
  const bgX = (width - bgW) / 2;
  const bgY = (height - bgH) / 2;

  if (bgBlur === 0) {
    // Sharp / Crisp background (No blur applied!)
    bgCtx.drawImage(sourceMedia, bgX, bgY, bgW, bgH);
  } else {
    // Ultra-fast bokeh blur: 4x downscaled offscreen buffer
    const downW = Math.max(120, Math.round(width / 4));
    const downH = Math.max(200, Math.round(height / 4));

    if (!downscaleCanvas) {
      downscaleCanvas = document.createElement('canvas');
    }
    downscaleCanvas.width = downW;
    downscaleCanvas.height = downH;

    const downCtx = downscaleCanvas.getContext('2d', { alpha: false });
    if (downCtx) {
      downCtx.imageSmoothingEnabled = true;
      downCtx.imageSmoothingQuality = 'low';

      const scaledDownScale = Math.max(downW / naturalWidth, downH / naturalHeight) * bgScale;
      const dW = naturalWidth * scaledDownScale;
      const dH = naturalHeight * scaledDownScale;
      const dX = (downW - dW) / 2;
      const dY = (downH - dH) / 2;

      const kernelBlur = Math.max(1, Math.round(bgBlur / 4));
      downCtx.filter = `blur(${kernelBlur}px)`;
      downCtx.drawImage(sourceMedia, dX, dY, dW, dH);
      downCtx.filter = 'none';

      // Draw upscaled onto target background with smooth interpolation
      bgCtx.drawImage(downscaleCanvas, 0, 0, downW, downH, 0, 0, width, height);
    } else {
      bgCtx.filter = `blur(${bgBlur}px)`;
      bgCtx.drawImage(sourceMedia, bgX, bgY, bgW, bgH);
      bgCtx.filter = 'none';
    }
  }

  // Apply Dimming / Darkness overlay for high contrast
  if (bgDarkness > 0) {
    bgCtx.fillStyle = `rgba(0, 0, 0, ${bgDarkness})`;
    bgCtx.fillRect(0, 0, width, height);
  }

  cachedBgKey = key;
  return cachedBgCanvas;
}

/**
 * Main render function that draws a single frame of the loop video onto the canvas.
 * Now renders individual words with manual / selected highlights and viral styling!
 */
export function renderCanvasFrame(
  canvas: HTMLCanvasElement,
  project: VideoProject,
  img: HTMLImageElement | HTMLVideoElement | null,
  normalizedTime: number,
  bgImg?: HTMLImageElement | HTMLVideoElement | null
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const width = canvas.width;
  const height = canvas.height;

  // Clear canvas
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, width, height);

  const naturalWidth = (img as HTMLImageElement)?.naturalWidth || (img as HTMLVideoElement)?.videoWidth || 800;
  const naturalHeight = (img as HTMLImageElement)?.naturalHeight || (img as HTMLVideoElement)?.videoHeight || 600;

  // 1. CALCULATE MOTION (If enabled by user)
  let motionScale = 1.0;
  let motionOffsetY = 0;
  let motionOffsetX = 0;

  if (project.adjust.motionType === 'ken-burns') {
    const cycle = (Math.sin(normalizedTime * Math.PI * 2 - Math.PI / 2) + 1) / 2;
    motionScale = 1.0 + cycle * (project.adjust.motionIntensity || 0.03);
    motionOffsetY = Math.sin(normalizedTime * Math.PI * 2) * 5;
  } else if (project.adjust.motionType === 'subtle-drift') {
    motionOffsetX = Math.sin(normalizedTime * Math.PI * 2) * 6;
    motionOffsetY = Math.cos(normalizedTime * Math.PI * 2) * 6;
  }

  // 2. DRAW BACKGROUND
  const effectiveBgMedia = project.adjust.bgSource === 'custom' && bgImg ? bgImg : img;
  const bgCanvas = getBlurredBackgroundCanvas(
    effectiveBgMedia,
    width,
    height,
    project
  );
  ctx.drawImage(bgCanvas, 0, 0, width, height);

  // 3. LAYOUT FOREGROUND IMAGE
  const contentWidth = width * (project.script.boxMaxWidth / 100);
  const centerX = width / 2;

  const manualZoomScale = (project.adjust.scale || 1.0) * motionScale;
  const imgAspect = naturalWidth / naturalHeight;
  let targetImgW = contentWidth * manualZoomScale;
  let targetImgH = (contentWidth / imgAspect) * manualZoomScale;

  const maxImgH = height * 0.52;
  if (targetImgH > maxImgH && manualZoomScale <= 1.0) {
    targetImgH = maxImgH;
    targetImgW = targetImgH * imgAspect;
  }

  // 4. MEASURE TEXT AND ACTIVE HIGHLIGHTS
  const scaleRatio = width / 1080;
  const adjustedFontSize = Math.round(project.script.fontSize * scaleRatio);
  
  ctx.font = getCanvasFontString(project.script, adjustedFontSize);
  const textPadding = Math.round(project.script.boxPadding * scaleRatio);
  const maxTextLineWidth = contentWidth - textPadding * 2;

  // Process text transform (e.g. UPPERCASE / lowercase)
  let processedText = project.script.text;
  if (project.script.textTransform === 'uppercase') {
    processedText = processedText.toUpperCase();
  } else if (project.script.textTransform === 'lowercase') {
    processedText = processedText.toLowerCase();
  }

  // Resolve active highlights based on user's highlightMode ('manual-only' | 'auto-and-manual' | 'none')
  const highlightMode = project.script.highlightMode ?? (project.script.autoHighlightKeywords ? 'auto-and-manual' : 'manual-only');
  const activeHighlights = getActiveHighlights(
    processedText,
    highlightMode,
    project.script.customKeywords || [],
    project.script.excludedKeywords || []
  );

  const formattedLines = wrapFormattedWords(ctx, processedText, maxTextLineWidth, activeHighlights);
  const calculatedLineHeight = adjustedFontSize * project.script.lineHeight;
  const extraHeight = Math.round((project.script.boxHeightExtra || 0) * scaleRatio);
  const bottomSafetyPadding = Math.round(20 * scaleRatio);
  const textBlockHeight = formattedLines.length * calculatedLineHeight;
  const textBoxHeight = textBlockHeight + textPadding * 2 + extraHeight + bottomSafetyPadding;
  const gap = Math.round(project.script.boxMarginTop * scaleRatio);

  const totalContentHeight = targetImgH + gap + textBoxHeight;

  // Base coordinates for vertically balanced default composition
  const baseImgX = centerX - targetImgW / 2;
  let baseImgY = (height - totalContentHeight) / 2;
  const baseTextBoxX = centerX - contentWidth / 2;
  let baseTextBoxY = baseImgY + targetImgH + gap;

  // Guarantee card never pushes off screen bottom
  const maxBottomY = height - textBoxHeight - Math.round(18 * scaleRatio);
  if (baseTextBoxY > maxBottomY) {
    const shiftUp = baseTextBoxY - maxBottomY;
    baseTextBoxY = Math.max(Math.round(18 * scaleRatio), maxBottomY);
    baseImgY = Math.max(Math.round(18 * scaleRatio), baseImgY - shiftUp * 0.7);
  }

  const moveScaleX = width * 0.85;
  const moveScaleY = height * 0.85;

  const imgOffsetX = ((project.adjust.moveX || 0) / 100) * moveScaleX + motionOffsetX;
  const imgOffsetY = ((project.adjust.moveY || 0) / 100) * moveScaleY + motionOffsetY;

  const textOffsetX = ((project.script.moveX || 0) / 100) * moveScaleX;
  const textOffsetY = ((project.script.moveY || 0) / 100) * moveScaleY;

  const imgX = baseImgX + imgOffsetX;
  const imgY = baseImgY + imgOffsetY;

  // 5. DRAW FOREGROUND IMAGE
  if (img) {
    ctx.save();
    const imgRadius = Math.round(project.adjust.imageBorderRadius * scaleRatio);

    if (project.adjust.imageShadow) {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
      ctx.shadowBlur = 30 * scaleRatio;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 12 * scaleRatio;
    }

    roundRect(ctx, imgX, imgY, targetImgW, targetImgH, imgRadius);
    if (project.adjust.imageShadow) {
      ctx.fillStyle = '#000000';
      ctx.fill();
      ctx.shadowColor = 'transparent';
    }
    ctx.clip();
    ctx.drawImage(img, imgX, imgY, targetImgW, targetImgH);
    ctx.restore();

    // Clean border around foreground image
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
    ctx.lineWidth = 1.5 * scaleRatio;
    roundRect(ctx, imgX, imgY, targetImgW, targetImgH, imgRadius);
    ctx.stroke();
    ctx.restore();
  } else {
    // Elegant placeholder card when image is loading or not selected
    ctx.save();
    const imgRadius = Math.round(project.adjust.imageBorderRadius * scaleRatio);
    roundRect(ctx, imgX, imgY, targetImgW, targetImgH, imgRadius);
    ctx.fillStyle = '#18181b';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1.5 * scaleRatio;
    ctx.stroke();

    ctx.fillStyle = '#a1a1aa';
    ctx.font = `600 ${Math.round(18 * scaleRatio)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('🖼️ Click Add Media to choose picture', imgX + targetImgW / 2, imgY + targetImgH / 2);
    ctx.restore();
  }

  // 6. DRAW BLACK TEXT CARD
  const textBoxX = baseTextBoxX + textOffsetX;
  const textBoxY = baseTextBoxY + textOffsetY;
  const boxRadius = Math.round(project.script.boxBorderRadius * scaleRatio);

  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
  ctx.shadowBlur = 36 * scaleRatio;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 14 * scaleRatio;

  const hex = (project.script.boxBackgroundColor || '#000000').replace('#', '');
  const r = parseInt(hex.substring(0, 2) || '00', 16);
  const g = parseInt(hex.substring(2, 4) || '00', 16);
  const b = parseInt(hex.substring(4, 6) || '00', 16);
  ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${project.script.boxOpacity ?? 0.96})`;

  roundRect(ctx, textBoxX, textBoxY, contentWidth, textBoxHeight, boxRadius);
  ctx.fill();
  ctx.restore();

  // Subtle border on text box
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1 * scaleRatio;
  roundRect(ctx, textBoxX, textBoxY, contentWidth, textBoxHeight, boxRadius);
  ctx.stroke();
  ctx.restore();

  // 7. DRAW HIGHLIGHTED WORDS INSIDE BLACK CARD WITH BOUNDARY CLIPPING
  ctx.save();
  // Safe clipping rect with horizontal safety padding so edge letters never get cut off
  const clipSafety = 14 * scaleRatio;
  roundRect(
    ctx,
    textBoxX - clipSafety,
    textBoxY - 4 * scaleRatio,
    contentWidth + clipSafety * 2,
    textBoxHeight + 8 * scaleRatio,
    boxRadius
  );
  ctx.clip();

  ctx.font = getCanvasFontString(project.script, adjustedFontSize);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  const defaultTextColor = project.script.textColor || '#ffffff';
  const highlightColor = project.script.highlightColor || '#ef4444';
  const highlightStyle = project.script.highlightStyle || 'text';
  const spaceWidth = ctx.measureText(' ').width;

  const directionMode = project.script.textDirection ?? 'auto';
  const isRtl = directionMode === 'rtl' ? true : directionMode === 'ltr' ? false : isRtlText(project.script.text);

  let lineY = textBoxY + textPadding + Math.max(0, extraHeight / 2);

  for (let i = 0; i < formattedLines.length; i++) {
    const line = formattedLines[i];
    if (line.words.length === 0) {
      lineY += calculatedLineHeight;
      continue;
    }

    if (isRtl) {
      // Right-to-Left (Urdu / Arabic / Persian):
      // Word 0 is the FIRST word spoken/read and sits right at the RIGHT margin!
      let rightEdge = textBoxX + contentWidth - textPadding - Math.round(4 * scaleRatio);
      if (project.script.textAlign === 'center') {
        rightEdge = textBoxX + (contentWidth + line.totalWidth) / 2;
      } else if (project.script.textAlign === 'left' && directionMode === 'ltr') {
        rightEdge = textBoxX + textPadding + line.totalWidth;
      }

      let curRight = rightEdge;
      for (let w = 0; w < line.words.length; w++) {
        const wordObj = line.words[w];
        const wordStartX = curRight - wordObj.width;

        if (wordObj.isHighlighted) {
          if (highlightStyle === 'pill' || highlightStyle === 'both') {
            ctx.save();
            const pillAlpha = highlightStyle === 'pill' ? 0.92 : 0.38;
            ctx.fillStyle = hexToRgba(highlightColor, pillAlpha);
            roundRect(
              ctx,
              wordStartX - 5 * scaleRatio,
              lineY - 2 * scaleRatio,
              wordObj.width + 10 * scaleRatio,
              calculatedLineHeight - 4 * scaleRatio,
              6 * scaleRatio
            );
            ctx.fill();
            ctx.restore();
          }

          if (highlightStyle === 'pill') {
            const isBright = ['#facc15', '#fde047', '#a3e635', '#22c55e', '#22d3ee', '#fbbf24', '#fef08a'].some(c => highlightColor.toLowerCase() === c.toLowerCase());
            ctx.fillStyle = isBright ? '#000000' : '#ffffff';
          } else {
            ctx.fillStyle = highlightColor;
          }
        } else {
          ctx.fillStyle = defaultTextColor;
        }

        ctx.fillText(wordObj.text, wordStartX, lineY);
        curRight -= (wordObj.width + spaceWidth);
      }
    } else {
      // Left-to-Right (English / Roman Urdu):
      let wordX = textBoxX + textPadding + Math.round(4 * scaleRatio);
      if (project.script.textAlign === 'center') {
        wordX = textBoxX + (contentWidth - line.totalWidth) / 2;
      } else if (project.script.textAlign === 'right') {
        wordX = textBoxX + contentWidth - textPadding - line.totalWidth - Math.round(4 * scaleRatio);
      }

      for (let w = 0; w < line.words.length; w++) {
        const wordObj = line.words[w];

        if (wordObj.isHighlighted) {
          if (highlightStyle === 'pill' || highlightStyle === 'both') {
            ctx.save();
            const pillAlpha = highlightStyle === 'pill' ? 0.92 : 0.38;
            ctx.fillStyle = hexToRgba(highlightColor, pillAlpha);
            roundRect(
              ctx,
              wordX - 5 * scaleRatio,
              lineY - 2 * scaleRatio,
              wordObj.width + 10 * scaleRatio,
              calculatedLineHeight - 4 * scaleRatio,
              6 * scaleRatio
            );
            ctx.fill();
            ctx.restore();
          }

          if (highlightStyle === 'pill') {
            const isBright = ['#facc15', '#fde047', '#a3e635', '#22c55e', '#22d3ee', '#fbbf24', '#fef08a'].some(c => highlightColor.toLowerCase() === c.toLowerCase());
            ctx.fillStyle = isBright ? '#000000' : '#ffffff';
          } else {
            ctx.fillStyle = highlightColor;
          }
        } else {
          ctx.fillStyle = defaultTextColor;
        }

        ctx.fillText(wordObj.text, wordX, lineY);
        wordX += wordObj.width + spaceWidth;
      }
    }

    lineY += calculatedLineHeight;
  }
  ctx.restore();
}

export interface LayerBounds {
  image: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  text: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

/**
 * Calculates current exact pixel bounds for Image layer and Text layer on the canvas.
 */
export function getCanvasLayerBounds(
  width: number,
  height: number,
  project: VideoProject,
  naturalWidth: number = 800,
  naturalHeight: number = 600
): LayerBounds {
  const contentWidth = width * (project.script.boxMaxWidth / 100);
  const centerX = width / 2;

  const manualZoomScale = project.adjust.scale || 1.0;
  const imgAspect = naturalWidth / naturalHeight;
  let targetImgW = contentWidth * manualZoomScale;
  let targetImgH = (contentWidth / imgAspect) * manualZoomScale;

  const maxImgH = height * 0.52;
  if (targetImgH > maxImgH && manualZoomScale <= 1.0) {
    targetImgH = maxImgH;
    targetImgW = targetImgH * imgAspect;
  }

  const scaleRatio = width / 1080;
  const adjustedFontSize = Math.round(project.script.fontSize * scaleRatio);
  const textPadding = Math.round(project.script.boxPadding * scaleRatio);
  const maxTextLineWidth = contentWidth - textPadding * 2;

  // Measure line count accurately
  let lineCount = 1;
  const tCtx = getSharedMeasureCtx();
  if (tCtx) {
    tCtx.font = getCanvasFontString(project.script, adjustedFontSize);
    const highlightMode = project.script.highlightMode ?? (project.script.autoHighlightKeywords ? 'auto-and-manual' : 'manual-only');
    
    let processedText = project.script.text;
    if (project.script.textTransform === 'uppercase') {
      processedText = processedText.toUpperCase();
    } else if (project.script.textTransform === 'lowercase') {
      processedText = processedText.toLowerCase();
    }

    const activeKeywords = getActiveHighlights(
      processedText,
      highlightMode,
      project.script.customKeywords || [],
      project.script.excludedKeywords || []
    );
    const lines = wrapFormattedWords(tCtx, processedText, maxTextLineWidth, activeKeywords);
    lineCount = Math.max(1, lines.length);
  }

  const calculatedLineHeight = adjustedFontSize * project.script.lineHeight;
  const extraHeight = Math.round((project.script.boxHeightExtra || 0) * scaleRatio);
  const bottomSafetyPadding = Math.round(20 * scaleRatio);
  const textBlockHeight = lineCount * calculatedLineHeight;
  const textBoxHeight = textBlockHeight + textPadding * 2 + extraHeight + bottomSafetyPadding;
  const gap = Math.round(project.script.boxMarginTop * scaleRatio);

  const totalContentHeight = targetImgH + gap + textBoxHeight;

  const baseImgX = centerX - targetImgW / 2;
  let baseImgY = (height - totalContentHeight) / 2;
  const baseTextBoxX = centerX - contentWidth / 2;
  let baseTextBoxY = baseImgY + targetImgH + gap;

  const maxBottomY = height - textBoxHeight - Math.round(18 * scaleRatio);
  if (baseTextBoxY > maxBottomY) {
    const shiftUp = baseTextBoxY - maxBottomY;
    baseTextBoxY = Math.max(Math.round(18 * scaleRatio), maxBottomY);
    baseImgY = Math.max(Math.round(18 * scaleRatio), baseImgY - shiftUp * 0.7);
  }

  const moveScaleX = width * 0.85;
  const moveScaleY = height * 0.85;

  const imgOffsetX = ((project.adjust.moveX || 0) / 100) * moveScaleX;
  const imgOffsetY = ((project.adjust.moveY || 0) / 100) * moveScaleY;
  const textOffsetX = ((project.script.moveX || 0) / 100) * moveScaleX;
  const textOffsetY = ((project.script.moveY || 0) / 100) * moveScaleY;

  return {
    image: {
      x: baseImgX + imgOffsetX,
      y: baseImgY + imgOffsetY,
      width: targetImgW,
      height: targetImgH,
    },
    text: {
      x: baseTextBoxX + textOffsetX,
      y: baseTextBoxY + textOffsetY,
      width: contentWidth,
      height: textBoxHeight,
    },
  };
}
