import React, {useEffect, useRef, useState} from 'react';
import {commandActions, defaultCommands, matchCommand, validateCommands} from '../shared/voice-commands.js';

export default function VoiceCommands({utterance, commands = defaultCommands, save, execute}) {
  const [enabled, setEnabled] = useState(false), [draft, setDraft] = useState(commands), [message, setMessage] = useState('');
  const last = useRef(null), executeRef = useRef(execute); executeRef.current = execute;
  useEffect(() => {setDraft(commands);}, [commands]);
  useEffect(() => {
    // Only completed microphone phrases from live mode can control output.
    if (!utterance.final || !utterance.id || last.current === utterance.id) return;
    last.current = utterance.id;
    if (!enabled) return;
    const action = matchCommand(utterance.text, commands);
    if (action) {executeRef.current(action); setMessage(`Command received: ${commandActions.find(([key]) => key === action)[1]}.`);}
  }, [utterance, enabled, commands]);
  return <section className="live-scripture" aria-label="Voice controls">
    <div className="section-label">VOICE CONTROLS</div>
    <label className="checkbox-label"><input type="checkbox" checked={enabled} onChange={event => setEnabled(event.target.checked)}/>Enable voice commands for this session</label>
    <p className="muted">In continuous mode, say “Shepherd, next slide” as a separate phrase, then pause. Only completed phrases act. Blackout stays on when moving through the queue; say “Shepherd, resume output” to show it again.</p>
    <details><summary>Customize command phrases</summary><div className="editor-form">
      {commandActions.map(([action, label]) => <label key={action}>{label}<input aria-label={`${label} voice phrase`} maxLength={80} value={draft[action]} onChange={event => setDraft(current => ({...current, [action]: event.target.value}))}/></label>)}
      <p className="muted">Enter the words after “Shepherd”. Saved phrases are included in your backup; enabling voice commands is a session choice.</p>
      <button className="button small" onClick={() => {try {validateCommands(draft); save({...draft}); setMessage('Command phrases saved.');} catch (error) {setMessage(error.message);}}}>Save command phrases</button>
    </div></details>
    {message && <p className="muted" role="status">{message}</p>}
  </section>;
}
