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
  const { buildPlanExecution } =
    await import('../../src/application/goals/build-plan-execution.js');
  const { renderPlanExecution } = await import('../../src/ui/renderers/plan-execution-renderer.js');
  const model = buildPlanExecution({
    today: '2026-11-12',
    hoursByDay: { 1: 2 },
    dailyPlans: [
      {
        date: '2026-11-09',
        items: [
          {
            id: 'a',
            subjectId: 's',
            topicId: 't',
            type: 'study',
            plannedMinutes: 80,
            status: 'planned',
            prioritySnapshot: { priority: true },
          },
        ],
      },
    ],
    sessions: [
      {
        id: 'extra',
        date: '2026-11-10',
        subjectId: 's',
        topicId: 't',
        type: 'study',
        durationSeconds: 1800,
      },
    ],
  });
  const out = renderPlanExecution(model, { formatDate: iso => iso.split('-').reverse().join('/') });
  assert.match(out, /Sem vínculo com atividade/);
  assert.match(out, /30min/);
  assert.match(out, /0min de 1h20 prioritárias/);
  assert.doesNotMatch(out, /Estudo extra, sem tarefa marcada/);
});

test('extrato separa vínculo válido, incompatível e de outro período', async () => {
  const { buildPlanExecution } =
    await import('../../src/application/goals/build-plan-execution.js');
  const { renderPlanExecution } = await import('../../src/ui/renderers/plan-execution-renderer.js');
  const item = id => ({
    id,
    subjectId: 's',
    topicId: 't',
    type: 'study',
    plannedMinutes: 60,
    status: 'planned',
  });
  const model = buildPlanExecution({
    today: '2026-11-12',
    hoursByDay: { 1: 2 },
    dailyPlans: [
      { date: '2026-11-09', items: [item('current')] },
      { date: '2026-11-02', items: [item('past')] },
    ],
    sessions: [
      {
        id: 'ok',
        date: '2026-11-10',
        subjectId: 's',
        topicId: 't',
        type: 'study',
        planItemId: 'current',
        durationSeconds: 1800,
      },
      {
        id: 'bad',
        date: '2026-11-10',
        subjectId: 's',
        topicId: 'other',
        type: 'study',
        planItemId: 'current',
        durationSeconds: 600,
      },
      {
        id: 'old',
        date: '2026-11-10',
        subjectId: 's',
        topicId: 't',
        type: 'study',
        planItemId: 'past',
        durationSeconds: 1200,
      },
    ],
  });
  const out = renderPlanExecution(model, { formatDate: iso => iso.split('-').reverse().join('/') });
  assert.match(out, /Vinculado a atividades desta semana[\s\S]*?30min/);
  assert.match(out, /Vínculo incompatível ou inativo[\s\S]*?10min/);
  assert.match(out, /Vinculado a outro período[\s\S]*?20min/);
});

test('quando os totais usam bases diferentes o extrato explica a diferença', async () => {
  const { buildPlanExecution } =
    await import('../../src/application/goals/build-plan-execution.js');
  const { renderPlanExecution } = await import('../../src/ui/renderers/plan-execution-renderer.js');
  const session = { id: 'duplicada', date: '2026-11-10', durationSeconds: 1800 };
  const model = buildPlanExecution({
    today: '2026-11-12',
    hoursByDay: { 1: 1 },
    sessions: [session, session],
  });
  const out = renderPlanExecution(model, { formatDate: iso => iso.split('-').reverse().join('/') });
  assert.match(out, /análise de vínculos considera 30min em sessões únicas/);
  assert.match(out, /total acima usa as datas registradas/);
});

test('capacidade explica de onde vem o número e o estudado é a linha de total', () => {
  const out = html(160, 623, 720);
  assert.match(out, /Capacidade da semana<small>Soma da disponibilidade dos 7 dias<\/small>/);
  // O estudado é o total do extrato: única linha com a marca de total.
  assert.equal((out.match(/ledger-line--total/g) || []).length, 1);
  assert.match(out, /ledger-line--total[^>]*>.*?Estudado até hoje/);
});

