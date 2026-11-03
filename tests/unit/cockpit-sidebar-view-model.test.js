import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildCockpitSidebarViewModel } from '../../src/application/analytics/build-cockpit-sidebar-view-model.js';

test('buildCockpitSidebarViewModel: gera estrutura consistente com estado vazio', () => {
  const result = buildCockpitSidebarViewModel(null, '2026-11-02');
  assert.ok(result.todayGoal);
  assert.equal(result.todayGoal.percent, 0);
  assert.equal(result.todayGoal.questionsDone, 0);

  assert.ok(result.reviewLoad);
  assert.equal(result.reviewLoad.days.length, 7);
  assert.equal(result.reviewLoad.overdueCount, 0);

  assert.ok(result.consistency);
  assert.equal(result.consistency.days.length, 28);
  assert.equal(result.consistency.activeDaysCount, 0);
});

test('buildCockpitSidebarViewModel: calcula meta do dia, revisões da semana e mini-heatmap', () => {
  const todayISO = '2026-11-02'; // A Monday
  const state = {
    historico: [
      { id: 's1', data: todayISO, duracao: 135 }, // 2h15
      { id: 's2', data: '2026-11-01', duracao: 90 },
      { id: 's3', data: '2026-10-31', duracao: 60 },
    ],
    questoes: [
      { id: 'q1', data: todayISO, resolvidas: 38 },
    ],
    planoEstudos: {
      dias: {
        [todayISO]: {
          itens: [
            { minutos: 180 }, // 3h00
          ],
        },
      },
    },
    metas: {
      questoesDia: 40,
    },
    revisoes: [
      { id: 'r1', dataAgendada: todayISO, status: 'pendente' },
      { id: 'r2', dataAgendada: todayISO, status: 'pendente' },
      { id: 'r3', dataAgendada: '2026-11-05', status: 'pendente' }, // Qui
      { id: 'r4', dataAgendada: '2026-11-05', status: 'pendente' },
      { id: 'r5', dataAgendada: '2026-11-05', status: 'pendente' },
      { id: 'r6', dataAgendada: '2026-11-05', status: 'pendente' },
      { id: 'r7', dataAgendada: '2026-10-30', status: 'pendente' }, // overdue
    ],
  };

  const result = buildCockpitSidebarViewModel(state, todayISO);

  // Today's Goal
  assert.equal(result.todayGoal.percent, 75); // 135 / 180 = 75%
  assert.equal(result.todayGoal.studiedFormatted, '2h15');
  assert.equal(result.todayGoal.plannedFormatted, '3h00');
  assert.equal(result.todayGoal.questionsDone, 38);
  assert.equal(result.todayGoal.questionsTarget, 40);

  // Weekly Review Load
  assert.equal(result.reviewLoad.days.length, 7);
  assert.equal(result.reviewLoad.overdueCount, 1);
  const qui = result.reviewLoad.days.find(d => d.dayName === 'Qui');
  assert.ok(qui);
  assert.equal(qui.count, 4);
  assert.equal(qui.isPeak, true);
  assert.match(result.reviewLoad.tip, /Quinta-feira tem pico de 4 revisões/);

  // Consistency Mini-Heatmap
  assert.equal(result.consistency.days.length, 28);
  assert.equal(result.consistency.activeDaysCount, 3);
  const todayHeatmap = result.consistency.days.find(d => d.isToday);
  assert.ok(todayHeatmap);
  assert.equal(todayHeatmap.level, 3); // 135 min >= 120 min
});
