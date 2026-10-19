import test from 'node:test';
import assert from 'node:assert/strict';
import { decodePCM, recordingType, PCMPlayer } from '../lib/voice-newsroom/ui/audio.js';
function context() {
  const sources=[];
  return {currentTime:2,destination:{},sources,
    createBuffer(channels,length,rate) { assert.equal(channels,1);assert.equal(rate,24000);return {duration:length/rate,copyToChannel(samples,index){assert.equal(index,0);}}; },
    createBufferSource(){const s={connect(){},disconnect(){s.disconnected=true;},start(at){s.at=at;},stop(){s.stopped=true;}};sources.push(s);return s;}
  };
}
test('decodes signed little-endian PCM, rejects partial samples',()=>{
  assert.deepEqual([...decodePCM(Buffer.from([0,0,0,128,255,127]).toString('base64'))],[0,-1,32767/32768]);
  assert.throws(()=>decodePCM('AA==')); assert.throws(()=>decodePCM(''));
});
test('prefers Opus and falls back to Safari MP4 or browser default',()=>{
  assert.equal(recordingType({isTypeSupported:()=>true}),'audio/webm;codecs=opus');
  assert.equal(recordingType({isTypeSupported:t=>t==='audio/mp4'}),'audio/mp4');
  assert.equal(recordingType({isTypeSupported:()=>false}),'');
});
test('drain completes only when all queued source playback actually ends',async()=>{
  const c=context(), p=new PCMPlayer(c); const audio=Buffer.alloc(4800).toString('base64');
  p.append(audio);p.append(audio);assert.ok(c.sources[1].at>=c.sources[0].at+0.1);
  let settled=false;const waiting=p.drain().then(result=>{settled=true;return result;});
  await Promise.resolve();assert.equal(settled,false);
  c.sources[0].onended();await Promise.resolve();assert.equal(settled,false);
  c.sources[1].onended();assert.equal(await waiting,true);
});
test('interruption stops every queued source and never reports heard',async()=>{
  const c=context(),p=new PCMPlayer(c);p.append('AAA=');p.append('AAA=');
  const waiting=p.drain();p.stop();assert.equal(await waiting,false);
  assert.ok(c.sources.every(s=>s.stopped&&s.disconnected));assert.throws(()=>p.append('AAA='));
});
test('empty playback cannot count as heard',async()=>{assert.equal(await new PCMPlayer(context()).drain(),false);});

const {encodeRecordingWav,normalizeRecording} = await import('../lib/voice-newsroom/ui/audio.js');
test('recording WAV has canonical mono PCM16LE 16k header and clipped samples',async()=>{
  const blob=encodeRecordingWav(new Float32Array([-2,-1,0,1,2]));
  assert.equal(blob.type,'audio/wav'); const bytes=await blob.arrayBuffer();const view=new DataView(bytes);
  assert.equal(new TextDecoder().decode(bytes.slice(0,4)),'RIFF');assert.equal(view.getUint32(4,true),46);
  assert.equal(new TextDecoder().decode(bytes.slice(8,16)),'WAVEfmt ');
  assert.equal(view.getUint32(16,true),16);assert.equal(view.getUint16(20,true),1);assert.equal(view.getUint16(22,true),1);
  assert.equal(view.getUint32(24,true),16000);assert.equal(view.getUint32(28,true),32000);
  assert.equal(view.getUint16(32,true),2);assert.equal(view.getUint16(34,true),16);assert.equal(view.getUint32(40,true),10);
  assert.deepEqual(Array.from({length:5},(_,i)=>view.getInt16(44+i*2,true)),[-32768,-32768,0,32767,32767]);
});
test('recording encoder rejects empty, over-30-second and nonfinite audio',()=>{
  assert.throws(()=>encodeRecordingWav(new Float32Array(0)));
  assert.throws(()=>encodeRecordingWav(new Float32Array(480001)));
  assert.throws(()=>encodeRecordingWav(new Float32Array([NaN])));
  assert.equal(encodeRecordingWav(new Float32Array(480000)).size,960044);
});
test('normalization renders 48k input into 16k mono and rejects overlong audio before rendering',async()=>{
  let rendered=0;const decoded={length:48000,sampleRate:48000};
  const audio={decodeAudioData:async()=>decoded};
  class Offline {
    constructor(channels,length,rate){assert.equal(channels,1);assert.equal(length,16000);assert.equal(rate,16000);}
    createBufferSource(){return {connect(){},start(){}};}
    async startRendering(){rendered++;return {getChannelData(){return new Float32Array(16000);}};}
  }
  const blob=await normalizeRecording(new Blob(['encoded']),audio,Offline);assert.equal(blob.size,32044);assert.equal(rendered,1);
  decoded.length=1440001;await assert.rejects(normalizeRecording(new Blob(['encoded']),audio,Offline),/30 seconds/);assert.equal(rendered,1);
});
