import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildOnboardingViewModel,
  EXAM_DATE_SHORTCUTS,
  AVAILABILITY_PRESETS,
  applyOnboardingDateShortcut,
  calculatePlanFeasibility,
} from '../../src/application/onboarding/build-onboarding-view-model.js';
import { buildFirstStepsMission } from '../../src/application/onboarding/build-first-steps-mission.js';
import {
  createGuidedTourState,
  nextTourStep,
  prevTourStep,
  closeTour,
  GUIDED_TOUR_STEPS,
  ESSENTIAL_TOUR_STEPS,
} from '../../src/domain/onboarding/guided-tour-steps.js';

test('applyOnboardingDateShortcut calcula datas sem deriva de fuso horário', () => {
  const base = '2026-10-26';
  assert.equal(applyOnboardingDateShortcut(base, 90), '2027-01-24');
  assert.equal(applyOnboardingDateShortcut(base, 180), '2027-04-24');
  assert.equal(applyOnboardingDateShortcut(base, 365), '2027-10-26');
  assert.equal(applyOnboardingDateShortcut(base, 0), '2026-10-26');
});

test('buildOnboardingViewModel expõe atalhos de data e presets de rotina congelados', () => {
  const model = buildOnboardingViewModel({ today: '2026-10-26' });
  assert.ok(Array.isArray(model.dateShortcuts));
  assert.equal(model.dateShortcuts.length, 3);
  assert.equal(model.dateShortcuts[0].offsetDays, 90);
  assert.equal(model.dateShortcuts[1].offsetDays, 180);
  assert.equal(model.dateShortcuts[2].offsetDays, 365);

  assert.ok(Array.isArray(model.availabilityPresets));
  assert.equal(model.availabilityPresets.length, 3);
  const workStudy = model.availabilityPresets.find(p => p.id === 'work_study');
  assert.ok(workStudy);
  assert.equal(workStudy.weeklyHours, 14);
  assert.equal(workStudy.hoursByDay['1'], 2);
  assert.equal(workStudy.hoursByDay['6'], 4);
});

test('buildFirstStepsMission exibe missões pós-plano e calcula progresso', () => {
  // Cenário 1: Sem plano -> invisível
  const noPlan = buildFirstStepsMission({ hasPlan: false });
  assert.equal(noPlan.visible, false);

  // Cenário 2: Tem plano mas sem sessões nem questões -> visível com 1/3 completo
  const planOnly = buildFirstStepsMission({
    hasPlan: true,
    sessionsCount: 0,
    questionsCount: 0,
    dismissed: false,
  });
  assert.equal(planOnly.visible, true);
  assert.equal(planOnly.completedCount, 1);
  assert.equal(planOnly.totalCount, 3);
  assert.equal(planOnly.progressPercent, 33);
  assert.equal(planOnly.activeMission?.id, 'session');
  assert.equal(planOnly.activeMission?.quickAction, 'start-quick-warmup');
  assert.ok(planOnly.activeMission?.quickActionLabel?.includes('Aquecimento'));

  // Cenário 3: Tem plano e 1 sessão -> 2/3 completo
  const planAndSession = buildFirstStepsMission({
    hasPlan: true,
    sessionsCount: 1,
    questionsCount: 0,
    dismissed: false,
  });
  assert.equal(planAndSession.visible, true);
  assert.equal(planAndSession.completedCount, 2);
  assert.equal(planAndSession.progressPercent, 67);
  assert.equal(planAndSession.activeMission?.id, 'questions');

  // Cenário 4: Tudo completo -> invisível automaticamente
  const allDone = buildFirstStepsMission({
    hasPlan: true,
    sessionsCount: 2,
    questionsCount: 15,
    dismissed: false,
  });
  assert.equal(allDone.visible, false);
  assert.equal(allDone.canRestore, false);
  assert.equal(allDone.completedCount, 3);
  assert.equal(allDone.progressPercent, 100);
  assert.equal(allDone.activeMission, null);

  // Cenário 5: Dispensado manualmente -> invisível mas restaurável
  const dismissed = buildFirstStepsMission({
    hasPlan: true,
    sessionsCount: 0,
    questionsCount: 0,
    dismissed: true,
  });
  assert.equal(dismissed.visible, false);
  assert.equal(dismissed.canRestore, true);
});

