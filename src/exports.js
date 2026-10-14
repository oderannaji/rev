import JSZip from 'jszip';

export function saveBlob(name, blob) {
  const url = URL.createObjectURL(blob); const a = document.createElement('a');
  a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1500);
}
export function exportMarkdown(title, text) { saveBlob(`${title.replace(/[^\p{L}\p{N} -]/gu, '').slice(0,80) || 'notes'}.md`, new Blob([`# ${title}\n\n${text}\n`], {type:'text/markdown;charset=utf-8'})); }
const escape = text => String(text).replace(/[<>&"']/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[c]));
export async function exportDocx(title, text) {
  const zip = new JSZip();
  zip.file('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>');
  zip.file('_rels/.rels','<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
  zip.file('word/document.xml', `<?xml version="1.0" encoding="UTF-8"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${[title,...text.split('\n')].map(line=>`<w:p><w:r><w:t xml:space="preserve">${escape(line)}</w:t></w:r></w:p>`).join('')}<w:sectPr/></w:body></w:document>`);
  saveBlob('shepherd-pro-notes.docx', await zip.generateAsync({type:'blob',mimeType:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'}));
}
export function printText(title, text) {
  const frame = document.createElement('iframe'); frame.style.cssText='position:fixed;left:-10000px;top:0;width:800px;height:1000px;border:0';
  frame.srcdoc=`<!doctype html><html><head><title>${escape(title)}</title><style>body{font:12pt/1.65 Georgia,serif;margin:2cm;color:#111}h1{font-size:24pt}pre{font:inherit;white-space:pre-wrap;overflow-wrap:anywhere}@page{margin:1.5cm}</style></head><body><h1>${escape(title)}</h1><pre>${escape(text)}</pre></body></html>`;
  frame.onload=()=>{frame.contentWindow.focus();frame.contentWindow.print();setTimeout(()=>frame.remove(),60000);}; document.body.appendChild(frame);
}
export async function exportPptx(slides, theme) {
  const {default:PptxGenJS}=await import('pptxgenjs'); const pptx=new PptxGenJS();
  pptx.layout='LAYOUT_WIDE';pptx.author='Shepherd Pro';pptx.subject='Service presentation';pptx.title='Shepherd Pro service';pptx.lang='en-US';
  for(const item of slides){const page=pptx.addSlide();page.background={color:(theme?.background||'#172321').replace('#','')};const color=(theme?.color||'#ffffff').replace('#','');page.addText(item.text||`Media: ${item.title||'Untitled'}`,{x:.7,y:.6,w:11.9,h:5.4,fontSize:32,fontFace:'Georgia',color,align:theme?.align||'center',valign:'mid',fit:'shrink',breakLine:false});page.addText([item.reference||item.title,item.translation].filter(Boolean).join(' · '),{x:.7,y:6.3,w:11.9,h:.5,fontSize:16,color,align:'center'});}
  await pptx.writeFile({fileName:'shepherd-pro-service.pptx'});
}
