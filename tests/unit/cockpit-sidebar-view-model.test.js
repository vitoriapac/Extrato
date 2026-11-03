import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildCockpitSidebarViewModel } from '../../src/application/analytics/build-cockpit-sidebar-view-model.js';
import { buildConsistencyStrip } from '../../src/ui/renderers/consistency-strip-renderer.js';
import { buildReviewLoad } from '../../src/ui/renderers/reviews-renderer.js';

const todayISO = '2026-11-02'; // A Monday

const state = {
  studySessions: [
    { id: 's1', date: todayISO, durationSeconds: 135 * 60 },
    { id: 's2', date: '2026-11-01', durationSeconds: 90 * 60 },
    { id: 's3', date: '2026-10-31', durationSeconds: 60 * 60 },
  ],
  questoes: [{ id: 'q1', date: todayISO, resolved: 38 }],
  metas: { questoesSemanal: 280 },
};

const reviews = [
  { id: 'r1', date: todayISO, status: 'Pendente' },
  { id: 'r2', date: todayISO, status: 'Pendente' },
  { id: 'r3', date: '2026-11-05', status: 'Pendente' }, // Qui
  { id: 'r4', date: '2026-11-05', status: 'Pendente' },
  { id: 'r5', date: '2026-11-05', status: 'Pendente' },
  { id: 'r6', date: '2026-11-05', status: 'Pendente' },
  { id: 'r7', date: '2026-10-30', status: 'Pendente' }, // overdue
  { id: 'r8', date: '2026-11-03', status: 'Concluído' },
];

test('buildCockpitSidebarViewModel: estado vazio não inventa meta nem revisões', () => {
  const result = buildCockpitSidebarViewModel(null, todayISO);
  assert.equal(result.todayGoal.percent, 0);
  assert.equal(result.todayGoal.plannedFormatted, '0 min');
  assert.equal(result.todayGoal.questionsDone, 0);
  assert.equal(result.reviewLoad.days.length, 7);
  assert.equal(result.reviewLoad.overdueCount, 0);
  assert.match(result.reviewLoad.tip, /Nenhuma revisão agendada/);
  assert.equal(result.consistency.days.length, 28);
  assert.equal(result.consistency.activeDaysCount, 0);
});

test('buildCockpitSidebarViewModel: calcula meta do dia, revisões da semana e mini-heatmap', () => {
  const result = buildCockpitSidebarViewModel(state, todayISO, { goalMinutes: 180, reviews });

  assert.equal(result.todayGoal.percent, 75); // 135 / 180
  assert.equal(result.todayGoal.studiedFormatted, '2h15');
  assert.equal(result.todayGoal.plannedFormatted, '3h00');
  assert.equal(result.todayGoal.questionsDone, 38);
  assert.equal(result.todayGoal.questionsTarget, 40); // 280 / 7

  assert.equal(result.reviewLoad.overdueCount, 1);
  const qui = result.reviewLoad.days.find(d => d.dayName === 'Qui');
  assert.equal(qui.count, 4);
  assert.equal(qui.isPeak, true);
  assert.match(result.reviewLoad.tip, /Quinta-feira tem pico de 4 revisões/);

  assert.equal(result.consistency.activeDaysCount, 3);
  assert.equal(result.consistency.days.find(d => d.isToday).level, 3); // 135 min >= 120 min
});

test('paridade com Hoje: mesmos dias ativos, atrasadas e meta que a aba Hoje', () => {
  const sidebar = buildCockpitSidebarViewModel(state, todayISO, { goalMinutes: 120, reviews });

  const strip = buildConsistencyStrip({
    sessions: state.studySessions,
    questions: state.questoes,
    today: todayISO,
  });
  assert.equal(sidebar.consistency.activeDaysCount, strip.activeDays);

  const load = buildReviewLoad(reviews, todayISO, 7);
  assert.equal(sidebar.reviewLoad.overdueCount, load.overdue);

  assert.equal(sidebar.todayGoal.plannedFormatted, '2h00');
});

test('overdueCount informado pelo seletor prevalece sobre o cálculo local', () => {
  const result = buildCockpitSidebarViewModel(state, todayISO, { reviews, overdueCount: 9 });
  assert.equal(result.reviewLoad.overdueCount, 9);
});

test('Plano de hoje vem de planMinutes e some sem plano', () => {
  const comPlano = buildCockpitSidebarViewModel(state, todayISO, { goalMinutes: 120, planMinutes: 80 });
  assert.equal(comPlano.todayGoal.planFormatted, '1h20');
  assert.equal(comPlano.todayGoal.plannedFormatted, '2h00');

  const semPlano = buildCockpitSidebarViewModel(state, todayISO, { goalMinutes: 120 });
  assert.equal(semPlano.todayGoal.planFormatted, null);
});
