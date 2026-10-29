import test from 'node:test';
import assert from 'node:assert/strict';
import { createSubjectsTabController } from '../../src/ui/tabs/subjects/subjects-tab-controller.js';

function createMockDom() {
  const elements = new Map();

  function getElement(id) {
    if (!elements.has(id)) {
      elements.set(id, {
        id,
        innerHTML: '',
        textContent: '',
        hidden: false,
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

  const win = {
    innerWidth: 1024,
    matchMedia: () => ({ matches: false }),
  };

  return { doc, win, elements };
}

function createBaseContext(doc, win) {
  let toasts = [];
  let confirms = [];
  let prompts = [];
  let persists = 0;
  let historyEvents = [];

  const state = {
    subjects: [
      {
        id: 'sub-1',
        name: 'Português',
        collapsed: false,
        archived: false,
        archivedAt: null,
        createdAt: '2026-01-01T00:00:00.000Z',
        topics: [
          {
            id: 'top-1',
            name: 'Ortografia',
            link: '',
            status: 'Não iniciado',
            archived: false,
            archivedAt: null,
            notes: '',
            tags: ['tag1'],
            difficulty: 'Médio',
            createdAt: '2026-01-01T00:00:00.000Z',
            reviewCount: 0,
            lastReviewedAt: null,
          },
        ],
      },
      {
        id: 'sub-2',
        name: 'Matemática',
        collapsed: false,
        archived: false,
        archivedAt: null,
        createdAt: '2026-01-01T00:00:00.000Z',
        topics: [],
      },
    ],
    questoes: [],
    studySessions: [],
    calendar: [],
    reviewAgenda: [
      {
        id: 'rev-1',
        topicId: 'top-1',
        status: 'Concluído',
        completedAt: '2026-01-10T12:00:00.000Z',
      },
    ],
    metasPorDisciplina: [],
    simulados: [],
    activeTimer: { subjectId: null, topicId: null },
    examBlueprint: { subjects: [], activeExamTags: [] },
  };

  const subjectService = {
    create: name => {
      const s = {
        id: 'sub-new',
        name,
        collapsed: false,
        archived: false,
        archivedAt: null,
        createdAt: '2026-01-02T00:00:00.000Z',
        topics: [],
      };
      state.subjects.push(s);
      return s;
    },
    rename: (id, name) => {
      const s = state.subjects.find(x => x.id === id);
      if (s) s.name = name;
    },
    archive: id => {
      const s = state.subjects.find(x => x.id === id);
      if (s) {
        s.archived = true;
        s.archivedAt = '2026-01-02T00:00:00.000Z';
      }
    },
    restore: id => {
      const s = state.subjects.find(x => x.id === id);
      if (s) {
        s.archived = false;
        s.archivedAt = null;
      }
    },
    remove: id => {
      state.subjects = state.subjects.filter(x => x.id !== id);
    },
    toggle: (id, _opts) => {
      const s = state.subjects.find(x => x.id === id);
      if (s) s.collapsed = !s.collapsed;
    },
    addTopic: (subjectId, data) => {
      const s = state.subjects.find(x => x.id === subjectId);
      if (s) {
        const top = {
          id: 'top-new',
          name: data?.name || 'Novo Tópico',
          link: '',
          status: 'Não iniciado',
          archived: false,
          archivedAt: null,
          notes: '',
          tags: [],
          difficulty: 'Médio',
          createdAt: '2026-01-02T00:00:00.000Z',
          reviewCount: 0,
          lastReviewedAt: null,
        };
        s.topics.push(top);
        return top;
      }
    },
    archiveTopic: (subjectId, topicId) => {
      const s = state.subjects.find(x => x.id === subjectId);
      const t = s?.topics.find(x => x.id === topicId);
      if (t) {
        t.archived = true;
        t.archivedAt = '2026-01-02T00:00:00.000Z';
      }
    },
    restoreTopic: (subjectId, topicId) => {
      const s = state.subjects.find(x => x.id === subjectId);
      const t = s?.topics.find(x => x.id === topicId);
      if (t) {
        t.archived = false;
        t.archivedAt = null;
      }
    },
    removeTopic: (subjectId, topicId) => {
      const s = state.subjects.find(x => x.id === subjectId);
      if (s) s.topics = s.topics.filter(x => x.id !== topicId);
    },
    updateTopic: (subjectId, topicId, patch) => {
      const s = state.subjects.find(x => x.id === subjectId);
      const t = s?.topics.find(x => x.id === topicId);
      if (t) Object.assign(t, patch);
    },
  };

  const topicHistoryService = {
    add: (type, subjectId, topicId, metadata) => {
      historyEvents.push({ type, subjectId, topicId, metadata });
    },
    list: () => historyEvents,
    eventLocalDate: () => '2026-01-01',
  };

  const context = {
    document: doc,
    window: win,
    state,
    subjectService,
    topicHistoryService,
    persistAndRender: () => {
      persists++;
    },
    showToast: msg => {
      toasts.push(msg);
    },
    showPrompt: (title, cfg, onConfirm) => {
      prompts.push({ title, cfg, onConfirm });
    },
    showConfirm: (msg, onConfirm) => {
      confirms.push({ msg, onConfirm });
    },
    activeSubjects: () => state.subjects.filter(s => !s.archived),
    allTopics: () => state.subjects.flatMap(s => s.topics || []),
    getTopicById: topicId => {
      for (const s of state.subjects) {
        const t = (s.topics || []).find(x => x.id === topicId);
        if (t) return { subject: s, topic: t };
      }
      return null;
    },
    getSubjectById: subjectId => state.subjects.find(s => s.id === subjectId),
    isCommonTopic: () => false,
    matchesSubjectSearch: () => true,
    subjectProgress: () => 50,
    pluralize: (c, s, p) => `${c} ${c === 1 ? s : p || s + 's'}`,
    EXAM_TAGS: { BB: 'bb', CAIXA: 'caixa', CAIXA_TI: 'caixa-ti' },
    STATUS_OPTIONS: ['Não iniciado', 'Em andamento', 'Concluído'],
    STATUS_CLASS: {},
    DIFFICULTY_OPTIONS: ['Fácil', 'Médio', 'Difícil'],
    DIFFICULTY_CLASS: {},
  };

  return { context, state, toasts, confirms, prompts, historyEvents, getPersists: () => persists };
}

test('SubjectsTabController - reordering, toggling and duplicating subjects', () => {
  const { doc, win } = createMockDom();
  const { context, state, toasts, getPersists } = createBaseContext(doc, win);
  const controller = createSubjectsTabController(/** @type {any} */ (context));

  assert.equal(state.subjects[0].id, 'sub-1');
  assert.equal(state.subjects[1].id, 'sub-2');

  // Move subject down
  controller.moveSubject('sub-1', 1);
  assert.equal(state.subjects[0].id, 'sub-2');
  assert.equal(state.subjects[1].id, 'sub-1');
  assert.equal(getPersists(), 1);

  // Toggle subject collapsed
  controller.toggleSubject('sub-1');
  assert.equal(state.subjects[1].collapsed, true);

  // Duplicate subject
  controller.duplicateSubject('sub-1');
  assert.equal(state.subjects.length, 3);
  assert.equal(state.subjects[2].name, 'Português (cópia)');
  assert.equal(state.subjects[2].topics.length, 1);
  assert.equal(state.subjects[2].topics[0].status, 'Não iniciado');
  assert.ok(toasts.some(t => t.includes('Português (cópia)')));
});

test('SubjectsTabController - topic status lifecycle and review stats', () => {
  const { doc, win } = createMockDom();
  const { context, state, historyEvents, getPersists } = createBaseContext(doc, win);
  const controller = createSubjectsTabController(/** @type {any} */ (context));

  const topic = state.subjects[0].topics[0];
  assert.equal(topic.status, 'Não iniciado');

  // Transition to Em andamento
  controller.updateTopicStatus('sub-1', 'top-1', /** @type {any} */ ({ value: 'Em andamento' }));
  assert.equal(topic.status, 'Em andamento');
  assert.equal(historyEvents[0].type, 'topic_started');

  // Transition to Concluído
  controller.updateTopicStatus('sub-1', 'top-1', /** @type {any} */ ({ value: 'Concluído' }));
  assert.equal(topic.status, 'Concluído');
  assert.equal(topic.completionCount, 1);
  assert.equal(historyEvents[1].type, 'topic_completed');

  // Refresh review stats from agenda
  controller.refreshTopicReviewStats('top-1');
  assert.equal(topic.reviewCount, 1);
  assert.equal(topic.lastReviewedAt, '2026-01-10T12:00:00.000Z');
});

test('SubjectsTabController - subject dependency check and deletion protection', () => {
  const { doc, win } = createMockDom();
  const { context, state, toasts, confirms } = createBaseContext(doc, win);
  const controller = createSubjectsTabController(/** @type {any} */ (context));

  // Dependency count with top-1 having a review
  const deps = controller.getSubjectDependencies('sub-1');
  assert.equal(deps.reviews, 1);

  // Attempt delete while not archived
  controller.requestPermanentSubjectDelete('sub-1');
  assert.ok(toasts.some(t => t.includes('Arquive a disciplina')));

  // Archive subject
  controller.archiveSubject('sub-1');
  assert.equal(state.subjects[0].archived, true);

  // Attempt delete with dependencies
  controller.requestPermanentSubjectDelete('sub-1');
  assert.ok(toasts.some(t => t.includes('possui 1 registro vinculado')));

  // Remove dependency and delete
  state.reviewAgenda = [];
  controller.requestPermanentSubjectDelete('sub-1');
  assert.equal(confirms.length, 1);
  confirms[0].onConfirm();
  assert.equal(state.subjects.some(s => s.id === 'sub-1'), false);
});

test('SubjectsTabController - limits, filters and syllabus toggle', () => {
  const { doc, win, elements } = createMockDom();
  const { context } = createBaseContext(doc, win);
  const controller = createSubjectsTabController(/** @type {any} */ (context));

  controller.changeSubjectTopicLimit('sub-1', 5);
  assert.equal(controller.subjectTopicLimits.get('sub-1'), 15);

  controller.showAllSubjectTopics('sub-1');
  assert.equal(controller.subjectTopicLimits.get('sub-1'), Number.MAX_SAFE_INTEGER);

  controller.resetSubjectTopicLimit('sub-1');
  assert.equal(controller.subjectTopicLimits.get('sub-1'), 10);

  controller.setSubjectTopicFilter('sub-1', 'status', 'Concluído');
  assert.deepEqual(controller.subjectTopicFilters.get('sub-1'), { status: 'Concluído', difficulty: '' });

  controller.toggleNotes('top-1');
  assert.ok(controller.openNotesIds.has('top-1'));
  controller.toggleNotes('top-1');
  assert.equal(controller.openNotesIds.has('top-1'), false);
});
