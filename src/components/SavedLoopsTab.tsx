import React from 'react';
import { ExportedVideo } from '../types';
import { Download, Trash2, Film, Play, Camera } from 'lucide-react';

interface SavedLoopsTabProps {
  savedVideos: ExportedVideo[];
  onDeleteVideo: (id: string) => void;
  onSelectForEdit?: (video: ExportedVideo) => void;
}

export const SavedLoopsTab: React.FC<SavedLoopsTabProps> = ({
  savedVideos,
  onDeleteVideo,
}) => {
  if (savedVideos.length === 0) {
    return (
      <div className="text-center py-16 px-4 bg-neutral-900 border border-neutral-800 rounded-xl">
        <div className="w-12 h-12 rounded-full bg-neutral-800 text-neutral-400 flex items-center justify-center mx-auto mb-3">
          <Film className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-semibold text-neutral-200">
          No Saved Video Loops Yet
        </h3>
        <p className="text-xs text-neutral-400 max-w-sm mx-auto mt-1">
          When you click "Create video" in the studio, your rendered 8-second seamless loops will appear here for instant preview and download.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-neutral-200">
          Generated 8-Second Loop Videos ({savedVideos.length})
        </h3>
        <span className="text-xs text-neutral-400">
          Ready for TikTok, YouTube Shorts & Instagram Reels
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {savedVideos.map((video) => (
          <div
            key={video.id}
            className="bg-neutral-900 border border-neutral-800 rounded-xl p-3.5 space-y-3 flex flex-col justify-between"
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
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Video</span>
              </a>

              <button
                type="button"
                onClick={() => onDeleteVideo(video.id)}
                className="p-1.5 text-neutral-400 hover:text-rose-400 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
                title="Delete from list"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
