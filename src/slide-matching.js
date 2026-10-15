const tokenize = text => String(text || '').normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase().match(/[\p{L}\p{N}]+/gu) || [];

// Index only small five-word keys, with positions so unrelated common phrases
// cannot add up to an apparently long continuous quotation.
export function prepareSlides(slides) {
  return slides.filter(slide => !slide.mediaUrl && slide.text).map(slide => ({slide, words: tokenize(slide.text.slice(0, 12000)).slice(0, 512)}));
}
export function matchSlides(text, prepared) {
  const spoken = tokenize(text.slice(-1500));
  if (spoken.length < 6) return [];
  const grams = new Map();
  for (let i = 0; i <= spoken.length - 5; i++) {
    const gram = spoken.slice(i, i + 5).join(' ');
    if (!grams.has(gram)) grams.set(gram, []);
    grams.get(gram).push(i);
  }
  return prepared.map(({slide, words}) => {
    let best = 0;
    const runs = new Map();
    for (let i = 0; i <= words.length - 5; i++) {
      for (const position of grams.get(words.slice(i, i + 5).join(' ')) || []) {
        const offset = i - position, previous = runs.get(offset);
        const length = previous?.end === i - 1 ? previous.length + 1 : 5;
        runs.set(offset, {end: i, length}); best = Math.max(best, length);
      }
    }
    return {slide, matchedWords: best, coverage: best / spoken.length};
  }).filter(match => match.matchedWords >= 6).sort((a, b) => b.matchedWords - a.matchedWords || b.coverage - a.coverage);
}
export function automaticSlide(matches) {
  // A duplicate or competing slide always needs operator review.
  return matches.length === 1 && matches[0].matchedWords >= 8 && matches[0].coverage >= .8 ? matches[0].slide : null;
}
