import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeTimerSeconds,
  hasActiveTimer,
  activeTimerMatchesRecommendation,
  renderActiveStudyTimerNoticeHtml,
  renderGuidedStrategyHtml,
  advanceGuidedStrategyStep,
  createTimerController,
} from '../../src/ui/controllers/timer-controller.js';

test('computeTimerSeconds — calcula segundos acumulados quando pausado', () => {
  assert.equal(computeTimerSeconds(null), 0);
  assert.equal(computeTimerSeconds({}), 0);
  assert.equal(computeTimerSeconds({ accumulatedSeconds: 150, isRunning: false }), 150);
});

test('computeTimerSeconds — calcula segundos dinâmicos quando em execução', () => {
  const baseNow = Date.now();
  const runStartedAt = new Date(baseNow - 45000).toISOString(); // 45s atrás
  const seconds = computeTimerSeconds(
    { accumulatedSeconds: 30, isRunning: true, runStartedAt },
    baseNow
  );
  assert.equal(seconds, 75);
});

test('hasActiveTimer — identifica se há cronômetro ativo ou pausado com tempo', () => {
  assert.equal(hasActiveTimer(null), false);
  assert.equal(hasActiveTimer({}), false);
  assert.equal(hasActiveTimer({ startedAt: '2026-10-25T01:00:00Z' }), true);
  assert.equal(hasActiveTimer({ isRunning: true }), true);
  assert.equal(hasActiveTimer({ accumulatedSeconds: 10 }), true);
  assert.equal(hasActiveTimer({ accumulatedSeconds: 0 }), false);
});

test('activeTimerMatchesRecommendation — verifica compatibilidade de alvo e tipo', () => {
  const active = {
    startedAt: '2026-10-25T01:00:00Z',
    subjectId: 's1',
    topicId: 't1',
    type: 'review',
    recommendationType: 'review',
  };

  assert.equal(
    activeTimerMatchesRecommendation(active, { subjectId: 's1', topicId: 't1', type: 'review' }),
    true
  );
  assert.equal(
    activeTimerMatchesRecommendation(active, { subjectId: 's2', topicId: 't1', type: 'review' }),
    false
  );
  assert.equal(
    activeTimerMatchesRecommendation(active, { subjectId: 's1', topicId: 't2', type: 'review' }),
    false
  );
});

test('renderActiveStudyTimerNoticeHtml — gera HTML do banner com detalhes', () => {
  const active = {
    startedAt: '2026-10-25T01:00:00Z',
    isRunning: true,
    subjectId: 's1',
    topicId: 't1',
  };

  const html = renderActiveStudyTimerNoticeHtml({
    active,
    subjectName: 'Direito Constitucional',
    topicName: 'Direitos Fundamentais',
    elapsed: '25:00',
    targetMinutes: 30,
    formatTargetFn: m => `${m} min`,
    escapeFn: s => s,
  });

  assert.match(html, /Sessão em andamento/);
  assert.match(html, /Direito Constitucional — Direitos Fundamentais/);
  assert.match(html, /25:00/);
  assert.match(html, /meta 30 min/);
  assert.match(html, /cronômetro rodando/);
});

test('renderGuidedStrategyHtml — formata etapas e botão de avanço', () => {
  const strategy = {
    label: 'Estratégia 50/10',
    steps: [
      { label: 'Leitura teórica', minutes: 25 },
      { label: 'Resolução de questões', minutes: 25 },
    ],
  };

  const htmlStep1 = renderGuidedStrategyHtml(strategy, 0);
  assert.match(htmlStep1, /Estratégia 50\/10 · etapa 1\/2/);
  assert.match(htmlStep1, /Leitura teórica · 25 min/);
  assert.match(htmlStep1, /Próxima etapa/);

  const htmlStep2 = renderGuidedStrategyHtml(strategy, 1);
  assert.match(htmlStep2, /etapa 2\/2/);
  assert.match(htmlStep2, /Concluir etapas/);
});

test('advanceGuidedStrategyStep — avança steps e marca status completed', () => {
  const active = {
    strategy: {
      label: 'Pomodoro',
      steps: [
        { label: 'Bloco 1', minutes: 25 },
        { label: 'Bloco 2', minutes: 25 },
      ],
    },
    strategyStep: 0,
  };

  const res1 = advanceGuidedStrategyStep(active);
  assert.equal(res1.isComplete, false);
  assert.equal(res1.nextIndex, 1);
  assert.equal(active.strategyStep, 1);
  assert.equal(active.strategy.steps[0].status, 'completed');

  const res2 = advanceGuidedStrategyStep(active);
  assert.equal(res2.isComplete, true);
  assert.equal(res2.nextIndex, 1);
});

test('createTimerController — inicia, pausa e reseta o cronômetro com callbacks', () => {
  let timerData = {
    accumulatedSeconds: 0,
    isRunning: false,
  };
  let ticks = [];
  let saves = 0;
  let controls = [];

  const controller = createTimerController({
    getActiveTimer: () => timerData,
    nowISO: () => '2026-10-25T01:00:00.000Z',
    onTick: sec => ticks.push(sec),
    onSave: () => saves++,
    onControlsUpdate: (running, sec) => controls.push({ running, sec }),
  });

  controller.start();
  assert.equal(controller.isTimerRunning(), true);
  assert.equal(timerData.isRunning, true);
  assert.equal(timerData.runStartedAt, '2026-10-25T01:00:00.000Z');
  assert.equal(saves, 1);

  controller.pause();
  assert.equal(controller.isTimerRunning(), false);
  assert.equal(timerData.isRunning, false);
  assert.equal(saves, 2);

  controller.reset();
  assert.equal(controller.getSeconds(), 0);
  assert.equal(timerData.accumulatedSeconds, 0);
  assert.equal(saves, 3);
});
