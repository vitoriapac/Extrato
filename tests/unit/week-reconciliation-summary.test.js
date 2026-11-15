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
  assert.match(out, />2 h</);
  assert.doesNotMatch(out, />1 h</);
});

test('aviso de plano curto usa o múltiplo exibido (2,04 não mostra; 2,06 mostra)', () => {
  assert.doesNotMatch(html(100, 204), /tempo com tarefa marcada/);
  assert.match(html(100, 206), /tempo com tarefa marcada/);
});

test('resumo diferencia a semana inteira do realizado até hoje', () => {
  const out = html(400, 231);
  assert.match(out, /inclui dias futuros/);
  assert.match(out, /Detalhamento do estudo ligado a tarefas indisponível/);
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
  assert.match(out, /Estudo avulso/);
});

test('prioridade informa a semana inteira e a necessidade de vínculo', async () => {
  const { renderStrategicExecution } =
    await import('../../src/ui/renderers/strategic-execution-renderer.js');
  const out = renderStrategicExecution(
    { priorityPlannedMinutes: 225, priorityExecutedMinutes: 0, strategicAdherence: 0 },
    '09/11 a 15/11'
  );
  assert.match(out, /semana inteira/);
  assert.match(out, /Só estudo ligado a uma tarefa válida conta/);
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
  assert.match(out, /Estudo avulso, sem tarefa/);
  assert.match(out, /30 min/);
  assert.match(out, /0 min de 1 h 20 min prioritárias/);
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
  assert.match(out, /Estudo ligado a tarefa desta semana[\s\S]*?30 min/);
  assert.match(out, /Ligado a tarefa incompatível ou inativa[\s\S]*?10 min/);
  assert.match(out, /Ligado a tarefa de outro período[\s\S]*?20 min/);
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
  assert.match(out, /análise do estudo ligado a tarefas considera 30 min em sessões únicas/);
  assert.match(out, /total acima usa as datas registradas/);
});

test('capacidade explica de onde vem o número e o estudado é a linha de total', () => {
  const out = html(160, 623, 720);
  assert.match(out, /Capacidade da semana<small>Soma da disponibilidade dos 7 dias<\/small>/);
  // O estudado é o total do extrato: única linha com a marca de total.
  assert.equal((out.match(/ledger-line--total/g) || []).length, 1);
  assert.match(out, /ledger-line--total[^>]*>.*?Estudado até hoje/);
});

