import test from 'node:test';
import assert from 'node:assert/strict';
import { createStateMigrator } from '../../src/state/migrations.js';
import { CURRENT_SCHEMA_VERSION } from '../../src/state/schema.js';
import { createDefaultState } from '../../src/state/defaults.js';
import { ensureStateDefaultsWithDeps } from '../../src/state/ensure-state-defaults.js';
import { validateBackupData } from '../../src/storage/backup-validator.js';
import { normalizeExamBlueprint } from '../../src/state/strategic.js';
import { createGoalService } from '../../src/application/goals/goal-service.js';

const { migrateState } = createStateMigrator({
  nowISO: () => '2026-11-25T10:00:00.000Z',
  todayISO: () => '2026-11-25',
  toLocalDate: value => String(value).slice(0, 10),
  errorCategoryKeys: ['naoSabia', 'chute', 'letraLei', 'jurisprudencia'],
});

test('migração v1 e v35 para v36 preserva snapshots congelados e inicializa novos campos', () => {
  const frozenReadiness = [
    {
      id: 'rs-1',
      date: '2026-10-01',
      score: 64,
      confidence: 0.7,
      factors: { coverage: 60 },
      algorithmVersion: 1,
      activeExamTags: [],
    },
  ];
  const v35 = {
    schemaVersion: 35,
    subjects: [{ id: 's1', name: 'Direito Constitucional', topics: [] }],
    metas: { horasDiarias: 3 },
    readinessSnapshots: structuredClone(frozenReadiness),
    weeklyCloseSnapshots: [{ id: 'wc-1', weekStart: '2026-10-01', adherencePct: 82 }],
  };

  const migrated = migrateState(v35);
  assert.equal(migrated.schemaVersion, CURRENT_SCHEMA_VERSION);
  assert.equal(CURRENT_SCHEMA_VERSION, 36);
  assert.deepEqual(migrated.jurisprudenceNotebook, []);
  assert.equal(migrated.metas.orcamentoRevisaoPct, null);
  assert.deepEqual(migrated.readinessSnapshots, frozenReadiness);
  assert.deepEqual(migrated.weeklyCloseSnapshots, [{ id: 'wc-1', weekStart: '2026-10-01', adherencePct: 82 }]);

  const v1 = migrateState({
    subjects: [{ name: 'Português', topics: [{ name: 'Crase' }] }],
  });
  assert.equal(v1.schemaVersion, 36);
  assert.deepEqual(v1.jurisprudenceNotebook, []);
  assert.equal(v1.metas.orcamentoRevisaoPct, null);
});

test('normalizeExamBlueprint preserva blocos eliminatórios, blockId e overheadMinutes', () => {
  const bp = normalizeExamBlueprint({
    durationMinutes: 300,
    overheadMinutes: 60,
    blocks: [
      { id: 'b1', name: 'P1 — Básicos', minScore: 40 },
      { id: 'b2', name: 'P2 — Específicos', minScore: 60 },
    ],
    subjects: [
      { subjectId: 's1', expectedQuestions: 30, questionWeight: 1, blockId: 'b1' },
      { subjectId: 's2', expectedQuestions: 50, questionWeight: 2, blockId: 'b2' },
    ],
  });
  assert.equal(bp.overheadMinutes, 60);
  assert.equal(bp.blocks?.length, 2);
  assert.equal(bp.subjects[0].blockId, 'b1');
  assert.equal(bp.subjects[1].blockId, 'b2');
});

test('backup-validator aceita estado v36 completo e rejeita orçamento ou jurisprudência inválidos', () => {
  const state = createDefaultState();
  state.subjects = [
    {
      id: 'sub-1',
      name: 'Administrativo',
      collapsed: true,
      archived: false,
      archivedAt: null,
      createdAt: '2026-11-25T10:00:00.000Z',
      topics: [],
    },
  ];
  state.metas.orcamentoRevisaoPct = 25;
  state.examBlueprint.overheadMinutes = 45;
  state.examBlueprint.blocks = [{ id: 'blk-1', name: 'Básicos', minScore: 40 }];
  state.lawNotebook = [
    {
      id: 'law-1',
      name: 'CF/88',
      subjectId: 'sub-1',
      totalArticles: 250,
      currentArticle: 39,
      laps: 0,
      lastReadAt: '2026-11-20',
      lapCompletedAt: null,
      createdAt: '2026-11-01T10:00:00.000Z',
      startArticle: 37,
      endArticle: 41,
      hotArticles: 'Arts. 37 §6º, 41',
    },
  ];
  state.jurisprudenceNotebook = [
    {
      id: 'jur-1',
      kind: 'informativo_stf',
      code: 'Info 1152 STF',
      title: 'Responsabilidade civil do Estado',
      thesisSummary: 'Tese fixada em repercussão geral.',
      subjectId: 'sub-1',
      topicId: null,
      laps: 1,
      lastReadAt: '2026-11-20',
      nextReviewDate: '2026-11-27',
      createdAt: '2026-11-20T10:00:00.000Z',
    },
  ];
  assert.equal(validateBackupData(state).valid, true);

  const badBudget = structuredClone(state);
  badBudget.metas.orcamentoRevisaoPct = 95;
  assert.equal(validateBackupData(badBudget).valid, false);

  const badJuris = structuredClone(state);
  /** @type {any} */ (badJuris.jurisprudenceNotebook[0]).kind = 'desconhecido';
  assert.equal(validateBackupData(badJuris).valid, false);
});

test('ensureStateDefaults e goalService mantêm orcamentoRevisaoPct nulo ou entre 10 e 60', () => {
  /** @type {any} */
  let state = { metas: { orcamentoRevisaoPct: 80 } };
  ensureStateDefaultsWithDeps({
    getState: () => state,
    setState: next => {
      state = next;
    },
    nowISO: () => '2026-11-25T10:00:00.000Z',
    todayISO: () => '2026-11-25',
    normalizeHistoryEvent: () => {},
    normalizeErrorBreakdown: () => {},
    refreshAllTopicReviewStats: () => {},
  });
  assert.equal(state.metas.orcamentoRevisaoPct, null);

  const repo = {
    goals: state.metas,
    getGoals: () => repo.goals,
    updateDailyHours: () => {},
    updateGoal: (k, v) => {
      repo.goals[k] = v;
    },
  };
  const service = createGoalService({ repository: repo, getDayOfWeek: () => 1 });
  assert.equal(service.update('orcamentoRevisaoPct', 25), true);
  assert.equal(repo.goals.orcamentoRevisaoPct, 25);
  assert.equal(service.update('orcamentoRevisaoPct', 5), false);
  assert.equal(service.update('orcamentoRevisaoPct', null), true);
  assert.equal(repo.goals.orcamentoRevisaoPct, null);
});
