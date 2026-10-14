import http from 'node:http';
import {createLocalConfig,createOllama} from './local-ai.js';
import {createSemantic} from './semantic.js';
import {createSpeech} from './speech.js';
import {validateState} from '../shared/state.js';
import {readFile,writeFile,mkdir,readdir,rename,stat} from 'node:fs/promises';
import {resolve,join,extname,dirname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomUUID} from 'node:crypto';
import {contentStatus,generateContent} from './content.js';
import {createSearchEngine} from './search.js';
const projectRoot=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.gif':'image/gif','.mp4':'video/mp4','.webm':'video/webm','.woff2':'font/woff2','.ico':'image/x-icon'};
const mediaTypes=new Map([['image/png','.png'],['image/jpeg','.jpg'],['image/webp','.webp'],['image/gif','.gif'],['video/mp4','.mp4'],['video/webm','.webm']]);
function fail(message,status=400){return Object.assign(new Error(message),{status});}
const object=(x)=>x!==null&&typeof x==='object'&&!Array.isArray(x);
export function validateTranslation(value){
 if(!object(value)||!/^[-A-Z0-9_]{2,20}$/.test(value.id??'')||typeof value.name!=='string'||!value.name.trim()||value.name.length>100||!Array.isArray(value.verses)||!value.verses.length||value.verses.length>50000)throw fail('Translation requires an uppercase ID, name, and 1–50,000 verses');
 const seen=new Set();const verses=value.verses.map(v=>{if(!object(v)||typeof v.book!=='string'||!v.book.trim()||v.book.length>60||!/^[\p{L}\p{N} .'-]+$/u.test(v.book)||!Number.isInteger(v.chapter)||v.chapter<1||v.chapter>200||!Number.isInteger(v.verse)||v.verse<1||v.verse>200||typeof v.text!=='string'||!v.text.trim()||v.text.length>5000)throw fail('Each verse needs a book, chapter, verse number, and text');const key=`${v.book}:${v.chapter}:${v.verse}`;if(seen.has(key))throw fail('Duplicate verse reference');seen.add(key);return {book:v.book.trim(),chapter:v.chapter,verse:v.verse,text:v.text.trim()};});
 return {id:value.id,name:value.name.trim(),verses};
}
async function atomic(path,value){const temp=`${path}.${randomUUID()}.tmp`;await writeFile(temp,JSON.stringify(value),{mode:0o600});await rename(temp,path);}
async function body(req,max=10*1024*1024){const parts=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>max)throw fail('Request is too large',413);parts.push(chunk);}try{return JSON.parse(Buffer.concat(parts).toString('utf8'));}catch{throw fail('Invalid JSON body');}}
export async function createServer({root=projectRoot,dataDir=process.env.DATA_DIR||join(root,'.local'),translations,ollama:createOllamaOverride,speechExecute}={}){
 await mkdir(join(dataDir,'translations'),{recursive:true});await mkdir(join(dataDir,'media'),{recursive:true});
 if(!translations)translations=[JSON.parse(await readFile(join(root,'data','BSB.json'),'utf8'))];
 const engine=createSearchEngine(translations.map(validateTranslation));
 for(const file of await readdir(join(dataDir,'translations')))if(file.endsWith('.json')){try{const data=validateTranslation(JSON.parse(await readFile(join(dataDir,'translations',file),'utf8')));if(!engine.list().some(x=>x.id===data.id))engine.addTranslation(data);}catch{console.warn(`Ignored invalid local translation file: ${file}`);}}
 const localConfig=await createLocalConfig(dataDir),ollama=createOllamaOverride||createOllama();
 const semantic=createSemantic({dataDir,engine,config:localConfig,ollama}),speech=createSpeech({config:localConfig,...(speechExecute?{execute:speechExecute}:{})});
 let state={};try{const loaded=JSON.parse(await readFile(join(dataDir,'state.json'),'utf8'));state=validateState(loaded);}catch(e){if(e.code!=='ENOENT')console.warn('Local state could not be loaded; starting with an empty state');}
 const listeners=new Set();let writeQueue=Promise.resolve();
 const broadcast=()=>{for(const response of listeners)response.write(`data: ${JSON.stringify(state)}\n\n`);};
 const server=http.createServer(async(req,res)=>{
  const headers={'X-Content-Type-Options':'nosniff','Referrer-Policy':'same-origin','Cache-Control':'no-store'};
  const json=(data,status=200)=>{res.writeHead(status,{...headers,'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(data));};
  try{
   const host=req.headers.host??'';if(!/^(?:127\.0\.0\.1|localhost|\[::1\])(?::\d+)?$/.test(host))throw fail('Invalid host',403);
   const url=new URL(req.url,`http://${host}`);const path=url.pathname;
   if(['POST','PUT','DELETE','PATCH'].includes(req.method)){
    if(req.headers.origin&&req.headers.origin!==`http://${host}`)throw fail('Cross-origin writes are not allowed',403);
    if(req.headers['sec-fetch-site']==='cross-site')throw fail('Cross-site writes are not allowed',403);
    if(!(req.headers['content-type']??'').startsWith('application/json'))throw fail('Content-Type must be application/json',415);
   }
   if(req.method==='GET'&&path==='/api/health')return json({ok:true,app:'Shepherd Pro',search:'local'});
   if(req.method==='GET'&&path==='/api/local-ai/status'){
    let models=[],ollamaError=null;try{models=await ollama.models();}catch(e){ollamaError=e.message;}
    return json({config:localConfig.get(),models:models.map(m=>({name:m.name,size:m.size})),ollamaError,semantic:await semantic.status(),speech:await speech.status()});
   }
   if(req.method==='PUT'&&path==='/api/local-ai/config'){
    if((await semantic.status()).job?.state==='building'||(await speech.status()).busy)throw fail('Wait for indexing or transcription to finish before changing settings.',409);
    return json(await localConfig.save(await body(req,10000)));
   }
   if(req.method==='POST'&&path==='/api/local-ai/index'){const input=await body(req,1000);return json(await semantic.build(input.translation||'BSB'),202);}
   if(req.method==='POST'&&path==='/api/speech/prepare'){await body(req,1000);await speech.prepare();return json({ready:true});}
   if(req.method==='POST'&&path==='/api/speech/prepare'){await body(req,1000);await speech.prepare();return json({ready:true});}
   if(req.method==='GET'&&path==='/api/speech/status')return json(await speech.status());
   if(req.method==='POST'&&path==='/api/speech/transcribe')return json(await speech.transcribe(await body(req,5700000)));
   if(req.method==='GET'&&path==='/api/content/status'){
    const c=localConfig.get();if(!c.enabled)return json(contentStatus());
    try{await ollama.installed(c.draftModel);return json({configured:true,local:true,model:c.draftModel});}catch(e){return json({configured:false,local:true,model:c.draftModel,error:e.message});}
   }
   if(req.method==='POST'&&path==='/api/content/generate')return json(await generateContent(await body(req,100000),process.env,{config:localConfig.get(),ollama}));
   if(req.method==='GET'&&path==='/api/translations')return json(engine.list());
   if(req.method==='POST'&&path==='/api/translations'){
    const translation=validateTranslation(await body(req,30*1024*1024));if(engine.list().some(t=>t.id===translation.id))throw fail('That translation ID already exists',409);
    // Exclusive file creation protects simultaneous imports with the same ID.
    try{await writeFile(join(dataDir,'translations',`${translation.id}.json`),JSON.stringify(translation),{flag:'wx',mode:0o600});}catch(e){if(e.code==='EEXIST')throw fail('That translation ID already exists',409);throw e;}
    engine.addTranslation(translation);return json({id:translation.id,name:translation.name,count:translation.verses.length},201);
   }
   if(req.method==='GET'&&path==='/api/search'){
    const mode=url.searchParams.get('mode')??'smart';if(!['smart','reference','exact','concept','neural'].includes(mode))throw fail('Unknown search mode');
    const limit=Number(url.searchParams.get('limit')??50);if(!Number.isInteger(limit)||limit<1||limit>200)throw fail('Limit must be 1–200');
    const options={mode,translation:url.searchParams.get('translation')??'BSB',limit};
    return json(mode==='neural'?await semantic.search(url.searchParams.get('q'),options):engine.search(url.searchParams.get('q'),options));
   }
   if(req.method==='GET'&&path==='/api/chapter')return json({results:engine.chapter(url.searchParams.get('book')??'',url.searchParams.get('chapter'),url.searchParams.get('translation')??'BSB')});
   if(req.method==='GET'&&path==='/api/state')return json(state);
   if(req.method==='PUT'&&path==='/api/state'){
    const next=await body(req);validateState(next);
    const saving=writeQueue.then(async()=>{await atomic(join(dataDir,'state.json'),next);state=next;broadcast();});writeQueue=saving.catch(()=>{});await saving;return json(state);
   }
   if(req.method==='GET'&&path==='/api/events'){
    res.writeHead(200,{...headers,'Content-Type':'text/event-stream','Connection':'keep-alive','X-Accel-Buffering':'no'});res.write(`data: ${JSON.stringify(state)}\n\n`);listeners.add(res);
    const timer=setInterval(()=>res.write(': keepalive\n\n'),20000);timer.unref();req.on('close',()=>{clearInterval(timer);listeners.delete(res);});return;
   }
   if(req.method==='GET'&&path==='/api/media'){
    const entries=[];for(const file of await readdir(join(dataDir,'media')))if(file.endsWith('.json'))try{entries.push(JSON.parse(await readFile(join(dataDir,'media',file),'utf8')));}catch{}return json(entries);
   }
   if(req.method==='POST'&&path==='/api/media'){
    const input=await body(req,28*1024*1024);if(!object(input)||typeof input.name!=='string'||!input.name.trim()||input.name.length>200||!mediaTypes.has(input.type)||typeof input.data!=='string'||!input.data||input.data.length%4!==0||!/^[A-Za-z0-9+/]*={0,2}$/.test(input.data))throw fail('Upload a PNG, JPEG, WebP, GIF, MP4, or WebM encoded as base64');
    const bytes=Buffer.from(input.data,'base64');if(bytes.length>20*1024*1024)throw fail('Media must be at most 20 MB',413);
    const signatureOk=input.type==='image/png'?bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])):input.type==='image/jpeg'?bytes[0]===255&&bytes[1]===216&&bytes[2]===255:input.type==='image/gif'?/^GIF8[79]a/.test(bytes.subarray(0,6).toString()):input.type==='image/webp'?bytes.subarray(0,4).toString()==='RIFF'&&bytes.subarray(8,12).toString()==='WEBP':input.type==='video/mp4'?bytes.subarray(4,8).toString()==='ftyp':bytes.subarray(0,4).equals(Buffer.from([26,69,223,163]));
    if(!signatureOk)throw fail('File content does not match its media type');
    const id=randomUUID(),file=`${id}${mediaTypes.get(input.type)}`;const record={id,name:input.name.trim(),type:input.type,url:`/media/${file}`};await writeFile(join(dataDir,'media',file),bytes,{mode:0o600});await atomic(join(dataDir,'media',`${id}.json`),record);return json(record,201);
   }
   if(path.startsWith('/api/'))throw fail('API route not found',404);
   if(req.method!=='GET'&&req.method!=='HEAD')throw fail('Method not allowed',405);
   let file;
   if(path.startsWith('/media/')){if(!/^\/media\/[a-f0-9-]+\.(png|jpg|webp|gif|mp4|webm)$/.test(path))throw fail('Media not found',404);file=join(dataDir,'media',path.slice(7));}
   else{let decoded;try{decoded=decodeURIComponent(path);}catch{throw fail('Invalid path');}if(decoded.includes('\0')||decoded.split(/[\\/]/).includes('..'))throw fail('Invalid path',403);const base=resolve(root,'dist');file=resolve(base,`.${decoded}`);if(file!==base&&!file.startsWith(base+sep))throw fail('Invalid path',403);try{if(!(await stat(file)).isFile())file=join(base,'index.html');}catch{if(extname(file))throw fail('File not found',404);file=join(base,'index.html');}}
   let data;try{data=await readFile(file);}catch{throw fail('File not found; run npm run build first',404);}
   res.writeHead(200,{...headers,'Content-Type':mime[extname(file)]??'application/octet-stream','Content-Length':data.length});res.end(req.method==='HEAD'?undefined:data);
  }catch(e){if(!res.headersSent)json({error:e.status?e.message:'Internal server error'},e.status??500);else res.end();if(!e.status)console.error('Request failed:',e.message);}
 });
 server.on('close',()=>{semantic.stop();speech.stop();speech.stop();for(const listener of listeners)listener.end();listeners.clear();});
 server.engine=engine;server.stopServices=()=>{semantic.stop();speech.stop();};return server;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const server=await createServer();for(const signal of ['SIGINT','SIGTERM'])process.once(signal,()=>{server.stopServices();server.closeAllConnections();server.close(()=>process.exit(0));});server.listen(Number(process.env.PORT??4173),'127.0.0.1',()=>{const port=server.address().port;console.log(`Shepherd Pro ready at http://127.0.0.1:${port}`);process.send?.({type:'ready',port});});
}
