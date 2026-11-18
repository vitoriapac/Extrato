import test from 'node:test';
import assert from 'node:assert/strict';
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

test('histórico de decisões renderiza todas as decisões, sem template de "Mostrar mais"', () => {
  const html = renderDecisionHistory(
    { items: Array.from({ length: 12 }, (_, i) => item(i)) },
    { escapeHtml: esc }
  );
  assert.equal(count(html, /<article/g), 12);
  assert.doesNotMatch(html, /data-lazy-more|Mostrar mais/);
});

test('retratos de aderência: todas as dobras, corpo só ao abrir, sem "Mostrar mais"', () => {
  const row = n => ({
    period: {
      start: `2026-09-${String(n).padStart(2, '0')}`,
      end: `2026-09-${String(n + 6).padStart(2, '0')}`,
    },
    revision: 1,
    adherence: { assessment: { label: 'Execução alinhada' }, model: { summary: {}, priority: {} } },
  });
  const html = renderAdherenceCloseHistory(Array.from({ length: 9 }, (_, i) => row(i + 1)));
  const outsideTemplates = html.replace(/<template data-lazy>.*?<\/template>/gs, '');
  assert.equal(count(outsideTemplates, /<details>/g), 9);
  assert.equal(count(html, /<summary>[^<]*<\/summary><template data-lazy>/g), 9);
  assert.doesNotMatch(html, /data-lazy-more|Mostrar mais/);
});
