import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {spawn} from 'node:child_process';
import {createUtterances} from '../src/live-audio.js';
import {createWhisperService} from '../server/whisper-service.js';
import {pcmWav} from '../src/audio.js';

test('continuous windows emit replaceable drafts, finish on pauses, and flush the final phrase',()=>{
  const events=[];const stream=createUtterances({rate:100,emit:(samples,meta)=>events.push({...meta,size:samples.length})});
  const voice=new Float32Array(10).fill(.2),silence=new Float32Array(10);
  for(let i=0;i<30;i++)stream.push(silence);assert.equal(events.length,0);
  for(let i=0;i<45;i++)stream.push(voice);
  assert.deepEqual(events.map(e=>e.final),[false,false]);assert.equal(events[0].id,events[1].id);
  for(let i=0;i<7;i++)stream.push(silence);assert.equal(events.at(-1).final,true);assert.equal(events.at(-1).size,520);
  for(let i=0;i<10;i++)stream.push(voice);stream.stop();assert.equal(events.at(-1).final,true);assert.equal(events.at(-1).id,1);
});
test('Whisper service reuses one loopback process across successive audio windows and closes it',async t=>{
  const dir=await mkdtemp(join(tmpdir(),'shepherd-whisper-service-'));t.after(()=>rm(dir,{recursive:true,force:true}));
  for(const name of ['whisper-cli','whisper-server','model.bin'])await writeFile(join(dir,name),'fixture',{mode:0o700});
  const fixture=join(dir,'server.mjs');await writeFile(fixture,`import http from 'node:http';let n=0;http.createServer(async(req,res)=>{if(req.url==='/'){res.end('ready');return;}let bytes=0;for await(const chunk of req)bytes+=chunk.length;if(!req.headers['content-type'].startsWith('multipart/form-data')||bytes<1000){res.writeHead(400);res.end();return;}res.setHeader('Content-Type','application/json');res.end(JSON.stringify({text:'phrase '+(++n)}));}).listen(Number(process.argv[process.argv.indexOf('--port')+1]),'127.0.0.1');`);
  let launches=0,child;const service=createWhisperService({config:{get:()=>({enabled:true,whisperBinary:join(dir,'whisper-cli'),whisperModel:join(dir,'model.bin')})},launch:(binary,args,options)=>{launches++;assert.equal(binary,join(dir,'whisper-server'));assert.ok(args.includes('-nc'));child=spawn(process.execPath,[fixture,...args],options);return child;}});
  t.after(()=>service.close());assert.equal(await service.available(),true);await service.start();
  const audio=Buffer.from(pcmWav(new Float32Array(16000).fill(.2),16000),'base64');assert.equal(await service.transcribe(audio),'phrase 1');assert.equal(await service.transcribe(audio),'phrase 2');assert.equal(launches,1);
  const ended=new Promise(resolve=>child.once('exit',resolve));service.close();await ended;await assert.rejects(service.start(),/stopped/);
});
