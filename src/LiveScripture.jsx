import React from 'react';
import {Plus,BookOpen} from 'lucide-react';
import {useLiveScripture} from './useLiveScripture.js';
export default function LiveScripture({utterance,translation,preview,addQueue}){
  const [enabled,setEnabled]=React.useState(true),[neural,setNeural]=React.useState(true);
  const detection=useLiveScripture({utterance,translation,enabled,neural});
  return <section className="live-scripture" aria-label="Automatic Scripture suggestions"><div className="section-label"><BookOpen size={14}/> LIVE SCRIPTURE DETECTION</div>
    <label className="checkbox-label"><input type="checkbox" checked={enabled} onChange={e=>setEnabled(e.target.checked)}/>Automatically suggest Scripture as I speak</label>
    <label className="checkbox-label"><input type="checkbox" checked={neural} disabled={!enabled} onChange={e=>setNeural(e.target.checked)}/>Include meaning matches from my neural index</label>
    <p className="muted" role="status">{!enabled?'Automatic detection is paused.':detection.busy?'Checking the latest words…':detection.waiting?'Waiting for the rest of the reference…':detection.results.length?`${detection.kind==='reference'?'Spoken reference':detection.kind==='quotation'?'Quotation':'Possible meaning'} detected. Review before presenting.`:'Listening for references, quotations and meaning. Suggestions update without pressing Find Scripture.'}</p>
    {detection.warning&&<p className="muted">{detection.warning}</p>}
    {enabled&&detection.results.map(v=><article className="verse-card" key={v.id}><button className="verse-select" aria-label={`Preview detected ${v.book} ${v.chapter}:${v.verse}`} onClick={()=>preview(v)}><div className="verse-heading"><strong>{v.book} {v.chapter}:{v.verse}</strong><span>{v.translation}</span></div><p>{v.text}</p><span className="match-reason">{v.reason}</span></button><button className="verse-add icon-button" aria-label={`Add detected ${v.book} ${v.chapter}:${v.verse} to queue`} onClick={()=>addQueue(v)}><Plus size={16}/></button></article>)}
  </section>;
}
