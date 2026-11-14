import test from 'node:test';
import assert from 'node:assert/strict';
import { createStateMigrator } from '../../src/state/migrations.js';
import { CURRENT_SCHEMA_VERSION } from '../../src/state/schema.js';
import {
  inferCumulativeUnlockDates,
  syncAchievementUnlocks,
} from '../../src/application/achievements/achievement-unlocks.js';

const { migrateState } = createStateMigrator({
  nowISO: () => '2026-11-13T12:00:00.000Z',
  todayISO: () => '2026-11-13',
  toLocalDate: value => String(value).slice(0, 10),
  errorCategoryKeys: ['naoSabia', 'chute'],
});

const session = (date, hours, extra = {}) => ({
  id: `s-${date}-${hours}`,
  date,
  subjectId: 'a',
  topicId: null,
  durationSeconds: hours * 3600,
  ...extra,
});

test('esquema atual é 31', () => assert.equal(CURRENT_SCHEMA_VERSION, 31));

test('migração v30 → v31 infere a data das cumulativas pelo registro que atingiu o critério', () => {
  const migrated = migrateState({
    schemaVersion: 30,
    studySessions: [session('2026-10-03', 6), session('2026-10-01', 5), session('2026-10-05', 5)],
    questoes: [
      { id: 'q1', date: '2026-10-02', resolved: 60, correct: 40 },
      { id: 'q2', date: '2026-10-04', resolved: 60, correct: 40 },
    ],
    simulados: [
      { id: 'm1', date: '2026-10-06', correct: 1, total: 2 },
      { id: 'm2', date: '2026-10-01', correct: 1, total: 2 },
    ],
  });
  const unlocks = migrated.achievementUnlocks;
  assert.equal(migrated.schemaVersion, 31);
  assert.equal(migrated.achievementsBaselined, false);
  assert.deepEqual(unlocks.firstSession, { unlockedAt: '2026-10-01', source: 'migrated' });
  // 5h em 01/10 + 6h em 03/10 = 11h: cruza 10 h no dia 03.
  assert.equal(unlocks.hours10.unlockedAt, '2026-10-03');
  assert.equal(unlocks.hours50, undefined);
  assert.equal(unlocks.q100.unlockedAt, '2026-10-04');
  assert.equal(unlocks.q500, undefined);
  assert.equal(unlocks.sim1.unlockedAt, '2026-10-01');
  assert.equal(unlocks.sim5, undefined);
});

test('migração v30 → v31 é idempotente e preserva registro já gravado', () => {
  const first = migrateState({
    schemaVersion: 30,
    studySessions: [session('2026-10-01', 11)],
  });
  first.achievementUnlocks.hours10 = { unlockedAt: '2026-09-01', source: 'live' };
  const again = migrateState({ ...first, schemaVersion: 30 });
  assert.deepEqual(again.achievementUnlocks.hours10, { unlockedAt: '2026-09-01', source: 'live' });
  assert.equal(
    Object.keys(again.achievementUnlocks).length,
    Object.keys(first.achievementUnlocks).length
  );
});

test('migração v30 → v31 de backup sem histórico não inventa conquistas', () => {
  const migrated = migrateState({ schemaVersion: 30 });
  assert.deepEqual(migrated.achievementUnlocks, {});
  assert.equal(migrated.achievementsBaselined, false);
});

test('inferência de tópicos conta cada tópico uma vez e usa a data da primeira conclusão', () => {
  const history = [];
  for (let i = 1; i <= 10; i += 1)
    history.push({
      type: 'topic_completed',
      topicId: `t${i}`,
      localDate: `2026-09-${String(i).padStart(2, '0')}`,
    });
  history.push({ type: 'topic_completed', topicId: 't1', localDate: '2026-09-20' });
  assert.equal(inferCumulativeUnlockDates({ topicHistory: history }).topics10, '2026-09-10');
  assert.equal(
    inferCumulativeUnlockDates({ topicHistory: history.slice(0, 9) }).topics10,
    undefined
  );
});

test('inferência de revisões só conta as concluídas', () => {
  const reviews = Array.from({ length: 25 }, (_, i) => ({
    id: `r${i}`,
    date: '2026-10-01',
    status: i === 24 ? 'Pendente' : 'Concluído',
    completedAt: `2026-10-${String(i + 1).padStart(2, '0')}T10:00:00Z`,
  }));
  assert.equal(inferCumulativeUnlockDates({ reviewAgenda: reviews }).reviews25, undefined);
  reviews[24].status = 'Concluído';
  assert.equal(inferCumulativeUnlockDates({ reviewAgenda: reviews }).reviews25, '2026-10-25');
});

test('primeira leitura registra o que já está cumprido como migrado, sem aviso', () => {
  const state = { achievementUnlocks: {}, achievementsBaselined: false };
  const result = syncAchievementUnlocks(state, ['streak7', 'coverage50'], '2026-11-13');
  assert.deepEqual(result.newlyUnlocked, []);
  assert.equal(result.changed, true);
  assert.deepEqual(state.achievementUnlocks.streak7, { unlockedAt: null, source: 'migrated' });
  assert.equal(state.achievementsBaselined, true);
});

test('depois da primeira leitura, cada conquista nova entra como live uma única vez', () => {
  const state = {
    achievementUnlocks: { streak7: { unlockedAt: null, source: 'migrated' } },
    achievementsBaselined: true,
  };
  const first = syncAchievementUnlocks(state, ['streak7', 'q100', 'hours10'], '2026-11-13');
  assert.deepEqual(first.newlyUnlocked, ['q100', 'hours10']);
  assert.deepEqual(state.achievementUnlocks.q100, { unlockedAt: '2026-11-13', source: 'live' });
  assert.deepEqual(state.achievementUnlocks.streak7, { unlockedAt: null, source: 'migrated' });

  const second = syncAchievementUnlocks(state, ['streak7', 'q100', 'hours10'], '2026-11-14');
  assert.deepEqual(second.newlyUnlocked, []);
  assert.equal(second.changed, false);
  assert.equal(state.achievementUnlocks.q100.unlockedAt, '2026-11-13');
});

test('conquista que deixa de estar cumprida continua registrada (o passado não é reescrito)', () => {
  const state = {
    achievementUnlocks: { streak7: { unlockedAt: '2026-10-10', source: 'live' } },
    achievementsBaselined: true,
  };
  const result = syncAchievementUnlocks(state, [], '2026-11-13');
  assert.deepEqual(result.newlyUnlocked, []);
  assert.equal(state.achievementUnlocks.streak7.unlockedAt, '2026-10-10');
});