test('o excesso vira uma sublinha com ação para ajustar a disponibilidade', async () => {
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
  // 5 h marcadas para 2 h de capacidade: excesso de 3 h, com a ação ao lado.
  assert.match(out, /Marcado acima da capacidade em <strong>3 h<\/strong>/);
  assert.match(out, /data-delegated-click="openAvailabilityAdjust\(\)"[^>]*>\s*Ajustar disponibilidade/);
  assert.doesNotMatch(out, /context-note--attention|tempo planejado nos dias|Só .* de capacidade têm tarefa marcada/);
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
  // Mesmos valores (1 h 20 min com tarefa marcada, 1 h estudada) nos dois lugares.
  for (const value of ['1 h 20 min', '1 h'])
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

test('saldo da semana: perfil vazio não mostra a barra', () => {
  assert.doesNotMatch(html(0, 0, 0), /chart-stacked/);
});

test('saldo da semana abaixo da capacidade tem frase descritiva, rótulos com duração e parte livre', () => {
  const out = html(160, 60, 720);
  assert.match(out, /role="img" aria-label="Saldo da semana, capacidade de 12 h:/);
  assert.match(out, /Estudado 1 h \(8%\)/);
  assert.match(out, /Marcado, ainda não estudado 1 h 40 min/);
  assert.match(out, /Livre 9 h 20 min/);
});

test('saldo da semana acima da capacidade marca o excedente e não cria parte livre', () => {
  const out = html(400, 800, 720);
  assert.match(out, /aria-label="Saldo da semana, 1 h 20 min acima da capacidade de 12 h:/);
  assert.doesNotMatch(out, /Livre /);
});

test('saldo da semana separa estudado com e sem vínculo', async () => {
  const { buildWeekReconciliation } = await import('../../src/ui/tabs/goals/week-reconciliation.js');
  const { weekBalanceParts } = await import('../../src/ui/tabs/goals/WeekReconciliationSummary.js');
  const data = buildWeekReconciliation({
    capacityMin: 600, plannedMin: 300, studiedMin: 240, periodLabel: '09/11 a 15/11',
    links: { studiedMinutes: 240, linkedMinutes: 150, additionalMinutes: 90, incompatibleMinutes: 0, otherPeriodMinutes: 0 },
  });
  const { parts } = weekBalanceParts(data);
  assert.deepEqual(parts.map(p => [p.label, p.value]), [
    ['Estudado ligado a tarefa', 150], ['Estudado avulso', 90], ['Marcado, ainda não estudado', 150], ['Livre', 210],
  ]);
});

test('frase-resumo diz o estudado contra a capacidade em três situações', async () => {
  const { weekSummarySentence } = await import('../../src/ui/tabs/goals/WeekReconciliationSummary.js');
  const d = (capacityMin, studiedMin) =>
    buildWeekReconciliation({ periodLabel: 'x', capacityMin, plannedMin: 0, studiedMin });
  assert.equal(weekSummarySentence(d(720, 623)), 'Estudado 10 h 23 min de 12 h; falta 1 h 37 min.');
  assert.equal(weekSummarySentence(d(720, 720)), 'Estudado 12 h de 12 h: capacidade completa.');
  assert.equal(weekSummarySentence(d(720, 810)), 'Estudado 13 h 30 min de 12 h: 1 h 30 min acima da capacidade.');
  assert.equal(weekSummarySentence(d(0, 0)), null);
  assert.equal(weekSummarySentence(d(0, 30)), 'Estudado 30 min até hoje.');
});

test('o resumo mostra a frase antes das linhas e não repete "só X dos Y" com o múltiplo', () => {
  const out = html(100, 300, 720);
  assert.ok(out.indexOf('week-reconciliation__sentence') < out.indexOf('Capacidade da semana'));
  assert.match(out, /Você estudou 3,0× o tempo com tarefa marcada\./);
  assert.doesNotMatch(out, /Só 1 h 40 min dos 12 h/);
});

test('a frase-resumo destaca o que falta em um único elemento forte', () => {
  const out = html(160, 623, 720);
  assert.match(out, /week-reconciliation__sentence">Estudado 10 h 23 min de 12 h; <strong>falta 1 h 37 min<\/strong>\./);
});

test('a execução das prioridades vira texto: sem número grande nem segunda barra', async () => {
  const { renderStrategicExecution } = await import('../../src/ui/renderers/strategic-execution-renderer.js');
  const out = renderStrategicExecution(
    { priorityPlannedMinutes: 326, priorityExecutedMinutes: 236, strategicAdherence: 72 },
    '09/11 a 15/11'
  );
  assert.match(out, /<strong>72%<\/strong> das prioridades executadas: 3 h 56 min de 5 h 26 min/);
  assert.doesNotMatch(out, /metas-priority-value|ui-progress/);
});

test('o excesso não usa caixa de alerta e o estudo avulso zerado não ocupa linha', async () => {
  const { buildWeekReconciliation } = await import('../../src/ui/tabs/goals/week-reconciliation.js');
  const data = buildWeekReconciliation({
    capacityMin: 120, plannedMin: 300, studiedMin: 60, periodLabel: 'x',
    links: { studiedMinutes: 60, linkedMinutes: 60, additionalMinutes: 0, incompatibleMinutes: 0, otherPeriodMinutes: 0 },
  });
  const out = render(h(WeekReconciliationSummary, { data }));
  assert.match(out, /class="week-reconciliation__excess" role="note"/);
  assert.doesNotMatch(out, /Estudo avulso, sem tarefa/);
  assert.match(out, /Estudo ligado a tarefa desta semana/);
});