test('guided-tour-steps gerencia transição de paradas e limites de forma imutável', () => {
  const initial = createGuidedTourState();
  assert.equal(initial.active, true);
  assert.equal(initial.currentIndex, 0);
  assert.equal(initial.totalSteps, 5);
  assert.equal(initial.isFirst, true);
  assert.equal(initial.isLast, false);
  assert.equal(initial.currentStep?.id, 'overview-action');
  assert.equal(initial.currentStep?.tab, 'dashboard');

  // Avança para parada 2
  const step2 = nextTourStep(initial);
  assert.equal(step2.active, true);
  assert.equal(step2.currentIndex, 1);
  assert.equal(step2.isFirst, false);
  assert.equal(step2.currentStep?.id, 'today-execution');
  assert.equal(step2.currentStep?.tab, 'hoje');

  // Volta para parada 1
  const back = prevTourStep(step2);
  assert.equal(back.currentIndex, 0);
  assert.equal(back.isFirst, true);

  // Tentar voltar antes da 1 mantém o estado
  const backBeforeStart = prevTourStep(back);
  assert.equal(backBeforeStart.currentIndex, 0);

  // Avançar até a última parada
  let current = initial;
  for (let i = 0; i < 4; i++) {
    current = nextTourStep(current);
  }
  assert.equal(current.currentIndex, 4);
  assert.equal(current.isLast, true);
  assert.equal(current.currentStep?.id, 'weekly-planning');
  assert.equal(current.currentStep?.tab, 'metas');

  // Avançar além da última encerra o tour
  const finished = nextTourStep(current);
  assert.equal(finished.active, false);

  // Fechar explicitamente
  const closed = closeTour(step2);
  assert.equal(closed.active, false);
});

test('calculatePlanFeasibility avalia viabilidade e ritmo pedagógico', () => {
  // Cenário 1: Confortável (coverageRatio >= 1.25)
  // 20h/sem (1200 min) * 20 semanas = 24.000 min / 12.000 min necessários = 2.0
  const comfortable = calculatePlanFeasibility({
    availableWeeklyMinutes: 1200,
    estimatedNeedMinutes: 12000,
    weeksUntilExam: 20,
  });
  assert.ok(comfortable);
  assert.equal(comfortable.status, 'comfortable');
  assert.equal(comfortable.badgeText, 'Excelente');
  assert.equal(comfortable.coverageRatio, 2.0);

  // Cenário 2: Equilibrado (1.0 <= coverageRatio < 1.25)
  // 10h/sem (600 min) * 10 semanas = 6.000 min / 5.500 min = 1.09
  const balanced = calculatePlanFeasibility({
    availableWeeklyMinutes: 600,
    estimatedNeedMinutes: 5500,
    weeksUntilExam: 10,
  });
  assert.ok(balanced);
  assert.equal(balanced.status, 'balanced');
  assert.equal(balanced.badgeText, 'Equilibrado');

  // Cenário 3: Apertado (0.75 <= coverageRatio < 1.0)
  // 10h/sem (600 min) * 10 semanas = 6.000 min / 7.200 min = 0.83
  const tight = calculatePlanFeasibility({
    availableWeeklyMinutes: 600,
    estimatedNeedMinutes: 7200,
    weeksUntilExam: 10,
  });
  assert.ok(tight);
  assert.equal(tight.status, 'tight');
  assert.equal(tight.badgeText, 'Atenção');
  assert.ok(tight.verdictMessage.includes('Ritmo apertado'));

  // Cenário 4: Déficit (coverageRatio < 0.75)
  // 5h/sem (300 min) * 10 semanas = 3.000 min / 10.000 min = 0.3
  const deficit = calculatePlanFeasibility({
    availableWeeklyMinutes: 300,
    estimatedNeedMinutes: 10000,
    weeksUntilExam: 10,
  });
  assert.ok(deficit);
  assert.equal(deficit.status, 'deficit');
  assert.equal(deficit.badgeText, 'Priorização Crítica');
  assert.ok(deficit.verdictMessage.includes('Déficit de prazo'));
});

test('buildOnboardingViewModel detecta activeDateShortcut, activeAvailabilityPreset e planFeasibility', () => {
  const model = buildOnboardingViewModel({
    today: '2026-10-26',
    examDate: '2027-01-24', // 90 dias
    hoursByDay: { 0: 0, 1: 2, 2: 2, 3: 2, 4: 2, 5: 2, 6: 4 }, // work_study
    subjects: [
      {
        id: 'sub1',
        name: 'Direito Constitucional',
        topics: [{ id: 'top1', name: 'Controle', estimatedStudyMinutes: 120 }],
      },
    ],
  });

  assert.equal(model.activeDateShortcut, 90);
  assert.equal(model.activeAvailabilityPreset, 'work_study');
  assert.ok(model.planFeasibility);
  assert.equal(model.planFeasibility.status, 'comfortable');
});

test('ESSENTIAL_TOUR_STEPS — gerencia 3 paradas focadas no primeiro uso do estudante', () => {
  const state = createGuidedTourState(0, ESSENTIAL_TOUR_STEPS);
  assert.equal(state.totalSteps, 3);
  assert.equal(state.currentStep?.id, 'today-execution');
  assert.equal(state.currentStep?.tab, 'hoje');

  const step2 = nextTourStep(state);
  assert.equal(step2.currentStep?.id, 'overview-action');
  assert.equal(step2.currentStep?.tab, 'dashboard');

  const step3 = nextTourStep(step2);
  assert.equal(step3.currentStep?.id, 'questions-hub');
  assert.equal(step3.currentStep?.tab, 'questoes');
  assert.equal(step3.isLast, true);

  const done = nextTourStep(step3);
  assert.equal(done.active, false);
});
