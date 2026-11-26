import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSyllabusTriage } from '../../src/domain/planning/syllabus-triage.js';

const c = (topicId, examImpact, remainingMinutes, extra = {}) => ({
  topicId,
  topicName: topicId,
  subjectName: 'S',
  examImpact,
  remainingMinutes,
  ...extra,
});

test('triagem mantém o que rende mais por minuto e lista o resto como corte', () => {
  const triage = buildSyllabusTriage({
    candidates: [
      c('alto', 90, 60),
      c('medio', 50, 60),
      c('baixo', 10, 120),
      c('feito', 99, 30, { covered: true }),
    ],
    weeklyAvailableMinutes: 60,
    weeksUntilExam: 2,
  });
  assert.equal(triage.budgetMinutes, 120);
  assert.deepEqual(
    triage.keep.map(i => i.topicId),
    ['alto', 'medio']
  );
  assert.deepEqual(
    triage.cut.map(i => i.topicId),
    ['baixo']
  );
  assert.equal(triage.coveragePct, 93);
});

test('manutenção acima da disponibilidade zera o orçamento de conteúdo novo', () => {
  const triage = buildSyllabusTriage({
    candidates: [c('a', 50, 30)],
    weeklyAvailableMinutes: 60,
    weeksUntilExam: 4,
    maintenanceMinutes: 90,
  });
  assert.equal(triage.budgetMinutes, 0);
  assert.equal(triage.cut.length, 1);
});
