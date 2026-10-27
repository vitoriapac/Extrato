import test from 'node:test';
import assert from 'node:assert/strict';
import { createDefaultState } from '../../src/state/defaults.js';
import {
  PERSISTENT_COLLECTIONS,
  PERSISTENT_OBJECTS,
  pickPersistentState,
} from '../../src/state/state-boundaries.js';
import {
  validateBackupData,
  validateNormalizedBackup,
} from '../../src/storage/backup-validator.js';
import { parseBackupText, serializeBackup } from '../../src/storage/backup-service.js';

const SCALAR_PERSISTENT_KEYS = [
  'schemaVersion',
  'executionMode',
  'examDate',
  'lastBackupAt',
  'updatedAt',
];

/** @returns {import('../../src/core/types.js').ErrorFlashcard} */
function card(overrides = {}) {
  return {
    id: 'efc_1',
    topicId: 'top-1',
    subjectId: 'sub-1',
    questionId: null,
    statementSummary: 'Prazo de prescrição',
    bancaTrap: 'Troca "ou" por "e"',
    correctConcept: 'A regra exige apenas uma das condições',
    errorCategory: 'Interpretação',
    status: 'reviewing',
    reviewCount: 2,
    consecutiveSuccesses: 1,
    lastReviewedAt: '2026-10-20T12:00:00.000Z',
    nextReviewDate: '2026-10-24',
    intervalDays: 4,
    easeFactor: 2.35,
    createdAt: '2026-10-10T12:00:00.000Z',
    ...overrides,
  };
}

function payload(errorFlashcards) {
  const base = {
    schemaVersion: 28,
    subjects: [
      {
        id: 'sub-1',
        name: 'Direito',
        topics: [
          {
            id: 'top-1',
            name: 'Atos',
            status: 'Não iniciado',
            difficulty: 'Médio',
            tags: [],
            examImportance: 0.8,
            estimatedStudyMinutes: 60,
            prerequisites: [],
          },
        ],
      },
    ],
    metas: { horasPorDia: { 0: 2 } },
    activeTimer: { accumulatedSeconds: 0 },
    examBlueprint: { examDate: null, targetScore: 80, subjects: [] },
    algorithmVersions: { recommendations: 1 },
  };
  for (const key of PERSISTENT_COLLECTIONS) {
    if (key !== 'subjects' && key !== 'errorFlashcards') base[key] = [];
  }
  if (errorFlashcards !== undefined) base.errorFlashcards = errorFlashcards;
  return base;
}

const noop = { ensureDefaults: () => {}, migrateState: candidate => candidate };

test('contrato: todo campo do estado inicial é persistido ou declarado transitório', () => {
  const persisted = new Set([
    ...PERSISTENT_COLLECTIONS,
    ...PERSISTENT_OBJECTS,
    ...SCALAR_PERSISTENT_KEYS,
  ]);
  const missing = Object.keys(createDefaultState()).filter(key => !persisted.has(key));
  assert.deepEqual(
    missing,
    [],
    `Campos do estado inicial que seriam perdidos ao salvar: ${missing}`
  );
});

test('pickPersistentState preserva os flashcards de erro e o JSON volta idêntico', () => {
  const cards = [card(), card({ id: 'efc_2', status: 'mastered', nextReviewDate: null })];
  const persisted = pickPersistentState({ ...createDefaultState(), errorFlashcards: cards });
  assert.deepEqual(JSON.parse(JSON.stringify(persisted)).errorFlashcards, cards);
});

test('backup exportado e restaurado preserva datas, fator de facilidade e status dos cartões', () => {
  const cards = [card(), card({ id: 'efc_2', status: 'mastered', nextReviewDate: null })];
  const text = serializeBackup(payload(cards));
  const parsed = parseBackupText(text);
  assert.equal(parsed.valid, true);
  if (!parsed.valid) return;
  const result = validateBackupData(parsed.data, noop);
  assert.equal(result.valid, true);
  if (!result.valid) return;
  assert.deepEqual(result.normalized.errorFlashcards, cards);
});

test('backup antigo sem errorFlashcards continua válido', () => {
  const result = validateBackupData(payload(undefined), noop);
  assert.equal(result.valid, true);
});

test('backup com errorFlashcards fora do formato de lista é rejeitado', () => {
  const result = validateBackupData(payload({ id: 'efc_1' }), noop);
  assert.equal(result.valid, false);
  if (!result.valid) {
    assert.match(result.message, /errorFlashcards/);
  }
});

test('cartão órfão (disciplina ou tópico removidos) é preservado, não rejeitado', () => {
  const orphan = card({ id: 'efc_orfao', topicId: 'top-removido', subjectId: 'sub-removida' });
  assert.equal(validateNormalizedBackup(payload([orphan])).valid, true);
});

/** @type {Array<[string, Partial<import('../../src/core/types.js').ErrorFlashcard>, RegExp]>} */
const invalidCases = [
  ['status desconhecido', /** @type {any} */ ({ status: 'done' }), /status/],
  ['identificador inseguro', { id: '../x' }, /identificador/],
  ['easeFactor não finito', { easeFactor: Infinity }, /fator/],
  ['easeFactor menor que o mínimo', { easeFactor: 0 }, /fator/],
  ['intervalo negativo', { intervalDays: -1 }, /intervalo/],
  ['contagem fracionária', { reviewCount: 1.5 }, /contagem/],
  ['data de revisão inválida', { nextReviewDate: '2026-13-40' }, /data/],
  ['criação sem timestamp', { createdAt: 'ontem' }, /criação/],
  ['texto obrigatório vazio', { correctConcept: '' }, /conceito|texto/],
];

for (const [nome, override, trecho] of invalidCases) {
  test(`cartão inválido é rejeitado: ${nome}`, () => {
    const result = validateNormalizedBackup(payload([card(override)]));
    assert.equal(result.valid, false);
    if (!result.valid) {
      assert.match(result.message, trecho);
    }
  });
}

test('cartões com identificador duplicado são rejeitados', () => {
  const result = validateNormalizedBackup(payload([card(), card()]));
  assert.equal(result.valid, false);
  if (!result.valid) {
    assert.match(result.message, /efc_1/);
  }
});
