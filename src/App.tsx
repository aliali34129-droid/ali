import React, { useState, useEffect } from 'react';
import { VideoProject, ExportedVideo, SavedUserTemplate } from './types';
import { PRESET_PROJECTS } from './utils/presets';
import { ThemeId, STUDIO_THEMES, DEFAULT_THEME_ID, getTheme } from './utils/themes';
import { TopNav } from './components/TopNav';
import { ScriptTab } from './components/ScriptTab';
import { AddMediaTab } from './components/AddMediaTab';
import { AdjustPictureTab } from './components/AdjustPictureTab';
import { BackgroundSoundTab } from './components/BackgroundSoundTab';
import { DesignPreview } from './components/DesignPreview';
import { CreateVideoModal } from './components/CreateVideoModal';
import { SavedLoopsTab } from './components/SavedLoopsTab';
import { ImageCropModal } from './components/ImageCropModal';
import { ProjectsManagerModal } from './components/ProjectsManagerModal';
import { SavePresetModal } from './components/SavePresetModal';
import {
  getSavedProjects,
  saveProjectRecord,
  saveDraftProject,
  getDraftProject,
  deleteProjectRecord,
  duplicateProjectRecord,
} from './utils/projectStorage';
import {
  getUserTemplates,
  getDefaultUserTemplate,
} from './utils/userTemplates';
import {
  FileText,
  Image as ImageIcon,
  Sliders,
  Music,
  Bookmark,
  FolderKanban,
  Save,
  Check,
  Sparkles,
} from 'lucide-react';

