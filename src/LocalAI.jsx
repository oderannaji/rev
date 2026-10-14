import React,{useEffect,useState} from 'react';
import {Sparkles,RefreshCw} from 'lucide-react';
const defaults={enabled:false,embeddingModel:'embeddinggemma:latest',draftModel:'qwen3:4b',whisperBinary:'',whisperModel:''};
async function request(path,options){const r=await fetch(path,options),data=await r.json();if(!r.ok)throw Error(data.error);return data;}
export default function LocalAI({translations,notify,fail}){
  const [status,setStatus]=useState(null),[config,setConfig]=useState(defaults),[busy,setBusy]=useState(false);
  const refresh=async()=>{try{const next=await request('/api/local-ai/status');setStatus(next);return next;}catch(e){fail(e);}};
  useEffect(()=>{let active=true;const load=async(first=false)=>{try{const next=await request('/api/local-ai/status');if(active){setStatus(next);if(first)setConfig(next.config);}}catch(e){if(active)fail(e);}};load(true);const timer=setInterval(()=>load(),4000);return()=>{active=false;clearInterval(timer);};},[]);
  const save=async()=>{setBusy(true);try{await request('/api/local-ai/config',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(config)});await refresh();notify('Local AI settings saved');}catch(e){fail(e);}finally{setBusy(false);}};
  const build=async translation=>{setBusy(true);try{await request('/api/local-ai/index',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({translation})});await refresh();notify('Building the neural search index locally');}catch(e){fail(e);}finally{setBusy(false);}};
  const building=status?.semantic?.job?.state==='building';
  return <div className="settings-section local-ai-settings"><div className="section-label"><Sparkles size={14}/> LOCAL AI · M5 / 16 GB</div><p className="muted">Search and drafting use models installed in Ollama on this computer. Speech uses local Whisper with English selected. Start with a built-in microphone test in Transcripts.</p>
    <div className="editor-form"><label className="checkbox-label"><input type="checkbox" checked={config.enabled} onChange={e=>setConfig({...config,enabled:e.target.checked})}/>Enable local AI</label>
    <label>Search model<input aria-label="Local search model" value={config.embeddingModel} onChange={e=>setConfig({...config,embeddingModel:e.target.value})}/></label>
    <label>Drafting model<input aria-label="Local drafting model" value={config.draftModel} onChange={e=>setConfig({...config,draftModel:e.target.value})}/></label>
    <label>Whisper executable<input aria-label="Whisper executable" value={config.whisperBinary} onChange={e=>setConfig({...config,whisperBinary:e.target.value})} placeholder="/Users/you/…/whisper-cli"/></label>
    <label>Whisper model file<input aria-label="Whisper model file" value={config.whisperModel} onChange={e=>setConfig({...config,whisperModel:e.target.value})} placeholder="/Users/you/…/ggml-small.bin"/></label>
    <div className="button-row"><button className="button primary" disabled={busy||building||!status} onClick={save}>Save local AI settings</button><button className="button" onClick={refresh}><RefreshCw size={13}/>Check status</button></div></div>
    <p className="muted">{!status?'Checking local services…':status.ollamaError||`Ollama available · ${status.models.length} local model(s) installed`}</p>
    {status?.models.length>0&&<p className="muted">Installed: {status.models.map(m=>m.name).join(', ')}</p>}
    <p className="muted">{status?.speech.message}</p><p className="muted">{status?.speech.liveAvailable?"Continuous speech engine available; it loads when you start listening.":"Continuous mode needs whisper-server. Run the updated speech-only setup to build it without downloading existing models again."}</p>
    <div className="section-label list-label">NEURAL SEARCH INDEX</div><p className="muted">Build once after installing the search model. Rebuild after changing that model. This may take several minutes; the existing reference and keyword search remains available.</p>
    {translations.map(t=>{const entry=status?.semantic.indexes.find(x=>x.translation===t.id);return <div className="translation-row" key={t.id}><strong>{t.id}</strong><span>{entry?.ready?'Index saved':'Not indexed'}</span><button className="button small" disabled={busy||building||!status?.config.enabled||Boolean(status?.ollamaError)} onClick={()=>build(t.id)}>{entry?.ready?'Rebuild':'Build index'}</button></div>;})}
    {status?.semantic.job&&<p role="status" className={status.semantic.job.error?'inline-error':'muted'}>{status.semantic.job.error||`${status.semantic.job.translation}: ${status.semantic.job.completed.toLocaleString()} / ${status.semantic.job.total.toLocaleString()} verses · ${status.semantic.job.state}`}</p>}
    <details><summary>First-time local setup</summary><p className="muted">For a first speech test, run bash scripts/setup-local-mac.sh --speech-only from your downloaded Shepherd Pro folder. Leave off --speech-only to install search and drafting models too. It installs the selected model files and prints the two Whisper paths to paste above. Internet is needed for installation; these features use local inference afterward. Full instructions are in docs/LOCAL_MAC_SETUP.md.</p></details>
  </div>;
}
