import test from 'node:test';
import assert from 'node:assert/strict';
import {defaultCommands, validateCommands, matchCommand, commandPatch} from '../shared/voice-commands.js';
import {validateState} from '../shared/state.js';

test('voice commands require a complete wake phrase and accept validated custom phrases', () => {
  assert.equal(matchCommand('Shepherd, next slide!'), 'next');
  for (const text of ['next slide', 'Our shepherd next slide is about faith', 'Shepherd next slide and then pray', 'Do not say Shepherd next slide']) assert.equal(matchCommand(text), null);
  const commands = {...defaultCommands, next: 'move forward'};
  validateState({voiceCommands: commands});
  assert.equal(matchCommand('Shepherd move forward.', commands), 'next');
  assert.equal(matchCommand('Shepherd next slide', commands), null);
  assert.throws(() => validateCommands({...commands, previous: 'move forward'}), /different/);
  assert.throws(() => validateState({voiceCommands: {...commands, next: ''}}));
});
test('voice navigation respects queue boundaries and preserves blackout unless explicitly resumed', () => {
  const queue = [{id:'a'}, {id:'b'}], state = {queue, live:queue[0], blackout:true};
  assert.deepEqual(commandPatch(state, 'next'), {live:queue[1], preview:queue[1]});
  assert.equal(commandPatch(state, 'previous'), null);
  assert.equal(commandPatch({...state, live:queue[1]}, 'next'), null);
  assert.deepEqual(commandPatch(state, 'resume'), {blackout:false});
  assert.deepEqual(commandPatch(state, 'clear'), {live:null});
  assert.equal(commandPatch({queue:[]}, 'next'), null);
  assert.equal(commandPatch(state, 'present'), null);
});
