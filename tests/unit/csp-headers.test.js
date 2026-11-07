import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = path => readFile(new URL(`../../${path}`, import.meta.url), 'utf8');
// meta não suporta frame-ancestors; o cabeçalho HTTP o acrescenta.
const stripFrameAncestors = csp => csp.replace(/;\s*frame-ancestors[^;]*/, '').trim();

test('CSP do cabeçalho (vercel.json e _headers do build) igual à meta do index.html', async () => {
  const meta = (await read('index.html')).match(/http-equiv="Content-Security-Policy" content="([^"]+)"/)?.[1];
  assert.ok(meta, 'CSP não encontrada no index.html');

  const vercel = JSON.parse(await read('vercel.json')).headers[0].headers;
  const vercelCsp = vercel.find(h => h.key === 'Content-Security-Policy')?.value;
  assert.ok(vercelCsp, 'CSP ausente no vercel.json');
  assert.match(vercelCsp, /frame-ancestors 'none'/);
  assert.equal(stripFrameAncestors(vercelCsp), meta);
  assert.ok(vercel.some(h => h.key === 'Strict-Transport-Security'));

  const { buildProductionDist } = await import('../../scripts/build-prod.mjs');
  const { mkdtemp, rm } = await import('node:fs/promises');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const out = await mkdtemp(join(tmpdir(), 'dist-'));
  try {
    await buildProductionDist({ outDir: out, compile: false });
    const headers = await readFile(join(out, '_headers'), 'utf8');
    const line = headers.match(/Content-Security-Policy: (.+)/)?.[1];
    assert.ok(line, 'CSP ausente no _headers');
    assert.match(line, /frame-ancestors 'none'/);
    assert.equal(stripFrameAncestors(line), meta);
    assert.match(headers, /Strict-Transport-Security: max-age=31536000; includeSubDomains/);
  } finally {
    await rm(out, { recursive: true, force: true });
  }
});
