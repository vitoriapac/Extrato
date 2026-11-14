import test from 'node:test';
import assert from 'node:assert/strict';
import { createAchievementsController } from '../../src/ui/controllers/achievements-controller.js';

function build(overrides = {}) {
  const state = {
    studySessions: [],
    questoes: [],
    simulados: [],
    subjects: [],
    reviewAgenda: [],
    recommendationFeedback: [],
    topicHistory: [],
    exams: [],
    examBlueprint: { activeExamTags: [] },
    achievementUnlocks: {},
    achievementsBaselined: true,
    ...overrides,
  };
  let streakCalls = 0;
  const controller = createAchievementsController({
    document: { getElementById: () => null },
    getState: () => state,
    allTopics: () =>
      state.subjects.flatMap(subject =>
        (subject.topics || []).map(topic => ({
          ...topic,
          subjectArchived: Boolean(subject.archived),
        }))
      ),
    activeSubjects: () => state.subjects.filter(subject => !subject.archived),
    subjectProgress: subject => {
      const topics = (subject.topics || []).filter(topic => !topic.archived);
      return topics.length
        ? Math.round(
            (100 * topics.filter(topic => topic.status === 'Concluído').length) / topics.length
          )
        : 0;
    },
    computeStreak: () => {
      streakCalls += 1;
      return 0;
    },
    getActivityDates: () => new Set(),
    todayISO: () => '2026-11-13',
  });
  return { state, controller, calls: () => streakCalls };
}

const subject = (id, ...statuses) => ({
  id,
  topics: statuses.map((status, index) => ({ id: id + index, status })),
});

test('a avaliação é reaproveitada enquanto os dados das conquistas não mudam', () => {
  const { controller } = build();
  const first = controller.evaluateAchievements();
  assert.equal(controller.evaluateAchievements(), first);
});

test('a avaliação é refeita quando uma sessão entra', () => {
  const { controller, state } = build();
  const first = controller.evaluateAchievements();
  state.studySessions.push({ id: 's', date: '2026-11-13', durationSeconds: 60 });
  const second = controller.evaluateAchievements();
  assert.notEqual(second, first);
  assert.equal(second.find(item => item.id === 'firstSession').unlocked, true);
});

test('a sequência é calculada uma vez por avaliação', () => {
  const { controller, calls } = build();
  controller.evaluateAchievements();
  assert.equal(calls(), 1);
});

test('arquivar a disciplina incompleta que faz Plano completo virar verdade não gera aviso', () => {
  const { controller, state } = build({
    subjects: [subject('a', 'Concluído'), subject('b', 'Não iniciado')],
  });
  state.achievementsBaselined = false;
  controller.syncUnlocks('2026-11-13');
  assert.equal(state.achievementUnlocks.allsubjects, undefined);

  state.subjects[1].archived = true;
  const result = controller.syncUnlocks('2026-11-14');
  assert.equal(state.achievementUnlocks.allsubjects.source, 'live');
  assert.ok(!result.newlyUnlocked.includes('allsubjects'));
});

test('concluir o último tópico que fecha o plano ainda avisa', () => {
  const { controller, state } = build({
    subjects: [subject('a', 'Concluído'), subject('b', 'Em andamento')],
  });
  state.achievementsBaselined = false;
  controller.syncUnlocks('2026-11-13');
  state.subjects[1].topics[0].status = 'Concluído';
  const result = controller.syncUnlocks('2026-11-14');
  assert.ok(result.newlyUnlocked.includes('allsubjects'));
});
