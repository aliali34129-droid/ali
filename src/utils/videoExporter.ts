import { VideoProject, RenderProgress } from '../types';
import { renderCanvasFrame } from './canvasRenderer';
import { createLoopAudioBuffer } from './audioGenerator';

export interface ExportResult {
  videoBlob: Blob;
  videoUrl: string;
  posterBlob: Blob;
  posterUrl: string;
  mimeType: string;
  durationSec: number;
}

export class VideoRendererEngine {
  private abortController: AbortController | null = null;

  public cancel() {
    if (this.abortController) {
      this.abortController.abort();
    }
  }

  public async renderVideo(
    project: VideoProject,
    img: HTMLImageElement | HTMLVideoElement,
    onProgress: (progress: RenderProgress) => void,
    bgImg?: HTMLImageElement | HTMLVideoElement | null
  ): Promise<ExportResult> {
    this.abortController = new AbortController();
    const signal = this.abortController.signal;

    const width = project.resolution === '1080p' ? 1080 : 720;
    const height = project.resolution === '1080p' ? 1920 : 1280;
    const fps = project.fps || 30;
    const duration = Math.max(2, Math.min(10, project.durationSeconds || 8.0));
    const targetDurationMs = duration * 1000;
    const totalFrames = Math.round(duration * fps);

    // Create offscreen canvas for rendering
    const renderCanvas = document.createElement('canvas');
    renderCanvas.width = width;
    renderCanvas.height = height;

    // Render first frame as poster
    renderCanvasFrame(renderCanvas, project, img, 0, bgImg);
    const posterBlob = await new Promise<Blob>((resolve) => {
      renderCanvas.toBlob((b) => resolve(b || new Blob()), 'image/png');
    });
    const posterUrl = URL.createObjectURL(posterBlob);

    // Setup MediaStream from canvas
    const stream = renderCanvas.captureStream(fps);

    // Setup Audio if enabled
    let audioCtx: AudioContext | null = null;
    let audioSourceNode: AudioBufferSourceNode | null = null;

    if (project.audio.enabled && (project.audio.customAudioUrl || (project.audio.ambientTrack && project.audio.ambientTrack !== 'none'))) {
      try {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioCtx = new AudioContextClass();
        if (audioCtx.state === 'suspended') {
          await audioCtx.resume();
        }
        const dest = audioCtx.createMediaStreamDestination();
        
        let audioBuffer: AudioBuffer | null = null;

        if (project.audio.customAudioUrl) {
          const resp = await fetch(project.audio.customAudioUrl);
          const arrayBuffer = await resp.arrayBuffer();
          audioBuffer = await new Promise<AudioBuffer>((resolve, reject) => {
            audioCtx!.decodeAudioData(arrayBuffer.slice(0), resolve, reject);
          });
        } else if (project.audio.ambientTrack && project.audio.ambientTrack !== 'none') {
          audioBuffer = await createLoopAudioBuffer(audioCtx, project.audio.ambientTrack, duration);
        }

        if (audioBuffer) {
          audioSourceNode = audioCtx.createBufferSource();
          audioSourceNode.buffer = audioBuffer;
          audioSourceNode.loop = project.audio.loop ?? true;

          const gainNode = audioCtx.createGain();
          gainNode.gain.value = project.audio.volume ?? 0.7;
          audioSourceNode.connect(gainNode);
          gainNode.connect(dest);

          dest.stream.getAudioTracks().forEach((track) => {
            stream.addTrack(track);
          });
        }
      } catch (err) {
        console.warn('Audio stream setup warning:', err);
      }
    }

    // Determine supported mime type
    const mimeTypes = [
      'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
      'video/mp4',
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
    ];
    let selectedMimeType = 'video/webm';
    for (const mime of mimeTypes) {
      if (MediaRecorder.isTypeSupported(mime)) {
        selectedMimeType = mime;
        break;
      }
    }

    const recordedChunks: Blob[] = [];
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: selectedMimeType,
      videoBitsPerSecond: project.resolution === '1080p' ? 8_000_000 : 4_000_000,
    });

    mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        recordedChunks.push(e.data);
      }
    };

    return new Promise<ExportResult>((resolve, reject) => {
      const startTime = performance.now();
      let animId: number | null = null;
      let timerId: any = null;
      let isCompleted = false;

      const cleanupAndStop = () => {
        if (isCompleted) return;
        isCompleted = true;

        if (animId) cancelAnimationFrame(animId);
        if (timerId) clearTimeout(timerId);

        if (mediaRecorder.state !== 'inactive') {
          mediaRecorder.stop();
        }
      };

      // Strict safety timeout at targetDurationMs + 70ms to ensure recording NEVER exceeds duration
      const safetyTimeout = setTimeout(() => {
        cleanupAndStop();
      }, targetDurationMs + 70);

      mediaRecorder.onstop = () => {
        clearTimeout(safetyTimeout);
        if (animId) cancelAnimationFrame(animId);
        if (timerId) clearTimeout(timerId);

        if (audioSourceNode) {
          try {
            audioSourceNode.stop();
          } catch {
            // ignore
          }
        }
        if (audioCtx) {
          try {
            audioCtx.close();
          } catch {
            // ignore
          }
        }

        // Stop all tracks so media stream doesn't leak into subsequent renders
        stream.getTracks().forEach((track) => {
          try {
            track.stop();
          } catch {
            // ignore
          }
        });

        const videoBlob = new Blob(recordedChunks, { type: selectedMimeType });
        const videoUrl = URL.createObjectURL(videoBlob);

        resolve({
          videoBlob,
          videoUrl,
          posterBlob,
          posterUrl,
          mimeType: selectedMimeType,
          durationSec: duration,
        });
      };

      mediaRecorder.onerror = (e) => {
        clearTimeout(safetyTimeout);
        cleanupAndStop();
        reject(new Error(`Recording failed: ${e}`));
      };

      mediaRecorder.start();
      if (audioSourceNode) {
        try {
          audioSourceNode.start(0);
        } catch (err) {
          console.warn('Could not start audio node:', err);
        }
      }

      // Real-time animation loop synchronized to exact duration
      const tick = () => {
        if (signal.aborted) {
          clearTimeout(safetyTimeout);
          cleanupAndStop();
          reject(new Error('Rendering cancelled by user'));
          return;
        }

        const now = performance.now();
        const elapsedMs = now - startTime;

        if (elapsedMs >= targetDurationMs) {
          // Render final loop-closed frame
          renderCanvasFrame(renderCanvas, project, img, 0, bgImg);

          onProgress({
            isRendering: true,
            currentFrame: totalFrames,
            totalFrames,
            progressPercent: 100,
            timeRemainingSec: 0,
          });

          cleanupAndStop();
          return;
        }

        const normalizedTime = Math.min(1.0, elapsedMs / targetDurationMs);
        renderCanvasFrame(renderCanvas, project, img, normalizedTime, bgImg);

        const currentFrame = Math.min(totalFrames, Math.round((elapsedMs / targetDurationMs) * totalFrames));
        const progressPercent = Math.min(99, Math.round((elapsedMs / targetDurationMs) * 100));
        const timeRemainingSec = Math.max(0, Math.ceil((targetDurationMs - elapsedMs) / 1000));

        onProgress({
          isRendering: true,
          currentFrame,
          totalFrames,
          progressPercent,
          timeRemainingSec,
        });

        if (document.hidden) {
          timerId = setTimeout(tick, 1000 / fps);
        } else {
          animId = requestAnimationFrame(tick);
        }
      };

      animId = requestAnimationFrame(tick);
    });
  }
}