export default function App() {
  const [project, setProject] = useState<VideoProject>(() => {
    // 1. Try restoring active draft if available
    try {
      const draft = getDraftProject();
      if (draft && draft.script && draft.adjust) {
        return draft;
      }
    } catch {}

    // 2. Try applying user's default template if set
    try {
      const defTmpl = getDefaultUserTemplate();
      if (defTmpl) {
        return {
          ...PRESET_PROJECTS[0],
          id: `proj-${Date.now()}`,
          title: `Project (${defTmpl.name})`,
          durationSeconds: defTmpl.durationSeconds || 8,
          script: {
            ...PRESET_PROJECTS[0].script,
            ...defTmpl.script,
          },
          adjust: {
            ...PRESET_PROJECTS[0].adjust,
            ...defTmpl.adjust,
          },
          audio: {
            ...PRESET_PROJECTS[0].audio,
            ...defTmpl.audio,
          },
        };
      }
    } catch {}

    return PRESET_PROJECTS[0];
  });

  const [loadedMedia, setLoadedMedia] = useState<HTMLImageElement | HTMLVideoElement | null>(null);
  const [loadedBgMedia, setLoadedBgMedia] = useState<HTMLImageElement | HTMLVideoElement | null>(null);
  const [activeTopTab, setActiveTopTab] = useState<'create' | 'export' | 'history'>('create');
  const [workspaceSubTab, setWorkspaceSubTab] = useState<'script' | 'media' | 'adjust' | 'sound'>('script');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isProjectsModalOpen, setIsProjectsModalOpen] = useState(false);
  const [isPresetModalOpen, setIsPresetModalOpen] = useState(false);
  const [savedVideos, setSavedVideos] = useState<ExportedVideo[]>([]);
  const [projectsCount, setProjectsCount] = useState<number>(() => getSavedProjects().length);
  const [templatesCount, setTemplatesCount] = useState<number>(() => getUserTemplates().length);
  const [saveNotification, setSaveNotification] = useState<string | null>(null);

  const [cropModalTarget, setCropModalTarget] = useState<{
    isOpen: boolean;
    url: string;
    name: string;
  } | null>(null);

  // Studio Theme State with localStorage persistence
  const [themeId, setThemeId] = useState<ThemeId>(() => {
    try {
      const saved = localStorage.getItem('shortx_studio_theme');
      if (saved && STUDIO_THEMES.some((t) => t.id === saved)) {
        return saved as ThemeId;
      }
    } catch {}
    return DEFAULT_THEME_ID;
  });

  const activeTheme = getTheme(themeId);

  const handleSelectTheme = (newId: ThemeId) => {
    setThemeId(newId);
    try {
      localStorage.setItem('shortx_studio_theme', newId);
    } catch {}
  };

  // Load foreground media whenever project.mediaUrl changes
  useEffect(() => {
    if (!project.mediaUrl) {
      setLoadedMedia(null);
      return;
    }

    if (project.mediaType === 'video') {
      const video = document.createElement('video');
      video.src = project.mediaUrl;
      video.crossOrigin = 'anonymous';
      video.muted = true;
      video.loop = true;
      video.onloadeddata = () => {
        video.play();
        setLoadedMedia(video);
      };
    } else {
      const img = new Image();
      if (project.mediaUrl.startsWith('http://') || project.mediaUrl.startsWith('https://')) {
        img.crossOrigin = 'anonymous';
      }
      img.onload = () => {
        setLoadedMedia(img);
      };
      img.onerror = () => {
        console.warn('Failed to load image at', project.mediaUrl);
        setLoadedMedia(null);
      };
      img.src = project.mediaUrl;
    }
  }, [project.mediaUrl, project.mediaType]);

  // Load custom background media whenever project.adjust.bgCustomUrl changes
  useEffect(() => {
    if (!project.adjust.bgCustomUrl) {
      setLoadedBgMedia(null);
      return;
    }

    const isVideo = project.adjust.bgCustomUrl.includes('.mp4') || project.adjust.bgCustomUrl.startsWith('data:video');
    if (isVideo) {
      const video = document.createElement('video');
      video.src = project.adjust.bgCustomUrl;
      video.crossOrigin = 'anonymous';
      video.muted = true;
      video.loop = true;
      video.onloadeddata = () => {
        video.play();
        setLoadedBgMedia(video);
      };
    } else {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        setLoadedBgMedia(img);
      };
      img.onerror = () => {
        console.warn('Failed to load custom background at', project.adjust.bgCustomUrl);
      };
      img.src = project.adjust.bgCustomUrl;
    }
  }, [project.adjust.bgCustomUrl]);

  const handleLoadPreset = (presetId: string) => {
    const found = PRESET_PROJECTS.find((p) => p.id === presetId);
    if (found) {
      setProject({ ...found });
    }
  };

  const handleSelectMedia = (url: string, name: string, type: 'image' | 'video') => {
    setProject((prev) => ({
      ...prev,
      mediaUrl: url,
      mediaName: name,
      mediaType: type,
    }));
  };

  const handleSaveExport = (exported: ExportedVideo) => {
    setSavedVideos((prev) => [exported, ...prev]);
  };

  const handleDeleteExport = (id: string) => {
    setSavedVideos((prev) => prev.filter((v) => v.id !== id));
  };

  // Quick zoom step handler
  const handleZoomStep = (delta: number) => {
    setProject((prev) => {
      const newScale = Math.min(2.5, Math.max(0.4, Number((prev.adjust.scale + delta).toFixed(2))));
      return {
        ...prev,
        adjust: { ...prev.adjust, scale: newScale },
      };
    });
  };

  // Save current project manually (or via Ctrl+S)
  const handleSaveCurrentProject = () => {
    try {
      saveProjectRecord(project);
      setProjectsCount(getSavedProjects().length);
      setSaveNotification('Project successfully saved to drafts!');
      setTimeout(() => setSaveNotification(null), 2500);
    } catch (err) {
      console.warn('Failed to save project:', err);
    }
  };

  // Apply a saved template / preset
  const handleApplyUserTemplate = (template: SavedUserTemplate) => {
    setProject((prev) => ({
      ...prev,
      durationSeconds: template.durationSeconds || prev.durationSeconds,
      script: {
        ...prev.script,
        ...template.script,
        // Preserve current script text while applying styles
        text: prev.script.text,
      },
      adjust: {
        ...prev.adjust,
        ...template.adjust,
      },
      audio: {
        ...prev.audio,
        ...template.audio,
      },
    }));
    setTemplatesCount(getUserTemplates().length);
    setSaveNotification(`Applied template "${template.name}"!`);
    setTimeout(() => setSaveNotification(null), 2500);
  };

  // Start new project
  const handleStartNewProject = () => {
    const defTmpl = getDefaultUserTemplate();
    const newId = `proj-${Date.now()}`;
    if (defTmpl) {
      setProject({
        ...PRESET_PROJECTS[0],
        id: newId,
        title: 'New Video Project',
        durationSeconds: defTmpl.durationSeconds || 8,
        script: {
          ...PRESET_PROJECTS[0].script,
          ...defTmpl.script,
        },
        adjust: {
          ...PRESET_PROJECTS[0].adjust,
          ...defTmpl.adjust,
        },
        audio: {
          ...PRESET_PROJECTS[0].audio,
          ...defTmpl.audio,
        },
      });
    } else {
      setProject({
        ...PRESET_PROJECTS[0],
        id: newId,
        title: 'New Video Project',
      });
    }
    setSaveNotification('Created new project!');
    setTimeout(() => setSaveNotification(null), 2500);
  };

  // Auto-save draft debounced
  useEffect(() => {
    const timer = setTimeout(() => {
      saveDraftProject(project);
    }, 1200);
    return () => clearTimeout(timer);
  }, [project]);

  // Global Ctrl+S / Cmd+S save hotkey
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSaveCurrentProject();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [project]);

  return (
    <div className={`min-h-screen ${activeTheme.rootBg} ${activeTheme.mainText} flex flex-col font-sans transition-colors duration-200 selection:bg-rose-600 selection:text-white`}>
      {/* Top Header Navigation */}
      <TopNav
        title={project.title}
        onTitleChange={(newTitle) =>
          setProject((prev) => ({ ...prev, title: newTitle }))
        }
        activeTab={activeTopTab}
        onTabChange={(tab) => {
          setActiveTopTab(tab);
          if (tab === 'export') {
            setIsCreateModalOpen(true);
          }
        }}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
        onOpenProjectsModal={() => {
          setProjectsCount(getSavedProjects().length);
          setIsProjectsModalOpen(true);
        }}
        onOpenPresetModal={() => {
          setTemplatesCount(getUserTemplates().length);
          setIsPresetModalOpen(true);
        }}
        onSaveProject={handleSaveCurrentProject}
        projectsCount={projectsCount}
        savedCount={savedVideos.length}
        activeTheme={activeTheme}
        onSelectTheme={handleSelectTheme}
      />

      {/* Main Studio Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6">
        {activeTopTab === 'history' ? (
          <SavedLoopsTab
            savedVideos={savedVideos}
            savedProjects={getSavedProjects()}
            currentProjectId={project.id}
            onDeleteVideo={handleDeleteExport}
            onLoadProject={(loaded) => {
              setProject(loaded);
              setActiveTopTab('create');
              setSaveNotification(`Loaded project "${loaded.title}"!`);
              setTimeout(() => setSaveNotification(null), 2500);
            }}
            onDuplicateProject={(id) => {
              duplicateProjectRecord(id);
              setProjectsCount(getSavedProjects().length);
            }}
            onDeleteProject={(id) => {
              deleteProjectRecord(id);
              setProjectsCount(getSavedProjects().length);
            }}
            onSaveCurrentProject={handleSaveCurrentProject}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: YOUR WORKSPACE - Make your video */}
            <div className={`lg:col-span-7 ${activeTheme.cardBg} border ${activeTheme.cardBorder} rounded-xl p-5 shadow-sm space-y-5 transition-colors duration-200`}>
              {/* Workspace Header */}
              <div className={`flex flex-col sm:flex-row sm:items-center justify-between border-b ${activeTheme.cardBorder} pb-3 gap-2.5`}>
                <div>
                  <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                    Your Workspace
                  </div>
                  <h1 className={`text-base md:text-lg font-bold ${activeTheme.mainText}`}>
                    Make your video
                  </h1>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={handleSaveCurrentProject}
                    className="px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-700 hover:border-neutral-600 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-sm"
                    title="Save current project (Ctrl+S)"
                  >
                    <Save className="w-3.5 h-3.5 text-rose-500" />
                    <span>Save Project</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setProjectsCount(getSavedProjects().length);
                      setIsProjectsModalOpen(true);
                    }}
                    className="px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer"
                    title="View saved projects & drafts"
                  >
                    <FolderKanban className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Projects ({projectsCount})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setTemplatesCount(getUserTemplates().length);
                      setIsPresetModalOpen(true);
                    }}
                    className="px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer"
                    title="Save or load settings preset"
                  >
                    <Bookmark className="w-3.5 h-3.5 text-amber-400" />
                    <span>Presets ({templatesCount})</span>
                  </button>
                </div>
              </div>

              {saveNotification && (
                <div className="p-2.5 bg-emerald-950/90 border border-emerald-700 text-emerald-200 text-xs font-semibold rounded-xl flex items-center gap-2 animate-in fade-in shadow-md">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{saveNotification}</span>
                </div>
              )}

              {/* 4 Workspace Categories (Extra Bold, Prominent & Distinctive Studio Tabs) */}
              <div className={`flex items-center border-b ${activeTheme.cardBorder} gap-2 sm:gap-3 overflow-x-auto pb-1 scrollbar-none`}>
                <button
                  type="button"
                  onClick={() => setWorkspaceSubTab('script')}
                  className={`pb-3 pt-2 px-3 sm:px-4 text-xs sm:text-sm font-black flex items-center gap-2.5 transition-all cursor-pointer border-b-4 rounded-t-xl shrink-0 ${
                    workspaceSubTab === 'script'
                      ? `${activeTheme.accentBorder} text-white bg-neutral-800/80 shadow-md ring-1 ring-white/10`
                      : 'border-transparent text-neutral-400 hover:text-white hover:bg-neutral-800/40'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[11px] font-black ${
                    workspaceSubTab === 'script' ? 'bg-rose-600 text-white shadow-sm' : 'bg-neutral-800 text-neutral-400'
                  }`}>
                    1
                  </span>
                  <FileText className={`w-4 h-4 ${workspaceSubTab === 'script' ? activeTheme.accentText : 'text-neutral-400'}`} />
                  <span className="tracking-wide uppercase font-black text-xs sm:text-sm">SCRIPT</span>
                </button>

                <button
                  type="button"
                  onClick={() => setWorkspaceSubTab('media')}
                  className={`pb-3 pt-2 px-3 sm:px-4 text-xs sm:text-sm font-black flex items-center gap-2.5 transition-all cursor-pointer border-b-4 rounded-t-xl shrink-0 ${
                    workspaceSubTab === 'media'
                      ? `${activeTheme.accentBorder} text-white bg-neutral-800/80 shadow-md ring-1 ring-white/10`
                      : 'border-transparent text-neutral-400 hover:text-white hover:bg-neutral-800/40'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[11px] font-black ${
                    workspaceSubTab === 'media' ? 'bg-rose-600 text-white shadow-sm' : 'bg-neutral-800 text-neutral-400'
                  }`}>
                    2
                  </span>
                  <ImageIcon className={`w-4 h-4 ${workspaceSubTab === 'media' ? activeTheme.accentText : 'text-neutral-400'}`} />
                  <span className="tracking-wide uppercase font-black text-xs sm:text-sm">ADD MEDIA</span>
                  <span className="text-[10px] bg-neutral-700/90 font-mono text-neutral-200 px-1.5 py-0.2 rounded-full font-black">
                    {project.mediaUrl ? '✓' : '1'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setWorkspaceSubTab('adjust')}
                  className={`pb-3 pt-2 px-3 sm:px-4 text-xs sm:text-sm font-black flex items-center gap-2.5 transition-all cursor-pointer border-b-4 rounded-t-xl shrink-0 ${
                    workspaceSubTab === 'adjust'
                      ? `${activeTheme.accentBorder} text-white bg-neutral-800/80 shadow-md ring-1 ring-white/10`
                      : 'border-transparent text-neutral-400 hover:text-white hover:bg-neutral-800/40'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[11px] font-black ${
                    workspaceSubTab === 'adjust' ? 'bg-rose-600 text-white shadow-sm' : 'bg-neutral-800 text-neutral-400'
                  }`}>
                    3
                  </span>
                  <Sliders className={`w-4 h-4 ${workspaceSubTab === 'adjust' ? activeTheme.accentText : 'text-neutral-400'}`} />
                  <span className="tracking-wide uppercase font-black text-xs sm:text-sm">ADJUST PICTURE</span>
                </button>

                <button
                  type="button"
                  onClick={() => setWorkspaceSubTab('sound')}
                  className={`pb-3 pt-2 px-3 sm:px-4 text-xs sm:text-sm font-black flex items-center gap-2.5 transition-all cursor-pointer border-b-4 rounded-t-xl shrink-0 ${
                    workspaceSubTab === 'sound'
                      ? `${activeTheme.accentBorder} text-white bg-neutral-800/80 shadow-md ring-1 ring-white/10`
                      : 'border-transparent text-neutral-400 hover:text-white hover:bg-neutral-800/40'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[11px] font-black ${
                    workspaceSubTab === 'sound' ? 'bg-rose-600 text-white shadow-sm' : 'bg-neutral-800 text-neutral-400'
                  }`}>
                    4
                  </span>
                  <Music className={`w-4 h-4 ${workspaceSubTab === 'sound' ? activeTheme.accentText : 'text-neutral-400'}`} />
                  <span className="tracking-wide uppercase font-black text-xs sm:text-sm">BACKGROUND MUSIC</span>
                  {project.audio.enabled && (
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shadow-sm shadow-rose-500" />
                  )}
                </button>
              </div>

              {/* Active Tab Body */}
              <div className="pt-1">
                {workspaceSubTab === 'script' && (
                  <ScriptTab
                    script={project.script}
                    onChange={(updated) =>
                      setProject((prev) => ({
                        ...prev,
                        script: { ...prev.script, ...updated },
                      }))
                    }
                    onNext={() => setWorkspaceSubTab('media')}
                    onLoadPreset={handleLoadPreset}
                    onOpenSavePresetModal={() => {
                      setTemplatesCount(getUserTemplates().length);
                      setIsPresetModalOpen(true);
                    }}
                  />
                )}

                {workspaceSubTab === 'media' && (
                  <AddMediaTab
                    currentMediaUrl={project.mediaUrl}
                    currentMediaName={project.mediaName}
                    customBgUrl={project.adjust.bgCustomUrl}
                    onSelectMedia={handleSelectMedia}
                    onSelectCustomBg={(url, name) => {
                      if (url) {
                        setProject((prev) => ({
                          ...prev,
                          adjust: {
                            ...prev.adjust,
                            bgSource: 'custom',
                            bgCustomUrl: url,
                            bgCustomName: name,
                          },
                        }));
                      } else {
                        setProject((prev) => ({
                          ...prev,
                          adjust: {
                            ...prev.adjust,
                            bgSource: 'auto',
                            bgCustomUrl: undefined,
                            bgCustomName: undefined,
                          },
                        }));
                      }
                    }}
                    onNext={() => setWorkspaceSubTab('adjust')}
                  />
                )}

                {workspaceSubTab === 'adjust' && (
                  <AdjustPictureTab
                    adjust={project.adjust}
                    onChange={(updated) =>
                      setProject((prev) => ({
                        ...prev,
                        adjust: { ...prev.adjust, ...updated },
                      }))
                    }
                    onNextToSound={() => setWorkspaceSubTab('sound')}
                    onPreviewAndCreate={() => setIsCreateModalOpen(true)}
                    onOpenCrop={() =>
                      project.mediaUrl &&
                      setCropModalTarget({
                        isOpen: true,
                        url: project.mediaUrl,
                        name: project.mediaName || 'photo.jpg',
                      })
                    }
                    onOpenSavePresetModal={() => {
                      setTemplatesCount(getUserTemplates().length);
                      setIsPresetModalOpen(true);
                    }}
                  />
                )}

                {workspaceSubTab === 'sound' && (
                  <BackgroundSoundTab
                    audio={project.audio}
                    onChange={(updated) =>
                      setProject((prev) => ({
                        ...prev,
                        audio: { ...prev.audio, ...updated },
                      }))
                    }
                    onPreviewAndCreate={() => setIsCreateModalOpen(true)}
                  />
                )}
              </div>
            </div>

            {/* Right Column: Design Preview (9:16 Canvas & Controls) */}
            <div className="lg:col-span-5 sticky top-20">
              <DesignPreview
                project={project}
                loadedMedia={loadedMedia}
                loadedBgMedia={loadedBgMedia}
                onOpenCreateModal={() => setIsCreateModalOpen(true)}
                onZoomStep={handleZoomStep}
                onUpdateDuration={(sec) =>
                  setProject((prev) => ({ ...prev, durationSeconds: sec }))
                }
                onUpdateAdjust={(updated) =>
                  setProject((prev) => ({
                    ...prev,
                    adjust: { ...prev.adjust, ...updated },
                  }))
                }
                onUpdateScript={(updated) =>
                  setProject((prev) => ({
                    ...prev,
                    script: { ...prev.script, ...updated },
                  }))
                }
              />
            </div>
          </div>
        )}
      </main>

      {/* Create Video Export Modal (Matching Screenshot 2) */}
      <CreateVideoModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        project={project}
        loadedMedia={loadedMedia}
        loadedBgMedia={loadedBgMedia}
        onSaveExport={handleSaveExport}
        onUpdateDuration={(sec) =>
          setProject((prev) => ({ ...prev, durationSeconds: sec }))
        }
        onUpdateResolution={(res) =>
          setProject((prev) => ({ ...prev, resolution: res }))
        }
        onOpenSoundTab={() => {
          setActiveTopTab('create');
          setWorkspaceSubTab('sound');
        }}
        onUpdateAudio={(audioUpdate) =>
          setProject((prev) => ({
            ...prev,
            audio: { ...prev.audio, ...audioUpdate },
          }))
        }
      />

      {/* Global Image Crop Modal for Cropping Active Media */}
      {cropModalTarget && (
        <ImageCropModal
          isOpen={cropModalTarget.isOpen}
          imageUrl={cropModalTarget.url}
          imageName={cropModalTarget.name}
          onClose={() => setCropModalTarget(null)}
          onApplyCrop={(croppedUrl, croppedName) => {
            setProject((prev) => ({
              ...prev,
              mediaUrl: croppedUrl,
              mediaName: croppedName,
              mediaType: 'image',
            }));
            setCropModalTarget(null);
          }}
        />
      )}

      {/* Projects & Drafts Manager Modal */}
      <ProjectsManagerModal
        isOpen={isProjectsModalOpen}
        currentProject={project}
        onLoadProject={(loadedProj) => {
          setProject(loadedProj);
          setSaveNotification(`Loaded project "${loadedProj.title}"!`);
          setTimeout(() => setSaveNotification(null), 2500);
        }}
        onSaveCurrent={handleSaveCurrentProject}
        onStartNewProject={handleStartNewProject}
        onClose={() => setIsProjectsModalOpen(false)}
      />

      {/* Save & Load Settings Preset Modal */}
      <SavePresetModal
        isOpen={isPresetModalOpen}
        project={project}
        onApplyTemplate={handleApplyUserTemplate}
        onClose={() => setIsPresetModalOpen(false)}
      />
    </div>
  );
}
