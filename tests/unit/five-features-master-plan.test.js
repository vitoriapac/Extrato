import test from 'node:test';
import assert from 'node:assert/strict';
import { h } from 'preact';
import { render } from 'preact-render-to-string';
import { createDefaultState } from '../../src/state/defaults.js';
import { pickPersistentState } from '../../src/state/state-boundaries.js';
import { validateBackupData } from '../../src/storage/backup-validator.js';
import { normalizeStudySession } from '../../src/domain/sessions/study-session.js';
import { createSessionService } from '../../src/application/sessions/session-service.js';
import { createCollectionRepository } from '../../src/repositories/collection-repository.js';
import { createPlanningRepository } from '../../src/repositories/planning-repository.js';
import { createSessionsRepository } from '../../src/repositories/sessions-repository.js';
import {
  applyStudyCycleVersion,
  buildStudyCyclePreview,
  buildStudyCycleQueue,
  computeStudyCycleLapSummary,
  explainCycleVsPriority,
  getCurrentCycleBlock,
  recordStudyCycleBlockExecution,
  reorderStudyCycleBlocks,
  setStudyCycleStatus,
  skipStudyCycleBlock,
  validateStudyCycleBlocks,
} from '../../src/domain/planning/study-cycle-engine.js';
import { buildQuickStudyProposal } from '../../src/domain/quick-study/quick-study-engine.js';
import {
  buildJournalReviewProposal,
  deleteLearningJournalEntry,
  filterLearningJournalEntries,
  sanitizeJournalText,
  upsertLearningJournalEntry,
} from '../../src/domain/journal/learning-journal-engine.js';
import {
  buildWeeklyClosingRitualViewModel,
  finalizeWeeklyClosingIdempotent,
  resolveCivilWeekWindow,
} from '../../src/application/weekly-closing/weekly-closing-ritual.js';
import {
  buildStudyCopilotViewModel,
  buildStudyCycleCopilotHint,
  revalidateCopilotAction,
} from '../../src/application/copilot/study-copilot-service.js';
import { buildSessionResultViewModel } from '../../src/application/sessions/build-session-result-view-model.js';
import { renderSessionResult } from '../../src/ui/renderers/session-result-renderer.js';
import { TodayStudyAssistantBar } from '../../src/ui/components/TodayStudyAssistantBar.js';
import { OverviewCopilotCard } from '../../src/ui/components/OverviewCopilotCard.js';
import { StudyCycleCenterCard } from '../../src/ui/components/StudyCycleCenterCard.js';
import { TodayJournalSidebarCard } from '../../src/ui/components/TodayJournalSidebarCard.js';
import { SEARCH_COMMANDS } from '../../src/ui/controllers/search-controller.js';

const SUBJECTS = [
  {
    id: 's1',
    name: 'Português',
    collapsed: false,
    archived: false,
    archivedAt: null,
    createdAt: '2026-10-01T12:00:00.000Z',
    topics: [{ id: 't1', name: 'Crase', status: /** @type {const} */ ('Em andamento'), archived: false, prerequisites: [] }],
  },
  {
    id: 's2',
    name: 'Direito Administrativo',
    collapsed: false,
    archived: false,
    archivedAt: null,
    createdAt: '2026-10-01T12:00:00.000Z',
    topics: [{ id: 't2', name: 'Atos', status: /** @type {const} */ ('Em andamento'), archived: false, prerequisites: [] }],
  },
];

const SAMPLE_CANDIDATES = [
  {
    id: 't1',
    recommendationId: 'rec_1',
    subjectId: 's1',
    subjectName: 'Português',
    topicId: 't1',
    topicName: 'Crase',
    studyType: 'questions',
    score: 88,
    mastery: 52,
    retention: 60,
    estimatedMinutes: 30,
    reasons: ['Alto peso no edital e lacuna de domínio'],
    blockedPrerequisites: [],
    archived: false,
    covered: false,
    evidence: { evidenceStrength: 0.7, completeness: 0.8, evidenceLabel: 'Evidência moderada' },
  },
  {
    id: 't2',
    recommendationId: 'rec_2',
    subjectId: 's2',
    subjectName: 'Direito Administrativo',
    topicId: 't2',
    topicName: 'Atos',
    studyType: 'review',
    score: 79,
    mastery: 74,
    retention: 48,
    reviewUrgency: 75,
    estimatedMinutes: 25,
    reasons: ['Revisão vencida com risco de esquecimento'],
    blockedPrerequisites: [],
    archived: false,
    covered: false,
    evidence: { evidenceStrength: 0.6, completeness: 0.7, evidenceLabel: 'Evidência moderada' },
  },
];

