import test from 'node:test';
import assert from 'node:assert/strict';
import { createExamMatrixController } from '../../src/ui/tabs/goals/exam-matrix-controller.js';

function createMockDom() {
  const elements = new Map();

  function getElement(id) {
    if (!elements.has(id)) {
      elements.set(id, {
        id,
        innerHTML: '',
        textContent: '',
        hidden: false,
        dataset: {},
        classList: {
          classes: new Set(),
          add: c => elements.get(id).classList.classes.add(c),
          remove: c => elements.get(id).classList.classes.delete(c),
          contains: c => elements.get(id).classList.classes.has(c),
        },
        querySelectorAll: () => [],
        querySelector: () => null,
        addEventListener: () => {},
        focus: () => {},
      });
    }
    return elements.get(id);
  }

  const doc = {
    getElementById: id => getElement(id),
    querySelector: () => null,
    querySelectorAll: () => [],
    activeElement: null,
  };

  const win = {
    matchMedia: () => ({ matches: false }),
  };

  return { doc, win, elements };
}

function createBaseContext(doc, win) {
  let toasts = [];
  let persists = 0;
  let readinessCaptures = [];

  const state = {
    examBlueprint: {
      activeExamTags: ['bb-escriturario'],
      subjects: [
        {
          subjectId: 'sub-1',
          priority: 'Alta',
          expectedQuestions: 10,
          questionWeight: 1.5,
          accuracyTarget: 80,
          masteryTarget: 80,
        },
      ],
      configuredAt: '2026-10-28T00:00:00.000Z',
    },
    exams: [{ id: 'exam-1', name: 'BB 2023', examTags: ['bb-escriturario'] }],
    examQuestions: [
      {
        id: 'eq-1',
        examId: 'exam-1',
        number: 1,
        topicId: 'top-1',
        statement: 'Questão 1',
        classification: { confidence: 0.9, method: 'manual' },
      },
    ],
    subjects: [
      {
        id: 'sub-1',
        name: 'Português',
        topics: [{ id: 'top-1', name: 'Ortografia', examMetrics: {} }],
      },
    ],
    metas: {
      metaAprovacao: 80,
    },
  };

  return {
    ctx: {
      document: doc,
      window: win,
      getState: () => state,
      examEvidenceContext: () => ({
        questions: { included: [{ topicId: 'top-1', resolved: 10, correct: 8 }] },
      }),
      intelligenceCandidates: () => [
        {
          topicId: 'top-1',
          coverage: 100,
          mastery: 80,
          retention: 90,
          trend: 'up',
          score: 85,
          evidenceStrength: 'high',
        },
      ],
      examScopedTopics: () => [{ id: 'top-1', subjectId: 'sub-1', name: 'Ortografia' }],
      activeTopics: () => [{ id: 'top-1', subjectId: 'sub-1', name: 'Ortografia' }],
      activeSubjects: () => state.subjects,
      currentAchievementProjection: () => ({ model: {} }),
      nowISO: () => '2026-10-28T12:00:00.000Z',
      idGenerator: p => `${p}-1`,
      escapeHtml: s => String(s || ''),
      escapeAttr: s => String(s || ''),
      formatDatePt: d => d,
      showToast: msg => toasts.push(msg),
      persistAndRender: () => persists++,
      captureReadinessBeforeStrategy: r => readinessCaptures.push(r),
      invalidatePlanPreview: () => {},
      resetRecordListLimits: () => {},
      EXAM_TAGS: ['bb-escriturario', 'caixa-tbn'],
      EXAM_SOURCES: [],
    },
    state,
    toasts,
    persists: () => persists,
    readinessCaptures,
  };
}

test('createExamMatrixController — renderHistoricalExamMatrix atualiza HTML do container', () => {
  const { doc, win } = createMockDom();
  const { ctx } = createBaseContext(doc, win);
  const controller = createExamMatrixController(ctx);

  controller.renderHistoricalExamMatrix();

  const container = doc.getElementById('examHistoricalMatrix');
  assert.ok(container.innerHTML.length > 0);
  assert.equal(controller.getFilters().scope, 'active');
});

test('createExamMatrixController — renderExamMasteryMatrix gera tabela com métricas', () => {
  const { doc, win } = createMockDom();
  const { ctx } = createBaseContext(doc, win);
  const controller = createExamMatrixController(ctx);

  controller.renderExamMasteryMatrix();

  const container = doc.getElementById('examMasteryMatrix');
  assert.ok(container.innerHTML.includes('mastery-matrix'));
  assert.ok(container.innerHTML.includes('Português'));
});

test('createExamMatrixController — toggleActiveExamTag adiciona e remove concurso ativo', () => {
  const { doc, win } = createMockDom();
  const { ctx, state, persists, readinessCaptures } = createBaseContext(doc, win);
  const controller = createExamMatrixController(ctx);

  controller.toggleActiveExamTag('caixa-tbn', true);

  assert.ok(state.examBlueprint.activeExamTags.includes('caixa-tbn'));
  assert.equal(persists(), 1);
  assert.equal(readinessCaptures.length, 1);

  controller.toggleActiveExamTag('caixa-tbn', false);
  assert.equal(state.examBlueprint.activeExamTags.includes('caixa-tbn'), false);
  assert.equal(persists(), 2);
});

test('createExamMatrixController — updateExamClassificationReview renderiza perguntas no modal', () => {
  const { doc, win } = createMockDom();
  const { ctx } = createBaseContext(doc, win);
  const controller = createExamMatrixController(ctx);

  controller.updateExamClassificationReview();

  const content = doc.getElementById('examClassificationContent');
  assert.ok(content.innerHTML.length > 0);
});
