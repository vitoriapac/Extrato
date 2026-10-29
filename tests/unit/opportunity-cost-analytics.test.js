import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateSubjectOpportunity,
  calculateOpportunityCostMatrix,
  getTopStudyOpportunities,
  computeStateOpportunityCosts,
} from '../../src/domain/analytics/opportunity-cost.js';

test('calculateSubjectOpportunity — atribui tier marginal e ganho zero se domínio >= 85%', () => {
  const result = calculateSubjectOpportunity({
    subjectId: 's1',
    subjectName: 'Direito Constitucional',
    examWeightPercent: 20,
    currentMastery: 88,
  });

  assert.equal(result.potentialScoreGain, 0);
  assert.equal(result.pointsPerHourRatio, 0);
  assert.equal(result.tier, 'marginal');
  assert.match(result.rationale, /Domínio consolidado/);
});

test('calculateSubjectOpportunity — calcula ganho líquido e PPH com precisão para matéria prioritária', () => {
  // Peso: 25%, Domínio: 55% (gap = 30%). Ganho potencial: 25 * 30 / 100 = 7.5 pontos.
  // Esforço estimado fornecido: 10 horas. PPH = 7.5 / 10 = 0.75 pts/h.
  const result = calculateSubjectOpportunity({
    subjectId: 's2',
    subjectName: 'Direito Administrativo',
    examWeightPercent: 25,
    currentMastery: 55,
    estimatedEffortHours: 10,
  });

  assert.equal(result.potentialScoreGain, 7.5);
  assert.equal(result.estimatedEffortHours, 10);
  assert.equal(result.pointsPerHourRatio, 0.75);
  assert.equal(result.tier, 'top_priority');
  assert.match(result.rationale, /Alto retorno pedagógico/);
});

test('calculateSubjectOpportunity — deriva horas de esforço pedagogicamente quando não fornecido', () => {
  // Domínio 70 (gap = 15). Estimativa automática: (15 / 5) * 3 = 9h.
  // Peso 20%: ganho = 20 * 15 / 100 = 3.0 pontos. PPH = 3.0 / 9 = 0.333
  const result = calculateSubjectOpportunity({
    subjectId: 's3',
    subjectName: 'Direito Tributário',
    examWeightPercent: 20,
    currentMastery: 70,
  });

  assert.equal(result.potentialScoreGain, 3);
  assert.equal(result.estimatedEffortHours, 9);
  assert.ok(result.pointsPerHourRatio > 0.3);
});

test('calculateSubjectOpportunity — normaliza pesos fornecidos como fração decimal', () => {
  const result = calculateSubjectOpportunity({
    subjectId: 's4',
    subjectName: 'Português',
    examWeightPercent: 0.15, // 15%
    currentMastery: 65,
    estimatedEffortHours: 5,
  });

  assert.equal(result.examWeightPercent, 15);
  assert.equal(result.potentialScoreGain, 3); // 15 * 20 / 100
  assert.equal(result.pointsPerHourRatio, 0.6);
  assert.equal(result.tier, 'top_priority');
});

test('calculateOpportunityCostMatrix — ordena por PPH decrescente', () => {
  const inputs = [
    {
      subjectId: 's-low',
      subjectName: 'Matéria Baixo Retorno',
      examWeightPercent: 5,
      currentMastery: 75,
      estimatedEffortHours: 20,
    },
    {
      subjectId: 's-high',
      subjectName: 'Matéria Alto Retorno',
      examWeightPercent: 30,
      currentMastery: 50,
      estimatedEffortHours: 10,
    },
    {
      subjectId: 's-mid',
      subjectName: 'Matéria Médio Retorno',
      examWeightPercent: 15,
      currentMastery: 60,
      estimatedEffortHours: 8,
    },
  ];

  const matrix = calculateOpportunityCostMatrix(inputs);

  assert.equal(matrix.length, 3);
  assert.equal(matrix[0].subjectId, 's-high');
  assert.ok(matrix[0].pointsPerHourRatio > matrix[1].pointsPerHourRatio);
  assert.ok(matrix[1].pointsPerHourRatio > matrix[2].pointsPerHourRatio);
  assert.equal(matrix[0].tier, 'top_priority');
  assert.equal(matrix[2].tier, 'marginal');
});

test('getTopStudyOpportunities — filtra apenas as principais prioridades limitadas pela quantidade', () => {
  const matrix = calculateOpportunityCostMatrix([
    { subjectId: 's1', subjectName: 'S1', examWeightPercent: 30, currentMastery: 50, estimatedEffortHours: 8 },
    { subjectId: 's2', subjectName: 'S2', examWeightPercent: 25, currentMastery: 55, estimatedEffortHours: 8 },
    { subjectId: 's3', subjectName: 'S3', examWeightPercent: 20, currentMastery: 60, estimatedEffortHours: 8 },
    { subjectId: 's4', subjectName: 'S4', examWeightPercent: 5, currentMastery: 80, estimatedEffortHours: 20 },
  ]);

  const top2 = getTopStudyOpportunities(matrix, 2);
  assert.equal(top2.length, 2);
  assert.equal(top2[0].subjectId, 's1');
  assert.equal(top2[1].subjectId, 's2');
});

test('computeStateOpportunityCosts — mapeia subjects do estado para matriz de custo de oportunidade', () => {
  const subjects = [
    { id: 'sub-1', name: 'Português', questionWeight: 2, remainingHours: 12 },
    { id: 'sub-2', name: 'Matemática', examWeightPercent: 10, remainingHours: 15 },
  ];
  const masteryMap = new Map([
    ['sub-1', 50],
    ['sub-2', 80],
  ]);

  const result = computeStateOpportunityCosts(subjects, masteryMap);
  assert.equal(result.length, 2);
  assert.equal(result[0].subjectId, 'sub-1');
  assert.equal(result[0].examWeightPercent, 20); // 2 * 10
  assert.equal(result[0].currentMastery, 50);
});
