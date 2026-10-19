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

// Canonical 44-byte WAV envelope: PCM16LE, mono, 16 kHz, at most 30 seconds.
export function encodeRecordingWav(samples) {
  if (!samples?.length || samples.length > 480000) throw new Error('Recording must be between 0 and 30 seconds');
  const bytes = new ArrayBuffer(44 + samples.length * 2), view = new DataView(bytes);
  const tag = (offset, text) => { for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i)); };
  tag(0,'RIFF'); view.setUint32(4,36 + samples.length * 2,true); tag(8,'WAVE'); tag(12,'fmt ');
  view.setUint32(16,16,true); view.setUint16(20,1,true); view.setUint16(22,1,true);
  view.setUint32(24,16000,true); view.setUint32(28,32000,true); view.setUint16(32,2,true); view.setUint16(34,16,true);
  tag(36,'data'); view.setUint32(40,samples.length * 2,true);
  for (let i=0;i<samples.length;i++) {
    if (!Number.isFinite(samples[i])) throw new Error('Recording contains invalid audio');
    const sample = Math.max(-1,Math.min(1,samples[i]));
    view.setInt16(44+i*2,Math.round(sample < 0 ? sample*32768 : sample*32767),true);
  }
  return new Blob([bytes],{type:'audio/wav'});
}
export async function normalizeRecording(blob, audioContext, OfflineContext = globalThis.OfflineAudioContext || globalThis.webkitOfflineAudioContext) {
  if (!blob.size || blob.size > 10*1024*1024) throw new Error('Recording is empty or too large');
  if (!OfflineContext) throw new Error('This browser cannot prepare microphone audio; use a typed turn instead');
  const decoded = await audioContext.decodeAudioData(await blob.arrayBuffer());
  const duration = decoded.length / decoded.sampleRate;
  if (!Number.isFinite(duration) || duration <= 0 || duration > 30) throw new Error('Recording exceeds 30 seconds; please record a shorter turn');
  const length = Math.ceil(duration * 16000);
  const offline = new OfflineContext(1,length,16000);
  const source = offline.createBufferSource(); source.buffer = decoded;
  source.connect(offline.destination); source.start();
  const rendered = await offline.startRendering();
  return encodeRecordingWav(rendered.getChannelData(0));
}
