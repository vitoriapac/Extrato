import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createShellUiController } from '../../src/ui/shell/shell-ui-controller.js';

class MockClassList {
  constructor() {
    this._classes = new Set();
  }
  add(c) {
    this._classes.add(c);
  }
  remove(c) {
    this._classes.delete(c);
  }
  contains(c) {
    return this._classes.has(c);
  }
  toggle(c, force) {
    if (force === true) {
      this._classes.add(c);
      return true;
    }
    if (force === false) {
      this._classes.delete(c);
      return false;
    }
    if (this._classes.has(c)) {
      this._classes.delete(c);
      return false;
    }
    this._classes.add(c);
    return true;
  }
}

class MockElement {
  constructor(id = '', tag = 'div') {
    this.id = id;
    this.tagName = tag.toUpperCase();
    this.classList = new MockClassList();
    this.hidden = false;
    this.inert = false;
    this._listeners = {};
    this.focused = false;
  }
  addEventListener(event, fn) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(fn);
  }
  removeEventListener(event, fn) {
    if (!this._listeners[event]) return;
    this._listeners[event] = this._listeners[event].filter(l => l !== fn);
  }
  dispatchEvent(event) {
    const list = this._listeners[event.type] || [];
    for (const fn of list) {
      fn(event);
    }
  }
  focus() {
    this.focused = true;
  }
  closest(sel) {
    if (sel.includes(this.id)) return this;
    return null;
  }
}

function createMockEnvironment() {
  const elements = new Map();
  const mainContent = new MockElement('mainContent');
  const body = new MockElement('body');
  const modalOverlay = new MockElement('modalOverlay');
  modalOverlay.classList.add('modal-overlay');

  elements.set('mainContent', mainContent);
  elements.set('modalOverlay', modalOverlay);

  const listeners = {};
  const mockWindow = {
    scrollY: 0,
    addEventListener(event, fn) {
      if (!listeners[event]) listeners[event] = [];
      listeners[event].push(fn);
    },
    removeEventListener(event, fn) {
      if (!listeners[event]) return;
      listeners[event] = listeners[event].filter(l => l !== fn);
    },
    dispatchEvent(event) {
      const list = listeners[event.type] || [];
      for (const fn of list) fn(event);
    },
    scrollTo: _opts => {},
    matchMedia: () => ({ matches: false }),
  };

  const mockDocument = {
    body,
    getElementById(id) {
      return elements.get(id) || null;
    },
    querySelector() {
      return null;
    },
    querySelectorAll(selector) {
      if (selector === '.modal-overlay') return [modalOverlay];
      if (selector === '[data-go-home]') return [];
      return [];
    },
    addEventListener(event, fn) {
      if (!listeners[event]) listeners[event] = [];
      listeners[event].push(fn);
    },
  };

  return { mockDocument, mockWindow, elements, body, mainContent, modalOverlay };
}

test('Shell UI Controller — syncModalShell aplica inert e modal-open conforme visibilidade de modal', () => {
  const env = createMockEnvironment();
  const controller = createShellUiController({
    document: env.mockDocument,
    window: env.mockWindow,
    activateTab: () => {},
    state: {},
    scheduleSave: () => {},
  });

  // Inicialmente sem show:
  controller.syncModalShell();
  assert.equal(env.mainContent.inert, false);
  assert.equal(env.body.classList.contains('modal-open'), false);

  // Modal aberto com classe 'show':
  env.modalOverlay.classList.add('show');
  controller.syncModalShell();
  assert.equal(env.mainContent.inert, true);
  assert.equal(env.body.classList.contains('modal-open'), true);

  // Modal com 'hidden':
  env.modalOverlay.hidden = true;
  controller.syncModalShell();
  assert.equal(env.mainContent.inert, false);
  assert.equal(env.body.classList.contains('modal-open'), false);
});

test('Shell UI Controller — initExecutionModeSwitchers altera modo e agenda persistência', () => {
  const env = createMockEnvironment();
  const agendaBtn = new MockElement('executionAgendaBtn');
  const sequenceBtn = new MockElement('executionSequenceBtn');
  env.elements.set('executionAgendaBtn', agendaBtn);
  env.elements.set('executionSequenceBtn', sequenceBtn);

  const state = { executionMode: 'agenda' };
  let saved = 0;
  let rendered = 0;

  const controller = createShellUiController({
    document: env.mockDocument,
    window: env.mockWindow,
    activateTab: () => {},
    state,
    scheduleSave: () => {
      saved++;
    },
    renderPlanoHoje: () => {
      rendered++;
    },
  });

  controller.initExecutionModeSwitchers();

  sequenceBtn.dispatchEvent({ type: 'click' });
  assert.equal(state.executionMode, 'sequence');
  assert.equal(saved, 1);
  assert.equal(rendered, 1);

  agendaBtn.dispatchEvent({ type: 'click' });
  assert.equal(state.executionMode, 'agenda');
  assert.equal(saved, 2);
  assert.equal(rendered, 2);
});

test('Shell UI Controller — initBackToTop sincroniza botão conforme scrollY e executa scroll', () => {
  const env = createMockEnvironment();
  const backToTopBtn = new MockElement('backToTopBtn');
  env.elements.set('backToTopBtn', backToTopBtn);

  let scrolled = false;
  env.mockWindow.scrollTo = opts => {
    if (opts.top === 0) scrolled = true;
  };

  const controller = createShellUiController({
    document: env.mockDocument,
    window: env.mockWindow,
    activateTab: () => {},
    state: {},
    scheduleSave: () => {},
  });

  controller.initBackToTop();

  // Scroll < 600: hidden true
  env.mockWindow.scrollY = 200;
  env.mockWindow.dispatchEvent({ type: 'scroll' });
  assert.equal(backToTopBtn.hidden, true);

  // Scroll >= 600: hidden false
  env.mockWindow.scrollY = 800;
  env.mockWindow.dispatchEvent({ type: 'scroll' });
  assert.equal(backToTopBtn.hidden, false);

  // Clique faz scroll e foca no mainContent
  backToTopBtn.dispatchEvent({ type: 'click' });
  assert.equal(scrolled, true);
  assert.equal(env.mainContent.focused, true);
});
