import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPerformancePageModel } from '../../src/application/performance/build-performance-page-model.js';

const range = {
  start: '2026-10-09',
  end: '2026-11-07',
  comparePrevious: true,
  previous: { start: '2026-09-09', end: '2026-10-08' },
};
const questions = [
  { date: '2026-10-20', resolved: 87, correct: 62, topicId: 't1' }, // 71,3%
  { date: '2026-09-20', resolved: 90, correct: 60, topicId: 't1' }, // 66,7%
];
const base = {
  range,
  today: '2026-11-07',
  scope: {
    questions: { included: questions },
    sessions: { included: [] },
    content: { eligibleTopics: [] },
  },
  subjectIdFor: () => 's1',
};

test('a precisão anterior de Questões usa a mesma casa decimal da Visão geral', () => {
  const overview = buildPerformancePageModel({
    ...base,
    viewState: { section: 'overview', period: '30' },
  });
  const questionsModel = buildPerformancePageModel({
    ...base,
    viewState: { section: 'questions', period: '30' },
  });
  const overviewDelta =
    Math.round((overview.model.current.accuracy - overview.model.previous.accuracy) * 10) / 10;
  const questionsDelta =
    Math.round((questionsModel.analysis.accuracy - questionsModel.previousAccuracy) * 10) / 10;
  assert.equal(overviewDelta, 4.6);
  assert.equal(questionsDelta, overviewDelta);
});
