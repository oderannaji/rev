export function createNavigator(engine) {
  const caches = new Map();
  function problem(message, status = 400) {return Object.assign(Error(message), {status});}
  function library(id) {
    if (!engine.list().some(item => item.id === id)) throw problem('Unknown translation.');
    if (!caches.has(id)) {
      const rows = engine.rows(id), books = [...new Set(rows.map(row => row.book))];
      rows.sort((a,b) => books.indexOf(a.book)-books.indexOf(b.book) || a.chapter-b.chapter || a.verse-b.verse);
      const chapters = rows.filter((row, index) => index === 0 || row.book !== rows[index-1].book || row.chapter !== rows[index-1].chapter);
      caches.set(id, {rows, chapters});
    }
    return caches.get(id);
  }
  return function navigate({book, chapter, verse, translation = 'BSB', action, targetVerse, targetTranslation}) {
    if (typeof book !== 'string' || book.length > 60 || !Number.isInteger(chapter) || !Number.isInteger(verse) || chapter < 1 || verse < 1) throw problem('Select a valid Scripture verse first.');
    const {rows, chapters} = library(translation);
    const current = engine.chapter(book, chapter, translation).find(row => row.verse === verse);
    if (!current) throw problem('The current verse is unavailable in this translation.', 404);
    let result;
    if (action === 'next' || action === 'previous') {
      const index = rows.findIndex(row => row.id === current.id);
      result = rows[index + (action === 'next' ? 1 : -1)];
    } else if (action === 'nextChapter' || action === 'previousChapter') {
      const index = chapters.findIndex(row => row.book === current.book && row.chapter === current.chapter);
      result = chapters[index + (action === 'nextChapter' ? 1 : -1)];
    } else if (action === 'verse') {
      if (!Number.isInteger(targetVerse) || targetVerse < 1 || targetVerse > 200) throw problem('Choose a verse number from 1 to 200.');
      result = engine.chapter(current.book, chapter, translation).find(row => row.verse === targetVerse);
    } else if (action === 'translation') {
      library(targetTranslation);
      result = engine.chapter(current.book, chapter, targetTranslation).find(row => row.verse === verse);
    } else throw problem('Unknown Scripture navigation action.');
    if (!result) throw problem('No verse is available in that direction or translation.', 404);
    return result;
  };
}