// --- PR-01: Sessão canônica idempotente e persistência ---

test('PR-01: uma sessão = um registro e um crédito mesmo com chamadas repetidas do mesmo sessionId', () => {
  const state = createDefaultState();
  state.subjects = structuredClone(SUBJECTS);
  const service = createSessionService({
    repository: createSessionsRepository({ getState: () => state }),
    questionsRepository: createCollectionRepository({ getState: () => state, field: 'questoes' }),
    historyRepository: createCollectionRepository({ getState: () => state, field: 'topicHistory' }),
    planningRepository: createPlanningRepository({ getState: () => state }),
    recommendationsRepository: createCollectionRepository({
      getState: () => state,
      field: 'recommendationFeedback',
    }),
    clock: { today: () => '2026-11-16', nowISO: () => '2026-11-16T15:00:00.000Z' },
    idGenerator: prefix => `${prefix}_auto_1`,
  });

  const payload = {
    id: 'ses_fixed_1',
    date: '2026-11-16',
    subjectId: 's1',
    topicId: 't1',
    durationSeconds: 1800,
    type: 'questions',
    origin: /** @type {const} */ ('quick'),
    questionsResolved: 10,
    correctAnswers: 8,
  };

  const first = service.complete(payload);
  const second = service.complete(payload);
  assert.equal(first.id, 'ses_fixed_1');
  assert.equal(second.id, 'ses_fixed_1');
  assert.equal(state.studySessions.length, 1);
  assert.equal(state.questoes.length, 1);
  assert.equal(state.topicHistory.length, 1);
  assert.equal(normalizeStudySession({ origin: 'copilot' }).origin, 'copilot');
});

test('PR-01 & DIA-06: backup e pickPersistentState preservam learningJournal e studyCycle com compatibilidade legada', () => {
  const state = createDefaultState();
  state.subjects = [
    {
      id: 'sub-1',
      name: 'Português',
      collapsed: false,
      archived: false,
      archivedAt: null,
      createdAt: '2026-10-01T12:00:00.000Z',
      topics: [
        {
          id: 'top-1',
          name: 'Crase',
          status: 'Em andamento',
          difficulty: 'Médio',
          tags: [],
          examImportance: 0.8,
          estimatedStudyMinutes: 60,
          prerequisites: [],
        },
      ],
    },
  ];
  state.studyCycle = buildStudyCycleQueue({
    subjects: [{ id: 'sub-1', name: 'Português' }],
    blockDurationMinutes: 45,
    nowISO: '2026-11-16T12:00:00.000Z',
  });
  state.learningJournal = [
    {
      id: 'j_1',
      examId: null,
      sessionId: 'ses_1',
      subjectId: 'sub-1',
      subjectNameSnapshot: 'Português',
      topicId: 'top-1',
      topicNameSnapshot: 'Crase',
      localDate: '2026-11-16',
      difficultyRating: 'medium',
      energyRating: 'high',
      tags: ['duvida', 'pegadinha'],
      note: 'Atenção à crase facultativa.',
      nextStep: 'Fazer 10 questões',
      createdAt: '2026-11-16T12:00:00.000Z',
      updatedAt: '2026-11-16T12:00:00.000Z',
    },
  ];

  const persisted = pickPersistentState(state);
  const validation = validateBackupData(persisted, {
    ensureDefaults: () => {},
    migrateState: candidate => candidate,
  });
  assert.equal(validation.valid, true);
  if (validation.valid) {
    assert.equal(validation.normalized.learningJournal.length, 1);
    assert.equal(validation.normalized.studyCycle.blocks[0].durationMinutes, 45);
  }
});

// --- Funcionalidade A: Ciclo de Estudos 2.0 (CIC-01..10) ---

