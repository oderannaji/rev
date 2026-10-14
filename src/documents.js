import JSZip from 'jszip';

function xmlText(xml, tag = 't') {
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  if (doc.querySelector('parsererror')) throw new Error('The document contains invalid XML.');
  return [...doc.getElementsByTagNameNS('*', tag)].map(n => n.textContent || '').join(' ');
}

export function textSlides(text, title = 'Imported notes') {
  return text.replace(/\r/g, '').split(/\n\s*\n/).filter(p => p.trim()).flatMap((p, i) => {
    const chunks = p.match(/[\s\S]{1,650}(?:\s|$)|[\s\S]{1,650}/g) || [];
    return chunks.map((text, j) => ({ title: i === 0 && j === 0 ? title : `${title} · ${i + 1}${j ? `.${j + 1}` : ''}`, text: text.trim() }));
  });
}

/** Reads user-provided documents locally; never executes embedded scripts or macros. */
export async function readDocument(file) {
  if (file.size > 30 * 1024 * 1024) throw new Error('Choose a document under 30 MB.');
  const ext = file.name.split('.').pop().toLowerCase();
  const title = file.name.replace(/\.[^.]+$/, '');
  if (['txt', 'md'].includes(ext)) {
    const text = await file.text();
    return { text, slides: textSlides(text, title) };
  }
  if (['docx', 'pptx'].includes(ext)) {
    const zip = await JSZip.loadAsync(await file.arrayBuffer());
    if (Object.keys(zip.files).length > 5000) throw new Error('This archive has too many entries.');
    const entries = Object.keys(zip.files).filter(n => ext === 'docx' ? n === 'word/document.xml' : /^ppt\/slides\/slide\d+\.xml$/.test(n));
    entries.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    if (!entries.length) throw new Error('No readable slides or document text were found.');
    let expandedBytes = 0;
    const slides = [];
    for (const [i, name] of entries.entries()) {
      const xml = await zip.file(name).async('string');
      expandedBytes += xml.length;
      if (expandedBytes > 20 * 1024 * 1024) throw new Error('Expanded document text exceeds the import limit.');
      const text = xmlText(xml);
      if (ext === 'docx') return { text, slides: textSlides(text, title) };
      slides.push({ title: `${title} · ${i + 1}`, text });
    }
    return { text: slides.map(s => s.text).join('\n\n'), slides };
  }
  if (ext === 'pdf') {
    const pdfjs = await import('pdfjs-dist');
    pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();
    const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer(), isEvalSupported: false }).promise;
    if (pdf.numPages > 200) { await pdf.destroy(); throw new Error('Choose a PDF with at most 200 pages.'); }
    const slides = [];
    try {
      for (let n = 1; n <= pdf.numPages; n++) {
        const page = await pdf.getPage(n);
        const content = await page.getTextContent();
        slides.push({ title: `${title} · ${n}`, text: content.items.map(i => i.str || '').join(' ') });
      }
    } finally { await pdf.destroy(); }
    if (!slides.some(s => s.text.trim())) throw new Error('This PDF has no selectable text. OCR is not included; import page images instead.');
    return { text: slides.map(s => s.text).join('\n\n'), slides };
  }
  throw new Error('Supported document formats: TXT, Markdown, PDF, DOCX, PPTX.');
}
