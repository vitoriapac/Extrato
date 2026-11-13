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
  assert.match(out, /Detalhamento dos vínculos indisponível/);
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

test('extrato usa vínculos reais mesmo quando o estudo total é menor que o planejado', async () => {
  const { buildPlanExecution } = await import('../../src/application/goals/build-plan-execution.js');
  const { renderPlanExecution } = await import('../../src/ui/renderers/plan-execution-renderer.js');
  const model = buildPlanExecution({
    today: '2026-11-12', hoursByDay: { 1: 2 },
    dailyPlans: [{ date: '2026-11-09', items: [{ id: 'a', subjectId: 's', topicId: 't', type: 'study', plannedMinutes: 80, status: 'planned', prioritySnapshot: { priority: true } }] }],
    sessions: [{ id: 'extra', date: '2026-11-10', subjectId: 's', topicId: 't', type: 'study', durationSeconds: 1800 }],
  });
  const out = renderPlanExecution(model, { formatDate: iso => iso.split('-').reverse().join('/') });
  assert.match(out, /Sem vínculo com atividade/);
  assert.match(out, /30min/);
  assert.match(out, /0h00 de 1h20 prioritárias/);
  assert.doesNotMatch(out, /Estudo extra, sem tarefa marcada/);
});

test('extrato separa vínculo válido, incompatível e de outro período', async () => {
  const { buildPlanExecution } = await import('../../src/application/goals/build-plan-execution.js');
  const { renderPlanExecution } = await import('../../src/ui/renderers/plan-execution-renderer.js');
  const item = (id) => ({ id, subjectId: 's', topicId: 't', type: 'study', plannedMinutes: 60, status: 'planned' });
  const model = buildPlanExecution({ today: '2026-11-12', hoursByDay: { 1: 2 },
    dailyPlans: [{ date: '2026-11-09', items: [item('current')] }, { date: '2026-11-02', items: [item('past')] }],
    sessions: [
      { id: 'ok', date: '2026-11-10', subjectId: 's', topicId: 't', type: 'study', planItemId: 'current', durationSeconds: 1800 },
      { id: 'bad', date: '2026-11-10', subjectId: 's', topicId: 'other', type: 'study', planItemId: 'current', durationSeconds: 600 },
      { id: 'old', date: '2026-11-10', subjectId: 's', topicId: 't', type: 'study', planItemId: 'past', durationSeconds: 1200 },
    ] });
  const out = renderPlanExecution(model, { formatDate: iso => iso.split('-').reverse().join('/') });
  assert.match(out, /Vinculado a atividades desta semana[\s\S]*?30min/);
  assert.match(out, /Vínculo incompatível ou inativo[\s\S]*?10min/);
  assert.match(out, /Vinculado a outro período[\s\S]*?20min/);
});

test('quando os totais usam bases diferentes o extrato explica a diferença', async () => {
  const { buildPlanExecution } = await import('../../src/application/goals/build-plan-execution.js');
  const { renderPlanExecution } = await import('../../src/ui/renderers/plan-execution-renderer.js');
  const session = { id: 'duplicada', date: '2026-11-10', durationSeconds: 1800 };
  const model = buildPlanExecution({ today: '2026-11-12', hoursByDay: { 1: 1 }, sessions: [session, session] });
  const out = renderPlanExecution(model, { formatDate: iso => iso.split('-').reverse().join('/') });
  assert.match(out, /análise de vínculos considera 30min em sessões únicas/);
  assert.match(out, /total acima usa as datas registradas/);
});
