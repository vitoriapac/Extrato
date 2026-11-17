import test from 'node:test';
import assert from 'node:assert/strict';

import { buildTopicIntelligence } from '../../src/application/topic-intelligence/build-topic-intelligence.ts';
import { buildTopicIntelligenceViewModel } from '../../src/features/topic-intelligence/topic-intelligence-view-model.ts';
import {
  buildNextBestAction,
  revalidateNextBestAction,
  NEXT_BEST_ACTION_STATES,
} from '../../src/application/diagnostics/build-next-best-action.ts';
import { createTopicIntelligenceSelector } from '../../src/application/selectors/topic-intelligence-selector.ts';

test('buildTopicIntelligence retorna estado neutro sem inventar métricas quando não há evidência (FIT-10)', () => {
  const snapshot = buildTopicIntelligence({
    examId: 'exam-bb',
    examLabel: 'Banco do Brasil',
    subject: { id: 'subj-mat', name: 'Matemática Financeira' },
    topic: { id: 'top-juros', name: 'Juros Compostos' },
  });

  assert.ok(snapshot);
  assert.equal(snapshot.insufficientData, true);
  assert.equal(snapshot.performance.accuracyPercent, null);
  assert.equal(snapshot.progress.coveragePercent, null);
  assert.equal(snapshot.priority.classification, 'Evidência insuficiente');
  assert.ok(snapshot.neutralMessage);
  assert.equal(snapshot.mutatedState, false);

  const vm = buildTopicIntelligenceViewModel(snapshot);
  assert.ok(vm);
  assert.equal(vm.accuracyText, '—');
  assert.equal(vm.coverageText, '—');
  assert.equal(vm.priorityBadgeVariant, 'insufficient');
});

test('buildTopicIntelligence consolida desempenho, bookmark, prioridade e ação sem mutar estado', () => {
  const snapshot = buildTopicIntelligence({
    examId: 'exam-bb',
    examLabel: 'Banco do Brasil',
    subject: { id: 'subj-mat', name: 'Matemática Financeira' },
    topic: {
      id: 'top-juros',
      name: 'Juros Compostos',
      syllabusReference: 'Item 3.2',
      stageChecklist: { theory: true, questions: true, review: false },
      bookmark: {
        resourceType: 'pdf',
        label: 'Apostila de Matemática Financeira',
        currentUnit: 42,
        totalUnits: 100,
        positionText: 'p. 42',
        updatedAt: '2026-11-10T10:00:00.000Z',
      },
    },
    questionStats: { totalQuestions: 12, correctCount: 7 },
    reviewsCount: 2,
    retentionInfo: {
      statusLabel: 'Retenção em atenção',
      confidence: 'limited',
      lastActivityLocalDate: '2026-11-09',
      daysSinceLastActivity: 8,
    },
    diagnosisRow: {
      state: 'attention',
      severity: 'critical',
      reasons: ['Precisão abaixo da meta'],
    },
    recommendation: {
      id: 'rec-1',
      subjectId: 'subj-mat',
      topicId: 'top-juros',
      studyType: 'questions',
      estimatedMinutes: 30,
      score: 92,
      reasons: ['Alta incidência no edital'],
    },
    source: 'overview',
  });

  assert.ok(snapshot);
  assert.equal(snapshot.insufficientData, false);
  assert.equal(snapshot.performance.accuracyPercent, 58);
  assert.equal(snapshot.progress.coveragePercent, 67);
  assert.equal(snapshot.priority.classification, 'Prioridade alta');
  assert.equal(snapshot.priority.reasons.length, 2);
  assert.ok(snapshot.bookmarkLabel);
  assert.ok(snapshot.nextAction);
  assert.equal(snapshot.nextAction.activityType, 'questions');
  assert.equal(snapshot.mutatedState, false);

  const vm = buildTopicIntelligenceViewModel(snapshot);
  assert.ok(vm);
  assert.equal(vm.accuracyText, '58%');
  assert.equal(vm.lastActivityText, '8 dias');
  assert.equal(vm.priorityBadgeVariant, 'danger');
});

test('buildNextBestAction e revalidateNextBestAction respeitam concurso ativo e recusas', () => {
  const recommendations = [
    {
      id: 'rec-bb',
      subjectId: 'subj-mat',
      topicId: 'top-juros',
      examTags: ['bb-2026'],
      studyType: 'questions',
      status: 'pending',
    },
  ];

  const wrongExam = buildNextBestAction({
    recommendations,
    activeExamTags: ['caixa-2026'],
  });
  assert.equal(wrongExam.state, NEXT_BEST_ACTION_STATES.NO_ELIGIBLE_ACTION);

  const validAction = buildNextBestAction({
    recommendations,
    activeExamTags: ['bb-2026'],
  });
  assert.equal(validAction.state, NEXT_BEST_ACTION_STATES.ACTION_OPTIONAL);
  assert.equal(validAction.examScopeKey, 'bb-2026');

  const revalidatedChangedExam = revalidateNextBestAction({
    action: validAction.action,
    expectedExamScopeKey: validAction.examScopeKey,
    activeExamTags: ['caixa-2026'],
    recommendations,
  });
  assert.equal(revalidatedChangedExam.valid, false);

  const revalidatedDismissed = revalidateNextBestAction({
    action: validAction.action,
    expectedExamScopeKey: validAction.examScopeKey,
    activeExamTags: ['bb-2026'],
    recommendations,
    dismissedIds: ['rec-bb'],
  });
  assert.equal(revalidatedDismissed.valid, false);

  const revalidatedOk = revalidateNextBestAction({
    action: validAction.action,
    expectedExamScopeKey: validAction.examScopeKey,
    activeExamTags: ['bb-2026'],
    recommendations,
  });
  assert.equal(revalidatedOk.valid, true);
});

test('createTopicIntelligenceSelector memoiza por revisão e invalida ao mudar escopo', () => {
  const selector = createTopicIntelligenceSelector();
  const baseInput = {
    examId: 'exam-bb',
    subject: { id: 'subj-1', name: 'Português' },
    topic: { id: 'top-1', name: 'Crase' },
  };

  const first = selector.getSnapshot(1, 'bb-2026', baseInput);
  const second = selector.getSnapshot(1, 'bb-2026', baseInput);
  assert.strictEqual(first, second);

  const third = selector.getSnapshot(2, 'bb-2026', baseInput);
  assert.notStrictEqual(first, third);
  assert.deepEqual(first, third);
});
