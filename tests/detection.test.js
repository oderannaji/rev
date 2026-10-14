import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,mkdtemp,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createSearchEngine} from '../server/search.js';
import {createDetector} from '../server/detection.js';
import {createServer} from '../server/index.js';
const bible=JSON.parse(await readFile(new URL('../data/BSB.json',import.meta.url),'utf8')),engine=createSearchEngine([bible]);
test('detect spoken references within speech, ranges, corrections and contextual verse callouts',async()=>{
  const detector=createDetector({engine,semantic:{search:()=>{throw Error('Reference must not need embeddings');}}});
  const result=await detector.detect({text:'Today we read John chapter three verses sixteen through eighteen.',translation:'BSB',neural:true,final:false});
  assert.equal(result.kind,'reference');assert.deepEqual(result.results.map(v=>v.verse),[16,17,18]);
  const follow=await detector.detect({text:'Now look at verse nineteen.',context:result.context});assert.equal(follow.results[0].verse,19);assert.equal(follow.results[0].chapter,3);
  const corrected=await detector.detect({text:'John three sixteen, actually Romans eight twenty eight.'});assert.equal(corrected.results[0].book,'Romans');assert.equal(corrected.results[0].verse,28);
  const ordinal=await detector.detect({text:'Please turn to first Corinthians chapter thirteen verse four.'});assert.equal(ordinal.results[0].book,'I Corinthians');assert.equal(ordinal.results[0].verse,4);
  const inlineFollow=await detector.detect({text:'John chapter three verse sixteen and now verse seventeen.'});assert.equal(inlineFollow.results[0].verse,17);
});
test('incomplete and impossible references do not produce a fabricated verse',async()=>{
  const detector=createDetector({engine});
  const pending=await detector.detect({text:'Let us turn to John chapter three verse',final:false});assert.equal(pending.waiting,true);assert.equal(pending.results.length,0);
  const complete=await detector.detect({text:'verse sixteen',context:pending.context});assert.equal(complete.results[0].verse,16);
  const invalid=await detector.detect({text:'John chapter ninety nine verse one'});assert.equal(invalid.results.length,0);assert.equal(invalid.context,null);
  assert.equal((await detector.detect({text:'Good morning church'})).results.length,0);
});
test('quotations are detected locally; semantic matches stay labelled as suggestions',async()=>{
  let calls=0;const detector=createDetector({engine,semantic:{search:async()=>{calls++;return {results:[{id:'meaning',book:'Psalms',chapter:23,verse:1,text:'Fixture verse',similarity:.7}]};}}});
  const quote=await detector.detect({text:'Remember: For God so loved the world that He gave His one and only Son.',neural:true});assert.equal(quote.kind,'quotation');assert.ok(quote.results.some(v=>v.book==='John'&&v.chapter===3&&v.verse===16));assert.equal(calls,0);
  const meaning=await detector.detect({text:'Someone is caring for me when I feel lost and alone.',neural:true});assert.equal(meaning.kind,'meaning');assert.match(meaning.results[0].reason,/review/);assert.equal(calls,1);
});
test('automatic detection API validates requests and rejects cross-origin writes',async t=>{
  const dataDir=await mkdtemp(join(tmpdir(),'shepherd-detect-')),server=await createServer({dataDir,translations:[bible]});await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(async()=>{server.closeAllConnections();await new Promise(r=>server.close(r));await rm(dataDir,{recursive:true,force:true});});const url=`http://127.0.0.1:${server.address().port}/api/scripture/detect`;
  const options=input=>({method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(input)});
  const result=await fetch(url,options({text:'We read John chapter three verse sixteen.'})).then(r=>r.json());assert.equal(result.results[0].verse,16);
  assert.equal((await fetch(url,options({text:'x'.repeat(1501)}))).status,400);
  assert.equal((await fetch(url,{...options({text:'John 3:16'}),headers:{'Content-Type':'application/json',Origin:'https://outside.example'}})).status,403);
});
