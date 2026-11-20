import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const src = resolve(dirname(fileURLToPath(import.meta.url)), '../../src');

// Orçamento em bytes gzip, ~10% acima do tamanho de 2026-11-20 (app 633.554; demo 49.530; help 41.369;
// landing 21.578; report 14.818; catálogo 13.714). Ao estourar: reduza o bundle ou suba o limite de propósito.
const BUDGET_GZIP = {
  'app.bundle.js': 700_000,
  'demo.bundle.js': 55_000,
  'help.bundle.js': 46_000,
  'landing.bundle.js': 24_000,
  'report.bundle.js': 17_000,
  'exam-catalog.bundle.js': 16_000,
};

for (const [name, limit] of Object.entries(BUDGET_GZIP)) {
  test(`${name} cabe no orçamento de ${limit.toLocaleString('pt-BR')} bytes gzip`, () => {
    const gzip = gzipSync(readFileSync(resolve(src, name))).length;
    assert.ok(gzip <= limit, `${name} está com ${gzip} bytes gzip (limite ${limit}). Rode npm run report:bundle.`);
  });
}
