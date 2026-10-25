import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateBackupData,
  validateNormalizedBackup,
  backupSummary,
} from '../../src/storage/backup-validator.js';

test('validateBackupData — rejeita payload inválido ou sem campos base', () => {
  assert.equal(validateBackupData(null).valid, false);
  assert.equal(validateBackupData('invalid string').valid, false);
  assert.equal(validateBackupData([]).valid, false);
  assert.equal(validateBackupData({}).valid, false); // Falta subjects
});

test('validateBackupData — rejeita meta de aderência fora do limite', () => {
  const result = validateBackupData({
    schemaVersion: 28,
    subjects: [],
    metas: { aderenciaSemanal: 40 },
  });
  assert.equal(result.valid, false);
  assert.match(result.message, /aderência/);
});

test('validateBackupData — aceita payload estruturado e chama ensureDefaults e migrateState', () => {
  let defaulted = false;
  let migrated = false;

  const validPayload = {
    schemaVersion: 28,
    subjects: [
      {
        id: 'sub-1',
        name: 'Direito Administrativo',
        topics: [
          {
            id: 'top-1',
            name: 'Atos Administrativos',
            status: 'Não iniciado',
            difficulty: 'Médio',
            tags: [],
            examImportance: 0.8,
            estimatedStudyMinutes: 120,
            prerequisites: [],
          },
        ],
      },
    ],
    calendar: [],
    reviewAgenda: [],
    questoes: [],
    simulados: [],
    exams: [],
    examQuestions: [],
    progressHistory: [],
    readinessSnapshots: [],
    projectionSnapshots: [],
    studySessions: [],
    dailyPlans: [],
    studyPlans: [],
    planAdjustments: [],
    adaptivePlanningHistory: [],
    recommendationFeedback: [],
    recommendationHistory: [],
    weeklyCloseSnapshots: [],
    planningCapacityHistory: [],
    alertStates: [],
    topicHistory: [],
    metasPorDisciplina: [],
    metas: {
      horasPorDia: { 0: 2, 1: 2, 2: 2, 3: 2, 4: 2, 5: 2, 6: 2 },
    },
    activeTimer: { accumulatedSeconds: 0 },
    examBlueprint: { examDate: null, targetScore: 80, subjects: [] },
    algorithmVersions: { recommendations: 1 },
  };

  const result = validateBackupData(validPayload, {
    ensureDefaults: candidate => {
      defaulted = true;
    },
    migrateState: candidate => {
      migrated = true;
      return candidate;
    },
  });

  assert.equal(result.valid, true);
  assert.equal(defaulted, true);
  assert.equal(migrated, true);
  if (result.valid) {
    assert.equal(result.version, 28);
    assert.equal(result.normalized.subjects.length, 1);
  }
});

test('validateNormalizedBackup — detecta pré-requisito circular ou inexistente', () => {
  const invalidPayload = {
    subjects: [
      {
        id: 'sub-1',
        name: 'Matemática',
        topics: [
          {
            id: 'top-1',
            name: 'Álgebra',
            status: 'Não iniciado',
            difficulty: 'Fácil',
            tags: [],
            examImportance: 1,
            estimatedStudyMinutes: 60,
            prerequisites: ['top-1'], // circular direto
          },
        ],
      },
    ],
    calendar: [],
    reviewAgenda: [],
    questoes: [],
    simulados: [],
    exams: [],
    examQuestions: [],
    progressHistory: [],
    readinessSnapshots: [],
    projectionSnapshots: [],
    studySessions: [],
    dailyPlans: [],
    studyPlans: [],
    planAdjustments: [],
    adaptivePlanningHistory: [],
    recommendationFeedback: [],
    recommendationHistory: [],
    weeklyCloseSnapshots: [],
    planningCapacityHistory: [],
    alertStates: [],
    topicHistory: [],
    metasPorDisciplina: [],
    metas: { horasPorDia: {} },
    activeTimer: { accumulatedSeconds: 0 },
    examBlueprint: { examDate: null, targetScore: 70, subjects: [] },
    algorithmVersions: { rec: 1 },
  };

  const validation = validateNormalizedBackup(invalidPayload);
  assert.equal(validation.valid, false);
  assert.match(validation.message, /circular direto/);
});

test('backupSummary — formata resumo descritivo do backup', () => {
  assert.equal(backupSummary(null, 1), '');
  assert.equal(backupSummary({}, 1), '');

  const data = {
    subjects: [
      { id: 's1', topics: [{ id: 't1' }, { id: 't2' }] },
      { id: 's2', topics: [{ id: 't3' }] },
    ],
    studySessions: [{ id: 'ses-1' }, { id: 'ses-2' }],
    questoes: [{ id: 'q-1' }],
    updatedAt: '2026-10-25T10:30:00.000Z',
  };

  const summary = backupSummary(data, 28);
  assert.ok(
    summary.includes('Backup v28: 2 disciplinas, 3 tópicos, 2 sessões e 1 registro de questões.')
  );
  assert.ok(summary.includes('Última atualização:'));
});
