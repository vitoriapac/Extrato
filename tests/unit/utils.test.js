import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isISODate,
  isPlainObject,
  isSafeId,
  pluralize,
  structuredCloneSafe,
} from '../../src/core/utils.js';

test('valida datas reais no formato ISO local', () => {
  assert.equal(isISODate('2024-02-29'), true);
  assert.equal(isISODate('2023-02-29'), false);
  assert.equal(isISODate('2024-13-01'), false);
});

test('pluraliza substantivos regulares e irregulares', () => {
  assert.equal(pluralize(1, 'sessão', 'sessões'), '1 sessão');
  assert.equal(pluralize(2, 'sessão', 'sessões'), '2 sessões');
});

test('rejeita identificadores inseguros', () => {
  assert.equal(isSafeId('topic-safe_1:value'), true);
  assert.equal(isSafeId("x');alert(1)//"), false);
});

test('clona dados serializaveis sem compartilhar referencias', () => {
  const source = { nested: { value: 1 }, list: [1, 2] };
  const copy = structuredCloneSafe(source);
  copy.nested.value = 2;
  assert.equal(source.nested.value, 1);
  assert.equal(isPlainObject(copy), true);
});

test('escapeHtml — escapa os cinco caracteres e mantém zero', async () => {
  const { escapeHtml, escapeAttr } = await import('../../src/core/utils.js');
  assert.equal(
    escapeHtml(`<a href="x">'&'</a>`),
    '&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;'
  );
  assert.equal(escapeHtml(0), '0');
  assert.equal(escapeHtml(null), '');
  assert.equal(escapeAttr, escapeHtml);
});

test('renderers sem escapeHtml injetado escapam texto do usuário', async () => {
  const { renderErrorAnalysis } = await import('../../src/ui/renderers/error-analysis-renderer.js');
  const html = renderErrorAnalysis({ state: 'empty', message: '<img src=x onerror=alert(1)>' });
  assert.ok(!html.includes('<img'));
  assert.ok(html.includes('&lt;img'));
});
