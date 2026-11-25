import test from 'node:test';
import assert from 'node:assert/strict';
import { buildBatchQuestionRecords } from '../../src/domain/questions/batch-question-entry.js';

test('buildBatchQuestionRecords cria registros válidos por tópico ignorando linhas zeradas', () => {
  const result = buildBatchQuestionRecords({
    date: '2026-11-25',
    subjectId: 'sub-dir-adm',
    banca: 'fgv',
    retry: false,
    scoringMode: 'padrao',
    rows: [
      { topicId: 't-atos', topicName: 'Atos Administrativos', resolved: 15, correct: 12, errorCategory: 'pegadinha' },
      { topicId: 't-lic', topicName: 'Licitações', resolved: 0, correct: 0 },
      { topicId: null, topicName: 'Geral', resolved: 10, correct: 10 },
    ],
  });

  assert.equal(result.ok, true);
  assert.equal(result.records.length, 2);
  assert.equal(result.summary.topicCount, 2);
  assert.equal(result.summary.totalResolved, 25);
  assert.equal(result.summary.totalCorrect, 22);
  assert.equal(result.records[0].banca, 'FGV');
  assert.deepEqual(result.records[0].errorBreakdown, { pegadinha: 3 });
  assert.equal(result.records[1].topicId, null);
  assert.deepEqual(result.records[1].errorBreakdown, {});
});

test('buildBatchQuestionRecords rejeita acertos + brancas acima do total', () => {
  const result = buildBatchQuestionRecords({
    date: '2026-11-25',
    subjectId: 'sub-1',
    scoringMode: 'certo-errado',
    rows: [{ topicId: 't1', topicName: 'Crase', resolved: 10, correct: 8, blank: 3 }],
  });

  assert.equal(result.ok, false);
  assert.match(result.error || '', /Crase/);
  assert.equal(result.records.length, 0);
});
