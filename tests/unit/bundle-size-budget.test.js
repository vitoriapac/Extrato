import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const src = resolve(root, 'src');
const gzipOf = path => gzipSync(readFileSync(path)).length;

// Orçamento em bytes gzip, ~10% acima do tamanho de 2026-11-20 (demo 49.530; help 41.369;
// landing 21.578; report 14.818; catálogo 13.714). Ao estourar: reduza o bundle ou suba o limite de propósito.
const BUDGET_GZIP = {
  'demo.bundle.js': 55_000,
  'help.bundle.js': 46_000,
  'landing.bundle.js': 24_000,
  'report.bundle.js': 17_000,
  'exam-catalog.bundle.js': 16_000,
};

for (const [name, limit] of Object.entries(BUDGET_GZIP)) {
  test(`${name} cabe no orçamento de ${limit.toLocaleString('pt-BR')} bytes gzip`, () => {
    const gzip = gzipOf(resolve(src, name));
    assert.ok(gzip <= limit, `${name} está com ${gzip} bytes gzip (limite ${limit}). Rode npm run report:bundle.`);
  });
}

// O app é ESM com divisão de código. A abertura baixa o bundle principal e os pedaços que ele
// pré-carrega (modulepreload no index.html); o resto só desce quando a tela abre.
// Em 2026-11-27: antes da divisão 678.196; depois 636.748 (principal 587.844). Limite ~5% acima.
const STARTUP_BUDGET_GZIP = 670_000;

test(`abertura do app (principal + pré-carregados) cabe em ${STARTUP_BUDGET_GZIP.toLocaleString('pt-BR')} bytes gzip`, () => {
  const index = readFileSync(resolve(root, 'index.html'), 'utf8');
  const preloaded = [...index.matchAll(/<link rel="modulepreload" href="([^"]+)">/g)].map(match => match[1]);
  assert.ok(preloaded.length > 0, 'index.html sem modulepreload: rode npm run build.');
  const total = gzipOf(resolve(src, 'app.bundle.js')) + preloaded.reduce((sum, path) => sum + gzipOf(resolve(root, path)), 0);
  assert.ok(total <= STARTUP_BUDGET_GZIP, `abertura está com ${total} bytes gzip (limite ${STARTUP_BUDGET_GZIP}).`);
});