test('CIC-01..03: validação 15-120 min, modos manual/balanced/adaptive, reordenação e versionamento preservando histórico', () => {
  const bad = validateStudyCycleBlocks(
    [{ id: 'b1', subjectId: 's1', subjectName: 'Português', durationMinutes: 10 }],
    ['s1']
  );
  assert.equal(bad.valid, false);
  assert.match(bad.errors[0], /15 e 120/);

  const archived = validateStudyCycleBlocks(
    [{ id: 'b2', subjectId: 'old', subjectName: 'Antiga', durationMinutes: 30 }],
    ['s1']
  );
  assert.equal(archived.valid, false);

  const preview = buildStudyCyclePreview({
    mode: 'balanced',
    subjects: SUBJECTS,
    blockDurationMinutes: 45,
    nowISO: '2026-11-16T10:00:00.000Z',
  });
  assert.equal(preview.valid, true);
  assert.equal(preview.blocksCount, 2);

  const reordered = reorderStudyCycleBlocks(preview.cycle, 0, 1, '2026-11-16T10:05:00.000Z');
  assert.equal(reordered.blocks[0].subjectId, 's2');
  assert.equal(reordered.blocks[0].order, 1);

  const withHistory = { ...preview.cycle, completedCyclesCount: 2, version: 1 };
  const v2 = applyStudyCycleVersion(withHistory, reordered, '2026-11-16T10:10:00.000Z');
  assert.equal(v2.version, 2);
  assert.equal(v2.completedCyclesCount, 2);
});

test('CIC-04..09: execução parcial mantém saldo, conclusão avança 1x com idempotência por sessionId, pulo distingue cobertura e explica divergência', () => {
  let cycle = buildStudyCycleQueue({
    subjects: SUBJECTS,
    blockDurationMinutes: 60,
    nowISO: '2026-11-16T08:00:00.000Z',
  });

  // Pausa bloqueia avanço sem criar atrasos
  cycle = setStudyCycleStatus(cycle, 'paused', '2026-11-16T08:30:00.000Z');
  const pausedAttempt = recordStudyCycleBlockExecution(cycle, {
    sessionId: 'ses_paused',
    actualMinutes: 60,
    nowISO: '2026-11-16T09:00:00.000Z',
  });
  assert.equal(pausedAttempt.status, 'paused');
  assert.equal(pausedAttempt.advanced, false);

  cycle = setStudyCycleStatus(cycle, 'active', '2026-11-16T09:05:00.000Z');

  // Execução parcial: 25 min de 60 -> mantém bloco atual com saldo de 35 min
  const partial = recordStudyCycleBlockExecution(cycle, {
    sessionId: 'ses_part_1',
    actualMinutes: 25,
    nowISO: '2026-11-16T09:30:00.000Z',
  });
  cycle = partial.cycle;
  assert.equal(partial.status, 'partial');
  assert.equal(partial.advanced, false);
  assert.equal(getCurrentCycleBlock(cycle)?.remainingMinutes, 35);

  // Mesmo sessionId não contabiliza duas vezes (CIC-08)
  const dup = recordStudyCycleBlockExecution(cycle, {
    sessionId: 'ses_part_1',
    actualMinutes: 40,
    nowISO: '2026-11-16T09:31:00.000Z',
  });
  assert.equal(dup.duplicate, true);
  assert.equal(dup.advanced, false);

  // Completa os 35 min restantes -> avança ponteiro
  const finish = recordStudyCycleBlockExecution(cycle, {
    sessionId: 'ses_part_2',
    actualMinutes: 35,
    nowISO: '2026-11-16T10:15:00.000Z',
  });
  cycle = finish.cycle;
  assert.equal(finish.status, 'completed');
  assert.equal(finish.advanced, true);
  assert.equal(getCurrentCycleBlock(cycle)?.subjectId, 's2');

  // Pula segundo bloco com motivo -> fecha volta distinguindo 1 concluído de 1 pulado (CIC-06, CIC-07)
  const skip = skipStudyCycleBlock(cycle, {
    reason: 'Sem material agora',
    nowISO: '2026-11-16T11:00:00.000Z',
  });
  cycle = skip.cycle;
  assert.equal(skip.completedLap, true);
  const lap1 = computeStudyCycleLapSummary(cycle, 1);
  assert.equal(lap1.completedBlocks, 1);
  assert.equal(lap1.skippedBlocks, 1);
  assert.equal(lap1.executedCoveragePct, 50);

  // CIC-09: ciclo s1 vs prioridade urgente em s2 explica sem substituir silenciosamente
  const diff = explainCycleVsPriority(cycle, SAMPLE_CANDIDATES[1]);
  assert.equal(diff.diverges, true);
  assert.equal(diff.urgentReview, true);
  assert.match(diff.explanation, /Nada é trocado automaticamente/i);
});

