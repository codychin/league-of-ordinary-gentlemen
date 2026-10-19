import { Buffer } from 'node:buffer';
// Browser sends canonical PCM16LE mono16k WAV. Strict server validation bounds billing.
export async function normalizeCapture(bytes){
 const b=Buffer.from(bytes);
 if(b.length<46||b.toString('ascii',0,4)!=='RIFF'||b.readUInt32LE(4)!==b.length-8||b.toString('ascii',8,16)!=='WAVEfmt '||b.readUInt32LE(16)!==16||b.readUInt16LE(20)!==1||b.readUInt16LE(22)!==1||b.readUInt32LE(24)!==16000||b.readUInt32LE(28)!==32000||b.readUInt16LE(32)!==2||b.readUInt16LE(34)!==16||b.toString('ascii',36,40)!=='data'||b.readUInt32LE(40)!==b.length-44||(b.length-44)%2)throw Error('Canonical PCM16 mono16k WAV required');
 const seconds=(b.length-44)/32000;if(seconds>30)throw Error('Capture exceeds30seconds');return {bytes:b,seconds};
}
