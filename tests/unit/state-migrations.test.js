import test from 'node:test';
import assert from 'node:assert/strict';
import { createStateMigrator } from '../../src/state/migrations.js';
import { CURRENT_SCHEMA_VERSION } from '../../src/state/schema.js';

const { migrateState } = createStateMigrator({
  nowISO: () => '2026-10-27T12:00:00.000Z',
  todayISO: () => '2026-10-27',
  toLocalDate: value => String(value).slice(0, 10),
  errorCategoryKeys: ['naoSabia', 'chute'],
});

test('createStateMigrator — estado v1 chega à versão atual com vínculos por id', () => {
  const migrated = migrateState({
    subjects: [{ name: 'Direito', topics: [{ name: 'Prazos', completedAt: '2026-01-10' }] }],
    questoes: [{ subject: 'Direito', errorBreakdown: { chute: '2.7', outra: 5 } }],
    reviewAgenda: [{ subject: 'Direito', tipo: 'Revisão 30d' }],
    metas: { horasDiarias: 3 },
  });
  const subject = migrated.subjects[0];
  const topic = subject.topics[0];

  assert.equal(migrated.schemaVersion, CURRENT_SCHEMA_VERSION);
  assert.equal(migrated.questoes[0].subjectId, subject.id);
  assert.deepEqual(migrated.questoes[0].errorBreakdown, { naoSabia: 0, chute: 2 });
  assert.equal(migrated.reviewAgenda[0].baseIntervalDays, 30);
  assert.equal(migrated.metas.horasPorDia['0'], 3);
  const completed = migrated.topicHistory.find(event => event.type === 'topic_completed');
  assert.equal(completed.topicId, topic.id);
  assert.equal(completed.localDate, '2026-01-10');
});
