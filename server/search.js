/** Independent local retrieval: reference parsing, token ranking, and explicit concept expansion. */
const normalize = (text) => String(text).toLowerCase().normalize('NFKD').replace(/\p{M}/gu, '').replace(/[’']/g, '').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
const stop = new Set('a an and are as at be by for from has have he her him his i in is it its me my of on or our that the their them they this to was we were who will with you your'.split(' '));
const tokens = (text) => normalize(text).split(' ').filter(x => x && !stop.has(x));
const concepts = {
 anxiety: ['anxious','worry','worried','fear','peace'], anxious: ['anxiety','worry','fear','peace'], worry: ['anxious','fear','peace'],
 forgiveness: ['forgive','forgiven','mercy','pardon'], forgive: ['forgiveness','forgiven','mercy','pardon'],
 hope: ['trust','confidence','endurance'], grief: ['sorrow','mourn','comfort','tears'], comfort: ['comforted','sorrow','rest'],
 salvation: ['saved','save','redeem','redemption'], faith: ['believe','believed','trust'], love: ['loved','loves','loving','charity'],
 strength: ['strong','power','mighty'], generosity: ['give','giving','poor','generous'], prayer: ['pray','prayed','praying'],
 peace: ['rest','quiet','anxious'], resurrection: ['risen','raised','rise'], joy: ['rejoice','glad','gladness'],
};
const aliasGroups = {
 Genesis:['gen','ge','gn'], Exodus:['ex','exo','exod'], Leviticus:['lev','lv'], Numbers:['num','nu','nm'], Deuteronomy:['deut','dt'], Joshua:['josh','jos'], Judges:['judg','jdg'], Ruth:['ru'], Psalms:['ps','psa','psalm'], Proverbs:['prov','pr'], Ecclesiastes:['eccl','ecc'], 'Song of Solomon':['song','song of songs','sos','canticles'], Isaiah:['isa','is'], Jeremiah:['jer'], Lamentations:['lam'], Ezekiel:['ezek','eze'], Daniel:['dan','dn'], Hosea:['hos'], Joel:['jl'], Amos:['am'], Obadiah:['obad'], Jonah:['jon'], Micah:['mic'], Nahum:['nah'], Habakkuk:['hab'], Zephaniah:['zeph'], Haggai:['hag'], Zechariah:['zech'], Malachi:['mal'], Matthew:['matt','mt'], Mark:['mk','mrk'], Luke:['lk'], John:['jn','jhn'], Acts:['ac'], Romans:['rom','ro'], Galatians:['gal'], Ephesians:['eph'], Philippians:['phil','php'], Colossians:['col'], Titus:['tit'], Philemon:['phlm','phm'], Hebrews:['heb'], James:['jas'], Jude:['jud'], Revelation:['rev','revelations'],
};
for (const [book,shorts] of Object.entries({Samuel:['sam','sa'],Kings:['kgs','ki'],Chronicles:['chron','chr','ch'],Corinthians:['cor','co'],Thessalonians:['thess','thes'],Timothy:['tim','ti'],Peter:['pet','pe'],John:['jn','jhn']})) for (const n of [1,2,...(book==='John'?[3]:[])]) aliasGroups[`${n} ${book}`]=shorts.map(s=>`${n} ${s}`);
const small = {zero:0,one:1,first:1,two:2,second:2,three:3,third:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10,eleven:11,twelve:12,thirteen:13,fourteen:14,fifteen:15,sixteen:16,seventeen:17,eighteen:18,nineteen:19,twenty:20,thirty:30,forty:40,fifty:50,sixty:60,seventy:70,eighty:80,ninety:90};
function spokenNumbers(text) {
 const parts=text.toLowerCase().replace(/(?<=[a-z])-(?=[a-z])/g,' ').split(/\b/);
 // Consume adjacent number words ("twenty three", "one hundred nineteen").
 return parts.join('').replace(/\b(?:zero|one|first|two|second|three|third|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred)(?:[ -]+(?:one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred))*\b/g,m=>{let n=0; for(const word of m.split(/[ -]+/)) n=word==='hundred'?Math.max(n,1)*100:n+(small[word]??0); return String(n);});
}
function oneEdit(a,b) {
 if(Math.abs(a.length-b.length)>1) return false;
 if(a.length===b.length) {const differences=[]; for(let i=0;i<a.length;i++) if(a[i]!==b[i]) differences.push(i); return differences.length===1 || (differences.length===2 && differences[1]===differences[0]+1 && a[differences[0]]===b[differences[1]] && a[differences[1]]===b[differences[0]]);}
 if(a.length>b.length) [a,b]=[b,a];
 let i=0,j=0,miss=0; while(i<a.length&&j<b.length) {if(a[i]===b[j]){i++;j++;}else{if(++miss>1)return false;j++;}} return true;
}
export function createSearchEngine(translations=[]) {
 const libraries=new Map();
 function addTranslation(translation){
  const books=new Map(), aliases=new Map(), postings=new Map();
  const rows=translation.verses.map((v,i)=>{if(!books.has(v.book))books.set(v.book,[]);books.get(v.book).push(i);const words=tokens(v.text);for(const word of new Set(words)){if(!postings.has(word))postings.set(word,[]);postings.get(word).push(i);}return {...v,id:`${translation.id}:${v.book}:${v.chapter}:${v.verse}`,translation:translation.id,_normal:normalize(v.text),_length:words.length};});
  for(const book of books.keys()){const canonical=book.replace(/^(III|II|I) /, (_,roman)=>({I:1,II:2,III:3}[roman])+' ').replace(/^Revelation of John$/, 'Revelation').replace(/^Psalm$/, 'Psalms'); aliases.set(normalize(book),book); aliases.set(normalize(canonical),book); for(const alias of aliasGroups[canonical]??[])aliases.set(normalize(alias),book);}
  libraries.set(translation.id,{id:translation.id,name:translation.name,rows,books,aliases,postings});
 }
 translations.forEach(addTranslation);
 const get=(id)=>{const lib=libraries.get(id);if(!lib){const e=new Error('Unknown translation');e.status=400;throw e;}return lib;};
 function parseReference(query,translation='BSB'){
  const lib=get(translation);let q=spokenNumbers(query).replace(/[.]/g,'').replace(/\bchapter\s*/g,' ').replace(/\bverses?\s*/g,':').replace(/\b(?:through|to|thru)\b/g,'-').replace(/\s+/g,' ').trim();
  const m=q.match(/^(.+?)\s*(\d{1,3})(?:\s*[: ]\s*(\d{1,3})(?:\s*-\s*(\d{1,3}))?)?$/);
  if(!m)return null;const book=lib.aliases.get(normalize(m[1]));if(!book)return null;
  const chapter=Number(m[2]),start=m[3]?Number(m[3]):null,end=m[4]?Number(m[4]):start;
  if(chapter<1||(start!==null&&(start<1||end<start||end>200)))return null;
  return {book,chapter,start,end};
 }
 const clean=(v,score=1,reason='Reference match')=>{const {_normal,_length,...rest}=v;return {...rest,score:Number(score.toFixed(4)),reason};};
 function chapter(book,chapterNumber,translation='BSB'){const lib=get(translation);const name=lib.aliases.get(normalize(book));return (lib.books.get(name)??[]).map(i=>lib.rows[i]).filter(v=>v.chapter===Number(chapterNumber)).map(v=>clean(v));}
 function search(query,{mode='smart',translation='BSB',limit=50}={}){
  const begin=performance.now(),lib=get(translation);const finish=(rows,method)=>({results:rows.slice(0,limit),total:rows.length,elapsedMs:Number((performance.now()-begin).toFixed(2)),method});
  query=String(query??'').trim().slice(0,500); if(!query)return finish([],'Enter a reference, phrase, or topic');
  const reference=parseReference(query,translation);
  if(reference&&(mode==='reference'||mode==='smart'))return finish(chapter(reference.book,reference.chapter,translation).filter(v=>reference.start===null||(v.verse>=reference.start&&v.verse<=reference.end)),'Direct reference');
  if(mode==='reference')return finish([],'Direct reference');
  if(mode==='exact'){const q=normalize(query);return finish(lib.rows.filter(v=>(` ${v._normal} `).includes(` ${q} `)).map(v=>clean(v,1,'Exact phrase')),'Exact phrase');}
  const words=[...new Set(tokens(query))];const weights=new Map(words.map(w=>[w,1]));const fixes=[];const expanded=[];
  if(mode==='concept')for(const word of words)for(const synonym of concepts[word]??[]){if(!weights.has(synonym)){weights.set(synonym,0.38);expanded.push(synonym);}}
  for(const word of words)if(!lib.postings.has(word)&&word.length>=4){let matches=0;for(const candidate of lib.postings.keys())if(candidate[0]===word[0]&&oneEdit(word,candidate)){weights.set(candidate,0.7);fixes.push(`${word} → ${candidate}`);if(++matches>=5)break;}}
  const scores=new Map(),hits=new Map();
  for(const [word,weight]of weights){const entries=lib.postings.get(word)??[];const idf=Math.log(1+(lib.rows.length-entries.length+0.5)/(entries.length+0.5));for(const i of entries){const v=lib.rows[i];scores.set(i,(scores.get(i)??0)+idf*weight/(0.5+v._length/40));if(words.includes(word))hits.set(i,(hits.get(i)??0)+1);}}
  const phrase=normalize(query);let rows=[...scores].map(([i,score])=>{const v=lib.rows[i];const full=(` ${v._normal} `).includes(` ${phrase} `);score*=1+((hits.get(i)??0)/Math.max(words.length,1));if(full)score+=15;return {v,score};}).sort((a,b)=>b.score-a.score||a.v.id.localeCompare(b.v.id));
  const reason=mode==='concept'?`Concept expansion${expanded.length?`: ${[...new Set(expanded)].join(', ')}`:' (no synonyms available)'}`:fixes.length?`Keyword match; spelling: ${fixes.join('; ')}`:'Keyword match';
  return finish(rows.map(({v,score})=>clean(v,score,reason)),mode==='concept'?'Local keyword + synonym expansion (not neural semantic search)':'Local keyword ranking with typo tolerance');
 }
 return {addTranslation,search,chapter,parseReference,rows:(id)=>get(id).rows.map(v=>clean(v)),list:()=>[...libraries.values()].map(({id,name,rows})=>({id,name,count:rows.length}))};
}
