import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildHeaderViewModel,
  displayReadinessValue,
} from '../../src/application/analytics/build-header-view-model.js';
test('separa prontidão composta de conteúdo concluído', () => {
  const topics = Array.from({ length: 47 }, (_, index) => ({
      id: String(index),
      status: index < 12 ? 'Concluído' : 'Não iniciado',
    })),
    model = buildHeaderViewModel({
      readiness: {
        value: 42,
        confidenceLabel: 'Alta',
        availableFactors: ['a', 'b', 'c', 'd', 'e'],
        missingFactors: [],
      },
      subjects: [{ id: 's' }],
      topics,
    });
  assert.equal(model.readinessValue, 42);
  assert.equal(model.contentPercent, 26);
  assert.equal(model.completed, 12);
  assert.equal(model.availableFactors, 5);
});
test('expõe a mesma prontidão para os dois renderizadores', () => {
  const model = buildHeaderViewModel({
    readiness: {
      value: 45,
      confidenceLabel: 'Alta',
      availableFactors: ['a', 'b'],
      missingFactors: [],
    },
    examDate: '2026-09-26',
    today: '2026-09-09',
    planNumber: '2026-001',
  });
  assert.equal(model.readiness.value, 45);
  assert.equal(model.exam.daysRemaining, 17);
  assert.equal(model.plan.number, '2026-001');
});
test('não mostra saldo com um único fator disponível', () => {
  const model = buildHeaderViewModel({
    readiness: {
      value: 45,
      confidenceLabel: 'Baixa',
      availableFactors: ['a'],
      missingFactors: ['b', 'c', 'd', 'e'],
    },
  });
  assert.equal(model.readiness.value, null);
  assert.equal(model.readinessValue, null);
  assert.equal(model.readiness.availableFactors, 1);
  assert.equal(model.readiness.totalFactors, 5);
});

test('Prontidão abaixo do mínimo de fatores aparece como ausente em qualquer superfície', () => {
  assert.equal(displayReadinessValue({ value: 45, availableFactors: ['coverage'] }), null);
  assert.equal(displayReadinessValue({ value: 45, availableFactors: ['coverage', 'mastery'] }), 45);
  assert.equal(displayReadinessValue(null), null);
});

test('Prontid�o s� com cobertura e consist�ncia n�o mostra nota (1s de estudo n�o vira 43/100)', () => {
  assert.equal(
    displayReadinessValue({ value: 43, availableFactors: ['coverage', 'consistency'] }),
    null
  );
  assert.equal(displayReadinessValue({ value: 43, availableFactors: ['coverage', 'mastery'] }), 43);
});
test('cabeçalho ancora a Prontidão no último fechamento e mostra o cálculo de agora como prévia', async () => {
  const { lastWeeklyCloseReadiness } =
    await import('../../src/application/analytics/readiness-history.js');
  const snapshots = [
    { date: '2026-11-08', score: 62, activeExamTags: [], captureKind: 'weekly-close' },
    { date: '2026-11-22', score: 60, activeExamTags: [], captureKind: 'weekly-close' },
    { date: '2026-11-24', score: 55, activeExamTags: [], captureKind: 'before-strategy-change' },
  ];
  const lastClose = lastWeeklyCloseReadiness(snapshots, [], '2026-11-26');
  assert.deepEqual(lastClose, { score: 60, date: '2026-11-22' });
  assert.equal(
    lastWeeklyCloseReadiness(snapshots, [], '2026-12-20'),
    null,
    'fechamento velho não ancora'
  );
  const readiness = { value: 49, availableFactors: ['a', 'b', 'c', 'd'], missingFactors: [] };
  const model = buildHeaderViewModel({ readiness, lastClose });
  assert.equal(model.readiness.value, 60);
  assert.equal(model.readiness.preview, 49);
  assert.equal(model.readiness.closeDate, '2026-11-22');
  const noClose = buildHeaderViewModel({ readiness });
  assert.equal(noClose.readiness.value, 49);
  assert.equal(noClose.readiness.preview, null);
});
