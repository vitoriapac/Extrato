import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

// Catraca: o total de `any` explícito em src/ não pode subir. Ao reduzir, baixe o número.
const ANY_BASELINE = 4582;

function listSources(dir) {
  return readdirSync(dir).flatMap(name => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return listSources(path);
    return /\.tsx?$/.test(name) ? [path] : [];
  });
}

// shortcut: tira comentários por regex (não entende `//` dentro de strings); conta o mesmo em toda execução, então serve de catraca.
export function countExplicitAny(source) {
  const code = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');
  return (code.match(/(?:[:<,|&(]|\bas)\s*any\b/g) || []).length;
}

test('countExplicitAny reconhece as formas comuns de any explícito', () => {
  assert.equal(countExplicitAny('const a: any = 1; const b = x as any; f<any>(); g(a: any[])'), 4);
  assert.equal(countExplicitAny('// a: any\n/* x as any */ const ok: unknown = 1;'), 0);
});

test('o total de any explícito em src/ não aumenta', () => {
  const perFile = listSources(join(root, 'src')).map(file => [
    file.slice(root.length + 1).replaceAll('\\', '/'),
    countExplicitAny(readFileSync(file, 'utf8')),
  ]);
  const total = perFile.reduce((sum, [, n]) => sum + n, 0);
  const worst = perFile
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([f, n]) => `${f}: ${n}`)
    .join('; ');
  assert.ok(
    total <= ANY_BASELINE,
    `any explícito subiu para ${total} (limite ${ANY_BASELINE}). Maiores: ${worst}. Use tipos reais ou unknown.`
  );
  if (total < ANY_BASELINE) {
    console.log(
      `any explícito caiu para ${total}; baixe ANY_BASELINE em tests/unit/typing-any-ratchet.test.js.`
    );
  }
});
