import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateCebraspeEssayScore } from '../../src/domain/exams/essay-scoring.js';
import { buildEssayEvolutionSummary } from '../../src/domain/calendar/calendar-projection.js';

test('calculateCebraspeEssayScore calcula Nota Final = max(0, NC - w * (NE / TL))', () => {
  const result = calculateCebraspeEssayScore({
    contentScore: 18,
    maxScore: 20,
    linesWritten: 30,
    grammarErrors: 6,
    errorWeight: 2,
  });
  // 18 - 2 * (6 / 30) = 18 - 0.4 = 17.6
  assert.equal(result.errorsPerLine, 0.2);
  assert.equal(result.deduction, 0.4);
  assert.equal(result.netScore, 17.6);
  assert.equal(result.netPercent, 88);

  const clamped = calculateCebraspeEssayScore({
    contentScore: 2,
    maxScore: 20,
    linesWritten: 10,
    grammarErrors: 15,
    errorWeight: 2,
  });
  assert.equal(clamped.netScore, 0);
});

test('buildEssayEvolutionSummary preserva modalidade técnica e taxa de erros por linha', () => {
  const summary = buildEssayEvolutionSummary(
    [
      {
        key: 'Calendário:e1',
        id: 'e1',
        date: '2026-10-20',
        kind: 'essay',
        title: 'Estudo de Caso — Licitações',
        label: 'Estudo de Caso — Licitações',
        status: 'Concluído',
        origem: 'Calendário',
        subjectId: 'adm',
        subject: 'Direito Administrativo',
        essayKind: 'estudo_caso',
        essayScoringMode: 'cebraspe_linhas',
        essayLinesWritten: 30,
        essayGrammarErrors: 6,
        essayErrorWeight: 2,
        essayScore: 17.6,
        essayMaxScore: 20,
        essayStatus: 'graded',
        isEvent: false,
        isDraggable: true,
      },
    ],
    70
  );
  assert.equal(summary.totalCount, 1);
  assert.equal(summary.gradedCount, 1);
  assert.equal(summary.averagePercent, 88);
  assert.equal(summary.entries[0].essayKind, 'estudo_caso');
  assert.equal(summary.entries[0].essayScoringMode, 'cebraspe_linhas');
  assert.equal(summary.entries[0].errorsPerLine, 0.2);
  assert.equal(summary.latestBelowMinimum, false);
});
