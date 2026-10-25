import test from 'node:test';
import assert from 'node:assert/strict';
import { createExam, validateExam } from '../../src/domain/exam-intelligence/exam.js';
import {
  createExamQuestion,
  validateExamQuestion,
} from '../../src/domain/exam-intelligence/exam-question.js';

const input = {
  id: 'exam-bb-2023',
  institution: 'Banco do Brasil',
  examName: 'Escriturário 2023',
  role: 'Escriturário',
  board: 'Cesgranrio',
  year: 2023,
  date: '2023-04-23',
  source: 'manual',
  sourceReference: 'Edital 2023',
  coverage: 'complete',
  examTags: ['bb-escriturario'],
};

test('modelo rejeita datas, pesos, classificações e coberturas inválidas', () => {
  assert.match(validateExam({ ...input, date: '2023-02-30' }), /data/);
  assert.match(validateExam({ ...input, coverage: 'complete', examTags: 'bb' }), /escopo/);
  assert.throws(() => createExam({ ...input, year: 2024 }), /data/);
  const question = createExamQuestion({
    id: 'q-1',
    examId: input.id,
    subjectId: 'subject-1',
    topicId: 'topic-1',
    questionNumber: 1,
  });
  assert.equal(question.classification.method, 'manual');
  assert.match(validateExamQuestion({ ...question, weight: -1 }), /peso/);
  assert.match(
    validateExamQuestion({ ...question, classification: { method: 'assisted', confidence: 2 } }),
    /classificação/
  );
});
