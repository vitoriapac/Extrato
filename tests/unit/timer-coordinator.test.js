import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatTimer,
  findDailyPlanItem,
  releaseActivePlanItem,
  preparePlannedActivityStart,
  buildCompletedSessionRecord,
  topicResumeLabel,
  resolveSessionBookmark,
} from '../../src/application/sessions/timer-coordinator.js';

test('formatTimer — formata corretamente tempos em MM:SS e HH:MM:SS', () => {
  assert.equal(formatTimer(0), '00:00');
  assert.equal(formatTimer(59), '00:59');
  assert.equal(formatTimer(60), '01:00');
  assert.equal(formatTimer(3599), '59:59');
  assert.equal(formatTimer(3600), '01:00:00');
  assert.equal(formatTimer(3665), '01:01:05');
});

test('findDailyPlanItem — localiza item aninhado em lista de planos diários', () => {
  const dailyPlans = [
    { id: 'plan-1', items: [{ id: 'item-1', status: 'planned' }] },
    { id: 'plan-2', items: [{ id: 'item-2', status: 'in_progress' }] },
  ];

  const found = findDailyPlanItem(dailyPlans, 'item-2');
  assert.ok(found);
  assert.equal(found.plan.id, 'plan-2');
  assert.equal(found.item.id, 'item-2');

  assert.equal(findDailyPlanItem(dailyPlans, 'inexistente'), null);
  assert.equal(findDailyPlanItem([], 'item-1'), null);
});

test('releaseActivePlanItem — atualiza status para partial se executou segundos, ou planned se zerado', () => {
  const plans = [
    {
      id: 'p1',
      items: [
        { id: 'i1', status: 'in_progress', executedSeconds: 120 },
        { id: 'i2', status: 'in_progress', executedSeconds: 0 },
      ],
    },
  ];
  const now = () => '2026-10-28T12:00:00Z';

  assert.equal(releaseActivePlanItem(plans, 'i1', now), true);
  assert.equal(plans[0].items[0].status, 'partial');
  assert.equal(plans[0].updatedAt, '2026-10-28T12:00:00Z');

  assert.equal(releaseActivePlanItem(plans, 'i2', now), true);
  assert.equal(plans[0].items[1].status, 'planned');

  assert.equal(releaseActivePlanItem(plans, 'inexistente', now), false);
  assert.equal(releaseActivePlanItem(plans, null, now), false);
});

test('preparePlannedActivityStart — valida e transiciona item para in_progress', () => {
  const plans = [
    {
      id: 'p1',
      items: [
        {
          id: 'item-1',
          status: 'planned',
          subjectId: 'sub-1',
          topicId: 'top-1',
          strategy: { label: 'Revisão ativa' },
        },
      ],
    },
  ];
  const activeTimer = { planItemId: null };
  const executionItems = [{ id: 'item-1', remainingSeconds: 1800 }];
  const getSubjectById = id => ({ id, name: 'Português' });

  const result = preparePlannedActivityStart({
    itemId: 'item-1',
    dailyPlans: plans,
    executionItems,
    activeTimer,
    nowISO: () => '2026-10-28T12:00:00Z',
    getSubjectById,
  });

  assert.equal(result.ok, true);
  assert.equal(result.subjectId, 'sub-1');
  assert.equal(result.topicId, 'top-1');
  assert.equal(result.targetMinutes, 30);
  assert.equal(plans[0].items[0].status, 'in_progress');
});

test('buildCompletedSessionRecord — constrói objeto imutável da sessão de estudo', () => {
  const activeTimer = {
    planItemId: 'item-1',
    recommendationId: 'rec-1',
  };
  const formValues = {
    subjectId: 'sub-1',
    topicId: 'top-1',
    type: 'study',
    resolved: 10,
    correct: 8,
    perceivedRetention: 'Alta',
    perceivedDifficulty: 'Média',
    focusLevel: 'high',
    energyLevel: 'medium',
    notes: 'Estudo muito produtivo',
  };

  const record = buildCompletedSessionRecord({
    timerSeconds: 1500,
    timerStartedAt: '2026-10-28T10:00:00Z',
    activeTimer,
    formValues,
    nowISO: () => '2026-10-28T10:25:00Z',
    localDateFromTimestamp: ts => (typeof ts === 'string' ? ts.slice(0, 10) : null),
    uid: prefix => `${prefix}-123`,
  });

  assert.equal(record.id, 'session-123');
  assert.equal(record.startedAt, '2026-10-28T10:00:00Z');
  assert.equal(record.endedAt, '2026-10-28T10:25:00Z');
  assert.equal(record.date, '2026-10-28');
  assert.equal(record.durationSeconds, 1500);
  assert.equal(record.questionsResolved, 10);
  assert.equal(record.correctAnswers, 8);
  assert.equal(record.planItemId, 'item-1');
});

test('resolveSessionBookmark — gerencia remoção e atualização de bookmarks', () => {
  const current = { resourceType: 'pdf', label: 'Cap 1', currentUnit: 10, totalUnits: 50 };

  // Limpeza explícita
  const clearResult = resolveSessionBookmark({
    topicId: 't1',
    endedAt: '2026-10-28T10:00:00Z',
    isCleared: true,
    fieldValues: {},
    currentBookmark: current,
  });
  assert.equal(clearResult.shouldUpdate, true);
  assert.equal(clearResult.nextBookmark, null);

  // Valores idênticos aos atuais (sem necessidade de atualizar)
  const noChangeResult = resolveSessionBookmark({
    topicId: 't1',
    endedAt: '2026-10-28T10:00:00Z',
    isCleared: false,
    fieldValues: {
      resourceType: 'pdf',
      label: 'Cap 1',
      currentUnit: '10',
      totalUnits: '50',
    },
    currentBookmark: current,
  });
  assert.equal(noChangeResult.shouldUpdate, false);

  // Atualização com nova unidade
  const updateResult = resolveSessionBookmark({
    topicId: 't1',
    endedAt: '2026-10-28T10:00:00Z',
    isCleared: false,
    fieldValues: {
      resourceType: 'pdf',
      label: 'Cap 1',
      currentUnit: '15',
      totalUnits: '50',
    },
    currentBookmark: current,
  });
  assert.equal(updateResult.shouldUpdate, true);
  assert.equal(updateResult.nextBookmark.currentUnit, 15);
});
