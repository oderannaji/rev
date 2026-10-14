import {createHash,randomUUID} from 'node:crypto';
import {readFile,writeFile,rename,mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {problem} from './local-ai.js';

const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
function unit(vector,dimension) {
  if(!Array.isArray(vector) || !vector.length || vector.length>4096 || (dimension && vector.length!==dimension) || vector.some(n=>typeof n!=='number'||!Number.isFinite(n)))throw problem('Invalid embedding dimensions or values.',502);
  const norm=Math.hypot(...vector);if(norm<1e-12)throw problem('Embedding model returned an empty vector.',502);
  return vector.map(n=>n/norm);
}
export function createSemantic({dataDir,engine,config,ollama}) {
  const dir=join(dataDir,'semantic'),cache=new Map();
  let job=null,controller=null;
  const identity=(translation,model)=>{
    const rows=engine.rows(translation);
    return {rows,key:hash({version:1,translation,model,rows}),model,translation};
  };
  async function load(info) {
    if(cache.has(info.key))return cache.get(info.key);
    try {
      const meta=JSON.parse(await readFile(join(dir,info.key+'.json'),'utf8'));
      if(meta.key!==info.key || meta.count!==info.rows.length || !Number.isInteger(meta.dimension) || meta.dimension<1 || meta.dimension>4096 || !meta.digest)return null;
      const bytes=await readFile(join(dir,info.key+'.f32'));
      if(bytes.length!==meta.count*meta.dimension*4)return null;
      const vectors=new Float32Array(meta.count*meta.dimension);for(let i=0;i<vectors.length;i++){vectors[i]=bytes.readFloatLE(i*4);if(!Number.isFinite(vectors[i]))return null;}
      const index={...meta,vectors};cache.set(info.key,index);return index;
    } catch {return null;}
  }
  const status=async()=>({job, indexes:await Promise.all(engine.list().map(async t=>{const info=identity(t.id,config.get().embeddingModel),index=await load(info);return {translation:t.id,count:t.count,ready:Boolean(index),model:info.model};}))});
  async function build(translation) {
    if(job?.state==='building')throw problem('A search index is already being built.',409);
    const settings=config.get();if(!settings.enabled)throw problem('Enable local AI in Settings first.');
    const info=identity(translation,settings.embeddingModel);
    job={state:'building',translation,completed:0,total:info.rows.length,error:null};controller=new AbortController();
    const signal=controller.signal;
    // Run in the background; the status route reports progress and failures.
    void (async()=>{
      try {
        const installed=await ollama.installed(info.model);
        let dimension=0,vectors;
        for(let offset=0;offset<info.rows.length;offset+=64){
          signal.throwIfAborted();
          const rows=info.rows.slice(offset,offset+64);
          const embedded=await ollama.embed(info.model,rows.map(v=>`title: ${v.book} ${v.chapter}:${v.verse} | text: ${v.text}`),signal);
          for(let j=0;j<embedded.length;j++){
            const vector=unit(embedded[j],dimension);if(!dimension){dimension=vector.length;vectors=new Float32Array(info.rows.length*dimension);}
            vectors.set(vector,(offset+j)*dimension);
          }
          job={...job,completed:Math.min(info.rows.length,offset+rows.length)};
        }
        if((await ollama.installed(info.model)).digest!==installed.digest)throw problem('The model changed during indexing. Build the index again.');
        signal.throwIfAborted();await mkdir(dir,{recursive:true});
        const meta={key:info.key,model:info.model,digest:installed.digest,count:info.rows.length,dimension,builtAt:new Date().toISOString()};
        const bytes=Buffer.allocUnsafe(vectors.length*4);for(let i=0;i<vectors.length;i++)bytes.writeFloatLE(vectors[i],i*4);
        const temp=join(dir,`${info.key}.${randomUUID()}.tmp`);await writeFile(temp,bytes,{mode:0o600});await rename(temp,join(dir,info.key+'.f32'));
        const metaTemp=temp+'.json';await writeFile(metaTemp,JSON.stringify(meta),{mode:0o600});await rename(metaTemp,join(dir,info.key+'.json'));
        cache.set(info.key,{...meta,vectors});job={...job,state:'ready'};
      } catch(e){job={...job,state:'error',error:signal.aborted?'Index build stopped.':e.message};}
    })();
    return {...job};
  }
  async function search(query,{translation='BSB',limit=50}={}) {
    query=String(query??'').trim().slice(0,500);
    if(!query)return {results:[],total:0,method:'Local neural + keyword retrieval'};
    if(engine.parseReference(query,translation))return engine.search(query,{translation,limit,mode:'reference'});
    const settings=config.get();if(!settings.enabled)throw problem('Enable local AI and build a search index in Settings.');
    const begin=performance.now(),info=identity(translation,settings.embeddingModel),index=await load(info);
    if(!index)throw problem('Build this translation’s neural search index in Settings first.');
    if((await ollama.installed(info.model)).digest!==index.digest)throw problem('The embedding model changed. Rebuild the search index in Settings.');
    const [raw]=await ollama.embed(info.model,[`task: search result | query: ${query}`]);const vector=unit(raw,index.dimension);
    const semantic=info.rows.map((row,i)=>{let score=0;for(let j=0;j<index.dimension;j++)score+=vector[j]*index.vectors[i*index.dimension+j];return {row,score};}).filter(x=>x.score>=0.2).sort((a,b)=>b.score-a.score).slice(0,100);
    const lexical=engine.search(query,{translation,limit:100}).results,scores=new Map();
    semantic.forEach(({row,score},rank)=>scores.set(row.id,{...row,similarity:Number(score.toFixed(4)),score:1/(60+rank+1),reason:'Neural meaning match'}));
    lexical.forEach((row,rank)=>{const previous=scores.get(row.id);scores.set(row.id,{...(previous||row),score:(previous?.score||0)+1/(60+rank+1),reason:previous?'Neural + keyword match':'Keyword match'});});
    const rows=[...scores.values()].sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id));
    return {results:rows.slice(0,limit),total:rows.length,method:'Local neural + keyword retrieval',model:info.model,elapsedMs:Number((performance.now()-begin).toFixed(2))};
  }
  return {status,build,search,stop:()=>controller?.abort()};
}
