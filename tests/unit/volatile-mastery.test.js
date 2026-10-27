import test from 'node:test';
import assert from 'node:assert/strict';
import {
  analyzeTopicVolatileMastery,
  identifyVolatileTopics,
} from '../../src/domain/analytics/volatile-mastery.js';

test('analyzeTopicVolatileMastery — detecta ilusão de competência com queda abrupta após 14 dias', () => {
  // Cenário de Domínio Volátil:
  // Inicial: 10 de 10 acertos (100%) em 01/10
  // Espaçado: 5 de 10 acertos (50%) em 25/10 (24 dias depois)
  const result = analyzeTopicVolatileMastery({
    topicId: 't-direito-adm',
    topicName: 'Atos Administrativos',
    questions: [
      { topicId: 't-direito-adm', date: '2026-10-01', total: 10, correct: 10 },
      { topicId: 't-direito-adm', date: '2026-10-25', total: 10, correct: 5 },
    ],
  });

  assert.equal(result.status, 'volatile');
  assert.equal(result.initialAccuracy, 100);
  assert.equal(result.spacedAccuracy, 50);
  assert.equal(result.accuracyDrop, 50);
  assert.equal(result.daysBetweenAssessments, 24);
  assert.match(result.alertMessage, /Domínio Volátil/);
  assert.match(result.recommendedAction, /bateria cega de 15 questões/);
});

test('analyzeTopicVolatileMastery — consolida tópico quando acerto se mantém estável acima de 75%', () => {
  const result = analyzeTopicVolatileMastery({
    topicId: 't-portugues',
    topicName: 'Crase',
    questions: [
      { topicId: 't-portugues', date: '2026-10-01', total: 12, correct: 11 },
      { topicId: 't-portugues', date: '2026-10-20', total: 15, correct: 13 },
    ],
  });

  assert.equal(result.status, 'consolidated');
  assert.ok(result.spacedAccuracy >= 75);
  assert.equal(result.alertMessage, null);
});

test('analyzeTopicVolatileMastery — retorna dados insuficientes se houver menos de 8 questões', () => {
  const result = analyzeTopicVolatileMastery({
    topicId: 't-novo',
    questions: [
      { topicId: 't-novo', date: '2026-10-01', total: 3, correct: 3 },
      { topicId: 't-novo', date: '2026-10-20', total: 3, correct: 1 },
    ],
  });

  assert.equal(result.status, 'insufficient_data');
  assert.equal(result.alertMessage, null);
});

test('identifyVolatileTopics — filtra e diagnostica múltiplos tópicos', () => {
  const topics = [
    { id: 't1', name: 'Controle de Constitucionalidade' },
    { id: 't2', name: 'Pontuação' },
  ];
  const questions = [
    // t1 é volátil (100% -> 40% em 20 dias)
    { topicId: 't1', date: '2026-10-01', total: 10, correct: 10 },
    { topicId: 't1', date: '2026-10-21', total: 10, correct: 4 },
    // t2 é estável (80% -> 85% em 18 dias)
    { topicId: 't2', date: '2026-10-01', total: 10, correct: 8 },
    { topicId: 't2', date: '2026-10-19', total: 10, correct: 9 },
  ];

  const volatileList = identifyVolatileTopics(topics, questions);
  assert.equal(volatileList.length, 1);
  assert.equal(volatileList[0].topicId, 't1');
  assert.equal(volatileList[0].topicName, 'Controle de Constitucionalidade');
});
