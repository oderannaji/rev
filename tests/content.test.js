import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { generateContent } from '../server/content.js';
test('content drafting needs a configured provider and validates source', async () => {
  await assert.rejects(generateContent({ kind: 'sermon', source: 'Brief' }, {}), /20–50,000/);
  await assert.rejects(generateContent({ kind: 'sermon', source: 'Notes from Sunday about generosity and community.' }, {}), /GATHER_AI_URL/);
});
test('OpenAI-compatible adapter sends source and returns a reviewable draft', async t => {
  let received;
  const server = http.createServer(async (req, res) => { let body=''; for await (const c of req) body+=c; received=JSON.parse(body); res.setHeader('Content-Type','application/json'); res.end(JSON.stringify({choices:[{message:{content:'# Generosity\nA draft grounded in the provided notes.'}}]})); });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  t.after(() => { server.closeAllConnections(); server.close(); });
  const result=await generateContent({kind:'newsletter',source:'Sunday focused on generosity and caring for our neighbours.'},{GATHER_AI_URL:`http://127.0.0.1:${server.address().port}/v1/chat/completions`,GATHER_AI_MODEL:'test-model'});
  assert.match(result.text,/Generosity/); assert.equal(result.needsReview,true); assert.equal(received.model,'test-model'); assert.match(received.messages[1].content,/neighbours/);
});
