import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createServer} from '../server/index.js';
const sample={id:'BSB',name:'Test scripture',verses:[{book:'John',chapter:3,verse:16,text:'For God so loved the world.'}]};
async function fixture(t,dataDir){dataDir??=await mkdtemp(join(tmpdir(),'gather-test-'));const s=await createServer({dataDir,translations:[sample]});await new Promise(r=>s.listen(0,'127.0.0.1',r));const url=`http://127.0.0.1:${s.address().port}`;t.after(async()=>{s.closeAllConnections();await new Promise(r=>s.close(r));await rm(dataDir,{recursive:true,force:true});});return {s,url,dataDir};}
const body=data=>({method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
test('API persists state, streams output and imports translations',async t=>{
 const {url,dataDir}=await fixture(t);assert.equal((await fetch(url+'/api/health')).status,200);
 const controller=new AbortController();const stream=await fetch(url+'/api/events',{signal:controller.signal});const reader=stream.body.getReader();await reader.read();
 const state={queue:[{id:'a',title:'Welcome',text:'Hello'}],live:{id:'a',title:'Welcome',text:'Hello'},blackout:false};
 const saved=await fetch(url+'/api/state',{...body(state),method:'PUT'});assert.equal(saved.status,200);assert.deepEqual(await saved.json(),state);
 const event=await reader.read();assert.match(new TextDecoder().decode(event.value),/Welcome/);controller.abort();
 assert.deepEqual(JSON.parse(await readFile(join(dataDir,'state.json'),'utf8')),state);
 const imported={id:'TEST',name:'Custom translation',verses:[{book:'John',chapter:1,verse:1,text:'Beginning'}]};assert.equal((await fetch(url+'/api/translations',body(imported))).status,201);assert.equal((await fetch(url+'/api/translations',body(imported))).status,409);
 assert.equal((await (await fetch(url+'/api/search?q=John+1:1&translation=TEST')).json()).total,1);
});
test('reject invalid input, cross-origin mutation and path traversal',async t=>{
 const {url}=await fixture(t);
 assert.equal((await fetch(url+'/api/translations',body({...sample,id:'../bad'}))).status,400);
 assert.equal((await fetch(url+'/api/translations',body({...sample,id:'TEST',verses:[...sample.verses,...sample.verses]}))).status,400);
 assert.equal((await fetch(url+'/api/state',{...body({}),method:'PUT',headers:{'Content-Type':'application/json',Origin:'https://outside.example'}})).status,403);
 assert.equal((await fetch(url+'/api/state',{...body([]),method:'PUT'})).status,400);
 assert.equal((await fetch(url+'/api/media',body({name:'bad.png',type:'image/png',data:Buffer.from('not png').toString('base64')}))).status,400);
 assert.equal((await fetch(url+'/api/search?mode=unknown')).status,400);
 assert.equal((await fetch(url+'/api/search?limit=100000')).status,400);
 assert.equal((await fetch(url+'/%2e%2e%2fpackage.json')).status,403);
});
test('restores saved service state after server restart',async t=>{
 const {s,url,dataDir}=await fixture(t);await fetch(url+'/api/state',{...body({notes:'Persistent notes'}),method:'PUT'});
 s.closeAllConnections();await new Promise(r=>s.close(r));const replacement=await createServer({dataDir,translations:[sample]});await new Promise(r=>replacement.listen(0,'127.0.0.1',r));t.after(()=>{replacement.closeAllConnections();replacement.close();});const saved=await fetch(`http://127.0.0.1:${replacement.address().port}/api/state`).then(r=>r.json());assert.equal(saved.notes,'Persistent notes');
});
