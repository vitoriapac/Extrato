import test from 'node:test';
import assert from 'node:assert/strict';
import { buildExamCountImport } from '../../src/application/exam-intelligence/import-exam-json.js';
import { calculateTopicIncidence } from '../../src/domain/exam-intelligence/topic-incidence.js';

const state = {
  subjects: [
    {
      id: 's1',
      name: 'Matemática',
      archived: false,
      topics: [
        { id: 't1', name: 'Juros', archived: false },
        { id: 't2', name: 'Porcentagem', archived: false },
      ],
    },
  ],
  exams: [],
  examQuestions: [],
};
const meta = {
  institution: 'Banco do Brasil',
  role: 'Escriturário',
  board: 'Cesgranrio',
  year: '2023',
};
const counts = [
  { subjectId: 's1', topicId: 't1', count: '3' },
  { subjectId: 's1', topicId: 't2', count: '' },
];

test('contagem por tópico vira prova completa e alimenta a incidência', () => {
  const result = buildExamCountImport(meta, counts, state, ['bb']);
  assert.equal(result.examQuestions.length, 3);
  assert.equal(result.exams[0].coverage, 'complete');
  assert.equal(result.exams[0].source, 'manual');
  const incidence = calculateTopicIncidence({
    topicId: 't1',
    exams: result.exams,
    questions: result.examQuestions,
    activeExamTags: ['bb'],
  });
  assert.equal(incidence.presencePercent, 100);
  assert.equal(incidence.questionCount, 3);
});

test('total maior que o contado deixa a prova parcial e diz quanto falta', () => {
  const result = buildExamCountImport({ ...meta, totalQuestions: '5' }, counts, state, ['bb']);
  assert.equal(result.coverage, 'partial');
  assert.equal(result.missing, 2);
  assert.equal(result.exams[0].coverage, 'partial');
});

test('registrar a mesma prova de novo substitui a contagem', () => {
  const first = buildExamCountImport(meta, counts, state, ['bb']);
  const second = buildExamCountImport(
    meta,
    [{ subjectId: 's1', topicId: 't2', count: 1 }],
    { ...state, exams: first.exams, examQuestions: first.examQuestions },
    ['bb']
  );
  assert.equal(second.replaced, true);
  assert.equal(second.exams.length, 1);
  assert.deepEqual(
    second.examQuestions.map(question => question.topicId),
    ['t2']
  );
});

test('recusa contagem vazia, total menor e prova sem banca', () => {
  assert.throws(() => buildExamCountImport(meta, [], state), /pelo menos um tópico/);
  assert.throws(
    () => buildExamCountImport({ ...meta, totalQuestions: 2 }, counts, state),
    /não pode ser menor/
  );
  assert.throws(() => buildExamCountImport({ ...meta, board: '' }, counts, state), /banca/);
});
