import test from 'node:test';
import assert from 'node:assert/strict';
import { h } from 'preact';
import { render } from 'preact-render-to-string';
import { LedgerLine } from '../../src/ui/primitives/ledger-line.js';

test('LedgerLine tem guia decorativa oculta para leitores de tela', () => {
  const html = render(h(LedgerLine, { label: 'Meta', value: '2h' }));
  assert.match(html, /class="ledger-line__lead"[^>]*aria-hidden="true"|aria-hidden="true"[^>]*class="ledger-line__lead"/);
  assert.match(html, /ledger-line__value[^>]*>2h</);
});

test('LedgerLine negativo marca is-negative e mantém o valor em texto', () => {
  const html = render(h(LedgerLine, { label: 'Saldo', value: '−20min', tone: 'negative' }));
  assert.match(html, /is-negative/);
  assert.match(html, /−20min/);
});

test('LedgerLine total e hint', () => {
  const html = render(h(LedgerLine, { label: 'Total', value: '5h', total: true, hint: 'na semana' }));
  assert.match(html, /ledger-line--total/);
  assert.match(html, /<small>na semana<\/small>/);
  assert.doesNotMatch(render(h(LedgerLine, { label: 'a', value: 'b' })), /ledger-line--total|is-negative|<small>/);
});

test('LedgerLine positivo marca is-positive', () => {
  const html = render(h(LedgerLine, { label: 'Sobra', value: '10m', tone: 'positive' }));
  assert.match(html, /is-positive/);
});
