import test from 'node:test';
import assert from 'node:assert/strict';

import {
  suggestCanonicalMatches,
  confirmTopicEquivalence,
  resolveCanonicalTopicId,
} from '../../src/domain/exam-intelligence/topic-canonical-identity.ts';
import { CANONICAL_TOPICS_CATALOG } from '../../src/domain/exam-intelligence/canonical-topics-catalog.ts';
import { createStateMigrator } from '../../src/state/migrations.ts';
import { CURRENT_SCHEMA_VERSION } from '../../src/state/schema.ts';

test('suggestCanonicalMatches sugere equivalência sem fundir automaticamente', () => {
  const catalog = [
    {
      canonicalTopicId: 'canon-juros-compostos',
      canonicalName: 'Juros Compostos',
      aliases: ['Regime de Capitalização Composta'],
    },
    {
      canonicalTopicId: 'canon-juros-simples',
      canonicalName: 'Juros Simples',
      aliases: ['Regime de Capitalização Simples'],
    },
  ];

  const suggestions = suggestCanonicalMatches({
    topicName: 'Regime de Capitalização Composta',
    canonicalCatalog: catalog,
  });

  assert.ok(suggestions.length >= 1);
  assert.equal(suggestions[0].canonicalTopicId, 'canon-juros-compostos');
  assert.equal(suggestions[0].score, 1);
  assert.equal(suggestions[0].ambiguous, false);
});

test('confirmTopicEquivalence preserva o nome original do edital e resolve id canônico', () => {
  const record = confirmTopicEquivalence({
    id: 'eq-1',
    topicId: 'top-edital-bb-99',
    preservedOriginalName: 'Regime de Capitalização Composta',
    canonicalTopicId: 'canon-juros-compostos',
    canonicalName: 'Juros Compostos',
    source: 'manual',
    confirmedAt: '2026-11-17T20:00:00.000Z',
  });

  assert.equal(record.preservedOriginalName, 'Regime de Capitalização Composta');
  assert.equal(resolveCanonicalTopicId('top-edital-bb-99', [record]), 'canon-juros-compostos');
  assert.equal(resolveCanonicalTopicId('top-outro', [record]), 'top-outro');
});

test('migração v32 → v34 preserva históricos e inicializa topicEquivalences e studyMaterials', () => {
  const migrator = createStateMigrator({
    nowISO: () => '2026-11-17T20:00:00.000Z',
    todayISO: () => '2026-11-17',
    toLocalDate: () => '2026-11-17',
    errorCategoryKeys: ['concept', 'attention', 'interpretation'],
  });

  const legacyV32 = {
    schemaVersion: 32,
    subjects: [{ id: 's1', name: 'Matemática', topics: [{ id: 't1', name: 'Juros' }] }],
    studySessions: [{ id: 'sess-1', subjectId: 's1', topicId: 't1', durationSeconds: 1800, date: '2026-11-10' }],
    topicHistory: [{ id: 'hist-1', subjectId: 's1', topicId: 't1', occurredAt: '2026-11-10T10:00:00.000Z' }],
  };

  const migrated = migrator.migrateState(legacyV32);
  assert.equal(migrated.schemaVersion, CURRENT_SCHEMA_VERSION);
  assert.deepEqual(migrated.topicEquivalences, []);
  assert.deepEqual(migrated.studyMaterials, []);
  assert.equal(migrated.studySessions.length, 1);
  assert.equal(migrated.topicHistory.length, 1);
});

test('CANONICAL_TOPICS_CATALOG encontra equivalência de Crase e Atos Administrativos sem fusão automática', () => {
  const crase = suggestCanonicalMatches({
    topicName: 'Uso da Crase',
    canonicalCatalog: CANONICAL_TOPICS_CATALOG,
  });
  assert.ok(crase.length >= 1);
  assert.equal(crase[0].canonicalTopicId, 'canon-port-crase');
  assert.equal(crase[0].score, 1);
});
