import test from 'node:test';
import assert from 'node:assert/strict';
import { lazyMore } from '../../src/ui/lazy-more.ts';
import { renderDecisionHistory } from '../../src/ui/renderers/studytrack32-renderer.ts';
import { renderAdherenceCloseHistory } from '../../src/ui/renderers/weekly-adherence-renderer.ts';

const esc = value => String(value ?? '');
const item = n => ({
  subjectName: `Disciplina ${n}`,
  topicName: `Tópico ${n}`,
  strategyLabel: 'Estratégia',
  reasons: [],
  outcomeLabel: 'Sem resultado',
  explanationSnapshot: null,
});

const count = (html, pattern) => (html.match(pattern) || []).length;

test('histórico de decisões renderiza 5 fora do template e o resto atrás de "Mostrar mais"', () => {
  const html = renderDecisionHistory({ items: Array.from({ length: 12 }, (_, i) => item(i)) }, { escapeHtml: esc });
  const [visible, hidden] = html.split('<template data-lazy-more-body');
  assert.equal(count(visible, /<article/g), 5);
  assert.equal(count(hidden, /<article/g), 7);
  assert.match(html, /Mostrar mais 7/);
});

test('com até 5 itens não há botão', () => {
  assert.equal(lazyMore('', 0), '');
  const html = renderDecisionHistory({ items: [item(1), item(2)] }, { escapeHtml: esc });
  assert.doesNotMatch(html, /Mostrar mais/);
});

test('retratos de aderência: 5 dobras fora do template, corpo só ao abrir, resto em "Mostrar mais"', () => {
  const row = n => ({
    period: { start: `2026-09-${String(n).padStart(2, '0')}`, end: `2026-09-${String(n + 6).padStart(2, '0')}` },
    revision: 1,
    adherence: { assessment: { label: 'Execução alinhada' }, model: { summary: {}, priority: {} } },
  });
  const html = renderAdherenceCloseHistory(Array.from({ length: 9 }, (_, i) => row(i + 1)));
  const visible = html.split('<template data-lazy-more-body')[0];
  const outsideTemplates = visible.replace(/<template data-lazy>.*?<\/template>/gs, '');
  assert.equal(count(outsideTemplates, /<details>/g), 5);
  assert.equal(count(visible, /<summary>[^<]*<\/summary><template data-lazy>/g), 5);
  assert.match(html, /Mostrar mais 4/);
});
