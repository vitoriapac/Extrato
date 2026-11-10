import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPerformanceSubjectComparison } from '../../src/application/performance/build-performance-subject-comparison.js';
import { renderPerformanceSubjectComparison } from '../../src/ui/performance/performance-subject-comparison-renderer.js';

const subjects = [
  { id: 's1', name: 'Matemática', topics: [] },
  { id: 's2', name: 'Português', topics: [] },
];
const questions = [
  { subjectId: 's1', date: '2026-11-05', resolved: 20, correct: 10 },
  { subjectId: 's2', date: '2026-11-05', resolved: 20, correct: 18 },
];
const range = { start: '2026-11-01', end: '2026-11-10' };
const escape = value => String(value);

test('comparação por disciplina: saldo do plano e sugestão vêm de modelos já calculados', () => {
  const model = buildPerformanceSubjectComparison({
    subjects,
    questions,
    range,
    candidates: [
      { subjectId: 's1', topicName: 'Juros compostos', score: 80, studyType: 'review' },
      { subjectId: 's1', topicName: 'Razão', score: 40, studyType: 'study' },
    ],
    adherenceSubjects: [
      { subjectId: 's1', plannedMinutes: 120, executedMinutes: 75 },
      { subjectId: 's2', plannedMinutes: 60, executedMinutes: 90 },
    ],
    sort: 'balance',
  });
  const [first, second] = model.rows;
  assert.equal(first.subjectId, 's1');
  assert.equal(first.balanceMinutes, 45);
  assert.equal(first.suggestion, 'Revisar Juros compostos');
  assert.equal(second.balanceMinutes, -30);
  assert.equal(second.suggestion, null);
});

test('comparação por disciplina: sem plano o saldo fica em branco, sem inventar zero', () => {
  const model = buildPerformanceSubjectComparison({ subjects, questions, range });
  assert.equal(model.rows[0].balanceMinutes, null);
  const html = renderPerformanceSubjectComparison(model, {
    escapeHtml: escape,
    escapeAttr: escape,
  });
  assert.match(html, /Saldo do plano/);
  assert.doesNotMatch(html, /faltam 0 min/);
});
