/**
 * Generates an 8-second seamless looping ambient audio buffer using Web Audio API
 */
export async function createLoopAudioBuffer(
  audioCtx: AudioContext,
  trackType: 'cinematic-pulse' | 'subtle-mystery' | 'vintage-warmth',
  durationSec: number = 8.0
): Promise<AudioBuffer> {
  const sampleRate = audioCtx.sampleRate;
  const totalSamples = Math.floor(sampleRate * durationSec);
  const buffer = audioCtx.createBuffer(2, totalSamples, sampleRate);
  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);

  const baseFreq = trackType === 'cinematic-pulse' ? 55 : trackType === 'subtle-mystery' ? 65.41 : 48.99; // A1, C2, G1

  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    const progress = (t % durationSec) / durationSec; // 0.0 to 1.0

    // Modulating envelope that seamlessly connects at loop points
    const envelope = 0.7 + 0.3 * Math.sin(progress * Math.PI * 2);

    let sampleL = 0;
    let sampleR = 0;

    if (trackType === 'cinematic-pulse') {
      // Warm low drone with rhythmic sub pulse
      const sub = Math.sin(2 * Math.PI * baseFreq * t);
      const subHarmonic = 0.5 * Math.sin(2 * Math.PI * (baseFreq * 1.5) * t);
      const pulse = Math.pow(Math.max(0, Math.sin(progress * Math.PI * 4)), 3); // 2 pulses per loop
      sampleL = (sub + subHarmonic * 0.4) * envelope * (0.6 + pulse * 0.4);
      sampleR = (sub * 0.9 + subHarmonic * 0.5) * envelope * (0.6 + pulse * 0.4);
    } else if (trackType === 'subtle-mystery') {
      // Ethereal fifth chord shimmer
      const f1 = Math.sin(2 * Math.PI * baseFreq * t);
      const f2 = Math.sin(2 * Math.PI * (baseFreq * 1.4983) * t) * 0.4;
      const f3 = Math.sin(2 * Math.PI * (baseFreq * 2.0) * t) * 0.2;
      const pan = Math.sin(progress * Math.PI * 2);
      sampleL = (f1 + f2 * (1 + pan * 0.3) + f3) * envelope * 0.6;
      sampleR = (f1 + f2 * (1 - pan * 0.3) + f3) * envelope * 0.6;
    } else {
      // Vintage vinyl-like tape warmth
      const warmth = Math.sin(2 * Math.PI * baseFreq * t) + 0.3 * Math.sin(2 * Math.PI * baseFreq * 2 * t);
      const tapeNoise = (Math.random() * 2 - 1) * 0.015;
      sampleL = (warmth * 0.7 + tapeNoise) * envelope;
      sampleR = (warmth * 0.7 - tapeNoise) * envelope;
    }

    left[i] = sampleL * 0.25;
    right[i] = sampleR * 0.25;
  }

  return buffer;
}
