import test from 'node:test';
import assert from 'node:assert/strict';
import {createSearchEngine} from '../server/search.js';
import {createNavigator} from '../server/navigation.js';
import {matchScriptureCommand} from '../shared/scripture-commands.js';
const verses = [{book:'John',chapter:1,verse:1,text:'First'},{book:'John',chapter:1,verse:2,text:'Second'},{book:'John',chapter:2,verse:1,text:'Next chapter'},{book:'Acts',chapter:1,verse:1,text:'Next book'}];
test('Scripture navigation crosses chapters/books, preserves missing verses and validates translation swaps', () => {
  const engine = createSearchEngine([{id:'A',name:'First',verses}, {id:'B',name:'Second',verses:[verses[0]]}]), navigate = createNavigator(engine);
  const input={book:'John',chapter:1,verse:2,translation:'A'};
  assert.equal(navigate({...input,action:'next'}).chapter,2);
  assert.equal(navigate({...input,action:'previous'}).verse,1);
  assert.equal(navigate({...input,action:'nextChapter'}).chapter,2);
  assert.equal(navigate({...input,chapter:2,verse:1,action:'next'}).book,'Acts');
  assert.equal(navigate({...input,chapter:2,verse:1,action:'previousChapter'}).chapter,1);
  assert.equal(navigate({...input,verse:1,action:'translation',targetTranslation:'B'}).translation,'B');
  assert.throws(()=>navigate({...input,action:'translation',targetTranslation:'B'}),/No verse/);
  assert.throws(()=>navigate({...input,action:'verse',targetVerse:200}),/No verse/);
  assert.throws(()=>navigate({...input,verse:1,action:'previous'}),/No verse/);
});
test('spoken Scripture controls accept English verse numbers and only installed translation names', () => {
  assert.deepEqual(matchScriptureCommand('Shepherd, next verse.'),{action:'next'});
  assert.deepEqual(matchScriptureCommand('Shepherd go to verse one hundred and sixteen'),{action:'verse',targetVerse:116});
  assert.deepEqual(matchScriptureCommand('Shepherd verse twenty-eight'),{action:'verse',targetVerse:28});
  assert.deepEqual(matchScriptureCommand('Shepherd use B S B',[{id:'BSB',name:'Berean Standard Bible'}]),{action:'translation',targetTranslation:'BSB'});
  for (const text of ['Shepherd verse 201','Please say Shepherd next verse','Shepherd use KJV','Shepherd verse twenty eleven']) assert.equal(matchScriptureCommand(text),null);
});
