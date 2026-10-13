import { SavedProjectRecord, VideoProject } from '../types';

const STORAGE_KEY = 'shortx_saved_projects_v1';

export function getSavedProjects(): SavedProjectRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch (err) {
    console.warn('Failed to load saved projects:', err);
  }
  return [];
}

export function saveProjectRecord(
  project: VideoProject,
  thumbnailUrl?: string
): SavedProjectRecord {
  const existing = getSavedProjects();
  const existingIndex = existing.findIndex((p) => p.id === project.id);

  const now = new Date().toISOString();
  let record: SavedProjectRecord;

  if (existingIndex >= 0) {
    record = {
      ...existing[existingIndex],
      title: project.title || existing[existingIndex].title,
      updatedAt: now,
      project: JSON.parse(JSON.stringify(project)),
      thumbnailUrl: thumbnailUrl || existing[existingIndex].thumbnailUrl,
    };
    existing[existingIndex] = record;
  } else {
    record = {
      id: project.id || `proj-${Date.now()}`,
      title: project.title || 'Untitled Project',
      createdAt: now,
      updatedAt: now,
      project: JSON.parse(JSON.stringify(project)),
      thumbnailUrl,
    };
    existing.unshift(record);
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  } catch (err) {
    console.warn('Failed to save project record to localStorage:', err);
    // If quota exceeded due to large thumbnails or media, strip thumbnails and retry
    try {
      const stripped = existing.map((item) => ({
        ...item,
        thumbnailUrl: undefined,
      }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stripped));
    } catch {}
  }

  return record;
}

export function deleteProjectRecord(id: string): SavedProjectRecord[] {
  const existing = getSavedProjects().filter((p) => p.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  } catch (err) {
    console.warn('Failed to update project storage after deletion:', err);
  }
  return existing;
}

export function duplicateProjectRecord(id: string): SavedProjectRecord | null {
  const existing = getSavedProjects();
  const target = existing.find((p) => p.id === id);
  if (!target) return null;

  const now = new Date().toISOString();
  const cloneId = `proj-${Date.now()}`;
  const cloneTitle = `${target.title} (Copy)`;

  const clonedProject: VideoProject = {
    ...JSON.parse(JSON.stringify(target.project)),
    id: cloneId,
    title: cloneTitle,
  };

  const newRecord: SavedProjectRecord = {
    id: cloneId,
    title: cloneTitle,
    createdAt: now,
    updatedAt: now,
    project: clonedProject,
    thumbnailUrl: target.thumbnailUrl,
  };

  const updated = [newRecord, ...existing];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Failed to save duplicated project:', err);
  }

  return newRecord;
}

const DRAFT_KEY = 'shortx_current_active_draft_v1';

export function saveDraftProject(project: VideoProject): void {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(project));
  } catch (err) {
    // ignore
  }
}

export function getDraftProject(): VideoProject | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function exportProjectRecordJson(record: SavedProjectRecord): void {
  try {
    const safeTitle = (record.title || 'project').replace(/[^a-zA-Z0-9_-]/g, '_');
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(record, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute('href', dataStr);
    dlAnchorElem.setAttribute('download', `${safeTitle}-${record.id}.shortx.json`);
    dlAnchorElem.click();
  } catch (err) {
    console.error('Failed to export project:', err);
  }
}

export function importProjectRecordJson(jsonStr: string): SavedProjectRecord {
  try {
    const parsed = JSON.parse(jsonStr);
    const project = parsed.project || parsed;
    if (!project || !project.script) throw new Error('Invalid project file structure');

    const newRecord = saveProjectRecord({
      ...project,
      id: `proj-${Date.now()}`,
      title: (project.title || 'Imported Project') + ' (Imported)',
    }, parsed.thumbnailUrl);

    return newRecord;
  } catch (err) {
    console.error('Failed to import project:', err);
    throw err;
  }
}