// --- Funcionalidade B: Modo Estudo Rápido (RAP-01..07) ---

test('RAP-01..07: propõe atividade <= duração, unifica resgate de 15 min, preserva ciclo e identifica estudo livre sem mutação', () => {
  const snapshot = JSON.stringify(SAMPLE_CANDIDATES);
  const proposal30 = buildQuickStudyProposal({
    durationMinutes: 30,
    focusMode: 'priority',
    candidates: SAMPLE_CANDIDATES,
    subjects: SUBJECTS,
  });
  assert.equal(proposal30.plannedMinutes, 30);
  assert.ok(proposal30.action);
  assert.equal(proposal30.action?.topicId, 't1');
  if (proposal30.strategy) {
    const sumSteps = proposal30.strategy.steps.reduce((acc, s) => acc + s.minutes, 0);
    assert.ok(sumSteps <= 30);
  }
  assert.equal(JSON.stringify(SAMPLE_CANDIDATES), snapshot);

  // Aquecimento de 15 min com revisão vencida usa motor de resgate
  const proposal15Review = buildQuickStudyProposal({
    durationMinutes: 15,
    focusMode: 'priority',
    candidates: SAMPLE_CANDIDATES,
    subjects: SUBJECTS,
    overdueReviews: [
      {
        id: 'rev_1',
        origin: 'Agenda',
        date: '2026-11-10',
        subjectId: 's2',
        subjectName: 'Direito Administrativo',
        topicId: 't2',
        topicName: 'Atos',
        daysOverdue: 6,
      },
    ],
  });
  assert.equal(proposal15Review.kind, 'recovery_review');
  assert.equal(proposal15Review.activityType, 'review');

  // Sem candidato elegível oferece estudo livre claramente identificado (RAP-05)
  const free = buildQuickStudyProposal({
    durationMinutes: 20,
    focusMode: 'priority',
    candidates: [],
    subjects: [],
  });
  assert.equal(free.kind, 'free_study');
  assert.equal(free.action, null);
  assert.match(free.reasoning, /estudo livre/i);
});

// --- Funcionalidade C: Diário de Aprendizagem (DIA-01..08) ---

test('DIA-01..08: sanitiza HTML, mantém 1 entrada por sessão, preserva snapshots ao excluir matéria e gera proposta opcional de revisão', () => {
  const sanitized = sanitizeJournalText('<script>alert(1)</script><b>Regra</b> da crase.\u0007');
  assert.equal(sanitized, 'Regra da crase.');

  const clockOpts = {
    nowISO: () => '2026-11-16T14:00:00.000Z',
    todayISO: () => '2026-11-16',
    idGenerator: p => `${p}_1`,
  };

  let entries = [];
  const createRes = upsertLearningJournalEntry(
    entries,
    {
      sessionId: 'ses_abc',
      subjectId: 's1',
      subjectNameSnapshot: 'Português',
      topicId: 't1',
      topicNameSnapshot: 'Crase',
      tags: ['duvida', 'pegadinha'],
      note: 'Dúvida antes de verbo',
    },
    clockOpts
  );
  entries = createRes.entries;
  assert.equal(entries.length, 1);

  // Atualizar a mesma sessão edita a entrada existente (DIA-08)
  const updateRes = upsertLearningJournalEntry(
    entries,
    {
      sessionId: 'ses_abc',
      note: 'Dúvida resolvida antes de pronome.',
      tags: ['duvida', 'revisar'],
    },
    clockOpts
  );
  entries = updateRes.entries;
  assert.equal(updateRes.updated, true);
  assert.equal(entries.length, 1);
  assert.equal(entries[0].subjectNameSnapshot, 'Português');

  // Filtro por tag e busca textual (DIA-05)
  assert.equal(filterLearningJournalEntries(entries, { tag: 'revisar', query: 'pronome' }).length, 1);
  assert.equal(filterLearningJournalEntries(entries, { tag: 'entendi' }).length, 0);

  // Proposta de revisão requer confirmação (DIA-07)
  const reviewProposal = buildJournalReviewProposal(entries[0], {
    todayISO: () => '2026-11-16',
    addDays: (iso, d) => (iso === '2026-11-16' && d === 1 ? '2026-11-17' : iso),
  });
  assert.equal(reviewProposal?.requiresConfirmation, true);
  assert.equal(reviewProposal?.scheduledDate, '2026-11-17');

  entries = deleteLearningJournalEntry(entries, entries[0].id);
  assert.equal(entries.length, 0);
});

