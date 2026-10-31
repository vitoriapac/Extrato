import test from 'node:test';
import assert from 'node:assert/strict';
import { h } from 'preact';
import { render } from 'preact-render-to-string';
import { WeeklyAvailabilityGrid } from '../../src/ui/tabs/goals/WeeklyAvailabilityGrid.js';
import { PlanExecutionCard } from '../../src/ui/tabs/goals/PlanExecutionCard.js';
import { createGoalsTabController } from '../../src/ui/tabs/goals/goals-tab-controller.js';

test('WeeklyAvailabilityGrid Preact Component — renderiza resumo de disponibilidade e dias', () => {
  const html = render(
    h(WeeklyAvailabilityGrid, {
      summary: { totalMinutes: 1200, activeDays: 5, averageHours: 4 },
      formattedTotal: '20h',
      formattedAverage: '4h',
      formattedToday: '3h',
      days: [
        { dayIndex: 0, label: 'Domingo', isToday: false, hours: 2 },
        { dayIndex: 1, label: 'Segunda', isToday: true, hours: 4 },
        { dayIndex: 2, label: 'Terça', isToday: false, hours: 4 },
      ],
    })
  );

  assert.match(html, /20h/);
  assert.match(html, /disponíveis por semana/);
  assert.match(html, /5/);
  assert.match(html, /dias com estudo/);
  assert.match(html, /Segunda · hoje/);
  assert.match(html, /updateMetaHoursDay\(1,this\.value\)/);
  assert.match(html, /applyTodayGoalToAllDays\(\)/);
  assert.match(html, /clearWeekendGoals\(\)/);
});

test('WeeklyAvailabilityGrid Preact Component — exibe aviso quando vazio', () => {
  const html = render(
    h(WeeklyAvailabilityGrid, {
      summary: { totalMinutes: 0, activeDays: 0, averageHours: 0, state: 'empty' },
      formattedTotal: '0h',
      formattedAverage: '0h',
      formattedToday: '0h',
      days: [],
    })
  );

  assert.match(html, /Defina ao menos um dia para habilitar recomendações e planejamento/);
});

test('PlanExecutionCard Preact Component — renderiza execução, distribuição e alinhamento', () => {
  const html = render(
    h(PlanExecutionCard, {
      executionViewHtml: '<div class="exec-view">Resumo de Execução</div>',
      distributionHtml: '<div class="dist-view">Distribuição</div>',
      alignmentHtml: '<div class="align-view">Alinhamento</div>',
    })
  );

  assert.match(html, /Resumo de Execução/);
  assert.match(html, /Distribuição entre disciplinas/);
  assert.match(html, /Plano × impacto na prova/);
});

test('createGoalsTabController — renderiza disponibilidade e plano de execução', () => {
  const state = {
    metas: {
      horasPorDia: { 1: 4, 2: 4 },
    },
    dailyPlans: [],
    studySessions: [],
    subjects: [],
  };

  const controller = createGoalsTabController({
    state,
    parseLocalDate: () => ({ getDay: () => 1 }),
    todayISO: () => '2026-03-16',
    buildWeeklyAvailability: () => ({
      totalMinutes: 480,
      activeDays: 2,
      averageHours: 4,
      state: 'ok',
    }),
    formatPlanMinutes: mins => `${Math.round(mins / 60)}h`,
    metaHoursToday: () => 4,
    metaHoursForDate: () => 4,
    addDays: iso => iso,
    startOfWeek: iso => iso,
    WEEKDAY_LABELS: ['Dom', 'Seg'],
    buildPlanExecution: () => ({ ok: true }),
    renderPlanExecutionView: () => '<div>Vista de Execução</div>',
  });

  const availHtml = controller.renderWeeklyAvailabilityHtml();
  assert.match(availHtml, /8h/);
  assert.match(availHtml, /Seg · hoje/);

  const execHtml = controller.renderPlanExecutionHtml();
  assert.match(execHtml, /Vista de Execução/);
});

test('createGoalsTabController — renderMetas e metas por disciplina montam HTML', () => {
  const container = { innerHTML: '' };
  const state = {
    metas: { semanal: 5, aderenciaSemanal: 80 },
    metasPorDisciplina: [{ id: 'md1', subjectId: 's1', meta: 20 }],
    questoes: [],
    simulados: [],
    studySessions: [],
  };

  const controller = createGoalsTabController({
    state,
    parseLocalDate: () => ({ getDay: () => 1 }),
    todayISO: () => '2026-10-28',
    buildWeeklyAvailability: () => ({ totalMinutes: 600, activeDays: 5, averageHours: 2 }),
    formatPlanMinutes: m => `${m}min`,
    metaHoursToday: () => 2,
    metaHoursForDate: () => 2,
    addDays: (iso, days) => iso,
    startOfWeek: iso => iso,
    WEEKDAY_LABELS: ['Dom', 'Seg'],
    buildResultGoalsViewModel: ({ goals }) => ({ target: goals.semanal }),
    renderGoals: model => `<div class="metas-view">Meta ${model.target}</div>`,
    activeSubjects: () => [{ id: 's1', name: 'Direito' }],
    getSubjectName: () => 'Direito',
    somarQuestoesDisciplinaNaSemana: () => 10,
    buildPeriodComparisonViewModel: () => ({ ok: true }),
    renderPeriodComparisonDetail: () => '<div class="comparison">Comparacao</div>',
  });

  controller.renderMetas(container, {
    weeklyTopics: 2,
    monthlyTopics: 8,
    questions: 50,
    simulations: 1,
    accuracy: 80,
    studyDays: 4,
  });
  assert.match(container.innerHTML, /Meta 5/);

  controller.renderMetasPorDisciplina(container);
  assert.match(container.innerHTML, /Direito/);
  assert.match(container.innerHTML, /10 \/ 20/);
  assert.match(container.innerHTML, /50% da meta/);

  const weeks = [
    {
      weekStart: '2026-10-20',
      weekEnd: '2026-10-26',
      current: false,
      topicsConcl: 5,
      semanalOk: true,
      questoesResolved: 100,
      questoesOk: true,
      simuladosCount: 1,
      simuladosOk: true,
    },
  ];
  controller.renderHistoricoMetas(container, weeks);
  assert.match(container.innerHTML, /2026-10-20 – 2026-10-26/);
  assert.match(container.innerHTML, /cumprida/);

  // Semanas anteriores ao primeiro registro não aparecem nem como "não cumprida".
  controller.renderHistoricoMetas(container, [
    { ...weeks[0], weekStart: '2026-10-27', weekEnd: '2026-11-02', current: true },
    { ...weeks[0], semanalOk: false, beforeStart: true },
  ]);
  assert.doesNotMatch(container.innerHTML, /não cumprida/);
  assert.match(container.innerHTML, /aparecem aqui à medida que você registra estudo/);
});
