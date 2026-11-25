import test from 'node:test';
import assert from 'node:assert/strict';
import { ERROR_CATEGORIES } from '../../src/domain/diagnostics/error-categories.js';
import {
  buildWeeklyRollingWindows,
  detectTopicPlateau,
} from '../../src/domain/analytics/plateau-detector.js';
import { analyzeTopicVolatileMastery } from '../../src/domain/analytics/volatile-mastery.js';
import {
  shouldFreezeNewTheoryTopic,
  calculateFinalStretchWeightMultiplier,
} from '../../src/domain/planning/final-stretch-policy.js';

test('ERROR_CATEGORIES inclui letraLei e jurisprudencia com ícones Lucide e plateau detector aciona statute_deep_dive', () => {
  assert.equal(ERROR_CATEGORIES.letraLei.icon, 'scale');
  assert.equal(ERROR_CATEGORIES.jurisprudencia.icon, 'landmark');

  const questions = [
    { date: '2026-10-01', resolved: 25, correct: 15, errorBreakdown: { letraLei: 8, naoSabia: 2 } },
    { date: '2026-10-08', resolved: 25, correct: 15, errorBreakdown: { letraLei: 7, naoSabia: 3 } },
    { date: '2026-10-15', resolved: 25, correct: 16, errorBreakdown: { letraLei: 6, jurisprudencia: 3 } },
  ];
  const windows = buildWeeklyRollingWindows(questions, 28);
  assert.equal(windows.length, 3);

  const plateau = detectTopicPlateau({
    topicId: 't-adm',
    subjectId: 's-adm',
    questions,
  });
  assert.equal(plateau.hasPlateau, true);
  assert.equal(plateau.prescribedAction.strategy, 'statute_deep_dive');
});

test('volatile-mastery agrega micro-listas e evita falso positivo para 2 questões espaçadas', () => {
  const microSpaced = analyzeTopicVolatileMastery({
    topicId: 't-micro',
    questions: [
      { topicId: 't-micro', date: '2026-10-01', total: 10, correct: 9 },
      { topicId: 't-micro', date: '2026-10-25', total: 2, correct: 0 }, // < 4 questões espaçadas
    ],
  });
  assert.equal(microSpaced.status, 'insufficient_data');
  assert.equal(microSpaced.alertMessage, null);

  const bufferedWindow = analyzeTopicVolatileMastery({
    topicId: 't-agg',
    questions: [
      { topicId: 't-agg', date: '2026-10-01', total: 10, correct: 9 }, // inicial 90%
      { topicId: 't-agg', date: '2026-10-24', total: 10, correct: 9 }, // 90%
      { topicId: 't-agg', date: '2026-10-25', total: 2, correct: 0 }, // agregado espaçado = 9/12 = 75%
    ],
  });
  assert.equal(bufferedWindow.status, 'consolidated');
});

test('final-stretch-policy protege Tiro Curto de Alto ROI e evita punição sem histórico de provas', () => {
  assert.equal(
    shouldFreezeNewTheoryTopic(
      {
        topicId: 't-reg',
        sessionsCount: 0,
        totalStudySeconds: 0,
        estimatedStudyMinutes: 35,
        examImportance: 0.75,
      },
      10
    ),
    false
  );
  assert.equal(
    shouldFreezeNewTheoryTopic(
      {
        topicId: 't-denso',
        sessionsCount: 0,
        totalStudySeconds: 0,
        estimatedStudyMinutes: 180,
        examImportance: 0.8,
      },
      10
    ),
    true
  );
  // Sem historicalPresencePercent nem examImportance -> fallback 50 (multiplicador 1.0, não 0.4)
  assert.equal(
    calculateFinalStretchWeightMultiplier(
      {
        topicId: 't-novo-concurso',
        historicalPresencePercent: null,
        currentMastery: 55,
      },
      10
    ),
    1.0
  );
});
