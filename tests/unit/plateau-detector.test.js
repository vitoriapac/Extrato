import test from 'node:test';
import assert from 'node:assert/strict';
import {
  detectTopicPlateau,
  detectAllPlateaus,
  buildWeeklyRollingWindows,
} from '../../src/domain/analytics/plateau-detector.js';

test('detectTopicPlateau — rejeita detecção se volume total for menor que o mínimo', () => {
  const result = detectTopicPlateau({
    topicId: 't1',
    subjectId: 's1',
    minQuestions: 60,
    rollingWindows: [
      { date: '2026-10-01', accuracy: 68, count: 15 },
      { date: '2026-10-08', accuracy: 69, count: 15 },
      { date: '2026-10-15', accuracy: 68.5, count: 15 },
    ],
  });

  assert.equal(result.hasPlateau, false);
  assert.equal(result.confidence, 'low');
  assert.equal(result.questionCount, 45);
  assert.equal(result.weeksStagnant, 0);
  assert.match(result.prescribedAction.headline, /Volume Insuficiente/);
});

test('detectTopicPlateau — rejeita se houver menos de 3 janelas com dados', () => {
  const result = detectTopicPlateau({
    topicId: 't1',
    subjectId: 's1',
    rollingWindows: [
      { date: '2026-10-01', accuracy: 68, count: 40 },
      { date: '2026-10-08', accuracy: 69, count: 40 },
    ],
  });

  assert.equal(result.hasPlateau, false);
  assert.equal(result.questionCount, 80);
});

test('detectTopicPlateau — detecta platô com variação < 3.5 pts e precisão < 75%', () => {
  const result = detectTopicPlateau({
    topicId: 't-adm-atos',
    subjectId: 's-dir-adm',
    rollingWindows: [
      { date: '2026-10-01', accuracy: 66.0, count: 25 },
      { date: '2026-10-08', accuracy: 67.5, count: 30 },
      { date: '2026-10-15', accuracy: 65.5, count: 25 },
      { date: '2026-10-22', accuracy: 68.0, count: 35 },
    ],
  });

  assert.equal(result.hasPlateau, true);
  assert.equal(result.confidence, 'high');
  assert.equal(result.weeksStagnant, 4);
  assert.equal(result.questionCount, 115);
  assert.ok(result.averageAccuracy >= 65 && result.averageAccuracy <= 68);
  assert.ok(result.variance > 0);
  assert.equal(result.prescribedAction.strategy, 'active_recall');
  assert.match(result.prescribedAction.headline, /Caderno de Erros/);
});

test('detectTopicPlateau — prescreve statute_deep_dive quando erros literais predominam', () => {
  const result = detectTopicPlateau({
    topicId: 't-const-art5',
    subjectId: 's-dir-const',
    rollingWindows: [
      { date: '2026-10-01', accuracy: 70, count: 20 },
      { date: '2026-10-08', accuracy: 71, count: 25 },
      { date: '2026-10-15', accuracy: 72, count: 25 },
    ],
    errorBreakdown: {
      literalidade: 14,
      interpretacao: 4,
      desatencao: 2,
    },
  });

  assert.equal(result.hasPlateau, true);
  assert.equal(result.prescribedAction.strategy, 'statute_deep_dive');
  assert.match(result.prescribedAction.headline, /Lei Seca/);
  assert.match(result.prescribedAction.rationale, /pegadinhas textuais/);
});

test('detectTopicPlateau — prescreve prerequisite_review quando precisão média é < 60%', () => {
  const result = detectTopicPlateau({
    topicId: 't-trib-imunidades',
    subjectId: 's-dir-trib',
    rollingWindows: [
      { date: '2026-10-01', accuracy: 52, count: 25 },
      { date: '2026-10-08', accuracy: 54, count: 30 },
      { date: '2026-10-15', accuracy: 53, count: 25 },
    ],
  });

  assert.equal(result.hasPlateau, true);
  assert.equal(result.prescribedAction.strategy, 'prerequisite_review');
  assert.match(result.prescribedAction.headline, /Pré-Requisitos/);
});

test('detectTopicPlateau — não identifica platô quando precisão média >= 75% (domínio consolidado)', () => {
  const result = detectTopicPlateau({
    topicId: 't-portugues-crase',
    subjectId: 's-portugues',
    rollingWindows: [
      { date: '2026-10-01', accuracy: 84, count: 30 },
      { date: '2026-10-08', accuracy: 85, count: 30 },
      { date: '2026-10-15', accuracy: 84.5, count: 30 },
    ],
  });

  assert.equal(result.hasPlateau, false);
  assert.equal(result.weeksStagnant, 0);
  assert.match(result.prescribedAction.headline, /Domínio Consolidado/);
});

test('detectTopicPlateau — não identifica platô quando a amplitude de oscilação for >= 3.5 pts', () => {
  const result = detectTopicPlateau({
    topicId: 't-proc-recursos',
    subjectId: 's-proc-civil',
    rollingWindows: [
      { date: '2026-10-01', accuracy: 60, count: 25 },
      { date: '2026-10-08', accuracy: 68, count: 25 },
      { date: '2026-10-15', accuracy: 72, count: 25 },
    ],
  });

  assert.equal(result.hasPlateau, false);
  assert.match(result.prescribedAction.headline, /Evolução Ativa/);
});

test('buildWeeklyRollingWindows — agrupa histórico de questões em janelas semanais', () => {
  const questions = [
    { date: '2026-10-01', resolved: 20, correct: 14 },
    { date: '2026-10-05', resolved: 15, correct: 10 },
    { date: '2026-10-10', resolved: 20, correct: 13 },
    { date: '2026-10-18', resolved: 25, correct: 17 },
  ];

  const windows = buildWeeklyRollingWindows(questions, 28);
  assert.ok(windows.length >= 2);
  const totalCount = windows.reduce((acc, w) => acc + w.count, 0);
  assert.equal(totalCount, 80);
});

test('detectAllPlateaus — filtra e ordena tópicos com platô por volume decrescente', () => {
  const allResults = detectAllPlateaus([
    {
      topicId: 't1',
      subjectId: 's1',
      rollingWindows: [
        { date: '2026-10-01', accuracy: 68, count: 20 },
        { date: '2026-10-08', accuracy: 69, count: 20 },
        { date: '2026-10-15', accuracy: 68.5, count: 25 },
      ],
    },
    {
      topicId: 't2',
      subjectId: 's2',
      rollingWindows: [
        { date: '2026-10-01', accuracy: 88, count: 50 },
        { date: '2026-10-08', accuracy: 89, count: 50 },
        { date: '2026-10-15', accuracy: 88.5, count: 50 },
      ],
    },
    {
      topicId: 't3',
      subjectId: 's3',
      rollingWindows: [
        { date: '2026-10-01', accuracy: 62, count: 40 },
        { date: '2026-10-08', accuracy: 63, count: 40 },
        { date: '2026-10-15', accuracy: 62.5, count: 40 },
      ],
    },
  ]);

  assert.equal(allResults.length, 2);
  assert.equal(allResults[0].topicId, 't3'); // 120 questões
  assert.equal(allResults[1].topicId, 't1'); // 65 questões
});
