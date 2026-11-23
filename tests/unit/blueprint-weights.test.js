import test from 'node:test';
import assert from 'node:assert/strict';
import {
  blueprintWeightedMean,
  subjectExamPoints,
} from '../../src/domain/exams/blueprint-weights.ts';
import {
  calculateApprovalAcertosMetric,
  calculateApprovalEditalMetric,
} from '../../src/domain/analytics/approval-metrics.ts';

const subjects = [
  { subjectId: 'port', expectedQuestions: 10, questionWeight: 1 },
  { subjectId: 'esp', expectedQuestions: 30, questionWeight: 2 },
];

test('blueprintWeightedMean: pesa cada disciplina pelos pontos da prova', () => {
  assert.equal(subjectExamPoints(subjects[1]), 60);
  // 90% em 10 pontos e 50% em 60 pontos → (900 + 3000) / 70
  const mean = blueprintWeightedMean(
    [
      { subjectId: 'port', value: 90 },
      { subjectId: 'esp', value: 50 },
    ],
    subjects
  );
  assert.equal(Math.round(mean * 10) / 10, 55.7);
});

test('blueprintWeightedMean: sem pontos no edital devolve null; disciplina sem pontos pesa pela média', () => {
  assert.equal(blueprintWeightedMean([{ subjectId: 'port', value: 90 }], []), null);
  assert.equal(blueprintWeightedMean([{ subjectId: 'x', value: 90 }], subjects), null);
  // 'x' sem pontos pesa 35 (média de 10 e 60): (90·10 + 50·35) / 45
  const mean = blueprintWeightedMean(
    [
      { subjectId: 'port', value: 90 },
      { subjectId: 'x', value: 50 },
    ],
    subjects
  );
  assert.equal(Math.round(mean * 10) / 10, 58.9);
});

test('métricas de acerto e cobertura usam o valor ponderado quando há edital', () => {
  const questions = [{ resolved: 300, correct: 270 }];
  const plain = calculateApprovalAcertosMetric(questions);
  const weighted = calculateApprovalAcertosMetric(questions, 55.7);
  assert.equal(plain.raw, 90);
  assert.equal(weighted.raw, 55.7);
  assert.match(weighted.detail, /56% pelo peso do edital \(90% sem peso\)/);

  const edital = calculateApprovalEditalMetric({
    totalTopicsCount: 40,
    concludedTopicsCount: 30,
    subjectsWithTopicsCount: 5,
    weightedRaw: 40,
  });
  assert.equal(edital.raw, 40);
  assert.match(edital.detail, /30 de 40 tópicos concluídos · 40% do peso da prova/);
});