// --- Funcionalidade D: Fechamento Semanal Inteligente (SEM-01..09) ---

test('SEM-01..09: separa janela parcial de fechamento concluído, bloqueia comparação desigual e finaliza de modo idempotente', () => {
  // Segunda-feira 2026-11-16 -> janela 16/11..22/11 é parcial
  const partialWin = resolveCivilWeekWindow('2026-11-16');
  assert.equal(partialWin.weekStartLocal, '2026-11-16');
  assert.equal(partialWin.weekEndLocal, '2026-11-22');
  assert.equal(partialWin.isPartialCurrentWeek, true);

  // Semana anterior 09/11..15/11 já está encerrada
  const closedModel = buildWeeklyClosingRitualViewModel({
    today: '2026-11-16',
    referenceDate: '2026-11-12',
    sessions: [
      { id: 's1', date: '2026-11-10', durationSeconds: 3600, subjectId: 's1' },
      { id: 's0', date: '2026-11-04', durationSeconds: 2400, subjectId: 's1' },
    ],
    questions: [{ id: 'q1', date: '2026-11-10', resolved: 35, correct: 28, subjectId: 's1' }],
    dailyPlans: [{ date: '2026-11-10', items: [{ id: 'p1', plannedMinutes: 60, status: 'completed' }] }],
    subjects: SUBJECTS,
    weeklyCloseSnapshots: [],
  });

  assert.equal(closedModel.isPartialCurrentWeek, false);
  assert.equal(closedModel.comparableWithPrevious, true);
  assert.ok(closedModel.whatWorked.length <= 2);
  assert.ok(closedModel.needsAttention.length <= 2);

  const partialModel = buildWeeklyClosingRitualViewModel({
    today: '2026-11-16',
    sessions: [{ id: 's2', date: '2026-11-16', durationSeconds: 1800, subjectId: 's1' }],
    subjects: SUBJECTS,
    weeklyCloseSnapshots: [],
  });
  assert.equal(partialModel.isPartialCurrentWeek, true);
  assert.equal(partialModel.comparableWithPrevious, false);
  assert.match(partialModel.comparisonWarning || '', /em andamento/i);

  const snapshots = [];
  const firstClose = finalizeWeeklyClosingIdempotent(snapshots, closedModel, {
    nowISO: () => '2026-11-16T12:00:00.000Z',
    idGenerator: p => `${p}_1`,
  });
  const secondClose = finalizeWeeklyClosingIdempotent(snapshots, closedModel, {
    nowISO: () => '2026-11-16T12:05:00.000Z',
    idGenerator: p => `${p}_2`,
  });
  assert.equal(firstClose.status, 'finalized');
  assert.equal(secondClose.status, 'already_finalized');
  assert.equal(snapshots.length, 1);
});

// --- Funcionalidade E: Copiloto de Estudos (COP-01..10) ---

test('COP-01..10: mantém coerência com Hoje, não muta dados em leitura e revalida ação ao clicar', () => {
  const recs = [SAMPLE_CANDIDATES[0]];
  const vm = buildStudyCopilotViewModel({
    today: '2026-11-16',
    nowISO: '2026-11-16T16:00:00.000Z',
    recommendations: recs,
    candidates: SAMPLE_CANDIDATES,
    subjects: SUBJECTS,
    sessions: [{ id: 's1', date: '2026-11-15', durationSeconds: 1800, subjectId: 's1' }],
    questions: [{ id: 'q1', date: '2026-11-15', resolved: 30, correct: 22 }],
  });

  assert.equal(vm.recommendationId, 'rec_1');
  assert.equal(vm.mutatedState, false);
  assert.equal(vm.questionsList.length, 7);
  assert.match(vm.answers.why_this.evidenceSummary || '', /domínio 52\/100/);

  const validClick = revalidateCopilotAction(vm.action, {
    candidates: SAMPLE_CANDIDATES,
    recommendations: recs,
    subjects: SUBJECTS,
  });
  assert.equal(validClick.valid, true);
  assert.equal(validClick.changed, false);

  // Tópico arquivado é bloqueado na revalidação (COP-10)
  const archivedCheck = revalidateCopilotAction(vm.action, {
    candidates: SAMPLE_CANDIDATES,
    recommendations: recs,
    subjects: [{ id: 's1', name: 'Português', archived: true, topics: [] }],
  });
  assert.equal(archivedCheck.valid, false);
});

