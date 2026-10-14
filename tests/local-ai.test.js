import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {mkdtemp,rm,writeFile,readFile,access} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createOllama,createLocalConfig,validateLocalConfig,localDefaults} from '../server/local-ai.js';
import {createServer} from '../server/index.js';
import {createSpeech,validateWav} from '../server/speech.js';
import {pcmWav} from '../src/audio.js';

const sample={id:'BSB',name:'Fixture',verses:[{book:'Psalms',chapter:23,verse:1,text:'The LORD is my shepherd; I shall not want.'},{book:'Genesis',chapter:1,verse:1,text:'In the beginning God created the heavens and the earth.'}]};
const json=(data,method='POST')=>({method,headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
async function until(check){for(let i=0;i<100;i++){const result=await check();if(result)return result;await new Promise(r=>setTimeout(r,10));}throw Error('Timed out waiting for background index');}
test('local configuration rejects remote/cloud choices and survives restart',async t=>{
  const directory=await mkdtemp(join(tmpdir(),'shepherd-config-'));t.after(()=>rm(directory,{recursive:true,force:true}));
  assert.throws(()=>createOllama({endpoint:'https://provider.example'}),/loopback/);
  assert.throws(()=>validateLocalConfig({...localDefaults,draftModel:'qwen3-cloud'}),/cloud/);
  assert.throws(()=>validateLocalConfig({...localDefaults,whisperBinary:'~/whisper-cli'}),/absolute/);
  assert.throws(()=>validateLocalConfig({...localDefaults,endpoint:'https://provider.example'}),/Unknown/);
  const store=await createLocalConfig(directory);await store.save({...localDefaults,enabled:true});assert.equal((await createLocalConfig(directory)).get().enabled,true);
});
test('local neural API builds/persists an index, ranks paraphrases, checks model drift, and drafts locally',async t=>{
  const dataDir=await mkdtemp(join(tmpdir(),'shepherd-neural-'));const requests=[];let digest='fixture-v1';
  const provider=http.createServer(async(req,res)=>{
    let body='';for await(const chunk of req)body+=chunk;const input=body?JSON.parse(body):null;requests.push({path:req.url,input});res.setHeader('Content-Type','application/json');
    if(req.url==='/api/tags')return res.end(JSON.stringify({models:[{name:'embeddinggemma:latest',digest},{name:'qwen3:4b',digest:'draft-v1'}]}));
    if(req.url==='/api/embed')return res.end(JSON.stringify({embeddings:input.input.map(text=>text.includes('Genesis')?[0,1]:[1,0])}));
    if(req.url==='/api/chat')return res.end(JSON.stringify({message:{content:'# A local draft\nReview the scripture reference.'}}));
    res.writeHead(404);res.end('{}');
  });await new Promise(r=>provider.listen(0,'127.0.0.1',r));
  const ollama=createOllama({endpoint:`http://127.0.0.1:${provider.address().port}`});
  const servers=[];t.after(async()=>{for(const s of servers){s.closeAllConnections();await new Promise(r=>s.close(r));}provider.closeAllConnections();await new Promise(r=>provider.close(r));await rm(dataDir,{recursive:true,force:true});});
  const start=async()=>{const s=await createServer({dataDir,translations:[sample],ollama});servers.push(s);await new Promise(r=>s.listen(0,'127.0.0.1',r));return `http://127.0.0.1:${s.address().port}`;};
  let url=await start();
  assert.equal((await fetch(url+'/api/search?mode=neural&q=feeling+provided+for')).status,503);
  assert.equal((await fetch(url+'/api/local-ai/config',json({...localDefaults,enabled:true},'PUT'))).status,200);
  assert.equal((await fetch(url+'/api/local-ai/index',json({translation:'BSB'}))).status,202);
  await until(async()=>{const s=await fetch(url+'/api/local-ai/status').then(r=>r.json());return s.semantic.job.state==='ready';});
  const results=await fetch(url+'/api/search?mode=neural&q=feeling+provided+for').then(r=>r.json());assert.equal(results.results[0].book,'Psalms');assert.equal(results.method,'Local neural + keyword retrieval');
  const embeds=requests.filter(x=>x.path==='/api/embed').length;
  const direct=await fetch(url+'/api/search?mode=neural&q=Genesis+1:1').then(r=>r.json());assert.equal(direct.method,'Direct reference');assert.equal(requests.filter(x=>x.path==='/api/embed').length,embeds);
  const draft=await fetch(url+'/api/content/generate',json({kind:'sermon',source:'We discussed trust and care during the Sunday service.'})).then(r=>r.json());assert.equal(draft.local,true);assert.match(draft.text,/local draft/);
  const chat=requests.find(x=>x.path==='/api/chat').input;assert.equal(chat.keep_alive,0);assert.equal(chat.think,false);assert.equal(chat.options.num_ctx,8192);
  url=await start();assert.equal((await fetch(url+'/api/search?mode=neural&q=feeling+provided+for')).status,200);
  digest='fixture-v2';const drift=await fetch(url+'/api/search?mode=neural&q=feeling+provided+for');assert.equal(drift.status,503);assert.match((await drift.json()).error,/model changed/);
  assert.equal((await fetch(url+'/api/local-ai/config',{...json({...localDefaults,enabled:true},'PUT'),headers:{'Content-Type':'application/json',Origin:'https://outside.example'}})).status,403);
});
test('offline speech validates actual PCM audio, uses a bounded CLI call, skips silence and removes temporary files',async t=>{
  const directory=await mkdtemp(join(tmpdir(),'shepherd-speech-test-'));t.after(()=>rm(directory,{recursive:true,force:true}));const model=join(directory,'model.bin');await writeFile(model,'fixture');
  const config={get:()=>({...localDefaults,enabled:true,whisperBinary:process.execPath,whisperModel:model})};let temp,calls=0;
  const speech=createSpeech({config,execute:async(binary,args,options)=>{
    calls++;assert.equal(binary,process.execPath);assert.equal(args[args.indexOf('-l')+1],'en');assert.equal(options.timeout,180000);assert.equal(options.shell,undefined);
    temp=args[args.indexOf('-f')+1];assert.equal(validateWav(await readFile(temp)).seconds,1);
    await writeFile(args[args.indexOf('-of')+1]+'.json',JSON.stringify({transcription:[{text:' We read Psalm twenty three.'}]}));
  }});
  const samples=Float32Array.from({length:48000},(_,i)=>.2*Math.sin(i/10));const audio=pcmWav(samples,48000);
  const result=await speech.transcribe({audio});assert.equal(result.text,'We read Psalm twenty three.');assert.equal(result.language,'en');await assert.rejects(access(temp));
  const silent=await speech.transcribe({audio:pcmWav(new Float32Array(16000),16000)});assert.equal(silent.silent,true);assert.equal(calls,1);
  await assert.rejects(speech.transcribe({audio:Buffer.from('not WAV').toString('base64')}),/valid PCM/);
  const broken=Buffer.from(audio,'base64');broken.writeUInt16LE(2,22);assert.throws(()=>validateWav(broken),/mono/);
});
