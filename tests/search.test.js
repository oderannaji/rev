import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createSearchEngine} from '../server/search.js';
const bible=JSON.parse(await readFile(new URL('../data/BSB.json',import.meta.url)));
const engine=createSearchEngine([bible]);
test('complete source corpus is loaded; blank source entries omitted without fabricated text',()=>{assert.equal(engine.list()[0].count,31086);assert.equal(new Set(bible.verses.map(v=>v.book)).size,66);});
test('references, aliases, chapters, ranges and spoken numbers',()=>{
 for(const query of ['John 3:16','Jn 3:16','john chapter three verse sixteen']){const r=engine.search(query);assert.equal(r.total,1,query);assert.equal(r.results[0].verse,16);assert.match(r.results[0].text,/God so loved the world/);}
 assert.equal(engine.search('John 3:16-18').total,3);
 assert.equal(engine.search('Psalm 23').total,6);
 assert.equal(engine.search('first corinthians thirteen verse four').results[0].book,'I Corinthians');
 assert.equal(engine.search('1 Cor 13:4').total,1);
 assert.equal(engine.search('Rev 22:21').total,1);
 assert.equal(engine.search('John 999:1').total,0);
 assert.equal(engine.search('John 3:18-16',{mode:'reference'}).total,0);
});
test('exact phrase is contiguous and punctuation-insensitive',()=>{
 const r=engine.search('God so loved the world',{mode:'exact'});assert.equal(r.total,1);assert.equal(r.results[0].book,'John');
 assert.equal(engine.search('world loved God so',{mode:'exact'}).total,0);
});
test('keyword ranking, misspellings and bounded negative search',()=>{
 assert.equal(engine.search('God so loved the world').results[0].verse,16);
 assert.ok(engine.search('sheperd').results.some(v=>/shepherd/i.test(v.text)));
 assert.equal(engine.search('zzzzzzzzzz').total,0);assert.equal(engine.search('').total,0);
 const result=engine.search('grief',{mode:'concept'});assert.ok(result.total>0);assert.match(result.method,/not neural/);assert.ok(result.results.some(v=>/sorrow|comfort|mourn|tear/i.test(v.text)));
});
test('independent imported translations preserve non-Latin text and isolate results',()=>{
 const e=createSearchEngine([{id:'GRC',name:'Greek sample',verses:[{book:'John',chapter:1,verse:1,text:'ἐν ἀρχῇ ἦν ὁ λόγος'}]}]);assert.equal(e.search('λογος',{translation:'GRC'}).total,1);assert.throws(()=>e.search('love',{translation:'UNKNOWN'}),/Unknown translation/);
});