// --- UI declarativa: Resultado pós-sessão + Barra auxiliar em Hoje sem emojis ---

test('UI: renderSessionResult oferece prompt opcional só com sessionId e TodayStudyAssistantBar não contém emojis', () => {
  const withoutId = buildSessionResultViewModel(
    { subjectId: 's1', topicId: 't1', type: 'study', durationSeconds: 1800, questionsResolved: 0, correctAnswers: 0 },
    null,
    false,
    { subjectName: () => 'Português', topicName: () => 'Crase', formatMinutes: v => `${v} min` }
  );
  assert.doesNotMatch(renderSessionResult(withoutId, { escapeHtml: String }), /openSessionJournalEntry/);

  const withId = buildSessionResultViewModel(
    { id: 'ses_99', subjectId: 's1', topicId: 't1', type: 'study', durationSeconds: 1800, questionsResolved: 0, correctAnswers: 0 },
    null,
    false,
    { subjectName: () => 'Português', topicName: () => 'Crase', formatMinutes: v => `${v} min` }
  );
  assert.match(
    renderSessionResult(withId, { escapeHtml: String }),
    /openSessionJournalEntry\('ses_99'\)/
  );

  const quick = buildQuickStudyProposal({ durationMinutes: 30, candidates: SAMPLE_CANDIDATES, subjects: SUBJECTS });
  const copilot = buildStudyCopilotViewModel({
    today: '2026-11-16',
    nowISO: '2026-11-16T16:00:00.000Z',
    recommendations: SAMPLE_CANDIDATES,
    candidates: SAMPLE_CANDIDATES,
    subjects: SUBJECTS,
  });

  const html = render(
    h(TodayStudyAssistantBar, {
      activePanel: 'copilot',
      executionMode: 'sequence',
      subjects: SUBJECTS,
      cycle: buildStudyCycleQueue({ subjects: SUBJECTS, nowISO: '2026-11-16T10:00:00.000Z' }),
      cycleLap: {
        round: 1,
        totalBlocks: 2,
        completedBlocks: 1,
        skippedBlocks: 0,
        partialBlocks: 0,
        resolvedBlocks: 1,
        executedCoveragePct: 50,
        actualMinutesInRound: 60,
      },
      cycleDivergence: {
        diverges: false,
        currentBlockSubject: 'Português',
        recommendedSubject: 'Português',
        urgentReview: false,
        explanation: 'Alinhado',
      },
      cycleSkipReason: '',
      cycleDraft: { mode: 'adaptive', blockDurationMinutes: 60, preview: null },
      quickMinutes: 30,
      quickFocus: 'priority',
      quickProposal: quick,
      copilot,
      copilotQuestion: 'what_now',
      journalEntries: [],
      journalFilters: { subjectId: '', tag: '', query: '' },
      journalForm: {
        sessionId: null,
        subjectId: '',
        topicId: '',
        difficultyRating: '',
        energyRating: '',
        tags: [],
        note: '',
        nextStep: '',
      },
      weeklyClosing: null,
      onTogglePanel: () => {},
      onStartCycleBlock: () => {},
      onToggleCyclePause: () => {},
      onSkipReasonChange: () => {},
      onSkipCycleBlock: () => {},
      onChangeCycleDraftConfig: () => {},
      onMoveCycleDraftBlock: () => {},
      onConfirmCycleDraft: () => {},
      onChangeQuickConfig: () => {},
      onStartQuickStudy: () => {},
      onSelectCopilotQuestion: () => {},
      onExecuteCopilotAnswer: () => {},
      onChangeJournalFilter: () => {},
      onChangeJournalForm: () => {},
      onSaveJournalEntry: () => {},
      onDeleteJournalEntry: () => {},
      onCreateReviewFromJournal: () => {},
      onConfirmWeeklyClosingSnapshot: () => {},
      onTestWeeklyImprovement: () => {},
    })
  );

  assert.match(html, /Tenho X minutos/);
  assert.match(html, /Leitura do Extrato/);
  assert.doesNotMatch(html, /todayJournalPanel/);
  assert.doesNotMatch(html, /\p{Extended_Pictographic}/u);
});

