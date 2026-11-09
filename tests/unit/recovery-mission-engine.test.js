import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildRecoveryMissionPlan,
  calculateReviewUrgencyScore,
} from '../../src/domain/recovery/recovery-mission-engine.js';

test('calculateReviewUrgencyScore — pontua dias de atraso, risco crítico e prioridade', () => {
  const item1 = {
    id: 'rev-1',
    origin: 'Agenda de Revisões',
    date: '2026-11-01',
    subjectName: 'Direito Constitucional',
    topicId: 'top-1',
    topicName: 'Controle de Constitucionalidade',
    daysOverdue: 8,
    priorityScore: 85,
    isCriticalRisk: true,
  };

  const score1 = calculateReviewUrgencyScore(item1, ['top-1']);
  // Days (min(50, 40) = 40), Critical (+40), Priority >= 70 (+30) => 110
  assert.ok(score1.score >= 100);
  assert.match(score1.reason, /8 dias de atraso/);
  assert.match(score1.reason, /Risco de esquecimento/);
  assert.match(score1.reason, /Alta relevância/);

  const item2 = {
    id: 'rev-2',
    origin: 'Calendário',
    date: '2026-11-08',
    subjectName: 'Informática',
    topicId: 'top-2',
    topicName: 'Navegadores',
    daysOverdue: 1,
    priorityScore: 20,
    isCriticalRisk: false,
  };

  const score2 = calculateReviewUrgencyScore(item2);
  assert.ok(score2.score < 20);
  assert.match(score2.reason, /Venceu recentemente/);
});

test('buildRecoveryMissionPlan — retorna plano vazio se minutos <= 0 ou sem revisões', () => {
  const empty1 = buildRecoveryMissionPlan({
    overdueItems: [],
    availableMinutes: 60,
  });
  assert.equal(empty1.blocks.length, 0);
  assert.equal(empty1.rescuedReviewsCount, 0);

  const empty2 = buildRecoveryMissionPlan({
    overdueItems: [
      {
        id: 'rev-1',
        origin: 'Calendário',
        date: '2026-11-01',
        subjectName: 'Português',
        topicName: 'Crase',
        daysOverdue: 5,
      },
    ],
    availableMinutes: 10,
    blockDurationMinutes: 15,
  });
  assert.equal(empty2.blocks.length, 0);
});

test('buildRecoveryMissionPlan — dimensiona blocos e prioriza itens mais urgentes', () => {
  const overdue = [
    {
      id: 'rev-low',
      origin: 'Calendário',
      date: '2026-11-08',
      subjectName: 'Informática',
      topicId: 'top-low',
      topicName: 'Hardware',
      daysOverdue: 1,
      priorityScore: 30,
    },
    {
      id: 'rev-high',
      origin: 'Agenda de Revisões',
      date: '2026-10-25',
      subjectName: 'Direito Administrativo',
      topicId: 'top-high',
      topicName: 'Licitações',
      daysOverdue: 15,
      priorityScore: 90,
      isCriticalRisk: true,
    },
    {
      id: 'rev-mid',
      origin: 'Agenda de Revisões',
      date: '2026-11-05',
      subjectName: 'Raciocínio Lógico',
      topicId: 'top-mid',
      topicName: 'Tabela Verdade',
      daysOverdue: 4,
      priorityScore: 60,
    },
  ];

  // 30 min com blocos de 15 min = 2 blocos
  const plan = buildRecoveryMissionPlan({
    overdueItems: overdue,
    availableMinutes: 30,
    blockDurationMinutes: 15,
    criticalTopicIds: ['top-high'],
  });

  assert.equal(plan.availableMinutes, 30);
  assert.equal(plan.totalAllocatedMinutes, 30);
  assert.equal(plan.totalReviewsInDebt, 3);
  assert.equal(plan.rescuedReviewsCount, 2);
  assert.equal(plan.remainingDebtCount, 1);
  assert.equal(plan.blocks.length, 2);

  // O primeiro bloco DEVE ser o de maior urgência (Licitações)
  assert.equal(plan.blocks[0].reviewId, 'rev-high');
  assert.equal(plan.blocks[0].topicName, 'Licitações');
  assert.equal(plan.blocks[0].durationMinutes, 15);

  // O segundo bloco deve ser o rev-mid
  assert.equal(plan.blocks[1].reviewId, 'rev-mid');
});

test('buildRecoveryMissionPlan — suporta orçamentos de 45, 60 e 90 minutos', () => {
  const overdue = Array.from({ length: 8 }, (_, i) => ({
    id: `rev-${i + 1}`,
    origin: 'Agenda de Revisões',
    date: `2026-11-0${Math.max(1, 9 - i)}`,
    subjectName: `Disciplina ${i + 1}`,
    topicName: `Tópico ${i + 1}`,
    daysOverdue: i + 1,
  }));

  const plan45 = buildRecoveryMissionPlan({
    overdueItems: overdue,
    availableMinutes: 45,
    blockDurationMinutes: 15,
  });
  assert.equal(plan45.blocks.length, 3);
  assert.equal(plan45.totalAllocatedMinutes, 45);

  const plan60 = buildRecoveryMissionPlan({
    overdueItems: overdue,
    availableMinutes: 60,
    blockDurationMinutes: 15,
  });
  assert.equal(plan60.blocks.length, 4);
  assert.equal(plan60.totalAllocatedMinutes, 60);

  const plan90 = buildRecoveryMissionPlan({
    overdueItems: overdue,
    availableMinutes: 90,
    blockDurationMinutes: 15,
  });
  assert.equal(plan90.blocks.length, 6);
  assert.equal(plan90.totalAllocatedMinutes, 90);
});
