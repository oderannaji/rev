import React, {useEffect, useMemo, useRef, useState} from 'react';
import {prepareSlides, matchSlides, automaticSlide} from './slide-matching.js';

export default function SlideMatches({utterance, slides, preview, addQueue, present, blackout, automatic, setAutomatic}) {
  const [enabled, setEnabled] = useState(true), [result, setResult] = useState({text:'', matches:[]});
  const prepared = useMemo(() => prepareSlides(slides), [slides]);
  const last = useRef(null), presentRef = useRef(present); presentRef.current = present;
  useEffect(() => {
    if (!enabled || !utterance.text) {setResult({text:'', matches:[]}); return;}
    const timer = setTimeout(() => setResult({text:utterance.text, matches:matchSlides(utterance.text, prepared)}), 350);
    return () => clearTimeout(timer);
  }, [utterance, prepared, enabled]);
  useEffect(() => {
    if (!enabled || !automatic || blackout || !utterance.final || !utterance.id || result.text !== utterance.text) return;
    const slide = automaticSlide(result.matches);
    if (!slide || last.current === slide.id) return;
    last.current = slide.id; presentRef.current(slide);
  }, [enabled, automatic, blackout, utterance, result]);
  return <section className="live-scripture" aria-label="Spoken slide matches">
    <div className="section-label">SPOKEN SLIDE MATCHES</div>
    <label className="checkbox-label"><input type="checkbox" checked={enabled} onChange={event => setEnabled(event.target.checked)}/>Suggest slides from the words I speak</label>
    <label className="checkbox-label"><input type="checkbox" checked={automatic} disabled={!enabled} onChange={event => setAutomatic(event.target.checked)}/>Auto-show a unique strong slide match</label>
    <p className="muted">Matches phrases in your saved text slides. Automatic slide display replaces automatic Scripture display. {blackout && automatic ? 'Automatic display is paused during blackout.' : 'Ambiguous matches stay for review.'}</p>
    {!slides.length && <p className="muted">Create or import text slides first.</p>}
    {enabled && result.matches.slice(0, 3).map(({slide, matchedWords}) => <article className="verse-card" key={slide.id}>
      <button className="verse-select" aria-label={`Preview matched slide ${slide.title}`} onClick={() => preview(slide)}><div className="verse-heading"><strong>{slide.title}</strong><span>{matchedWords} matching words</span></div><p>{slide.text.slice(0, 300)}</p></button>
      <button className="button small" onClick={() => addQueue(slide)} aria-label={`Queue matched slide ${slide.title}`}>Add to queue</button>
    </article>)}
  </section>;
}
