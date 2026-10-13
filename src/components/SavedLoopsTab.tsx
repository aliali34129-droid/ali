import React, { useState } from 'react';
import { ExportedVideo, SavedProjectRecord, VideoProject } from '../types';
import {
  Download,
  Trash2,
  Film,
  Play,
  Camera,
  FolderKanban,
  Copy,
  Calendar,
  Clock,
  ArrowRight,
  Plus,
  Save,
  Check,
  FileText,
} from 'lucide-react';

interface SavedLoopsTabProps {
  savedVideos: ExportedVideo[];
  savedProjects: SavedProjectRecord[];
  currentProjectId?: string;
  onDeleteVideo: (id: string) => void;
  onLoadProject: (project: VideoProject) => void;
  onDuplicateProject: (id: string) => void;
  onDeleteProject: (id: string) => void;
  onSaveCurrentProject: () => void;
}

export const SavedLoopsTab: React.FC<SavedLoopsTabProps> = ({
  savedVideos,
  savedProjects,
  currentProjectId,
  onDeleteVideo,
  onLoadProject,
  onDuplicateProject,
  onDeleteProject,
  onSaveCurrentProject,
}) => {
  const [activeSubView, setActiveSubView] = useState<'projects' | 'videos'>('projects');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveClick = () => {
    onSaveCurrentProject();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  return (
    <div className="space-y-5">
      {/* View Switcher Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-neutral-950 p-2.5 rounded-xl border border-neutral-800">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveSubView('projects')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSubView === 'projects'
                ? 'bg-rose-600 text-white shadow-md'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
            }`}
          >
            <FolderKanban className="w-3.5 h-3.5" />
            <span>Saved Projects / Drafts ({savedProjects.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubView('videos')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSubView === 'videos'
                ? 'bg-rose-600 text-white shadow-md'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>Exported MP4 Videos ({savedVideos.length})</span>
          </button>
        </div>

        {activeSubView === 'projects' && (
          <button
            type="button"
            onClick={handleSaveClick}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
              saveSuccess
                ? 'bg-emerald-600 text-white'
                : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white'
            }`}
          >
            {saveSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 text-white" />
                <span>Project Saved!</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5 text-rose-400" />
                <span>Save Active Project Now</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* VIEW 1: SAVED PROJECTS & DRAFTS */}
      {activeSubView === 'projects' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-neutral-200">
                Aapke Saved Video Projects ({savedProjects.length})
              </h3>
              <p className="text-[11px] text-neutral-400">
                Jab zaroorat ho, kisi bhi project par click kar ke studio mein reload karein aur naye videos banayein.
              </p>
            </div>
          </div>

          {savedProjects.length === 0 ? (
            <div className="text-center py-16 px-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-3">
              <div className="w-12 h-12 rounded-full bg-neutral-900 text-neutral-500 flex items-center justify-center mx-auto">
                <FolderKanban className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-neutral-200">
                  Abhi tak koi project save nahi hua
                </h4>
                <p className="text-xs text-neutral-400 max-w-sm mx-auto mt-1">
                  Upar <strong>"Save Active Project Now"</strong> par click karein ya header mein Save ka button dabayein taake aapka kaam mehfooz ho jaye.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {savedProjects.map((record) => {
                const isCurrent = record.id === currentProjectId;
                const dateStr = new Date(record.updatedAt || record.createdAt).toLocaleString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <div
                    key={record.id}
                    className={`bg-neutral-950 border rounded-xl p-3.5 space-y-3 flex flex-col justify-between transition-all group ${
                      isCurrent
                        ? 'border-rose-500/80 bg-rose-950/20 ring-1 ring-rose-500/30'
                        : 'border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900/60'
                    }`}
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-start gap-2.5">
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
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-xs font-bold text-neutral-200 group-hover:text-rose-400 transition-colors truncate">
                              {record.title}
                            </h4>
                            {isCurrent && (
                              <span className="px-1.5 py-0.2 rounded bg-rose-600/30 text-rose-300 border border-rose-500/40 text-[9px] font-mono font-bold shrink-0">
                                ACTIVE
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-neutral-400 line-clamp-2 mt-1 leading-snug">
                            {record.project.script.text.substring(0, 75)}...
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-neutral-500 font-mono pt-1 border-t border-neutral-850">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{dateStr}</span>
                        </span>
                        <span>{record.project.durationSeconds || 8}s Loop</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-neutral-800">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onDuplicateProject(record.id)}
                          className="p-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800 rounded-lg transition-colors cursor-pointer"
                          title="Duplicate this project"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteProject(record.id)}
                          className="p-1.5 text-neutral-400 hover:text-rose-400 hover:bg-neutral-900 rounded-lg transition-colors cursor-pointer"
                          title="Delete project"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => onLoadProject(record.project)}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1 cursor-pointer shadow-sm"
                      >
                        <span>Open in Studio</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: EXPORTED VIDEOS */}
      {activeSubView === 'videos' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-neutral-200">
              Generated 8-Second Loop Videos ({savedVideos.length})
            </h3>
            <span className="text-xs text-neutral-400">
              Ready for TikTok, YouTube Shorts & Instagram Reels
            </span>
          </div>

          {savedVideos.length === 0 ? (
            <div className="text-center py-16 px-4 bg-neutral-950 border border-neutral-800 rounded-xl">
              <div className="w-12 h-12 rounded-full bg-neutral-900 text-neutral-500 flex items-center justify-center mx-auto mb-3">
                <Film className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-neutral-200">
                No Exported Video Loops Yet
              </h3>
              <p className="text-xs text-neutral-400 max-w-sm mx-auto mt-1">
                When you click "Create video" in the studio, your rendered seamless loops will appear here for instant preview and download.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedVideos.map((video) => (
                <div
                  key={video.id}
                  className="bg-neutral-950 border border-neutral-800 rounded-xl p-3.5 space-y-3 flex flex-col justify-between"
                >
                  <div className="relative aspect-9/16 max-h-[340px] w-full rounded-lg overflow-hidden bg-black mx-auto">
                    <video
                      src={video.videoUrl}
                      poster={video.posterUrl}
                      controls
                      loop
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-neutral-200 truncate">
                      {video.title}
                    </h4>
                    <div className="flex items-center gap-2 text-[11px] text-neutral-400 mt-1 font-mono">
                      <span>{video.duration}s Loop</span>
                      <span>·</span>
                      <span>{video.resolution}</span>
                      <span>·</span>
                      <span>{(video.sizeBytes / (1024 * 1024)).toFixed(1)} MB</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-neutral-800">
                    <a
                      href={video.videoUrl}
                      download={`${video.title.replace(/[^a-zA-Z0-9]/g, '_')}_8s_loop.mp4`}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Video</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => onDeleteVideo(video.id)}
                      className="p-1.5 text-neutral-400 hover:text-rose-400 hover:bg-neutral-900 rounded-lg transition-colors cursor-pointer"
                      title="Delete from list"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
