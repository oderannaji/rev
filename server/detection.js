import {problem} from './local-ai.js';
const words=text=>String(text).toLowerCase().normalize('NFKD').replace(/\p{M}/gu,'').replace(/[^\p{L}\p{N}]+/gu,' ').trim().split(/\s+/).filter(Boolean);
function longestQuote(a,b){let best=0,previous=new Uint16Array(b.length+1);for(const word of a){const row=new Uint16Array(b.length+1);for(let j=0;j<b.length;j++)if(word===b[j]){row[j+1]=previous[j]+1;best=Math.max(best,row[j+1]);}previous=row;}return best;}
export function createDetector({engine,semantic}){
  const cache=new Map();
  async function detect(input){
    if(!input||typeof input.text!=='string'||input.text.length>1500||input.neural!==undefined&&typeof input.neural!=='boolean'||input.final!==undefined&&typeof input.final!=='boolean')throw problem('Provide up to 1,500 characters of transcript text.',400);
    const translation=input.translation||'BSB';if(!engine.list().some(t=>t.id===translation))throw problem('Unknown translation',400);
    const text=input.text.trim(),tokens=words(text);if(!text)return {results:[],kind:'none',context:input.context||null};
    let context=null;if(input.context){if(typeof input.context.book!=='string'||input.context.book.length>60||!Number.isInteger(input.context.chapter)||input.context.chapter<1||input.context.chapter>200)throw problem('Invalid previous scripture context.',400);context={book:input.context.book,chapter:input.context.chapter};}
    const references=engine.findReferences(text,translation);let reference=references.at(-1);
    if(reference)context={book:reference.book,chapter:reference.chapter};
    // Follow-up callouts use only the remainder after the latest explicit reference.
    const remainder=reference?.after??engine.spokenNumbers(text);
    if(context){const follow=[...remainder.matchAll(/\b(?:chapter\s+(\d{1,3})\s*(?:verse[s]?|:)\s*|verse[s]?\s+)(\d{1,3})(?:\s*(?:through|to|and|-)\s*(\d{1,3}))?/gi)].at(-1);if(follow)reference={book:context.book,chapter:follow[1]?Number(follow[1]):context.chapter,start:Number(follow[2]),end:Number(follow[3]||follow[2]),after:remainder.slice(follow.index+follow[0].length)};}
    if(reference){
      context={book:reference.book,chapter:reference.chapter};
      const incomplete=input.final===false&&((reference.start===null&&!reference.after.trim())||/^(?:verses?|:|through|to|-)\s*$/i.test(reference.after.trim()));
      if(incomplete)return {results:[],kind:'incomplete-reference',context,waiting:true};
      const results=engine.chapter(reference.book,reference.chapter,translation).filter(v=>reference.start===null||(v.verse>=reference.start&&v.verse<=reference.end)).slice(0,12).map(v=>({...v,reason:reference.start===null?'Spoken chapter reference':'Spoken verse reference'}));
      return {results,kind:'reference',context:results.length?context:(input.context||null),explicitVerse:reference.start!==null,reference:{...context,start:reference.start,end:reference.end},warning:results.length?null:'The spoken reference is outside the selected translation.'};
    }
    if(tokens.length<5)return {results:[],kind:'none',context};
    const lexical=engine.search(text,{translation,limit:25}).results;
    const quotations=lexical.map(v=>({...v,matchedWords:longestQuote(tokens,words(v.text))})).filter(v=>v.matchedWords>=6).sort((a,b)=>b.matchedWords-a.matchedWords).slice(0,6).map(v=>({...v,reason:`Quotation match · ${v.matchedWords} consecutive words`}));
    if(quotations.length)return {results:quotations,kind:'quotation',context};
    if(input.neural){
      const key=JSON.stringify([translation,text]),old=cache.get(key);if(old&&Date.now()-old.at<30000)return {...old.value,context};
      try{const found=await semantic.search(text,{translation,limit:8});const results=found.results.filter(v=>v.similarity>=.55).slice(0,6).map(v=>({...v,reason:'Possible meaning match · review before presenting'}));const value={results,kind:results.length?'meaning':'none',context};cache.set(key,{at:Date.now(),value});if(cache.size>50)cache.delete(cache.keys().next().value);return value;}
      catch(e){return {results:[],kind:'none',context,warning:e.status?e.message:'Meaning search is currently unavailable.'};}
    }
    return {results:[],kind:'none',context};
  }
  return {detect};
}
