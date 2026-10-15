import React, {useState} from 'react';
export default function ScriptureNavigation({item, navigate, translations}) {
  const [verse,setVerse] = useState('');
  if (!item) return null;
  return <section className="scripture-navigation" aria-label="Scripture navigation"><strong>{item.reference} · {item.translation}</strong>
    <div className="button-row"><button className="button small" onClick={()=>navigate('previous')}>Previous verse</button><button className="button small" onClick={()=>navigate('next')}>Next verse</button><button className="button small" onClick={()=>navigate('previousChapter')}>Previous chapter</button><button className="button small" onClick={()=>navigate('nextChapter')}>Next chapter</button></div>
    <form className="button-row" onSubmit={event=>{event.preventDefault();void navigate('verse',{targetVerse:Number(verse)});}}><label>Jump to verse<input aria-label="Jump to verse" type="number" min="1" max="200" value={verse} onChange={event=>setVerse(event.target.value)}/></label><button className="button small" disabled={!verse}>Go to verse</button><label>Displayed translation<select aria-label="Displayed translation" value={item.translation} onChange={event=>navigate('translation',{targetTranslation:event.target.value})}>{translations.map(t=><option value={t.id} key={t.id}>{t.id}</option>)}</select></label></form>
  </section>;
}
