import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {createServer,validateTranslation} from '../server/index.js';

test('bundled public-domain translations retain corpus integrity and switch/search through the API', async t=>{
  const manifest=JSON.parse(await readFile(new URL('../docs/evidence/additional-translations.json',import.meta.url),'utf8'));
  for(const entry of manifest){
    const bytes=await readFile(new URL(`../data/${entry.id}.json`,import.meta.url));
    assert.equal(createHash('sha256').update(bytes).digest('hex'),entry.normalizedSha256);
    const data=validateTranslation(JSON.parse(bytes));
    assert.equal(data.verses.length,entry.nonemptyVerses);
    assert.equal(new Set(data.verses.map(v=>v.book)).size,66);
    assert.ok(data.verses.some(v=>v.book==='Genesis'&&v.chapter===1&&v.verse===1));
    assert.ok(data.verses.some(v=>/Revelation/.test(v.book)&&v.chapter===22&&v.verse===21));
  }
  const dataDir=await mkdtemp(join(tmpdir(),'shepherd-translations-')),server=await createServer({dataDir});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  t.after(async()=>{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));await rm(dataDir,{recursive:true,force:true});});
  const origin=`http://127.0.0.1:${server.address().port}`;
  const list=await fetch(`${origin}/api/translations`).then(r=>r.json());
  assert.deepEqual(list.map(x=>x.id),['BSB','ASV','YLT']);
  for(const id of ['ASV','YLT']){
    const result=await fetch(`${origin}/api/search?translation=${id}&q=John%203%3A16`).then(r=>r.json());
    assert.equal(result.results[0].translation,id);assert.equal(result.results[0].verse,16);
    assert.match(result.results[0].text,id==='ASV'?/only begotten Son/:/Son.*only begotten/);
    const switched=await fetch(`${origin}/api/scripture/navigate?book=John&chapter=3&verse=16&translation=BSB&action=translation&targetTranslation=${id}`).then(r=>r.json());
    assert.equal(switched.verse.translation,id);assert.equal(switched.verse.text,result.results[0].text);
  }
});
