import test from 'node:test';
import assert from 'node:assert/strict';
import {
  weightedSimulationScore,
  simulationScore,
  blocksBelowMinimum,
  examMinutesPerQuestion,
} from '../../src/domain/exams/simulation-score.js';
import { buildCalibratedScoreProjection } from '../../src/domain/forecasts/calibrated-score-projection.js';
import { buildPostSimulationReplan } from '../../src/domain/planning/post-simulation-replan.js';

test('weightedSimulationScore aplica pesos P1/P2/P3 e equivale ao simples com pesos iguais', () => {
  const sim = {
    scoring: 'certo-errado',
    correct: 70,
    wrong: 20,
    total: 100,
    breakdown: [
      { subjectId: 'p1', correct: 30, wrong: 10, total: 50 }, // líquida 20/50 = 40%
      { subjectId: 'p2', correct: 40, wrong: 10, total: 50 }, // líquida 30/50 = 60%
    ],
  };

  assert.equal(
    weightedSimulationScore(sim, [
      { subjectId: 'p1', questionWeight: 1 },
      { subjectId: 'p2', questionWeight: 1 },
    ]),
    simulationScore(sim)
  );

  // (20*1 + 30*3) / (50*1 + 50*3) = 110 / 200 = 55%
  const weighted = weightedSimulationScore(sim, [
    { subjectId: 'p1', questionWeight: 1 },
    { subjectId: 'p2', questionWeight: 3 },
  ]);
  assert.ok(Math.abs(weighted - 55) < 1e-9, `expected ~55, got ${weighted}`);
});

test('blocksBelowMinimum detecta bloco eliminatório ponderado abaixo do mínimo', () => {
  const sim = {
    correct: 65,
    total: 100,
    breakdown: [
      { subjectId: 'port', correct: 10, total: 20 }, // 50% peso 1
      { subjectId: 'const', correct: 15, total: 30 }, // 50% peso 1
      { subjectId: 'ti', correct: 40, total: 50 }, // 80% peso 2
    ],
  };
  const blocks = [
    { id: 'b1', name: 'Conhecimentos Básicos (P1)', minScore: 60 },
    { id: 'b2', name: 'Conhecimentos Específicos (P2)', minScore: 60 },
  ];
  const blueprintSubjects = [
    { subjectId: 'port', blockId: 'b1', questionWeight: 1 },
    { subjectId: 'const', blockId: 'b1', questionWeight: 1 },
    { subjectId: 'ti', blockId: 'b2', questionWeight: 2 },
  ];

  const misses = blocksBelowMinimum(sim, blocks, blueprintSubjects);
  assert.equal(misses.length, 1);
  assert.equal(misses[0].blockId, 'b1');
  assert.equal(misses[0].score, 50);
  assert.equal(misses[0].minimum, 60);
});

test('examMinutesPerQuestion desconta reserva de discursiva e gabarito (overheadMinutes)', () => {
  assert.equal(
    examMinutesPerQuestion({
      durationMinutes: 300,
      overheadMinutes: 60,
      subjects: [{ expectedQuestions: 60 }, { expectedQuestions: 60 }],
    }),
    2.0
  );
  // Sem overheadMinutes mantém cálculo integral
  assert.equal(
    examMinutesPerQuestion({
      durationMinutes: 300,
      subjects: [{ expectedQuestions: 100 }],
    }),
    3.0
  );
});

test('buildCalibratedScoreProjection separa simulados sob pesos diferentes na composição', () => {
  const sims = [
    {
      id: 's1',
      date: '2026-09-01',
      correct: 70,
      total: 100,
      breakdown: [
        { subjectId: 'p1', correct: 45, total: 50 },
        { subjectId: 'p2', correct: 25, total: 50 },
      ],
    },
    {
      id: 's2',
      date: '2026-09-15',
      correct: 72,
      total: 100,
      breakdown: [
        { subjectId: 'p1', correct: 45, total: 50 },
        { subjectId: 'p2', correct: 27, total: 50 },
      ],
    },
    {
      id: 's3',
      date: '2026-10-01',
      correct: 74,
      total: 100,
      breakdown: [
        { subjectId: 'p1', correct: 45, total: 50 },
        { subjectId: 'p2', correct: 29, total: 50 },
      ],
    },
    {
      id: 's4',
      date: '2026-10-15',
      correct: 76,
      total: 100,
      breakdown: [
        { subjectId: 'p1', correct: 45, total: 50 },
        { subjectId: 'p2', correct: 31, total: 50 },
      ],
    },
  ];
  const unweighted = buildCalibratedScoreProjection({ simulations: sims, today: '2026-10-20' });
  const weighted = buildCalibratedScoreProjection({
    simulations: sims,
    today: '2026-10-20',
    blueprintSubjects: [
      { subjectId: 'p1', questionWeight: 1 },
      { subjectId: 'p2', questionWeight: 3 },
    ],
  });
  assert.equal(unweighted.available, true);
  assert.equal(weighted.available, true);
  assert.ok(weighted.central < unweighted.central);
});

test('buildPostSimulationReplan usa nota líquida Cebraspe e prioriza violação de mínimo eliminatório', () => {
  const replan = buildPostSimulationReplan({
    simulation: {
      id: 'sim-cebraspe',
      date: '2026-10-20',
      scoring: 'certo-errado',
      breakdown: [
        { subjectId: 's1', correct: 6, wrong: 4, total: 10 }, // líquida 20%, peso 1
        { subjectId: 's2', correct: 7, wrong: 2, total: 10 }, // líquida 50%, minScore 60%, peso 2
      ],
    },
    subjects: [
      { id: 's1', name: 'Português' },
      { id: 's2', name: 'Direito Penal' },
    ],
    blueprintSubjects: [
      { subjectId: 's1', questionWeight: 1 },
      { subjectId: 's2', questionWeight: 2, minScore: 60 },
    ],
  });
  assert.equal(replan.state, 'proposal');
  assert.equal(replan.adjustments[0].subjectId, 's2');
  assert.equal(replan.adjustments[0].deltaMinutes, 30);
  assert.equal(replan.adjustments[1].accuracy, 20);
});
