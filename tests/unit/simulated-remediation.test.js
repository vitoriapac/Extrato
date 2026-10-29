import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildSimulatedRemediationDiagnostic,
  generate7DayRemediationPlan,
  generateDraftErrorCards,
} from '../../src/domain/diagnostics/simulated-remediation.js';

test('buildSimulatedRemediationDiagnostic — calcula comparativo com corte e histórico', () => {
  const simulation = {
    id: 'sim-10',
    nome: 'Simulado Nacional TRT',
    date: '2026-10-25',
    correct: 68,
    total: 100,
    breakdown: [
      { id: 'b1', subjectId: 's-dir-trab', topicId: 't-remun', subjectName: 'Direito do Trabalho', topicName: 'Remuneração', total: 20, correct: 10 },
      { id: 'b2', subjectId: 's-proc-trab', topicId: 't-exec', subjectName: 'Processo do Trabalho', topicName: 'Execução Trabalhista', total: 20, correct: 8 },
      { id: 'b3', subjectId: 's-const', topicId: 't-art5', subjectName: 'Direito Constitucional', topicName: 'Art. 5º', total: 30, correct: 25 },
      { id: 'b4', subjectId: 's-adm', topicId: 't-licit', subjectName: 'Direito Administrativo', topicName: 'Licitações', total: 30, correct: 25 },
    ],
  };

  const historicalSimulations = [
    { id: 'sim-9', date: '2026-10-10', correct: 60, total: 100 },
    { id: 'sim-8', date: '2026-09-25', correct: 64, total: 100 },
  ];

  const diagnostic = buildSimulatedRemediationDiagnostic({
    simulation,
    historicalSimulations,
    passingScorePercent: 75,
    weeklyAvailableHours: 20,
  });

  assert.equal(diagnostic.scorePercent, 68);
  assert.equal(diagnostic.totalQuestions, 100);
  assert.equal(diagnostic.totalLostPoints, 32);
  assert.equal(diagnostic.passingScorePercent, 75);
  assert.equal(diagnostic.gapToCutoff, -7); // 68 - 75 = -7 pontos
  assert.equal(diagnostic.historicalAverageScore, 62); // (60 + 64) / 2
  assert.equal(diagnostic.deltaVsHistoricalAverage, 6); // 68 - 62 = +6

  // Top 3 sangrias
  assert.equal(diagnostic.topBleedingTopics.length, 3);
  // b2 perdeu 12 pontos (20 - 8)
  assert.equal(diagnostic.topBleedingTopics[0].topicId, 't-exec');
  assert.equal(diagnostic.topBleedingTopics[0].lostPoints, 12);
  // b1 perdeu 10 pontos (20 - 10)
  assert.equal(diagnostic.topBleedingTopics[1].topicId, 't-remun');
  assert.equal(diagnostic.topBleedingTopics[1].lostPoints, 10);
  // b3 e b4 perderam 5 pontos cada
  assert.equal(diagnostic.topBleedingTopics[2].lostPoints, 5);
});

test('generate7DayRemediationPlan — realoca 60% para sangria e 40% para manutenção', () => {
  const topTopics = [
    { id: 't1', subjectId: 's1', topicId: 't1', name: 'Execução', subjectName: 'Processo', total: 20, correct: 8, lostPoints: 12, accuracy: 40, shareOfLostPoints: 50 },
    { id: 't2', subjectId: 's2', topicId: 't2', name: 'Atos', subjectName: 'Administrativo', total: 20, correct: 10, lostPoints: 10, accuracy: 50, shareOfLostPoints: 50 },
  ];

  const plan = generate7DayRemediationPlan(topTopics, 20);

  assert.equal(plan.totalRemediationHours, 20);
  assert.equal(plan.bleedAllocationHours, 12); // 60% de 20h
  assert.equal(plan.maintenanceAllocationHours, 8); // 40% de 20h
  assert.equal(plan.dailySchedule.length, 7);

  // Dia 1 foca no tópico mais crítico com acerto < 50% -> 'statute'
  assert.equal(plan.dailySchedule[0].day, 1);
  assert.equal(plan.dailySchedule[0].activityType, 'statute');
  assert.match(plan.dailySchedule[0].focusHeadline, /lei seca/i);

  // Dias 6 e 7 são manutenção e consolidação
  assert.equal(plan.dailySchedule[5].day, 6);
  assert.equal(plan.dailySchedule[5].activityType, 'review');
  assert.equal(plan.dailySchedule[6].day, 7);
  assert.equal(plan.dailySchedule[6].activityType, 'questions');
});

test('generateDraftErrorCards — cria rascunhos para o Caderno de Erros', () => {
  const simulation = {
    id: 'sim-1',
    nome: 'Simulado 01',
    date: '2026-10-20',
    correct: 70,
    total: 100,
  };

  const topTopics = [
    { id: 't-atos', subjectId: 's-adm', topicId: 't-atos', name: 'Atos Administrativos', subjectName: 'Direito Administrativo', total: 10, correct: 5, lostPoints: 5, accuracy: 50, shareOfLostPoints: 100 },
  ];

  const drafts = generateDraftErrorCards(simulation, topTopics);

  assert.ok(drafts.length >= 1);
  assert.equal(drafts[0].subjectId, 's-adm');
  assert.equal(drafts[0].topicId, 't-atos');
  assert.equal(drafts[0].sourceSimulationId, 'sim-1');
  assert.match(drafts[0].statementSummary, /Simulado 01/);
  assert.ok(drafts[0].bancaTrap.length > 0);
  assert.ok(drafts[0].correctConcept.length > 0);
});
