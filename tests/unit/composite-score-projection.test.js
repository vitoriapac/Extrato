import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCompositeScoreProjection } from '../../src/domain/forecasts/composite-score-projection.js';

test('buildCompositeScoreProjection combina faixa objetiva e média das discursivas corrigidas', () => {
  const result = buildCompositeScoreProjection({
    objectiveBand: { low: 70, central: 75, high: 80 },
    essayWeightPercent: 25,
    essayMaxScore: 40,
    essayMinPercent: 60,
    essayRecords: [
      { kind: 'essay', essayStatus: 'graded', essayScore: 32, essayMaxScore: 40, date: '2026-11-20' },
      { kind: 'essay', essayStatus: 'graded', essayScore: 36, essayMaxScore: 40, date: '2026-11-24' },
      { kind: 'essay', essayStatus: 'written', essayScore: null, date: '2026-11-25' },
    ],
  });

  assert.equal(result.available, true);
  assert.equal(result.gradedEssaysCount, 2);
  assert.equal(result.essayAveragePercent, 85);
  assert.equal(result.belowEssayMinimum, false);
  // 75 * 0.75 + 85 * 0.25 = 56.25 + 21.25 = 77.5
  assert.equal(result.compositeBand?.central, 77.5);
});
