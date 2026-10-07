import React, { useState, useEffect, useRef } from 'react';
import { VideoProject, SavedProjectRecord } from '../types';
import {
  getSavedProjects,
  saveProjectRecord,
  deleteProjectRecord,
  duplicateProjectRecord,
  exportProjectRecordJson,
  importProjectRecordJson,
} from '../utils/projectStorage';
import {
  FolderKanban,
  Plus,
  Play,
  Copy,
  Trash2,
  Calendar,
  Clock,
  Sparkles,
  X,
  Search,
  Check,
  FileText,
  ArrowRight,
  Download,
  Upload,
} from 'lucide-react';

interface ProjectsManagerModalProps {
  isOpen: boolean;
  currentProject: VideoProject;
  onLoadProject: (project: VideoProject) => void;
  onSaveCurrent: () => void;
  onStartNewProject?: () => void;
  onClose: () => void;
}

export const ProjectsManagerModal: React.FC<ProjectsManagerModalProps> = ({
  isOpen,
  currentProject,
  onLoadProject,
  onSaveCurrent,
  onStartNewProject,
  onClose,
}) => {
  const [projects, setProjects] = useState<SavedProjectRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setProjects(getSavedProjects());
      setSaveToast(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveCurrentNow = () => {
    onSaveCurrent();
    const updated = getSavedProjects();
    setProjects(updated);
    setSaveToast('Current project successfully saved!');
    setTimeout(() => setSaveToast(null), 2500);
  };

  const handleImportProjectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const newRecord = importProjectRecordJson(content);
        const updated = getSavedProjects();
        setProjects(updated);
        setSaveToast(`Project "${newRecord.title}" successfully imported!`);
        setTimeout(() => setSaveToast(null), 3000);
      } catch (err) {
        alert('Could not import project: invalid JSON structure');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExportProject = (record: SavedProjectRecord, e: React.MouseEvent) => {
    e.stopPropagation();
    exportProjectRecordJson(record);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this saved project?')) {
      const updated = deleteProjectRecord(id);
      setProjects(updated);
    }
  };

  const handleDuplicate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const cloned = duplicateProjectRecord(id);
    if (cloned) {
      setProjects(getSavedProjects());
      setSaveToast(`Project duplicated as "${cloned.title}"!`);
      setTimeout(() => setSaveToast(null), 2500);
    }
  };

  const handleSelect = (record: SavedProjectRecord) => {
    onLoadProject(record.project);
    onClose();
  };

  const filteredProjects = projects.filter((p) =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-rose-600 flex items-center justify-center text-white shadow-md">
              <FolderKanban className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Saved Projects & Drafts</span>
                <span className="text-[10px] bg-neutral-800 text-neutral-300 font-mono px-2 py-0.5 rounded-full font-semibold">
                  {projects.length} Saved
                </span>
              </h3>
              <p className="text-[11px] text-neutral-400">
                Aapke tamam projects yahan mehfooz hain. Kisi bhi project par click kar ke dobara continue karein.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              ref={importInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleImportProjectFile}
              className="hidden"
            />

            {onStartNewProject && (
              <button
                type="button"
                onClick={() => {
                  onStartNewProject();
                  onClose();
                }}
                className="px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white font-medium text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-1 border border-neutral-700"
                title="Start a fresh blank project"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-400" />
                <span>New Project</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => importInputRef.current?.click()}
              className="px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white font-medium text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-1 border border-neutral-700"
              title="Import project from .json file"
            >
              <Upload className="w-3.5 h-3.5 text-neutral-400" />
              <span>Import JSON</span>
            </button>

            <button
              type="button"
              onClick={handleSaveCurrentNow}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <span>Save Current</span>
              <Check className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {saveToast && (
          <div className="p-2.5 bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs font-semibold rounded-lg flex items-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{saveToast}</span>
          </div>
        )}

        {/* Search bar */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects by title..."
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-rose-500"
            />
          </div>
          <span className="text-[11px] text-neutral-500 font-mono">
            {filteredProjects.length} of {projects.length}
          </span>
        </div>

        {/* Projects Cards Grid */}
        <div className="max-h-[50vh] overflow-y-auto space-y-2.5 pr-1">
          {projects.length === 0 ? (
            <div className="text-center py-12 px-4 bg-neutral-950/60 rounded-xl border border-neutral-800">
              <FolderKanban className="w-10 h-10 text-neutral-600 mx-auto mb-2" />
              <div className="text-xs font-semibold text-neutral-300">
                Abhi tak koi project save nahi kiya gaya
              </div>
              <p className="text-[11px] text-neutral-500 mt-1 max-w-sm mx-auto">
                Upar <strong>"Save Current Project"</strong> par click karein taake aapka active video project drafts mein mehfooz ho jaye.
              </p>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="text-center py-8 text-xs text-neutral-500">
              "{searchQuery}" se match karta koi project nahi mila.
            </div>
          ) : (
            filteredProjects.map((record) => {
              const isCurrent = record.id === currentProject.id;
              const dateStr = new Date(record.updatedAt || record.createdAt).toLocaleString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={record.id}
                  onClick={() => handleSelect(record)}
                  className={`p-3.5 bg-neutral-950 border rounded-xl transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group hover:scale-[1.01] ${
                    isCurrent
                      ? 'border-rose-500/80 bg-rose-950/20 ring-1 ring-rose-500/30'
                      : 'border-neutral-800 hover:border-neutral-700 hover:bg-neutral-850'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    {/* Thumbnail or Project Icon */}
                    <div className="w-12 h-16 rounded-lg bg-neutral-900 border border-neutral-800 overflow-hidden shrink-0 flex items-center justify-center relative shadow-sm">
                      {record.thumbnailUrl ? (
                        <img
                          src={record.thumbnailUrl}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : record.project.mediaUrl ? (
                        <img
                          src={record.project.mediaUrl}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <FileText className="w-5 h-5 text-neutral-500" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-neutral-200 group-hover:text-rose-400 transition-colors truncate">
                          {record.title}
                        </h4>
                        {isCurrent && (
                          <span className="px-1.5 py-0.2 rounded bg-rose-600/30 text-rose-300 border border-rose-500/40 text-[9px] font-mono font-bold shrink-0">
                            CURRENT
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-neutral-400 line-clamp-1 mt-0.5">
                        {record.project.script.text.substring(0, 80)}...
                      </div>

                      <div className="flex items-center gap-3 text-[10px] text-neutral-500 font-mono mt-1.5">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{dateStr}</span>
                        </span>
                        <span>·</span>
                        <span>{record.project.durationSeconds || 8}s Loop</span>
                        <span>·</span>
                        <span>Font: {record.project.script.fontFamily || 'rubik'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={(e) => handleExportProject(record, e)}
                      className="p-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800 rounded-lg transition-colors cursor-pointer"
                      title="Download project as .json backup"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleDuplicate(record.id, e)}
                      className="p-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800 rounded-lg transition-colors cursor-pointer"
                      title="Duplicate project"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleDelete(record.id, e)}
                      className="p-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-rose-400 border border-neutral-800 rounded-lg transition-colors cursor-pointer"
                      title="Delete project"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelect(record)}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-sm"
                    >
                      <span>Open in Studio</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
