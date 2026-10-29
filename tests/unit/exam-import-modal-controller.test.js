import test from 'node:test';
import assert from 'node:assert/strict';
import { createExamImportModalController } from '../../src/features/exam-import/exam-import-modal-controller.js';

function createMockDom() {
  const elements = new Map();

  function getElement(id) {
    if (!elements.has(id)) {
      elements.set(id, {
        id,
        innerHTML: '',
        textContent: '',
        hidden: false,
        disabled: false,
        value: '',
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

  return { doc, elements };
}

function createBaseContext(doc) {
  let toasts = [];
  let persists = 0;
  let activeTagsRecorded = null;

  const state = {
    subjects: [
      {
        id: 'sub-1',
        name: 'Português',
        examMetrics: {
          bb: { mappingType: 'direct', expectedQuestions: 10, questionWeight: 1.5, official: true },
        },
      },
    ],
    examBlueprint: {
      subjects: [],
      activeExamTags: [],
    },
  };

  const EXAM_PRESETS = [
    {
      id: 'bb-preset',
      name: 'Banco do Brasil',
      sources: ['bb'],
      examTags: ['bb'],
      subjects: [
        {
          id: 'sub-1',
          name: 'Português',
          topics: [{ id: 'top-1', name: 'Ortografia', examTags: ['bb'] }],
        },
      ],
    },
  ];

  const EXAM_SOURCES = {
    bb: { label: 'Banco do Brasil', official: true },
  };

  const examImportService = {
    preview: (subjectIds, topicIds) => ({
      addedSubjects: 0,
      addedTopics: 0,
      metadataUpdates: 1,
    }),
    importBlueprint: () => ({
      addedSubjects: 0,
      addedTopics: 0,
      metadataUpdates: 1,
    }),
  };

  const context = {
    document: doc,
    state,
    examImportService,
    EXAM_PRESETS,
    EXAM_SOURCES,
    EXAM_TAGS: { BB: 'bb', CAIXA: 'caixa', CAIXA_TI: 'caixa-ti' },
    ensureExamCatalog: async () => {},
    isCommonTopic: () => false,
    normalizeExamTags: tags => tags,
    setActiveExamTags: (st, tags) => {
      activeTagsRecorded = tags;
      st.examBlueprint.activeExamTags = tags;
    },
    persistAndRender: () => {
      persists++;
    },
    showToast: msg => {
      toasts.push(msg);
    },
    pluralize: (c, s, p) => `${c} ${c === 1 ? s : p || s + 's'}`,
  };

  return { context, state, toasts, getPersists: () => persists, getActiveTags: () => activeTagsRecorded };
}

test('ExamImportModalController - open, render and close modal', async () => {
  const { doc, elements } = createMockDom();
  const { context } = createBaseContext(doc);
  const controller = createExamImportModalController(/** @type {any} */ (context));

  await controller.openExamImport('bb-preset');
  const overlay = elements.get('examImportOverlay');
  assert.ok(overlay.classList.contains('show'));
  assert.equal(controller.state.presetId, 'bb-preset');

  controller.closeExamImport();
  assert.equal(overlay.classList.contains('show'), false);
});

test('ExamImportModalController - applyPresetBlueprintDefaults', () => {
  const { doc } = createMockDom();
  const { context, state, getActiveTags } = createBaseContext(doc);
  const controller = createExamImportModalController(/** @type {any} */ (context));

  controller.applyPresetBlueprintDefaults(context.EXAM_PRESETS[0]);
  assert.equal(state.examBlueprint.subjects.length, 1);
  assert.equal(state.examBlueprint.subjects[0].subjectId, 'sub-1');
  assert.equal(state.examBlueprint.subjects[0].expectedQuestions, 10);
  assert.deepEqual(getActiveTags(), ['bb']);
});
