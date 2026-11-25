import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateWeightedTopicPerformance,
  recencyWeight,
  MIN_RECENCY_WEIGHT,
} from '../../src/domain/analytics/topic-performance.js';
import { MASTERY_ALGORITHM_VERSION } from '../../src/domain/analytics/topic-metrics.js';
import { normalizeQuestionImportRows } from '../../src/domain/questions/question-import-normalizer.js';
import { calculateCareerBenchmarkComparison } from '../../src/domain/analytics/career-benchmarks.js';

test('recencyWeight mantém platô até 150 dias e aplica decaimento com piso 0,35 em ciclos longos', () => {
  assert.equal(recencyWeight('2026-06-01', '2026-10-20'), 1); // 141 dias <= 150d
  const old = recencyWeight('2025-12-01', '2026-10-20');
  assert.ok(old < 1 && old > MIN_RECENCY_WEIGHT);
  const ancient = recencyWeight('2023-01-01', '2026-10-20');
  assert.equal(ancient, MIN_RECENCY_WEIGHT);
});

test('calculateWeightedTopicPerformance expõe versão 4, answeredAccuracy e netAccuracy no Cebraspe', () => {
  assert.equal(MASTERY_ALGORITHM_VERSION, 4);
  const records = [
    // Antiga (> 1 ano atrás): 20/20 peso decaído para 0,35
    { topicId: 't1', resolved: 20, correct: 4, date: '2025-01-01' },
    // Recente (hoje): 20 resolvidas, 14 certas, 4 em branco -> 2 erradas; answered = 14/16 = 87.5%, net = 12/20 = 60%
    { topicId: 't1', resolved: 20, correct: 14, blank: 4, date: '2026-10-20' },
  ];
  const perf = calculateWeightedTopicPerformance(records, 't1', {
    referenceDate: '2026-10-20',
    scoringMode: 'certo-errado',
  });
  assert.equal(perf.weighting.recencyWeighted, true);
  assert.ok(perf.weighting.answeredAccuracy > 60);
  assert.ok(perf.weighting.netAccuracy !== null);
  assert.ok(perf.accuracy < 60 && perf.accuracy > 45);
});

test('CSV normalizer interpreta colunas e linhas em branco sem contaminar errorBreakdown', () => {
  const csv = `Disciplina,Tópico,Data,Resolvidas,Acertos,Em branco,Motivo
Direito Constitucional,Controle,2026-10-20,20,14,4,Letra de lei`;
  const [summary] = normalizeQuestionImportRows(csv, {
    defaultDate: '2026-10-20',
    errorCategoryKeys: ['naoSabia', 'letraLei', 'jurisprudencia'],
  });
  assert.equal(summary.resolved, 20);
  assert.equal(summary.correct, 14);
  assert.equal(summary.blank, 4);
  assert.equal(summary.errorBreakdown.letraLei, 2); // 20 - 14 - 4 = 2 erros reais

  const qByQ = `Disciplina,Assunto,Data,Resultado
Direito Administrativo,Atos,2026-10-20,Acertou
Direito Administrativo,Atos,2026-10-20,Em branco
Direito Administrativo,Atos,2026-10-20,Errou`;
  const [agg] = normalizeQuestionImportRows(qByQ, {
    defaultDate: '2026-10-20',
    errorCategoryKeys: ['naoSabia', 'letraLei'],
  });
  assert.equal(agg.resolved, 3);
  assert.equal(agg.correct, 1);
  assert.equal(agg.blank, 1);
});

test('calculateCareerBenchmarkComparison calibra alvos em -12 p.p. para Certo/Errado Cebraspe', () => {
  const aggregates = {
    studiedHours: 22,
    resolvedQuestions: 220,
    accuracyPercent: 68,
    theoryMinutes: 300,
    questionsMinutes: 600,
    reviewMinutes: 200,
  };
  const padrao = calculateCareerBenchmarkComparison(aggregates, 'geral', null, 'padrao');
  const cebraspe = calculateCareerBenchmarkComparison(aggregates, 'geral', null, 'certo-errado');
  assert.equal(padrao.accuracy.targetMin, 78);
  assert.equal(cebraspe.accuracy.targetMin, 66);
  assert.equal(cebraspe.accuracy.status, 'competitive');
});
