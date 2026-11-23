import test from 'node:test';
import assert from 'node:assert/strict';
import {
  blankCount,
  scorePercent,
  simulationScore,
  subjectsBelowMinimum,
  wrongCount,
} from '../../src/domain/exams/simulation-score.js';

test('múltipla escolha mantém o acerto simples', () => {
  assert.equal(simulationScore({ correct: 70, total: 100 }), 70);
  assert.equal(simulationScore({ correct: 0, total: 0 }), 0);
});

test('certo ou errado: cada erro anula um acerto e o branco vale zero', () => {
  // Sem erradas declaradas, nada ficou em branco: 70 − 30 = 40.
  assert.equal(simulationScore({ correct: 70, total: 100, scoring: 'certo-errado' }), 40);
  // 70 certas, 10 erradas, 20 em branco: 60.
  assert.equal(
    simulationScore({ correct: 70, wrong: 10, total: 100, scoring: 'certo-errado' }),
    60
  );
  assert.equal(blankCount({ correct: 70, wrong: 10, total: 100 }), 20);
  // Mais erros que acertos não fica negativo.
  assert.equal(scorePercent({ correct: 20, wrong: 50, total: 100 }, 'certo-errado'), 0);
  // Erradas declaradas acima do possível são limitadas ao que sobra.
  assert.equal(wrongCount({ correct: 90, wrong: 40, total: 100 }), 10);
});

test('detalhamento por disciplina define os totais e aponta o mínimo eliminatório', () => {
  const sim = {
    scoring: 'certo-errado',
    correct: 0,
    total: 0,
    breakdown: [
      { subjectId: 'pt', correct: 40, wrong: 5, total: 50 },
      { subjectId: 'esp', correct: 30, wrong: 15, total: 50 },
    ],
  };
  assert.equal(simulationScore(sim), 50);
  const misses = subjectsBelowMinimum(sim, [
    { subjectId: 'pt', minScore: 50 },
    { subjectId: 'esp', minScore: 40 },
    { subjectId: 'outra', minScore: 50 },
  ]);
  assert.deepEqual(misses, [{ subjectId: 'esp', score: 30, minimum: 40 }]);
  assert.deepEqual(subjectsBelowMinimum(sim, []), []);
});
