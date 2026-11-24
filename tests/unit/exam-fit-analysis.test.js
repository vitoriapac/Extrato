import test from 'node:test';
import assert from 'node:assert/strict';
import { buildExamFitAnalysis } from '../../src/application/questions/build-exam-fit-analysis.js';

const subjects = [
  { id: 's1', name: 'Português', archived: false, topics: [] },
  { id: 's2', name: 'Matemática', archived: false, topics: [] },
];
const q = (over = {}) => ({
  id: Math.random().toString(36),
  date: '2026-11-20',
  subjectId: 's1',
  topicId: null,
  resolved: 20,
  correct: 16,
  ...over,
});
const blueprint = {
  banca: 'Cesgranrio',
  durationMinutes: 300,
  subjects: [{ expectedQuestions: 60 }, { expectedQuestions: 40 }],
};
const fromDate = '2026-08-27';

test('compara a banca da prova com as demais questões, por disciplina e no total', () => {
  const model = buildExamFitAnalysis({
    questions: [
      q({ banca: 'Cesgranrio', correct: 12 }),
      q({ banca: 'FGV', correct: 18 }),
      q({ subjectId: 's2', banca: 'Cesgranrio', resolved: 5, correct: 5 }),
      q({ date: '2026-01-01', banca: 'Cesgranrio', correct: 0 }),
    ],
    subjects,
    blueprint,
    fromDate,
  });
  assert.equal(model.totalResolved, 45);
  assert.equal(model.banca.coverage, 100);
  assert.equal(model.banca.onBanca.accuracy, 68);
  assert.equal(model.banca.others.accuracy, 90);
  assert.equal(model.banca.delta, -22);
  const [first, second] = model.banca.subjects;
  assert.equal(first.subjectId, 's1');
  assert.equal(first.delta, -30);
  // Só 5 questões de Matemática: comparação declarada insuficiente.
  assert.equal(second.delta, null);
});

test('sem banca da prova não há comparação e a cobertura conta questões sem banca', () => {
  const model = buildExamFitAnalysis({
    questions: [q({ banca: 'FGV' }), q()],
    subjects,
    blueprint: { ...blueprint, banca: null },
    fromDate,
  });
  assert.equal(model.banca.target, null);
  assert.equal(model.banca.coverage, 50);
  assert.equal(model.banca.delta, null);
  assert.deepEqual(model.banca.subjects, []);
});

test('ritmo usa só inéditas com tempo e compara com o tempo por questão da prova', () => {
  const base = { questions: [], subjects, blueprint, fromDate };
  assert.equal(
    buildExamFitAnalysis({ ...base, blueprint: { banca: null } }).pace.status,
    'missing-exam'
  );
  assert.equal(
    buildExamFitAnalysis({ ...base, questions: [q({ minutes: 30, resolved: 10 })] }).pace.status,
    'insufficient'
  );
  const slow = buildExamFitAnalysis({
    ...base,
    questions: [q({ minutes: 80 }), q({ minutes: 10, retry: true })],
  });
  assert.equal(slow.pace.examMinutesPerQuestion, 3);
  assert.equal(slow.pace.measuredMinutesPerQuestion, 4);
  assert.equal(slow.pace.sampleQuestions, 20);
  assert.equal(slow.pace.status, 'slow');
  assert.equal(
    buildExamFitAnalysis({ ...base, questions: [q({ minutes: 55 })] }).pace.status,
    'tight'
  );
  assert.equal(
    buildExamFitAnalysis({ ...base, questions: [q({ minutes: 40 })] }).pace.status,
    'ok'
  );
});

test('refeitas são comparadas com inéditas só com evidência nas duas', () => {
  const model = buildExamFitAnalysis({
    questions: [q({ correct: 12 }), q({ retry: true, correct: 19 })],
    subjects,
    blueprint,
    fromDate,
  });
  assert.equal(model.retry.fresh.accuracy, 60);
  assert.equal(model.retry.retried.accuracy, 95);
  assert.equal(model.retry.gap, 35);
  const few = buildExamFitAnalysis({
    questions: [q(), q({ retry: true, resolved: 5, correct: 5 })],
    subjects,
    blueprint,
    fromDate,
  });
  assert.equal(few.retry.gap, null);
});
