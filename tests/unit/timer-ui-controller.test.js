import test from 'node:test';
import assert from 'node:assert/strict';
import { createTimerUiController } from '../../src/ui/controllers/timer-ui-controller.js';

test('createTimerUiController — ativa e desativa modo foco restaurando a aba de origem', () => {
  let activeTab = 'dashboard';
  const activatedTabs = [];
  let contextRendered = false;

  const mockBody = {
    classList: {
      classes: new Set(),
      contains(cls) {
        return this.classes.has(cls);
      },
      toggle(cls, force) {
        if (force === undefined) {
          if (this.classes.has(cls)) this.classes.delete(cls);
          else this.classes.add(cls);
        } else if (force) {
          this.classes.add(cls);
        } else {
          this.classes.delete(cls);
        }
      },
    },
  };

  /** @type {Record<string, any>} */
  const elements = {};
  const mockDoc = {
    body: mockBody,
    getElementById(id) {
      if (!elements[id]) {
        elements[id] = {
          id,
          setAttribute(k, v) {
            this[k] = v;
          },
          textContent: '',
          focus() {},
        };
      }
      return elements[id];
    },
    querySelector() {
      return { scrollIntoView() {}, focus() {} };
    },
  };

  const controller = createTimerUiController({
    document: mockDoc,
    activeTabName: () => activeTab,
    activateTab: tab => {
      activeTab = tab;
      activatedTabs.push(tab);
    },
    renderTimerFocusContext: () => {
      contextRendered = true;
    },
    isTimerRunning: () => false,
    getTopicById: () => null,
  });

  // Abre modo foco a partir da Visão Geral: o cronômetro mora em Hoje
  controller.openStudyTimerFocus();
  assert.equal(activeTab, 'hoje');
  assert.equal(mockBody.classList.contains('timer-focus-active'), true);
  assert.equal(controller.getTimerFocusReturnTab(), 'dashboard');
  assert.equal(contextRendered, true);
  assert.match(elements.timerFocusToggle.innerHTML, /icon-lucide-x[^]*Sair do modo foco$/);

  // Sai do modo foco: deve retornar à Visão Geral
  controller.toggleTimerFocus(false);
  assert.equal(activeTab, 'dashboard');
  assert.equal(mockBody.classList.contains('timer-focus-active'), false);
  assert.equal(controller.getTimerFocusReturnTab(), null);
  assert.match(elements.timerFocusToggle.innerHTML, /icon-lucide-focus-2[^]*Modo foco$/);
  assert.ok(!elements.timerFocusToggle.innerHTML.includes('⛶'));
});

test('createTimerUiController — salva e limpa bookmarks de sessão no tópico', () => {
  let updatedTopic = null;

  const subject = {
    id: 's1',
    name: 'Constitucional',
  };
  const topic = {
    id: 't1',
    name: 'Direitos Sociais',
    bookmark: null,
  };

  const mockSubjectService = {
    updateTopic(subjectId, topicId, patch) {
      updatedTopic = { subjectId, topicId, patch };
    },
  };

  /** @type {Record<string, any>} */
  const elements = {
    sessionBookmarkSection: { dataset: { clear: '0' } },
    sessionBookmarkType: { value: 'book' },
    sessionBookmarkLabel: { value: 'Manual de Constitucional' },
    sessionBookmarkCurrent: { value: '45' },
    sessionBookmarkTotal: { value: '300' },
    sessionBookmarkPosition: { value: 'Página 45' },
  };

  const mockDoc = {
    body: { classList: { contains: () => false, toggle: () => {} } },
    getElementById(id) {
      return elements[id] || { value: '', dataset: {} };
    },
  };

  const controller = createTimerUiController({
    document: mockDoc,
    activeTabName: () => 'dashboard',
    activateTab: () => {},
    renderTimerFocusContext: () => {},
    isTimerRunning: () => false,
    getTopicById: id => (id === 't1' ? { subject, topic } : null),
    subjectService: mockSubjectService,
  });

  // Salva bookmark
  controller.saveSessionBookmark('t1', '2026-03-10T15:30:00Z');
  assert.ok(updatedTopic);
  assert.equal(updatedTopic.subjectId, 's1');
  assert.equal(updatedTopic.topicId, 't1');
  assert.equal(updatedTopic.patch.bookmark.label, 'Manual de Constitucional');

  // Rótulo de retomada
  topic.bookmark = updatedTopic.patch.bookmark;
  const label = controller.topicResumeLabel('t1');
  assert.match(label, /Manual de Constitucional/);
});

test('createTimerUiController — aplica e restaura inert nos irmãos fora de #study-timer no modo foco', () => {
  const mkNode = (initialInert = false) => ({
    inert: initialInert,
    attrs: new Map(),
    setAttribute(k, v) {
      this.attrs.set(k, String(v));
    },
    removeAttribute(k) {
      this.attrs.delete(k);
    },
  });
  const sibling = mkNode(false);
  const alreadyInert = mkNode(true);
  const bodyClasses = new Set();
  const mockDoc = {
    body: {
      classList: {
        contains: cls => bodyClasses.has(cls),
        toggle: (cls, force) => {
          const next = force == null ? !bodyClasses.has(cls) : Boolean(force);
          if (next) bodyClasses.add(cls);
          else bodyClasses.delete(cls);
        },
      },
    },
    getElementById: () => ({
      setAttribute() {},
      focus() {},
      innerHTML: '',
    }),
    querySelector: () => null,
    querySelectorAll: sel => {
      if (sel === '[data-focus-inert="1"]') {
        return [sibling, alreadyInert].filter(n => n.attrs.has('data-focus-inert'));
      }
      return [sibling, alreadyInert];
    },
  };

  const controller = createTimerUiController({
    document: mockDoc,
    activeTabName: () => 'hoje',
    activateTab: () => {},
    renderTimerFocusContext: () => {},
    isTimerRunning: () => false,
    getTopicById: () => null,
  });

  controller.toggleTimerFocus(true);
  assert.equal(sibling.inert, true);
  assert.equal(sibling.attrs.get('data-focus-inert'), '1');
  assert.equal(alreadyInert.inert, true);
  assert.equal(alreadyInert.attrs.has('data-focus-inert'), false);

  controller.toggleTimerFocus(false);
  assert.equal(sibling.inert, false);
  assert.equal(sibling.attrs.has('data-focus-inert'), false);
  assert.equal(alreadyInert.inert, true);
});
