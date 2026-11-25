import test from 'node:test';
import assert from 'node:assert/strict';
import {
  aggregateGuessPerformance,
  subjectPaceBreakdown,
} from '../../src/domain/exams/simulation-score.js';

test('aggregateGuessPerformance calcula saldo acumulado de chutes em Certo/Errado', () => {
  const result = aggregateGuessPerformance([
    { scoring: 'certo-errado', total: 100, correct: 60, wrong: 30, guessed: 20, guessedCorrect: 6 },
    { scoring: 'certo-errado', total: 100, correct: 65, wrong: 25, guessed: 10, guessedCorrect: 3 },
  ]);

  assert.equal(result.simulationsWithGuesses, 2);
  assert.equal(result.totalGuessed, 30);
  assert.equal(result.totalGuessedCorrect, 9);
  assert.equal(result.guessAccuracyPercent, 30);
  assert.ok(result.cumulativeGuessGainPercent < 0);
  assert.match(result.recommendation || '', /custaram/);
});

test('subjectPaceBreakdown destaca disciplinas com custo temporal acima do ritmo-alvo', () => {
  const names = new Map([
    ['s-fgv', 'Português FGV'],
    ['s-dir', 'Direito Adm'],
  ]);
  const items = subjectPaceBreakdown(
    {
      total: 40,
      correct: 30,
      breakdown: [
        { subjectId: 's-fgv', total: 20, correct: 16, durationMinutes: 90 },
        { subjectId: 's-dir', total: 20, correct: 14, durationMinutes: 30 },
      ],
    },
    3.0,
    names
  );

  assert.equal(items.length, 2);
  assert.equal(items[0].subjectId, 's-fgv');
  assert.equal(items[0].minutesPerQuestion, 4.5);
  assert.equal(items[0].costlyPace, true);
  assert.equal(items[1].costlyPace, false);
});
