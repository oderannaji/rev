import {access} from 'node:fs/promises';
import {constants} from 'node:fs';
import {dirname,join} from 'node:path';
import {spawn} from 'node:child_process';
import net from 'node:net';
import {problem} from './local-ai.js';

// Managed loopback child: the same loaded Whisper model serves successive windows.
export function createWhisperService({config,launch=spawn}={}) {
  let child=null,origin=null,identity=null,starting=null,closed=false;
  const binary=()=>join(dirname(config.get().whisperBinary||'.'),process.platform==='win32'?'whisper-server.exe':'whisper-server');
  async function available(){const c=config.get();if(!c.enabled||!c.whisperBinary||!c.whisperModel)return false;try{await access(binary(),constants.X_OK);await access(c.whisperModel,constants.R_OK);return true;}catch{return false;}}
  function stop(){const previous=child;child=null;origin=null;identity=null;if(previous&&previous.exitCode===null){previous.kill('SIGTERM');const timer=setTimeout(()=>{if(previous.exitCode===null)previous.kill('SIGKILL');},2000);timer.unref();}}
  async function start(){
    const c=config.get(),key=JSON.stringify([binary(),c.whisperModel]);
    if(closed)throw problem('Speech service has stopped.');
    if(child&&identity===key&&origin)return origin;
    if(starting)return starting;
    starting=(async()=>{
      if(!await available())throw problem('Build whisper-server beside whisper-cli using the updated speech-only setup script.');
      stop();const port=await new Promise((resolve,reject)=>{const probe=net.createServer();probe.once('error',reject);probe.listen(0,'127.0.0.1',()=>{const port=probe.address().port;probe.close(error=>error?reject(error):resolve(port));});});
      const processHandle=launch(binary(),['-m',c.whisperModel,'--host','127.0.0.1','--port',String(port),'-l','en','-t','4','-nc'],{stdio:['ignore','pipe','pipe'],windowsHide:true});
      child=processHandle;identity=key;let failed=false;
      processHandle.stdout?.resume();processHandle.stderr?.resume();
      processHandle.on('error',()=>{failed=true;});processHandle.on('exit',()=>{failed=true;if(child===processHandle){child=null;origin=null;identity=null;}});
      const address=`http://127.0.0.1:${port}`,deadline=Date.now()+90000;
      while(Date.now()<deadline){
        if(closed||child!==processHandle||failed)throw problem('The local Whisper server stopped while loading the model.');
        try{const response=await fetch(address+'/',{signal:AbortSignal.timeout(1000),redirect:'error'});await response.arrayBuffer();if(response.ok){origin=address;return origin;}}catch{}
        await new Promise(resolve=>setTimeout(resolve,150));
      }
      stop();throw problem('Local Whisper model loading timed out. Check the model path and available memory.');
    })().finally(()=>{starting=null;});return starting;
  }
  async function transcribe(bytes){
    const address=await start(),form=new FormData();
    form.append('file',new Blob([bytes],{type:'audio/wav'}),'speech.wav');form.append('language','en');form.append('response_format','json');form.append('no_context','true');
    try{const response=await fetch(address+'/inference',{method:'POST',body:form,signal:AbortSignal.timeout(45000),redirect:'error'});if(!response.ok)throw Error('Inference failed');const data=await response.json();if(typeof data.text!=='string')throw Error('Invalid text');return data.text.trim();}
    catch{stop();throw problem('Live transcription failed or timed out. The next attempt will restart the local speech engine.',502);}
  }
  return {available,start,transcribe,stop,close:()=>{closed=true;stop();}};
}
