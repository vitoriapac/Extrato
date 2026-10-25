import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createAchievementsController,
  STRATEGIC_BADGES,
  CONSISTENCY_BADGE_IDS,
} from '../../src/ui/controllers/achievements-controller.js';

test('createAchievementsController — avalia conquistas padrão e calcula progresso', () => {
  const dummyState = {
    studySessions: [
      { id: 's1', date: '2026-03-10', durationSeconds: 7200 },
      { id: 's2', date: '2026-03-11', durationSeconds: 3600 },
    ],
    questoes: [
      { id: 'q1', resolved: 60 },
      { id: 'q2', resolved: 50 },
    ],
    simulados: [{ id: 'sim-1' }],
    reviewAgenda: [],
    recommendationFeedback: [],
    subjects: [
      {
        id: 'sub-1',
        topics: [{ id: 't1', status: 'Concluído' }],
      },
    ],
  };

  const controller = createAchievementsController({
    document: {},
    getState: () => dummyState,
    allTopics: () => [{ id: 't1', status: 'Concluído', archived: false }],
    activeSubjects: () => dummyState.subjects,
    subjectProgress: () => 100,
    computeStreak: () => 2,
    getActivityDates: () => new Set(['2026-03-10', '2026-03-11']),
    intelligenceCandidates: () => [],
  });

  const achievements = controller.evaluateAchievements();

  // Primeira sessão desbloqueada
  const firstSession = achievements.find(a => a.id === 'firstSession');
  assert.equal(firstSession?.unlocked, true);

  // 110 questões resolvidas -> q100 desbloqueada
  const q100 = achievements.find(a => a.id === 'q100');
  assert.equal(q100?.unlocked, true);

  // q500 bloqueada com progresso
  const q500 = achievements.find(a => a.id === 'q500');
  assert.equal(q500?.unlocked, false);
  assert.equal(q500?.progress?.current, 110);
  assert.equal(q500?.progress?.target, 500);

  // Conquistas estratégicas presentes
  assert.ok(achievements.some(a => a.id === 'strategist'));
});

test('STRATEGIC_BADGES e CONSISTENCY_BADGE_IDS contêm metadados esperados', () => {
  assert.equal(STRATEGIC_BADGES.length, 3);
  assert.ok(CONSISTENCY_BADGE_IDS.has('firstSession'));
  assert.ok(CONSISTENCY_BADGE_IDS.has('streak30'));
});
