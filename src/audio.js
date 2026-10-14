import {createUtterances} from './live-audio.js';
export function pcmWav(samples,rate){
  const length=Math.floor(samples.length*16000/rate),buffer=new ArrayBuffer(44+length*2),view=new DataView(buffer);
  const ascii=(at,s)=>{for(let i=0;i<s.length;i++)view.setUint8(at+i,s.charCodeAt(i));};
  ascii(0,'RIFF');view.setUint32(4,36+length*2,true);ascii(8,'WAVE');ascii(12,'fmt ');view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,1,true);view.setUint32(24,16000,true);view.setUint32(28,32000,true);view.setUint16(32,2,true);view.setUint16(34,16,true);ascii(36,'data');view.setUint32(40,length*2,true);
  // Average the input samples in each output interval before downsampling.
  for(let i=0;i<length;i++){const start=Math.floor(i*rate/16000),end=Math.max(start+1,Math.floor((i+1)*rate/16000));let sum=0;for(let j=start;j<end&&j<samples.length;j++)sum+=samples[j];const value=Math.max(-1,Math.min(1,sum/(end-start)));view.setInt16(44+i*2,value*(value<0?32768:32767),true);}
  const bytes=new Uint8Array(buffer);let binary='';for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(binary);
}
export async function captureMicrophone(onChunk,onError,{deviceId='',onLevel=()=>{},collect=true,live=false}={}){
  const stream=await navigator.mediaDevices.getUserMedia({audio:{channelCount:1,echoCancellation:true,noiseSuppression:true,...(deviceId?{deviceId:{exact:deviceId}}:{})},video:false});
  let context,worklet,source,mute,utterances,closed=false,parts=[],size=0,lastLevel=0;
  const flush=()=>{if(!collect||!context||size<context.sampleRate*.5){parts=[];size=0;return;}const samples=new Float32Array(size);let offset=0;for(const part of parts){samples.set(part,offset);offset+=part.length;}parts=[];size=0;onChunk(pcmWav(samples,context.sampleRate));};
  const stop=async(save=true)=>{if(closed)return;closed=true;if(worklet)worklet.port.onmessage=null;stream.getTracks().forEach(t=>t.stop());source?.disconnect();worklet?.disconnect();mute?.disconnect();if(utterances)utterances.stop(save);else if(save)flush();onLevel(0);if(context&&context.state!=='closed')await context.close();};
  try{
    context=new AudioContext({sampleRate:16000});
    if(live&&collect)utterances=createUtterances({rate:context.sampleRate,emit:(samples,meta)=>onChunk(pcmWav(samples,context.sampleRate),meta)});
    await context.audioWorklet.addModule('/speech-worklet.js');worklet=new AudioWorkletNode(context,'shepherd-recorder');source=context.createMediaStreamSource(stream);mute=context.createGain();mute.gain.value=0;source.connect(worklet);worklet.connect(mute);mute.connect(context.destination);
    worklet.port.onmessage=({data})=>{if(closed)return;const now=performance.now();if(now-lastLevel>=100){let sum=0;for(const sample of data)sum+=sample*sample;onLevel(Math.sqrt(sum/Math.max(1,data.length)));lastLevel=now;}if(utterances)utterances.push(data);else if(collect){parts.push(data);size+=data.length;if(size>=context.sampleRate*20)flush();}};
    stream.getAudioTracks()[0].onended=()=>{onError(Error('The microphone disconnected.'));void stop();};
    await context.resume();return stop;
  }catch(e){await stop(false);throw e;}
}
export async function audioFile(file){
  if(file.size>30*1024*1024)throw Error('Use an audio file smaller than 30 MB.');
  const context=new AudioContext();try{const decoded=await context.decodeAudioData(await file.arrayBuffer());if(decoded.duration<.5||decoded.duration>120)throw Error('Choose a recording lasting 0.5–120 seconds.');const mono=new Float32Array(decoded.length);for(let c=0;c<decoded.numberOfChannels;c++){const values=decoded.getChannelData(c);for(let i=0;i<mono.length;i++)mono[i]+=values[i]/decoded.numberOfChannels;}return pcmWav(mono,decoded.sampleRate);}finally{await context.close();}
}