test('o aviso de plano acima da capacidade usa os nomes fixos da semana', async () => {
  const { renderPlanExecution } = await import('../../src/ui/renderers/plan-execution-renderer.js');
  const { buildPlanExecution } =
    await import('../../src/application/goals/build-plan-execution.js');
  const model = buildPlanExecution({
    today: '2026-11-12',
    hoursByDay: { 1: 2 },
    dailyPlans: [
      {
        date: '2026-11-09',
        items: [
          {
            id: 'a',
            subjectId: 's',
            topicId: 't',
            type: 'study',
            plannedMinutes: 300,
            status: 'planned',
          },
        ],
      },
    ],
    sessions: [],
  });
  const out = renderPlanExecution(model, { formatDate: d => d.split('-').reverse().join('/') });
  assert.match(out, /O tempo com tarefa marcada nos dias supera a capacidade semanal informada/);
  assert.doesNotMatch(out, /tempo planejado nos dias/);
});

test('fechamento e resumo mostram os mesmos valores e rótulos para a mesma semana', async () => {
  const { buildPlanExecution } =
    await import('../../src/application/goals/build-plan-execution.js');
  const { renderPlanExecution } = await import('../../src/ui/renderers/plan-execution-renderer.js');
  const { renderWeeklyCloseKpis } = await import('../../src/ui/renderers/studytrack32-renderer.js');
  const { buildWeekReconciliationFromExecution } =
    await import('../../src/ui/tabs/goals/week-reconciliation.js');
  const formatDate = iso => iso.split('-').reverse().join('/');
  const model = buildPlanExecution({
    today: '2026-11-12',
    hoursByDay: { 1: 2, 2: 2 },
    dailyPlans: [
      {
        date: '2026-11-09',
        items: [
          {
            id: 'a',
            subjectId: 's',
            topicId: 't',
            type: 'study',
            plannedMinutes: 80,
            status: 'planned',
          },
        ],
      },
    ],
    sessions: [
      {
        id: 'extra',
        date: '2026-11-10',
        subjectId: 's',
        topicId: 't',
        type: 'study',
        durationSeconds: 3600,
      },
    ],
  });
  const close = {
    state: 'available',
    adherence: {
      model: { summary: { plannedMinutes: 80, executedMinutes: 60, temporalAdherence: 0 } },
    },
  };
  const out = renderWeeklyCloseKpis(close, {
    formatMinutes: m => `${m} min`,
    reconciliation: buildWeekReconciliationFromExecution(model, formatDate),
  });
  const resumo = renderPlanExecution(model, { formatDate });
  for (const label of ['Capacidade da semana', 'Com tarefa marcada', 'Estudado até hoje'])
    assert.ok(out.includes(label) && resumo.includes(label), label);
  // Mesmos valores (1h20 com tarefa marcada, 1h estudada) nos dois lugares.
  for (const value of ['1h20', '1h'])
    assert.ok(out.includes(`>${value}<`) && resumo.includes(`>${value}<`), value);
  assert.match(out, /ledger-line--total[^>]*>.*?Estudado até hoje/);
  assert.doesNotMatch(out, />Planejado<|>Realizado</);
});

test('fechamento com estudo sem vínculo explica o 0% e oferece marcar o restante do plano', async () => {
  const { renderWeeklyCloseKpis } = await import('../../src/ui/renderers/studytrack32-renderer.js');
  const { buildWeekReconciliation } =
    await import('../../src/ui/tabs/goals/week-reconciliation.js');
  const close = {
    state: 'available',
    adherence: {
      model: { summary: { plannedMinutes: 80, executedMinutes: 623, temporalAdherence: 0 } },
    },
  };
  const reconciliation = buildWeekReconciliation({
    capacityMin: 720,
    plannedMin: 80,
    studiedMin: 623,
    periodLabel: '09/11 a 15/11',
  });
  const out = renderWeeklyCloseKpis(close, { formatMinutes: m => `${m} min`, reconciliation });
  assert.match(out, /estudar fora do plano não é perder tempo de estudo/);
  assert.match(
    out,
    /data-delegated-click="openWeeklyAdherencePlanning\(\)"[^>]*>\s*Marcar o restante do plano/
  );
  // A explicação vem antes das linhas do extrato.
  assert.ok(out.indexOf('estudar fora do plano') < out.indexOf('Capacidade da semana'));
  assert.match(out, /Aderência ao plano<\/span><strong>0%/);
});
