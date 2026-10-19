// PCM16 little-endian, mono, 24 kHz. Never acknowledges audio by elapsed wall time.
export function decodePCM(base64) {
  const binary = atob(base64);
  if (!binary.length || binary.length % 2) throw new Error('Invalid PCM audio chunk');
  const samples = new Float32Array(binary.length / 2);
  for (let i = 0; i < samples.length; i++) {
    let n = binary.charCodeAt(i * 2) | (binary.charCodeAt(i * 2 + 1) << 8);
    if (n >= 32768) n -= 65536;
    samples[i] = n / 32768;
  }
  return samples;
}
export function recordingType(Recorder) {
  return ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm', 'audio/ogg;codecs=opus']
    .find(type => Recorder.isTypeSupported(type)) || '';
}
export class PCMPlayer {
  constructor(context) { this.context = context; this.sources = new Map(); this.next = 0; this.pending = []; this.cancelled = false; }
  append(base64) {
    if (this.cancelled) throw new Error('Playback interrupted');
    const samples = decodePCM(base64);
    const buffer = this.context.createBuffer(1, samples.length, 24000);
    buffer.copyToChannel(samples, 0);
    const source = this.context.createBufferSource(); source.buffer = buffer;
    source.connect(this.context.destination);
    const played = new Promise(resolve => {
      this.sources.set(source, resolve);
      source.onended = () => { source.disconnect(); this.sources.delete(source); resolve(!this.cancelled); };
    });
    this.pending.push(played);
    const start = Math.max(this.context.currentTime + 0.015, this.next);
    this.next = start + buffer.duration;
    source.start(start);
  }
  async drain() { return this.pending.length > 0 && (await Promise.all(this.pending)).every(Boolean) && !this.cancelled; }
  stop() {
    this.cancelled = true;
    for (const [source, resolve] of this.sources) {
      source.onended = null;
      try { source.stop(); source.disconnect(); } catch {}
      resolve(false);
    }
    this.sources.clear();
  }
}
