import test from 'node:test';
import assert from 'node:assert/strict';
import { h } from 'preact';
import { render } from 'preact-render-to-string';
import { WeekReconciliationSummary } from '../../src/ui/tabs/goals/WeekReconciliationSummary.js';
import { buildWeekReconciliation } from '../../src/ui/tabs/goals/week-reconciliation.js';

const html = (plannedMin, studiedMin, capacityMin = 720) =>
  render(
    h(WeekReconciliationSummary, {
      data: buildWeekReconciliation({
        capacityMin,
        plannedMin,
        studiedMin,
        periodLabel: '03 a 09 nov',
      }),
    })
  );

test('minutos fracionários arredondam antes de virar horas (119,7 min = 2h)', () => {
  const out = html(100, 50, 119.7);
  assert.match(out, />2h</);
  assert.doesNotMatch(out, />1h</);
});

test('aviso de plano curto usa o múltiplo exibido (2,04 não mostra; 2,06 mostra)', () => {
  assert.doesNotMatch(html(100, 204), /tempo com tarefa marcada/);
  assert.match(html(100, 206), /tempo com tarefa marcada/);
});

test('resumo diferencia a semana inteira do realizado até hoje', () => {
  const out = html(400, 231);
  assert.match(out, /inclui dias futuros/);
  assert.match(out, /Estudo extra, sem tarefa marcada/);
  assert.match(out, /Estudado até hoje/);
});

test('fechamento identifica o corte temporal e o escopo da aderência', async () => {
  const { renderWeeklyCloseKpis } = await import('../../src/ui/renderers/studytrack32-renderer.js');
  const close = {
    state: 'available',
    adherence: {
      model: {
        period: {
          start: '2026-11-09',
          end: '2026-11-15',
          evaluatedEnd: '2026-11-11',
          complete: false,
        },
        activeExamTags: ['bb'],
        summary: { plannedMinutes: 80, executedMinutes: 231, temporalAdherence: 0 },
      },
    },
  };
  const out = renderWeeklyCloseKpis(close, { formatMinutes: m => `${m} min` });
  assert.match(out, /até 11\/11\/2026/);
  assert.match(out, /provas ativas/);
  assert.match(out, /80 min/);
  assert.match(out, /sem vínculo/);
});

test('prioridade informa a semana inteira e a necessidade de vínculo', async () => {
  const { renderStrategicExecution } =
    await import('../../src/ui/renderers/strategic-execution-renderer.js');
  const out = renderStrategicExecution(
    { priorityPlannedMinutes: 225, priorityExecutedMinutes: 0, strategicAdherence: 0 },
    '09/11 a 15/11'
  );
  assert.match(out, /semana inteira/);
  assert.match(out, /Só sessões com vínculo válido contam/);
});
