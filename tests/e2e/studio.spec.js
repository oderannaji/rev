import {test,expect} from '@playwright/test';
import JSZip from 'jszip';
import {readFile} from 'node:fs/promises';
test.beforeEach(async({request,page})=>{await request.put('/api/state',{data:{}});await page.goto('/');await expect(page.getByLabel('Preview John 3:16',{exact:true})).toBeVisible();});
test('search, preview, go live, output synchronization, blackout, and reload',async({page,context})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.getByLabel('Search Scripture').fill('Jn 3:16-18');await expect(page.locator('.verse-card')).toHaveCount(3);
 await page.getByLabel('Preview John 3:17',{exact:true}).click();await expect(page.locator('.preview-details')).toContainText('John 3:17');
 const output=await context.newPage();await output.goto('/output?channel=main');
 await page.getByRole('button',{name:'Take live',exact:true}).click();await expect(output.locator('.projection-reference')).toContainText('John 3:17');
 await page.getByRole('button',{name:/Blackout/}).click();await expect(output.locator('.projection')).toHaveClass(/blacked/);
 await page.getByRole('button',{name:/Restore/}).click();await expect(output.locator('.projection')).not.toHaveClass(/blacked/);
 await page.reload();await expect(page.locator('.live-section')).toContainText('John 3:17');expect(errors).toEqual([]);
});
test('queue preserves rapid additions and supports ordering, notes and navigation',async({page})=>{
 await page.getByLabel('Search Scripture').fill('Psalm 23');await expect(page.locator('.verse-card')).toHaveCount(6);
 await page.getByLabel('Add Psalms 23:1 to queue',{exact:true}).click();await page.getByLabel('Add Psalms 23:2 to queue',{exact:true}).click();await page.getByLabel('Add Psalms 23:3 to queue',{exact:true}).click();
 await expect(page.locator('.queue-item')).toHaveCount(3);await page.getByLabel('Move Psalms 23:3 up',{exact:true}).click();
 await expect(page.locator('.queue-item').nth(1)).toContainText('Psalms 23:3');
 await page.getByRole('button',{name:'Start service'}).click();await expect(page.locator('.live-section')).toContainText('Psalms 23:1');
 await page.getByRole('button',{name:'Next in queue'}).click();await expect(page.locator('.live-section')).toContainText('Psalms 23:3');
 await page.getByRole('button',{name:'Presenter notes',exact:true}).click();await page.getByLabel('Presenter notes',{exact:true}).fill('Welcome visitors and pause before the reading.');
 await expect(page.getByText('Saved locally',{exact:true})).toBeVisible();await page.reload();await expect(page.locator('.queue-item')).toHaveCount(3);
});
test('slides authoring and PowerPoint export/import are functional',async({page})=>{
 await page.getByRole('button',{name:'Slides',exact:true}).click();await page.getByLabel('Slide title').fill('Welcome everyone');await page.getByLabel('Slide text').fill('We are glad you are here.');await page.getByRole('button',{name:'Create slide',exact:true}).click();
 await expect(page.locator('.asset-item')).toHaveCount(1);await page.getByLabel('Add Welcome everyone to queue').click();await expect(page.locator('.queue-item')).toHaveCount(1);
 const downloadPromise=page.waitForEvent('download');await page.getByRole('button',{name:'Export PPTX'}).click();const download=await downloadPromise;const bytes=await readFile(await download.path());const zip=await JSZip.loadAsync(bytes);expect(await zip.file('ppt/slides/slide1.xml').async('string')).toContain('We are glad');
 await page.locator('.library-panel input[type=file]').setInputFiles({name:'imported.pptx',mimeType:'application/vnd.openxmlformats-officedocument.presentationml.presentation',buffer:bytes});await expect(page.locator('.asset-item')).toHaveCount(2);
});
test('themes and dictionary change actual preview content',async({page})=>{
 await page.getByRole('button',{name:'Study',exact:true}).click();await expect(page.locator('.lexicon-entry')).toContainText('ἀγάπη');await page.getByRole('button',{name:'Preview word'}).click();await expect(page.locator('.preview-section')).toContainText('ἀγάπη');
 await page.getByRole('button',{name:'Themes',exact:true}).click();await page.getByRole('button',{name:/Lavender/}).click();await expect(page.locator('.preview-section .projection')).toHaveCSS('background-color','rgb(48, 39, 67)');
 await page.getByLabel('Theme font size').fill('64');await expect(page.getByText('64px',{exact:true})).toBeVisible();
});
test('transcript persistence, related scripture and DOCX export',async({page})=>{
 await page.getByRole('button',{name:'Transcripts',exact:true}).click();await page.getByLabel('Session name').fill('Morning reflection');await page.getByLabel('Transcript text').fill('We reflected on forgiveness and mercy.');await page.getByRole('button',{name:'Save',exact:true}).click();await expect(page.locator('.asset-item')).toContainText('Morning reflection');
 await page.getByRole('button',{name:'Find related Scripture'}).click();await expect(page.locator('.verse-card').first()).toBeVisible();
 const downloadPromise=page.waitForEvent('download');await page.getByRole('button',{name:'DOCX',exact:true}).click();const d=await downloadPromise;const zip=await JSZip.loadAsync(await readFile(await d.path()));expect(await zip.file('word/document.xml').async('string')).toContain('forgiveness');
});
test('content tools produce editable outlines without pretending AI is configured',async({page})=>{
 await page.getByRole('button',{name:'Content',exact:true}).click();await page.getByLabel('Content source').fill('Today we discussed generosity, service, and welcoming our neighbours.');await expect(page.getByRole('button',{name:'Draft with AI'})).toBeDisabled();await page.getByRole('button',{name:'Structure notes'}).click();await expect(page.getByLabel('Content draft')).toContainText('generosity');
 await page.getByRole('button',{name:'Make slides from draft'}).click();await page.getByRole('button',{name:'Slides',exact:true}).click();expect(await page.locator('.asset-item').count()).toBeGreaterThan(1);
});
test('media upload validates and previews real image data',async({page})=>{
 await page.getByRole('button',{name:'Media',exact:true}).click();await page.locator('.library-panel input[type=file]').setInputFiles({name:'pixel.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==','base64')});await page.getByLabel('Preview pixel.png').click();await expect(page.locator('.preview-section img')).toBeVisible();
});
test('backup import rejects malformed state without breaking the studio',async({page})=>{
 await page.getByRole('button',{name:'Settings',exact:true}).click();await page.locator('.library-panel input[type=file]').nth(1).setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({queue:[null]}))});await expect(page.getByRole('alert')).toContainText('Invalid backup');await page.getByRole('button',{name:/^Scripture/}).click();await expect(page.getByLabel('Search Scripture')).toBeVisible();
});
test('PDF and DOCX text imports preserve document text',async({page})=>{
 await page.getByRole('button',{name:'Slides',exact:true}).click();
 const objects=['<< /Type /Catalog /Pages 2 0 R >>','<< /Type /Pages /Kids [3 0 R] /Count 1 >>','<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>','<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'];const stream='BT /F1 18 Tf 72 720 Td (Welcome from the PDF document) Tj ET';objects.push(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);let pdf='%PDF-1.4\n';const offsets=[0];objects.forEach((s,i)=>{offsets.push(Buffer.byteLength(pdf));pdf+=`${i+1} 0 obj\n${s}\nendobj\n`;});const xref=Buffer.byteLength(pdf);pdf+=`xref\n0 6\n0000000000 65535 f \n${offsets.slice(1).map(n=>`${String(n).padStart(10,'0')} 00000 n \n`).join('')}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
 await page.locator('.library-panel input[type=file]').setInputFiles({name:'welcome.pdf',mimeType:'application/pdf',buffer:Buffer.from(pdf)});await expect(page.locator('.asset-item')).toContainText('Welcome from the PDF document');
 const zip=new JSZip();zip.file('word/document.xml','<w:document xmlns:w="urn:test"><w:body><w:p><w:r><w:t>Words from the DOCX document</w:t></w:r></w:p></w:body></w:document>');await page.locator('.library-panel input[type=file]').setInputFiles({name:'notes.docx',mimeType:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',buffer:await zip.generateAsync({type:'nodebuffer'})});await expect(page.locator('.asset-item')).toHaveCount(2);await expect(page.locator('.asset-item').nth(1)).toContainText('Words from the DOCX document');
});
