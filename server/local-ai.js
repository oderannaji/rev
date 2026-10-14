import {readFile, writeFile, rename} from 'node:fs/promises';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';

export const localDefaults = Object.freeze({enabled:false, embeddingModel:'embeddinggemma:latest', draftModel:'qwen3:4b', whisperBinary:'', whisperModel:''});
export const problem = (message, status=503) => Object.assign(new Error(message), {status});
export function validateLocalConfig(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input) || typeof input.enabled !== 'boolean') throw problem('Choose whether to enable local AI.',400);
  const result = {...localDefaults};
  for (const key of Object.keys(input)) {
    if (!(key in result)) throw problem('Unknown local AI setting.',400);
    if (key === 'enabled') {result.enabled=input.enabled;continue;}
    if (typeof input[key] !== 'string' || input[key].length>1024 || /[\0\r\n]/.test(input[key])) throw problem('Invalid local AI setting.',400);
    result[key]=input[key].trim();
  }
  for(const key of ['embeddingModel','draftModel']) if(!/^[a-zA-Z0-9][a-zA-Z0-9_.:/-]{0,120}$/.test(result[key]) || /cloud/i.test(result[key])) throw problem('Use an installed local model name, without a cloud suffix.',400);
  for(const key of ['whisperBinary','whisperModel']) if(result[key] && !result[key].startsWith('/')) throw problem('Whisper paths must be absolute paths.',400);
  return result;
}
export async function createLocalConfig(dataDir) {
  const file=join(dataDir,'local-ai.json');
  let config={...localDefaults};
  try {config=validateLocalConfig(JSON.parse(await readFile(file,'utf8')));} catch(e) {if(e.code!=='ENOENT') console.warn('Local AI configuration could not be loaded; local AI is disabled.');}
  return {get:()=>({...config}), async save(input) {
    const next=validateLocalConfig(input),temp=`${file}.${randomUUID()}.tmp`;
    await writeFile(temp,JSON.stringify(next,null,2),{mode:0o600});await rename(temp,file);config=next;return {...config};
  }};
}
export function createOllama({endpoint=process.env.SHEPHERD_OLLAMA_URL||'http://127.0.0.1:11434'}={}) {
  const url=new URL(endpoint);
  if(url.protocol!=='http:' || !['127.0.0.1','localhost','[::1]'].includes(url.hostname) || url.username || url.password || url.pathname!=='/' || url.search || url.hash) throw problem('Ollama must use an HTTP loopback address.');
  const request=async(path,body,signal,timeout=180000)=>{
    try {
      const r=await fetch(new URL(path,url),{method:body?'POST':'GET',headers:body?{'Content-Type':'application/json'}:{},...(body?{body:JSON.stringify(body)}:{}),redirect:'error',signal:signal?AbortSignal.any([signal,AbortSignal.timeout(timeout)]):AbortSignal.timeout(timeout)});
      if(!r.ok) throw problem(`Local Ollama returned HTTP ${r.status}. Check the installed model.`,502);
      return await r.json();
    } catch(e) {if(e.status)throw e;throw problem('Local Ollama is unavailable or timed out. Start Ollama and install the selected models.');}
  };
  const models=async()=>{
    const data=await request('/api/tags',null,null,3000);
    return (data.models||[]).filter(m=>typeof m.name==='string' && !m.remote_host && !m.remote_model && !/cloud/i.test(m.name));
  };
  const installed=async name=>{
    const model=(await models()).find(m=>m.name===name || m.name===`${name}:latest`);
    if(!model || !model.digest)throw problem(`Install the local model ${name} in Ollama first.`);
    return model;
  };
  return {models,installed,
    async embed(model,input,signal) {
      const data=await request('/api/embed',{model,input,truncate:false,keep_alive:'5m'},signal);
      if(!Array.isArray(data.embeddings) || data.embeddings.length!==input.length) throw problem('The embedding model returned an invalid batch.',502);
      return data.embeddings;
    },
    async draft(model,messages) {
      await installed(model);
      const data=await request('/api/chat',{model,messages,stream:false,think:false,keep_alive:0,options:{temperature:0.3,num_ctx:8192,num_predict:2400}});
      if(typeof data.message?.content!=='string' || !data.message.content.trim())throw problem('The local model returned no draft.',502);
      return data.message.content;
    }
  };
}
