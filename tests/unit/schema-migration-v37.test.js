import test from 'node:test';
import assert from 'node:assert/strict';
import { createStateMigrator } from '../../src/state/migrations.js';
import { CURRENT_SCHEMA_VERSION } from '../../src/state/schema.js';

const { migrateState } = createStateMigrator({
  nowISO: () => '2026-11-25T15:00:00.000Z',
  todayISO: () => '2026-11-25',
  toLocalDate: value => String(value).slice(0, 10),
  errorCategoryKeys: ['naoSabia', 'chute', 'letraLei', 'jurisprudencia'],
});

test('migração v1 e v36 para v37 inicializa campos da Onda 1/2 sem mutar snapshots históricos', () => {
  assert.equal(CURRENT_SCHEMA_VERSION, 37);

  const frozenWeekly = [{ id: 'wc-1', weekStart: '2026-11-01', adherencePct: 85 }];
  const v36 = {
    schemaVersion: 36,
    subjects: [{ id: 's1', name: 'Direito Administrativo', topics: [{ id: 't1', name: 'Atos' }] }],
    errorFlashcards: [
      {
        id: 'efc-1',
        topicId: 't1',
        subjectId: 's1',
        statementSummary: 'Enunciado',
        correctConcept: 'Conceito',
        status: 'pending',
        reviewCount: 0,
        consecutiveSuccesses: 0,
        intervalDays: 1,
        easeFactor: 2.5,
        createdAt: '2026-11-20T10:00:00.000Z',
      },
    ],
    simulacoes: [
      {
        id: 'sim-1',
        nome: 'Simulado 1',
        date: '2026-11-22',
        correct: 40,
        total: 60,
        breakdown: [{ id: 'b1', subjectId: 's1', correct: 8, total: 10 }],
      },
    ],
    weeklyCloseSnapshots: structuredClone(frozenWeekly),
  };

  const migrated = migrateState(v36);
  assert.equal(migrated.schemaVersion, 37);
  assert.equal(migrated.subjects[0].topics[0].lastLawReadAt, null);
  assert.equal(migrated.subjects[0].topics[0].legislativeUpdatePending, false);
  assert.equal(migrated.subjects[0].topics[0].legislativeUpdateNote, null);
  assert.equal(migrated.errorFlashcards[0].reference, null);
  assert.equal(migrated.errorFlashcards[0].banca, null);
  assert.equal(migrated.simulacoes[0].breakdown[0].durationMinutes, null);
  assert.deepEqual(migrated.weeklyCloseSnapshots, frozenWeekly);

  const fromV1 = migrateState({
    subjects: [{ name: 'Português', topics: [{ name: 'Crase' }] }],
  });
  assert.equal(fromV1.schemaVersion, 37);
  assert.equal(fromV1.subjects[0].topics[0].legislativeUpdatePending, false);
});
