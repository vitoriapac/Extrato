import test from 'node:test';
import assert from 'node:assert/strict';
import { renderWeeklyHistorySeries } from '../../src/ui/renderers/weekly-history-series-renderer.ts';

const esc = value => String(value ?? '');
const formatMinutes = m => `${m} min`;
const formatDate = iso => iso.split('-').reverse().join('/');
const metas = { semanal: 5, questoesSemanal: 100, simuladosSemanal: 1 };
const goalWeek = (weekStart, weekEnd, extra = {}) => ({
  weekStart,
  weekEnd,
  semanalOk: true,
  questoesOk: false,
  simuladosOk: true,
  ...extra,
});
const execution = {
  days: [{ date: '2026-11-09' }],
  plannedMinutes: 300,
  studiedMinutes: 120,
  history: [
    { start: '2026-11-02', plannedMinutes: 240, studiedMinutes: 200 },
    { start: '2026-10-26', plannedMinutes: 180, studiedMinutes: 90 },
  ],
};
// computeWeeklyHistory devolve da semana atual para a mais antiga.
const goalWeeks = [
  goalWeek('2026-11-09', '2026-11-15', { current: true }),
  goalWeek('2026-11-02', '2026-11-08'),
  goalWeek('2026-10-26', '2026-11-01', { questoesOk: true }),
  goalWeek('2026-10-19', '2026-10-25', { beforeStart: true }),
];

test('uma série: agendado e estudado por semana, mais antiga à esquerda, semana atual com os números do Resumo', () => {
  const html = renderWeeklyHistorySeries({ execution, goalWeeks, metas, formatMinutes, formatDate, escapeHtml: esc });
  assert.equal((html.match(/chart-columns__bar--/g) || []).length, 6);
  assert.ok(html.indexOf('26/10 a 01/11') < html.indexOf('02/11 a 08/11'));
  assert.ok(html.indexOf('02/11 a 08/11') < html.indexOf('09/11 a 15/11'));
  assert.match(html, /09\/11 a 15\/11 · agendado 300 min \(em andamento\)/);
  assert.match(html, /09\/11 a 15\/11 · estudado 120 min \(em andamento\)/);
  assert.doesNotMatch(html, /19\/10/);
});

test('semana em andamento é tracejada e separada; as encerradas não', () => {
  const html = renderWeeklyHistorySeries({ execution, goalWeeks, metas, formatMinutes, formatDate, escapeHtml: esc });
  assert.equal((html.match(/is-dashed/g) || []).length, 2);
});

test('metas cumpridas viram marca por semana encerrada; a atual diz "em andamento"', () => {
  const html = renderWeeklyHistorySeries({ execution, goalWeeks, metas, formatMinutes, formatDate, escapeHtml: esc });
  assert.match(html, /<b>2\/3<\/b>/);
  assert.match(html, /<b>3\/3<\/b>/);
  assert.match(html, /em andamento<\/b>/);
});

test('tabela fica numa única dobra "Ver dados"; sem semanas encerradas só há o estado vazio', () => {
  const html = renderWeeklyHistorySeries({ execution, goalWeeks, metas, formatMinutes, formatDate, escapeHtml: esc });
  assert.equal((html.match(/<details/g) || []).length, 1);
  const empty = renderWeeklyHistorySeries({
    execution: { days: [{ date: '2026-11-09' }], history: [] },
    goalWeeks: [goalWeek('2026-11-09', '2026-11-15', { current: true })],
    metas,
    formatMinutes,
    formatDate,
    escapeHtml: esc,
  });
  assert.doesNotMatch(empty, /<details/);
  assert.match(empty, /aparecem aqui/);
});
