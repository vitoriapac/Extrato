import test from 'node:test';
import assert from 'node:assert/strict';
import { buildEssayEvolutionSummary } from '../../src/domain/calendar/calendar-projection.ts';
import { studiedTopicsOutsideScope } from '../../src/domain/exams/exam-scope.ts';
import { resolveExamPhase, withPreEdital } from '../../src/domain/planning/adaptive-planning.ts';

const essay = (id, date, score, criteria = {}) => ({
  id,
  date,
  kind: 'essay',
  status: 'Concluído',
  essayScore: score,
  essayMaxScore: 100,
  ...criteria,
});

test('discursiva: média por critério, critério mais fraco e mínimo eliminatório', () => {
  const summary = buildEssayEvolutionSummary(
    [
      essay('a', '2026-11-01', 70, { essayContent: 80, essayStructure: 70, essayLanguage: 50 }),
      essay('b', '2026-11-10', 55, { essayContent: 60, essayLanguage: 70 }),
    ],
    60
  );
  assert.deepEqual(summary.criteriaAverages, { content: 70, structure: 70, language: 60 });
  assert.equal(summary.weakestCriterion.label, 'Linguagem');
  // A mais recente (55%) ficou abaixo do mínimo de 60%.
  assert.equal(summary.latestBelowMinimum, true);
  assert.equal(
    buildEssayEvolutionSummary([essay('c', '2026-11-01', 90)], 60).latestBelowMinimum,
    false
  );
  assert.equal(buildEssayEvolutionSummary([essay('c', '2026-11-01', 90)]).weakestCriterion, null);
});

test('pré-edital: fase sem data vira Pré-edital; com data não muda', () => {
  assert.equal(withPreEdital(resolveExamPhase(null), true).label, 'Pré-edital');
  assert.equal(withPreEdital(resolveExamPhase(null), false).label, 'Prova sem data');
  assert.equal(withPreEdital(resolveExamPhase(120), true).state, 'construction');
});

test('tópicos estudados fora do edital ativo, com tempo e questões', () => {
  const subjects = [
    {
      id: 's1',
      name: 'Português',
      topics: [
        { id: 't1', name: 'Crase', examTags: ['caixa-tbn'] },
        { id: 't2', name: 'Regência', examTags: ['bb-escriturario'] },
        { id: 't3', name: 'Pessoal', examTags: [] },
        { id: 't4', name: 'Sem estudo', examTags: ['caixa-tbn'] },
      ],
    },
  ];
  const rows = studiedTopicsOutsideScope({
    subjects,
    sessions: [
      { topicId: 't1', durationSeconds: 3600 },
      { topicId: 't3', durationSeconds: 600 },
    ],
    questions: [
      { topicId: 't1', resolved: 20 },
      { topicId: 't2', resolved: 10 },
    ],
    activeExamTags: ['bb-escriturario'],
  });
  // t2 está no edital, t3 é pessoal (sempre conta) e t4 não tem estudo.
  assert.deepEqual(
    rows.map(r => [r.topicId, r.minutes, r.questions]),
    [['t1', 60, 20]]
  );
  assert.deepEqual(studiedTopicsOutsideScope({ subjects, activeExamTags: [] }), []);
});
