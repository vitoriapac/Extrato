import test from 'node:test';
import assert from 'node:assert/strict';
import { buildWeeklyClose } from '../../src/domain/analytics/weekly-close.js';

// Caracterização (T10, caso 1): hoje a prioridade da próxima semana vem só do histórico de recomendações
// aceitas no período; o acerto ATUAL do tópico não é consultado. Quando T11 corrigir, este teste passa
// a afirmar o contrário (tópico acima da meta fora do foco).
test('foco da próxima semana inclui recomendação aceita mesmo com o tópico já acima da meta', () => {
  const close = buildWeeklyClose({
    period: { start: '2026-11-09', end: '2026-11-15' },
    current: { plannedMinutes: 120, executedMinutes: 100 },
    recommendations: [
      {
        recommendationId: 'r1',
        topicId: 'classes-de-palavras',
        subjectId: 'lp',
        date: '2026-11-10',
        accepted: true,
        reasons: ['Você: 17 acertos em 20 (85%) antes da recomendação.'],
        estimatedMinutes: 35,
      },
    ],
  });
  assert.equal(close.priorities.length, 1);
  assert.equal(close.priorities[0].topicId, 'classes-de-palavras');
});
