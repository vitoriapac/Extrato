import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateLawRecency } from '../../src/domain/analytics/law-recency.js';

test('evaluateLawRecency usa janela de 21d para bancas literalistas e sinaliza alteração legislativa', () => {
  const staleFcc = evaluateLawRecency({ lastLawReadAt: '2026-10-30' }, '2026-11-25', 'FCC');
  assert.equal(staleFcc.thresholdDays, 21);
  assert.equal(staleFcc.daysSinceLawRead, 26);
  assert.equal(staleFcc.isStale, true);
  assert.equal(staleFcc.needsAttention, true);

  const okCebraspe = evaluateLawRecency({ lastLawReadAt: '2026-10-30' }, '2026-11-25', 'Cebraspe');
  assert.equal(okCebraspe.thresholdDays, 30);
  assert.equal(okCebraspe.isStale, false);
  assert.equal(okCebraspe.needsAttention, false);

  const pendingUpdate = evaluateLawRecency(
    { lastLawReadAt: '2026-11-24', legislativeUpdatePending: true, legislativeUpdateNote: 'Lei 14.900' },
    '2026-11-25',
    'Cebraspe'
  );
  assert.equal(pendingUpdate.needsAttention, true);
  assert.match(pendingUpdate.label, /Lei 14\.900/);
});
