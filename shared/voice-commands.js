export const commandActions = [
  ['next', 'Next queue item', 'next slide'],
  ['previous', 'Previous queue item', 'previous slide'],
  ['present', 'Take preview live', 'take live'],
  ['blackout', 'Blackout output', 'blackout'],
  ['resume', 'Resume output', 'resume output'],
  ['clear', 'Clear live output', 'clear output'],
];
export const defaultCommands = Object.fromEntries(commandActions.map(([action,,phrase]) => [action, phrase]));
export function normalizeCommand(text) {
  return String(text).toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}
export function validateCommands(commands) {
  if (!commands || typeof commands !== 'object' || Array.isArray(commands)) throw Error('Command phrases must be an object.');
  const phrases = new Set();
  for (const [action] of commandActions) {
    const value = commands[action];
    if (typeof value !== 'string' || value.length > 80 || !normalizeCommand(value)) throw Error('Enter a command phrase of 1–80 characters for every action.');
    const phrase = normalizeCommand(value);
    if (phrase.startsWith('shepherd ') || phrase === 'shepherd') throw Error('Enter the phrase after “Shepherd”; the app adds that word.');
    if (phrases.has(phrase)) throw Error('Each action needs a different command phrase.');
    phrases.add(phrase);
  }
  if (Object.keys(commands).some(key => !(key in defaultCommands))) throw Error('Unknown voice command action.');
  return commands;
}
export function matchCommand(text, commands = defaultCommands) {
  const spoken = normalizeCommand(text);
  return commandActions.find(([action]) => spoken === `shepherd ${normalizeCommand(commands[action])}`)?.[0] || null;
}
export function commandPatch(state, action) {
  if (action === 'blackout') return {blackout: true};
  if (action === 'resume') return {blackout: false};
  if (action === 'clear') return {live: null};
  if (action === 'present') return state.preview ? {live: state.preview, blackout: false} : null;
  if (action === 'next' || action === 'previous') {
    const queue = state.queue || [], index = queue.findIndex(item => item.id === state.live?.id);
    const target = index < 0 ? (action === 'next' ? 0 : -1) : index + (action === 'next' ? 1 : -1);
    if (queue[target]) return {live: queue[target], preview: queue[target + 1] || queue[target]};
  }
  return null;
}
