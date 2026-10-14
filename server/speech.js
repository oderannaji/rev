import {access,mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';
import {constants} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {problem} from './local-ai.js';
const run=promisify(execFile);

export function validateWav(bytes) {
  if(bytes.length<44 || bytes.length>4*1024*1024 || bytes.toString('ascii',0,4)!=='RIFF' || bytes.toString('ascii',8,12)!=='WAVE' || bytes.readUInt32LE(4)+8!==bytes.length)throw problem('Use a valid PCM WAV recording of at most 120 seconds.',400);
  let format=null,audio=null;
  for(let offset=12;offset+8<=bytes.length;){
    const type=bytes.toString('ascii',offset,offset+4),size=bytes.readUInt32LE(offset+4),start=offset+8;
    if(start+size>bytes.length)throw problem('Incomplete WAV audio.',400);
    if(type==='fmt ' && size>=16)format={encoding:bytes.readUInt16LE(start),channels:bytes.readUInt16LE(start+2),rate:bytes.readUInt32LE(start+4),bits:bytes.readUInt16LE(start+14)};
    if(type==='data'){if(audio)throw problem('Multiple WAV data chunks are unsupported.',400);audio=bytes.subarray(start,start+size);}
    offset=start+size+(size%2);
  }
  if(!format || format.encoding!==1 || format.channels!==1 || format.rate!==16000 || format.bits!==16 || !audio || audio.length%2 || audio.length<16000 || audio.length>16000*2*120)throw problem('Use mono, 16 kHz, 16-bit PCM WAV audio lasting 0.5–120 seconds.',400);
  let power=0;for(let i=0;i<audio.length;i+=2)power+=(audio.readInt16LE(i)/32768)**2;
  return {seconds:audio.length/32000,silent:Math.sqrt(power/(audio.length/2))<0.001};
}
export function createSpeech({config,execute=run}) {
  let busy=false;
  async function status(){
    const c=config.get();let available=false;
    if(c.enabled && c.whisperBinary && c.whisperModel)try{await access(c.whisperBinary,constants.X_OK);await access(c.whisperModel,constants.R_OK);available=true;}catch{}
    return {available,busy,engine:'whisper.cpp',language:'en',profile:'Nigerian English',message:available?'Local Whisper is configured. Accuracy still needs a recording check.':'Set the Whisper executable and model paths in Settings.'};
  }
  async function transcribe(input){
    if(!input || typeof input.audio!=='string' || input.audio.length>5600000 || input.audio.length%4 || !/^[A-Za-z0-9+/]*={0,2}$/.test(input.audio))throw problem('Provide PCM WAV audio encoded as base64.',400);
    const bytes=Buffer.from(input.audio,'base64'),details=validateWav(bytes);
    if(!(await status()).available)throw problem('Local Whisper is not configured. Open Settings to finish setup.');
    if(busy)throw problem('Whisper is processing another recording. Try again when it finishes.',409);
    if(details.silent)return {text:'',...details,engine:'whisper.cpp',language:'en'};
    busy=true;let directory;
    try {
      directory=await mkdtemp(join(tmpdir(),'shepherd-speech-'));const wav=join(directory,'audio.wav'),output=join(directory,'result');
      await writeFile(wav,bytes,{mode:0o600});const c=config.get();
      // No shell and no client-supplied arguments. English is the language code;
      // Nigerian English is evaluated as an accent, not a separate Whisper language.
      await execute(c.whisperBinary,['-m',c.whisperModel,'-f',wav,'-l','en','-oj','-of',output,'-nt','-t','4'],{timeout:180000,maxBuffer:2*1024*1024,windowsHide:true});
      const result=JSON.parse(await readFile(output+'.json','utf8'));
      if(!Array.isArray(result.transcription))throw new Error('Invalid Whisper output');
      const text=result.transcription.map(x=>typeof x.text==='string'?x.text.trim():'').filter(Boolean).join(' ');
      return {text,...details,engine:'whisper.cpp',language:'en',needsReview:true};
    } catch {throw problem('Local transcription failed or timed out. Check the Whisper binary/model and try a shorter recording.',502);}
    finally {busy=false;if(directory)await rm(directory,{recursive:true,force:true});}
  }
  return {status,transcribe};
}
