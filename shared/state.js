const plain=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
function invalid(){throw Object.assign(new Error('Invalid backup or service state. Expected valid queue, slides, sessions, and theme fields.'),{status:400});}
function str(x,max){return typeof x==='string'&&x.length<=max;}
function item(x){if(!plain(x)||!str(x.id,100)||!x.id||!str(x.title??'',500)||!str(x.text??'',100000))invalid();if(x.mediaUrl!==undefined&&(!str(x.mediaUrl,250)||!/^\/media\/[a-f0-9-]+\.(png|jpg|webp|gif|mp4|webm)$/.test(x.mediaUrl)))invalid();}
export function validateState(s){
 if(!plain(s))invalid();
 for(const key of ['queue','slides'])if(s[key]!==undefined){if(!Array.isArray(s[key])||s[key].length>3000)invalid();const ids=new Set();for(const x of s[key]){item(x);if(ids.has(x.id))invalid();ids.add(x.id);}}
 for(const key of ['preview','live'])if(s[key]!==undefined&&s[key]!==null)item(s[key]);
 for(const key of ['sessions','drafts'])if(s[key]!==undefined){if(!Array.isArray(s[key])||s[key].length>2000)invalid();for(const x of s[key])if(!plain(x)||!str(x.id,100)||!str(x.text,500000)||!str(x.title??'',500))invalid();}
 if(s.media!==undefined&&!Array.isArray(s.media))invalid();
 if(s.notes!==undefined&&!str(s.notes,100000))invalid();if(s.alert!==undefined&&!str(s.alert,2000))invalid();if(s.blackout!==undefined&&typeof s.blackout!=='boolean')invalid();
 if(s.theme!==undefined){const t=s.theme;if(!plain(t))invalid();if(t.name!==undefined&&!str(t.name,80))invalid();for(const key of ['background','color'])if(t[key]!==undefined&&!/^#[\da-f]{6}$/i.test(t[key]))invalid();if(t.fontFamily!==undefined&&!['Georgia, serif','Arial, sans-serif',"'Courier New', monospace"].includes(t.fontFamily))invalid();if(t.fontSize!==undefined&&(!Number.isFinite(t.fontSize)||t.fontSize<24||t.fontSize>100))invalid();if(t.align!==undefined&&!['left','center','right'].includes(t.align))invalid();if(t.motion!==undefined&&!['none','aurora','glow'].includes(t.motion))invalid();}
 return s;
}
