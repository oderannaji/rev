import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareSlides, matchSlides, automaticSlide} from '../src/slide-matching.js';

const slide = {id:'welcome', title:'Welcome', text:'Today we welcome every family to worship with us together.'};
test('slide matching follows continuous spoken phrases and rejects scattered common words', () => {
  const prepared = prepareSlides([slide, {id:'other', text:'Today we pray for our friends and welcome those who gather.'}, {id:'media', mediaUrl:'/media/file.png', text:slide.text}]);
  const matches = matchSlides('Today, we welcome every family to worship with us together!', prepared);
  assert.equal(matches.length, 1); assert.equal(matches[0].matchedWords, 10);
  assert.equal(automaticSlide(matches).id, 'welcome');
  assert.deepEqual(matchSlides('Today every family together welcome us with we worship to', prepared), []);
  assert.equal(automaticSlide(matchSlides('We welcome every family to worship', prepared)), null);
});
test('duplicate slide text and weak partial overlap never auto-select a slide', () => {
  const matches = matchSlides(slide.text, prepareSlides([slide, {...slide, id:'duplicate'}]));
  assert.equal(matches.length, 2); assert.equal(automaticSlide(matches), null);
  const longSpeech = `We are discussing a very different subject first for quite some time. ${slide.text}`;
  assert.equal(automaticSlide(matchSlides(longSpeech, prepareSlides([slide]))), null);
  assert.deepEqual(matchSlides('Welcome', prepareSlides([slide])), []);
});
