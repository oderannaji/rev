import {normalizeCommand} from './voice-commands.js';
const small = ['zero','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen'];
const tens = ['','','twenty','thirty','forty','fifty','sixty','seventy','eighty','ninety'];
function english(n) {
  if (n < 20) return small[n];
  if (n < 100) return `${tens[Math.floor(n/10)]}${n%10 ? ` ${small[n%10]}` : ''}`;
  return `${small[Math.floor(n/100)]} hundred${n%100 ? ` ${english(n%100)}` : ''}`;
}
const numbers = new Map(Array.from({length:200}, (_,i) => [english(i+1),i+1]));
export function matchScriptureCommand(text, translations = []) {
  const spoken = normalizeCommand(text);
  const navigation = {'shepherd next verse':'next','shepherd previous verse':'previous','shepherd next chapter':'nextChapter','shepherd previous chapter':'previousChapter'};
  if (navigation[spoken]) return {action:navigation[spoken]};
  const verse = spoken.match(/^shepherd (?:go to )?verse (.+)$/);
  if (verse) {
    const raw = verse[1].replace(' hundred and ', ' hundred '), n = /^\d{1,3}$/.test(raw) ? Number(raw) : numbers.get(raw);
    return n > 0 && n <= 200 ? {action:'verse', targetVerse:n} : null;
  }
  const translation = spoken.match(/^shepherd (?:switch to|use) (.+)$/);
  if (translation) {
    const candidates = translations.filter(item => [normalizeCommand(item.id),normalizeCommand(item.name),normalizeCommand(item.id.split('').join(' '))].includes(translation[1]));
    if (candidates.length === 1) return {action:'translation', targetTranslation:candidates[0].id};
  }
  return null;
}
