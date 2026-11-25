import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildSimulatedRemediationDiagnostic,
  extractQuickWinRecoverablePoints,
} from '../../src/domain/diagnostics/simulated-remediation.js';

test('extractQuickWinRecoverablePoints identifica quedas em tópicos com domínio prévio >= 70%', () => {
  const simulation = {
    id: 'sim-1',
    nome: 'Simulado FGV',
    date: '2026-11-25',
    correct: 28,
    total: 40,
    breakdown: [
      { id: 'b1', subjectId: 's-port', subjectName: 'Português', correct: 6, total: 10 },
      { id: 'b2', subjectId: 's-dir', subjectName: 'Direito Adm', correct: 7, total: 10 },
      { id: 'b3', subjectId: 's-ti', subjectName: 'TI', correct: 3, total: 10 },
    ],
  };

  const priorMasteryById = new Map([
    ['s-port', 85],
    ['s-dir', 60],
  ]);

  const quickWins = extractQuickWinRecoverablePoints(simulation, {
    priorMasteryById,
    weights: new Map([['s-port', 2]]),
  });

  assert.ok(quickWins.length >= 1);
  assert.equal(quickWins[0].subjectId, 's-port');
  assert.equal(quickWins[0].priorMastery, 85);
  assert.ok(quickWins[0].recoverablePoints >= 1);
  assert.match(quickWins[0].reason, /85%/);

  const diagnostic = buildSimulatedRemediationDiagnostic({
    simulation,
    priorMasteryById,
    blueprintSubjects: [{ subjectId: 's-port', questionWeight: 2 }],
  });
  assert.ok(Array.isArray(diagnostic.quickWinItems));
  assert.equal(diagnostic.quickWinItems[0].subjectId, 's-port');
});
