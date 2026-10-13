import { SavedUserTemplate, VideoProject } from '../types';

const STORAGE_KEY = 'shortx_user_templates';
const DEFAULT_TEMPLATE_ID_KEY = 'shortx_default_template_id';

// Default starter templates so the user immediately sees how it works
const DEFAULT_STARTER_TEMPLATES: SavedUserTemplate[] = [
  {
    id: 'starter-rubik-bold',
    name: 'Viral Rubik-Bold Hook',
    createdAt: new Date().toISOString(),
    isDefault: false,
    durationSeconds: 8,
    script: {
      fontFamily: 'rubik',
      fontWeight: '800',
      fontSize: 34,
      lineHeight: 1.45,
      textAlign: 'center',
      textColor: '#ffffff',
      boxBackgroundColor: '#09090b',
      boxOpacity: 0.98,
      boxBorderRadius: 18,
      boxPadding: 26,
      boxMaxWidth: 86,
      highlightColor: '#ef4444',
      highlightStyle: 'text',
      highlightMode: 'manual-only',
    },
    adjust: {
      scale: 1.0,
      moveX: 0,
      moveY: 0,
      imageBorderRadius: 18,
      imageShadow: true,
      bgBlur: 38,
      bgDarkness: 0.35,
      bgScale: 1.4,
      motionType: 'static',
      motionIntensity: 0.03,
    },
    audio: {
      volume: 0.7,
      loop: true,
      fadeIn: true,
      fadeOut: true,
    },
  },
  {
    id: 'starter-yellow-punch',
    name: 'Hyper Yellow Shorts Style',
    createdAt: new Date().toISOString(),
    isDefault: false,
    durationSeconds: 8,
    script: {
      fontFamily: 'bebas-neue',
      fontWeight: '800',
      fontSize: 35,
      lineHeight: 1.4,
      textAlign: 'center',
      textColor: '#ffffff',
      boxBackgroundColor: '#000000',
      boxOpacity: 0.98,
      boxBorderRadius: 16,
      boxPadding: 26,
      boxMaxWidth: 86,
      highlightColor: '#facc15',
      highlightStyle: 'pill',
      highlightMode: 'manual-only',
    },
    adjust: {
      scale: 1.0,
      moveX: 0,
      moveY: 0,
      imageBorderRadius: 16,
      imageShadow: true,
      bgBlur: 40,
      bgDarkness: 0.4,
      bgScale: 1.4,
      motionType: 'static',
      motionIntensity: 0.03,
    },
    audio: {
      volume: 0.75,
      loop: true,
      fadeIn: true,
      fadeOut: true,
    },
  },
];

export function getUserTemplates(): SavedUserTemplate[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_STARTER_TEMPLATES));
      return DEFAULT_STARTER_TEMPLATES;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      const defaultId = localStorage.getItem(DEFAULT_TEMPLATE_ID_KEY);
      return parsed.map((item) => ({
        ...item,
        isDefault: item.id === defaultId,
      }));
    }
  } catch (err) {
    console.warn('Failed to load user templates:', err);
  }
  return DEFAULT_STARTER_TEMPLATES;
}

export function saveUserTemplate(
  name: string,
  project: VideoProject,
  isDefault: boolean = false
): SavedUserTemplate {
  const templates = getUserTemplates();
  const id = `template-${Date.now()}`;

  const newTemplate: SavedUserTemplate = {
    id,
    name: name.trim() || `My Style Preset (${new Date().toLocaleDateString()})`,
    createdAt: new Date().toISOString(),
    isDefault,
    durationSeconds: project.durationSeconds || 8,
    script: {
      fontFamily: project.script.fontFamily,
      fontWeight: project.script.fontWeight,
      fontSize: project.script.fontSize,
      lineHeight: project.script.lineHeight,
      textAlign: project.script.textAlign,
      textDirection: project.script.textDirection,
      textColor: project.script.textColor,
      boxBackgroundColor: project.script.boxBackgroundColor,
      boxOpacity: project.script.boxOpacity,
      boxBorderRadius: project.script.boxBorderRadius,
      boxPadding: project.script.boxPadding,
      boxMarginTop: project.script.boxMarginTop,
      boxMaxWidth: project.script.boxMaxWidth,
      boxHeightExtra: project.script.boxHeightExtra,
      moveX: project.script.moveX,
      moveY: project.script.moveY,
      highlightColor: project.script.highlightColor,
      highlightStyle: project.script.highlightStyle,
      highlightMode: project.script.highlightMode,
      wordColors: project.script.wordColors ? { ...project.script.wordColors } : {},
      customKeywords: project.script.customKeywords ? [...project.script.customKeywords] : [],
    },
    adjust: {
      scale: project.adjust.scale,
      moveX: project.adjust.moveX,
      moveY: project.adjust.moveY,
      imageBorderRadius: project.adjust.imageBorderRadius,
      imageShadow: project.adjust.imageShadow,
      bgBlur: project.adjust.bgBlur,
      bgDarkness: project.adjust.bgDarkness,
      bgScale: project.adjust.bgScale,
      motionType: project.adjust.motionType,
      motionIntensity: project.adjust.motionIntensity,
    },
    audio: {
      volume: project.audio.volume,
      loop: project.audio.loop,
      fadeIn: project.audio.fadeIn,
      fadeOut: project.audio.fadeOut,
      trimMode: project.audio.trimMode,
    },
  };

  const updated = [newTemplate, ...templates.filter((t) => t.id !== id)];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    if (isDefault) {
      localStorage.setItem(DEFAULT_TEMPLATE_ID_KEY, id);
    }
  } catch (err) {
    console.warn('Failed to save template:', err);
  }

  return newTemplate;
}

export function deleteUserTemplate(id: string): SavedUserTemplate[] {
  const templates = getUserTemplates().filter((t) => t.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
    if (localStorage.getItem(DEFAULT_TEMPLATE_ID_KEY) === id) {
      localStorage.removeItem(DEFAULT_TEMPLATE_ID_KEY);
    }
  } catch (err) {
    console.warn('Failed to delete template:', err);
  }
  return templates;
}

export function setDefaultUserTemplate(id: string): void {
  try {
    localStorage.setItem(DEFAULT_TEMPLATE_ID_KEY, id);
  } catch (err) {
    console.warn('Failed to set default template:', err);
  }
}

export function getDefaultUserTemplate(): SavedUserTemplate | null {
  try {
    const defaultId = localStorage.getItem(DEFAULT_TEMPLATE_ID_KEY);
    if (!defaultId) return null;
    const templates = getUserTemplates();
    return templates.find((t) => t.id === defaultId) || null;
  } catch {
    return null;
  }
}

export function exportUserTemplatesJson(): void {
  try {
    const templates = getUserTemplates();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(templates, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute('href', dataStr);
    dlAnchorElem.setAttribute('download', `shortx-presets-backup-${new Date().toISOString().slice(0, 10)}.json`);
    dlAnchorElem.click();
  } catch (err) {
    console.error('Failed to export presets JSON:', err);
  }
}

export function importUserTemplatesJson(jsonStr: string): SavedUserTemplate[] {
  try {
    const parsed = JSON.parse(jsonStr);
    if (!Array.isArray(parsed)) throw new Error('Invalid format: expected array');
    
    const existing = getUserTemplates();
    const existingIds = new Set(existing.map((t) => t.id));
    
    const merged = [...existing];
    for (const item of parsed) {
      if (item && item.name && item.script) {
        if (existingIds.has(item.id)) {
          item.id = `template-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        }
        merged.push(item);
      }
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    return merged;
  } catch (err) {
    console.error('Failed to import presets:', err);
    throw err;
  }
}
