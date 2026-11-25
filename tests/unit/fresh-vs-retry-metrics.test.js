import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateFreshVsRetryStats } from '../../src/domain/analytics/study-metrics.js';

test('calculateFreshVsRetryStats separa inéditas e refeitas na janela e alerta > 40%', () => {
  const stats = calculateFreshVsRetryStats(
    [
      { date: '2026-11-20', resolved: 30, retry: false },
      { date: '2026-11-22', resolved: 30, retry: true },
      { date: '2026-09-01', resolved: 50, retry: true },
    ],
    '2026-11-25',
    30
  );

  assert.equal(stats.totalResolved, 60);
  assert.equal(stats.freshResolved, 30);
  assert.equal(stats.retryResolved, 30);
  assert.equal(stats.freshPercent, 50);
  assert.equal(stats.retryPercent, 50);
  assert.equal(stats.highRetryAlert, true);
});
