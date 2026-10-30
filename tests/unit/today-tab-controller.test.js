import test from 'node:test';
import assert from 'node:assert/strict';
import { createTodayTabController } from '../../src/ui/tabs/today/today-tab-controller.js';

test('todayTabController: buildDailyStudyPlan distribui tempo e flexMinutes', () => {
  const controller = createTodayTabController({
    formatPlanMinutes: m => `${m}m`,
    formatDatePt: d => d,
  });

  const priorities = [
    { id: 'p1', estimatedMinutes: 30, score: 90 },
    { id: 'p2', estimatedMinutes: 45, score: 80 },
    { id: 'p3', estimatedMinutes: 60, score: 70 },
  ];

  // 60 minutos disponíveis: p1 (30m) + p2 (30m) = 60m planejados, flexMinutes = 0
  const plan1 = controller.buildDailyStudyPlan(priorities, 60);
  assert.equal(plan1.items.length, 2);
  assert.equal(plan1.plannedMinutes, 60);
  assert.equal(plan1.flexMinutes, 0);

  // 100 minutos disponíveis: p1 (30m) + p2 (45m) + p3 (25m) = 100m
  const plan2 = controller.buildDailyStudyPlan(priorities, 100);
  assert.equal(plan2.items.length, 3);
  assert.equal(plan2.plannedMinutes, 100);
  assert.equal(plan2.flexMinutes, 0);

  // Pouco tempo (< 15 minutos): nenhum item elegível
  const plan3 = controller.buildDailyStudyPlan(priorities, 10);
  assert.equal(plan3.items.length, 0);
  assert.equal(plan3.plannedMinutes, 0);
  assert.equal(plan3.flexMinutes, 10);
});

test('todayTabController: materializeDailyStudyPlan cria e persiste plano diário', () => {
  let saved = false;
  const state = {
    dailyPlans: [],
    algorithmVersions: { recommendations: 1 },
    examBlueprint: { activeExamTags: [] },
  };

  const controller = createTodayTabController({
    formatPlanMinutes: m => `${m}m`,
    formatDatePt: d => d,
    getState: () => state,
    todayISO: () => '2026-10-28',
    nowISO: () => '2026-10-28T10:00:00Z',
    uid: (p = 'id') => `${p}_mock`,
    scheduleSave: () => {
      saved = true;
    },
    getSubjectName: () => 'Direito',
    getTopicName: () => 'Controle',
    motivoPrioridade: () => 'Alta relevância',
    freezePlanExecution: () => {},
  });

  const priorities = [
    { id: 'p1', subjectId: 's1', topicId: 't1', estimatedMinutes: 40, score: 85, tier: 'Alta' },
  ];

  const plan = controller.materializeDailyStudyPlan(priorities, 60);
  assert.ok(plan);
  assert.equal(plan.date, '2026-10-28');
  assert.equal(plan.items.length, 1);
  assert.equal(plan.items[0].plannedMinutes, 40);
  assert.equal(plan.flexMinutes, 20);
  assert.equal(saved, true);
  assert.equal(state.dailyPlans.length, 1);

  // todayDailyStudyPlan retorna o plano criado
  const todayPlan = controller.todayDailyStudyPlan();
  assert.equal(todayPlan?.id, plan.id);
});

test('todayTabController: planItemStatusLabel mapeia corretamente os status', () => {
  const controller = createTodayTabController({
    formatPlanMinutes: m => `${m}m`,
    formatDatePt: d => d,
  });

  assert.equal(controller.planItemStatusLabel('planned'), 'Planejada');
  assert.equal(controller.planItemStatusLabel('in_progress'), 'Em andamento');
  assert.equal(controller.planItemStatusLabel('partial'), 'Parcial');
  assert.equal(controller.planItemStatusLabel('completed'), 'Concluída');
  assert.equal(controller.planItemStatusLabel('deferred'), 'Adiada');
  assert.equal(controller.planItemStatusLabel('replaced'), 'Substituída');
  assert.equal(controller.planItemStatusLabel('skipped'), 'Ignorada');
  assert.equal(controller.planItemStatusLabel('unknown'), 'Planejada');
});

test('todayTabController: dismissFirstSteps e restoreFirstSteps em demo mode', () => {
  const controller = createTodayTabController({
    formatPlanMinutes: m => `${m}m`,
    formatDatePt: d => d,
    isDemoMode: () => true,
  });

  assert.equal(controller.isFirstStepsDismissed(), false);
  controller.dismissFirstSteps();
  assert.equal(controller.isFirstStepsDismissed(), true);
  controller.restoreFirstSteps();
  assert.equal(controller.isFirstStepsDismissed(), false);
});
