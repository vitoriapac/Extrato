import test from 'node:test';
import assert from 'node:assert/strict';
import { createSubjectTargetEditorController } from '../../src/ui/tabs/goals/subject-target-editor-controller.js';

function createMockDom() {
  const elements = new Map();

  function getElement(id) {
    if (!elements.has(id)) {
      elements.set(id, {
        id,
        innerHTML: '',
        dataset: {},
        querySelectorAll: () => [],
        querySelector: () => null,
        addEventListener: () => {},
      });
    }
    return elements.get(id);
  }

  return {
    getElementById: id => getElement(id),
  };
}

function createBaseContext(doc) {
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
    metas: {
      metaAprovacao: 80,
    },
  };

  return {
    ctx: {
      document: doc,
      getState: () => state,
      examEvidenceContext: () => ({
        questions: { included: [{ id: 'q-1', subjectId: 'sub-1', resolved: 10, correct: 8 }] },
      }),
      examScopedSubjects: () => [{ id: 'sub-1', name: 'Português' }],
      entitySubjectId: item => item.subjectId,
      todayISO: () => '2026-10-28',
      nowISO: () => '2026-10-28T12:00:00.000Z',
      escapeHtml: s => String(s || ''),
      escapeAttr: s => String(s || ''),
      showToast: msg => toasts.push(msg),
      persistAndRender: () => persists++,
      captureReadinessBeforeStrategy: r => readinessCaptures.push(r),
      invalidatePlanPreview: () => {},
    },
    state,
    toasts,
    persists: () => persists,
    readinessCaptures,
  };
}

test('createSubjectTargetEditorController — renderSubjectTargetEditor preenche HTML no container', () => {
  const doc = createMockDom();
  const { ctx } = createBaseContext(doc);
  const controller = createSubjectTargetEditorController(ctx);

  controller.renderSubjectTargetEditor();

  const container = doc.getElementById('subjectTargetEditor');
  assert.ok(container.innerHTML.length > 0);
  assert.ok(container.innerHTML.includes('Português'));
});

test('createSubjectTargetEditorController — saveSubjectAccuracyTargets atualiza meta e persiste', () => {
  const doc = createMockDom();
  const { ctx, state, toasts, persists, readinessCaptures } = createBaseContext(doc);
  const controller = createSubjectTargetEditorController(ctx);

  controller.saveSubjectAccuracyTargets(['sub-1'], '85');

  const saved = state.examBlueprint.subjects.find(s => s.subjectId === 'sub-1');
  assert.equal(saved?.accuracyTarget, 85);
  assert.equal(persists(), 1);
  assert.equal(readinessCaptures.length, 1);
  assert.ok(toasts.includes('Metas de acerto atualizadas.'));
});

test('createSubjectTargetEditorController — saveSubjectAccuracyTargets rejeita valor fora de 0-100', () => {
  const doc = createMockDom();
  const { ctx, toasts, persists } = createBaseContext(doc);
  const controller = createSubjectTargetEditorController(ctx);

  controller.saveSubjectAccuracyTargets(['sub-1'], '150');

  assert.equal(persists(), 0);
  assert.ok(toasts.includes('Informe uma meta entre 0% e 100%.'));
});

test('createSubjectTargetEditorController — saveSubjectAccuracyTargets rejeita disciplina não elegível', () => {
  const doc = createMockDom();
  const { ctx, toasts, persists } = createBaseContext(doc);
  const controller = createSubjectTargetEditorController(ctx);

  controller.saveSubjectAccuracyTargets(['sub-inexistente'], '75');

  assert.equal(persists(), 0);
  assert.ok(toasts.includes('Selecione ao menos uma disciplina do concurso ativo.'));
});
