import test from 'node:test';
import assert from 'node:assert/strict';
import {
  clampScore,
  classifyApprovalScore,
  calculateApprovalSimuladosMetric,
  calculateApprovalAcertosMetric,
  calculateApprovalEditalMetric,
  calculateApprovalDominioMetric,
  calculateApprovalRevisoesMetric,
  calculateApprovalTendenciaMetric,
  calculateApprovalPrazoMetric,
  calculateApprovalConhecimentoMetric,
  calculateApprovalRetencaoMetric,
  calculateApprovalConsistenciaMetric,
  extractReadinessFactors,
} from '../../src/domain/analytics/approval-metrics.js';

test('clampScore: restringe notas ao intervalo 0-100', () => {
  assert.equal(clampScore(-10), 0);
  assert.equal(clampScore(105), 100);
  assert.equal(clampScore(72.6), 73);
});

test('classifyApprovalScore: categoriza corretamente as faixas de preparacao', () => {
  assert.deepEqual(classifyApprovalScore(90), {
    nivel: 'Excelente preparação',
    cor: 'ok',
    faixa: '85–100',
  });
  assert.deepEqual(classifyApprovalScore(75), {
    nivel: 'Preparação avançada',
    cor: 'ok',
    faixa: '70–84',
  });
  assert.deepEqual(classifyApprovalScore(55), {
    nivel: 'Em desenvolvimento',
    cor: 'warn',
    faixa: '50–69',
  });
  assert.deepEqual(classifyApprovalScore(30), {
    nivel: 'Preparação inicial',
    cor: 'danger',
    faixa: '0–49',
  });
});

test('calculateApprovalSimuladosMetric: retorna default neutro quando sem simulados', () => {
  const result = calculateApprovalSimuladosMetric([]);
  assert.equal(result.score, 50);
  assert.equal(result.confidence, 0);
  assert.equal(result.available, false);
});

test('calculateApprovalSimuladosMetric: pondera simulados recentes com maior peso', () => {
  const result = calculateApprovalSimuladosMetric([
    { nota: 60, totalQuestions: 60 },
    { nota: 80, totalQuestions: 60 },
  ]);
  // pesos 1 e 2: (60*1 + 80*2)/3 = 220/3 = 73.33
  assert.equal(result.available, true);
  assert.ok(result.raw > 70);
  assert.ok(result.score > 50);
});

test('calculateApprovalAcertosMetric: calcula acerto bruto de questoes com confianca proporcional', () => {
  const empty = calculateApprovalAcertosMetric([]);
  assert.equal(empty.available, false);

  const populated = calculateApprovalAcertosMetric([
    { resolved: 100, correct: 80 },
    { resolved: 50, correct: 40 },
  ]);
  assert.equal(populated.available, true);
  assert.equal(populated.raw, 80);
  assert.equal(populated.confidence, 0.5); // 150/300
});

test('calculateApprovalEditalMetric: mede conclusao de topicos e diversidade de disciplinas', () => {
  const empty = calculateApprovalEditalMetric({
    totalTopicsCount: 0,
    concludedTopicsCount: 0,
    subjectsWithTopicsCount: 0,
  });
  assert.equal(empty.available, false);

  const populated = calculateApprovalEditalMetric({
    totalTopicsCount: 40,
    concludedTopicsCount: 30, // 75%
    subjectsWithTopicsCount: 5,
  });
  assert.equal(populated.available, true);
  assert.equal(populated.raw, 75);
  assert.equal(populated.confidence, 1);
  assert.equal(populated.score, 75);
});

test('calculateApprovalDominioMetric: calcula dominio ponderado por confianca', () => {
  const result = calculateApprovalDominioMetric({
    topicMasteries: [
      { score: 80, confidence: 0.8 },
      { score: 60, confidence: 0.4 },
    ],
    totalTopicsCount: 2,
  });
  assert.equal(result.available, true);
  assert.ok(result.score > 60);
});

test('calculateApprovalRevisoesMetric: penaliza atrasos severos em revisoes', () => {
  const result = calculateApprovalRevisoesMetric([
    { status: 'Concluído' },
    { status: 'Pendente', daysLate: 14 },
  ]);
  assert.equal(result.available, true);
  assert.ok(result.score <= 50);
});

test('calculateApprovalTendenciaMetric: mede evolucao entre simulados recentes', () => {
  const insufficient = calculateApprovalTendenciaMetric([70]);
  assert.equal(insufficient.available, false);

  const positive = calculateApprovalTendenciaMetric([60, 70, 80, 90]);
  assert.equal(positive.available, true);
  assert.ok(positive.score > 50);
});

test('calculateApprovalPrazoMetric: retorna 100 para edital completo e ajusta por folga', () => {
  const complete = calculateApprovalPrazoMetric({
    ritmo: { status: 'completo' },
    hasExamDate: true,
  });
  assert.equal(complete.score, 100);

  const noExam = calculateApprovalPrazoMetric({
    ritmo: { status: 'ok' },
    hasExamDate: false,
  });
  assert.equal(noExam.available, false);

  const onTrack = calculateApprovalPrazoMetric({
    ritmo: { status: 'ok', comparativo: 'no-prazo', daysToExam: 30, daysNeeded: 20 },
    hasExamDate: true,
  });
  assert.equal(onTrack.score, 80); // 70 + 10 de folga
});

test('calculateApprovalConhecimentoMetric e extractReadinessFactors: integram metricas de prontidao', () => {
  const dominio = { score: 80, confidence: 0.8, available: true, raw: 80, detail: '' };
  const edital = { score: 70, confidence: 0.6, available: true, raw: 70, detail: '' };
  const conhecimento = calculateApprovalConhecimentoMetric({ dominio, edital });
  assert.equal(conhecimento.available, true);
  assert.equal(conhecimento.score, 69);
  assert.equal(Math.round(conhecimento.raw), 77);

  const allMetrics = {
    simulados: dominio,
    acertos: dominio,
    edital,
    dominio,
    revisoes: dominio,
    tendencia: dominio,
    prazo: dominio,
    conhecimento,
    retencao: dominio,
    questoes: dominio,
    consistencia: dominio,
  };
  const factors = extractReadinessFactors(allMetrics);
  assert.equal(factors.coverage, edital);
  assert.equal(factors.mastery, dominio);
  assert.equal(factors.simulations, dominio);
});
