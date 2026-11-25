import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AGENDA_INTERVALS,
  DIFFICULTY_INTERVALS,
  PRE_EXAM_GENERAL_REVIEW_TYPE,
  buildPreExamGeneralReviewItems,
} from '../../src/domain/reviews.js';

test('AGENDA_INTERVALS e DIFFICULTY_INTERVALS incluem horizontes de 60 e 90 dias', () => {
  assert.ok(AGENDA_INTERVALS.some(i => i.dias === 60));
  assert.ok(AGENDA_INTERVALS.some(i => i.dias === 90));
  for (const difficulty of ['Difícil', 'Médio', 'Fácil']) {
    const list = DIFFICULTY_INTERVALS[difficulty];
    assert.ok(list.some(i => i.dias === 60), `${difficulty} deve ter 60 dias`);
    assert.ok(list.some(i => i.dias === 90), `${difficulty} deve ter 90 dias`);
  }
});

test('buildPreExamGeneralReviewItems agenda revisões na janela de 10 a 15 dias antes da prova sem duplicar', () => {
  const topics = [
    { id: 't1', subjectId: 's1', status: 'Concluído' },
    { id: 't2', subjectId: 's1', status: 'Concluído' },
    { id: 't3', subjectId: 's1', status: 'Em estudo' },
  ];
  const existingAgenda = [{ topicId: 't2', tipo: PRE_EXAM_GENERAL_REVIEW_TYPE }];

  const drafts = buildPreExamGeneralReviewItems({
    topics,
    existingAgenda,
    examDate: '2026-12-20',
    today: '2026-11-25',
  });

  assert.equal(drafts.length, 1);
  assert.equal(drafts[0].topicId, 't1');
  assert.equal(drafts[0].tipo, PRE_EXAM_GENERAL_REVIEW_TYPE);
  assert.ok(drafts[0].date >= '2026-12-05' && drafts[0].date <= '2026-12-10');
});

test('buildPreExamGeneralReviewItems ajusta data mínima para hoje se a prova estiver a menos de 14 dias e ignora sem data', () => {
  const topics = [{ id: 't1', subjectId: 's1', status: 'Concluído' }];
  assert.deepEqual(
    buildPreExamGeneralReviewItems({ topics, existingAgenda: [], examDate: null, today: '2026-11-25' }),
    []
  );
  const closeDrafts = buildPreExamGeneralReviewItems({
    topics,
    existingAgenda: [],
    examDate: '2026-12-01',
    today: '2026-11-25',
  });
  assert.equal(closeDrafts.length, 1);
  assert.equal(closeDrafts[0].date, '2026-11-25');
});
