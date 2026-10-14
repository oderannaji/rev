import React from 'react';
import {Copy} from 'lucide-react';
export default function BroadcastConnections({notify,fail}){
  const copy=async path=>{try{await navigator.clipboard.writeText(window.location.origin+path);notify('OBS browser source URL copied');}catch(e){fail(e);}};
  return <div className="settings-section"><div className="section-label">OBS & EASYWORSHIP</div><p className="muted">On this computer, add an OBS Browser source, paste one of these URLs, and set its size to 1920 × 1080. Keep Shepherd Pro open.</p>
    <div className="button-row"><button className="button" onClick={()=>copy('/output?channel=main')}><Copy size={13}/>Copy OBS full-screen URL</button><button className="button" onClick={()=>copy('/output?channel=lowerthird')}><Copy size={13}/>Copy OBS lower-third URL</button></div>
    <p className="muted">Lower thirds have a transparent background. Clear or blackout hides the overlay. The desktop app’s URL can change when it restarts; copy it again if OBS loses the source.</p>
    <details><summary>Connect through NDI to EasyWorship</summary><p className="muted">Install a compatible DistroAV plugin and NDI runtime for OBS, then publish the OBS source or scene as an NDI output. In an EasyWorship version with NDI input support, select that source on the same network. This bridge needs a receiver test; it does not synchronize EasyWorship’s schedule or control its slides. See docs/BROADCAST_SETUP.md.</p></details>
  </div>;
}
