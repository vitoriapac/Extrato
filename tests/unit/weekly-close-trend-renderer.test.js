import test from 'node:test';
import assert from 'node:assert/strict';
import {
  renderWeeklyCloseTrend,
  renderWeeklySignals,
} from '../../src/ui/renderers/weekly-close-trend-renderer.ts';

const esc = value => String(value ?? '');
const formatMinutes = m => `${m} min`;
const formatDate = iso => iso.split('-').reverse().join('/');
const week = (start, end, plannedMinutes, studiedMinutes) => ({ start, end, plannedMinutes, studiedMinutes });

test('tendência mostra só as 4 últimas semanas com dados e uma dobra "Ver dados"', () => {
  const history = [
    week('2026-09-28', '2026-10-04', 0, 0),
    week('2026-10-05', '2026-10-11', 100, 80),
    week('2026-10-12', '2026-10-18', 120, 100),
    week('2026-10-19', '2026-10-25', 90, 90),
    week('2026-10-26', '2026-11-01', 60, 30),
    week('2026-11-02', '2026-11-08', 70, 70),
  ];
  const html = renderWeeklyCloseTrend({ history, formatMinutes, formatDate, escapeHtml: esc });
  assert.equal((html.match(/<details/g) || []).length, 1);
  assert.match(html, /Ver dados/);
  assert.doesNotMatch(html, /05\/10/);
  assert.match(html, /12\/10 a 18\/10/);
  assert.match(html, /02\/11 a 08\/11/);
});

test('com menos de duas semanas a tendência explica o que falta e não cria dobra', () => {
  const html = renderWeeklyCloseTrend({
    history: [week('2026-11-02', '2026-11-08', 70, 70)],
    formatMinutes,
    formatDate,
    escapeHtml: esc,
  });
  assert.doesNotMatch(html, /<details/);
  assert.match(html, /duas semanas concluídas/);
});

test('sinais da semana: lista curta, no máximo 2 acertos e 3 pontos de revisão', () => {
  const html = renderWeeklySignals({
    worked: ['a', 'b', 'c'],
    attention: ['d', 'e', 'f', 'g'],
    outcomesCount: 2,
    escapeHtml: esc,
  });
  assert.equal((html.match(/<li /g) || []).length, 6);
  assert.match(html, /2 resultados medidos/);
  assert.doesNotMatch(html, /<details/);
  assert.match(renderWeeklySignals({ escapeHtml: esc }), /Sem evidência suficiente/);
});