test('UI distribuída: OverviewCopilotCard, StudyCycleCenterCard, TodayJournalSidebarCard e SEARCH_COMMANDS seguem contratos e ficam sem emojis', () => {
  const copilot = buildStudyCopilotViewModel({
    today: '2026-11-16',
    nowISO: '2026-11-16T16:00:00.000Z',
    recommendations: SAMPLE_CANDIDATES,
    candidates: SAMPLE_CANDIDATES,
    subjects: SUBJECTS,
  });

  const copilotHtml = render(
    h(OverviewCopilotCard, {
      copilot,
      selectedQuestion: 'what_now',
      onSelectQuestion: () => {},
      onExecuteAnswer: () => {},
      onQuickStudy30: () => {},
    })
  );
  assert.match(copilotHtml, /Leitura do Extrato/);
  assert.match(copilotHtml, /Estudo rápido: 30 min/);
  assert.match(copilotHtml, /Tenho 30 minutos/);
  assert.match(copilotHtml, /Mais perguntas \(3\)/);
  assert.doesNotMatch(copilotHtml, /\p{Extended_Pictographic}/u);

  const cyclePreview = buildStudyCyclePreview({
    subjects: SUBJECTS,
    blockDurationMinutes: 60,
    nowISO: '2026-11-16T10:00:00.000Z',
  });
  assert.equal(createDefaultState().executionMode, 'sequence');

  const copilotHint = buildStudyCycleCopilotHint({
    cycle: cyclePreview.cycle,
    mode: 'adaptive',
    totalDurationMinutes: cyclePreview.totalDurationMinutes,
    weeklyCapacityMinutes: 600,
  });
  assert.match(copilotHint || '', /Modo Adaptativo/);
  assert.match(copilotHint || '', /1 volta completa leva cerca de/);

  const skippedHint = buildStudyCycleCopilotHint({
    cycle: {
      ...cyclePreview.cycle,
      executions: [
        { id: 'e1', cycleId: 'c1', cycleVersion: 1, blockId: 'b1', subjectId: 's1', round: 1, sessionId: null, plannedMinutes: 60, actualMinutes: 0, status: 'skipped', reason: null, timestamp: '2026-11-16T10:00:00Z', source: 'cycle' },
        { id: 'e2', cycleId: 'c1', cycleVersion: 1, blockId: 'b2', subjectId: 's2', round: 1, sessionId: null, plannedMinutes: 60, actualMinutes: 20, status: 'partial', reason: null, timestamp: '2026-11-16T11:00:00Z', source: 'cycle' },
      ],
    },
    mode: 'adaptive',
    totalDurationMinutes: cyclePreview.totalDurationMinutes,
  });
  assert.match(skippedHint || '', /40–45 min/);

  const cycleCopilot = buildStudyCopilotViewModel({
    today: '2026-11-16',
    nowISO: '2026-11-16T12:00:00.000Z',
    executionMode: 'sequence',
    studyCycle: cyclePreview.cycle,
    subjects: SUBJECTS,
    recommendations: [{ subjectId: 's2', subjectName: 'Direito Constitucional', topicId: 't2', topicName: 'Direitos Fundamentais', priority: 90 }],
  });
  assert.equal(cycleCopilot.source, 'cycle');
  assert.equal(cycleCopilot.answers.what_now.actionKind, 'start_cycle_block');

  const cycleCenterHtml = render(
    h(StudyCycleCenterCard, {
      executionMode: 'sequence',
      cycle: cyclePreview.cycle,
      subjects: SUBJECTS,
      copilotHint,
      cycleLap: {
        round: 1,
        totalBlocks: cyclePreview.blocksCount,
        completedBlocks: 0,
        skippedBlocks: 0,
        partialBlocks: 0,
        resolvedBlocks: 0,
        executedCoveragePct: 0,
        actualMinutesInRound: 0,
      },
      cycleDraft: {
        mode: 'adaptive',
        blockDurationMinutes: 60,
        preview: cyclePreview,
      },
      onSetExecutionMode: () => {},
      onToggleCyclePause: () => {},
      onChangeCycleDraftConfig: () => {},
      onMoveCycleDraftBlock: () => {},
      onConfirmCycleDraft: () => {},
      onGoToTodayCycle: () => {},
    })
  );
  assert.match(cycleCenterHtml, /Central do Ciclo de Estudos/);
  assert.doesNotMatch(cycleCenterHtml, /Central do Ciclo de Estudos 2\.0/);
  assert.match(cycleCenterHtml, /Confirmar nova versão do ciclo/);
  assert.match(cycleCenterHtml, /Ver sequência de 2 blocos/);
  assert.match(cycleCenterHtml, /1 h/);
  assert.match(cycleCenterHtml, /data-study-cycle-donut="true"/);
  assert.match(cycleCenterHtml, /data-cycle-copilot-hint="true"/);
  assert.match(cycleCenterHtml, /chart-donut/);
  assert.match(cycleCenterHtml, /chart-donut__slice/);
  assert.ok(cycleCenterHtml.indexOf('Ciclo de estudos') < cycleCenterHtml.indexOf('Agenda do dia'));
  assert.doesNotMatch(cycleCenterHtml, /subject-distribution-row|plan-impact-row|plan-execution-table/);
  assert.doesNotMatch(cycleCenterHtml, /\p{Extended_Pictographic}/u);

  const manualCycleCenterHtml = render(
    h(StudyCycleCenterCard, {
      executionMode: 'sequence',
      cycle: cyclePreview.cycle,
      subjects: SUBJECTS,
      cycleLap: {
        round: 1,
        totalBlocks: cyclePreview.blocksCount,
        completedBlocks: 0,
        skippedBlocks: 0,
        partialBlocks: 0,
        resolvedBlocks: 0,
        executedCoveragePct: 0,
        actualMinutesInRound: 0,
      },
      cycleDraft: {
        mode: 'manual',
        blockDurationMinutes: 60,
        preview: cyclePreview,
      },
      onSetExecutionMode: () => {},
      onToggleCyclePause: () => {},
      onChangeCycleDraftConfig: () => {},
      onMoveCycleDraftBlock: () => {},
      onConfirmCycleDraft: () => {},
      onGoToTodayCycle: () => {},
    })
  );
  assert.match(manualCycleCenterHtml, /draggable="true"|draggable/);
  assert.match(manualCycleCenterHtml, /Posição de Português/);

  const journalEntry = upsertLearningJournalEntry(
    [],
    {
      subjectId: 's1',
      subjectNameSnapshot: 'Português',
      topicId: 't1',
      topicNameSnapshot: 'Crase',
      localDate: '2026-11-16',
      tags: ['duvida'],
      note: 'Revisar casos proibidos de crase.',
    },
    { nowISO: () => '2026-11-16T12:00:00.000Z', todayISO: () => '2026-11-16', idGenerator: () => 'j_1' }
  ).entries;

  const sidebarHtml = render(
    h(TodayJournalSidebarCard, {
      subjects: SUBJECTS,
      entries: journalEntry,
      totalEntriesCount: journalEntry.length,
      filters: { subjectId: '', tag: '', query: '' },
      form: {
        sessionId: null,
        subjectId: '',
        topicId: '',
        difficultyRating: '',
        energyRating: '',
        tags: [],
        note: '',
        nextStep: '',
      },
      formOpen: false,
      onToggleForm: () => {},
      onChangeFilter: () => {},
      onChangeForm: () => {},
      onSaveEntry: () => {},
      onDeleteEntry: () => {},
      onCreateReviewFromEntry: () => {},
    })
  );
  assert.match(sidebarHtml, /Diário de Aprendizagem/);
  assert.match(sidebarHtml, /Registrar aprendizado ou dúvida/);
  assert.match(sidebarHtml, /Transformar em revisão/);
  assert.doesNotMatch(sidebarHtml, /\p{Extended_Pictographic}/u);

  for (const action of ['quick-study', 'copilot', 'learning-journal', 'study-cycle-center']) {
    assert.ok(SEARCH_COMMANDS.some(c => c.action === action), `Comando global ausente: ${action}`);
  }
  assert.ok(SEARCH_COMMANDS.some(c => c.action === 'achievements' && c.label === 'Ver conquistas'));
});
