import test from 'node:test';
import assert from 'node:assert/strict';
import { createHelpController, loadHelpBundle } from '../../src/ui/help/help-controller.js';
import { renderHelpCenter } from '../../src/ui/help/help-renderer.js';
import { HELP_CATEGORIES } from '../../src/ui/help/help-content.js';
import { getHelpFeedbackMap } from '../../src/domain/help/help-feedback.js';

function createMockElement(id = '', tag = 'div') {
  const children = [];
  const attributes = new Map();
  const listeners = new Map();
  let text = '';
  let html = '';

  const el = {
    id,
    tagName: tag.toUpperCase(),
    dataset: {},
    hidden: false,
    tabIndex: 0,
    get textContent() {
      return text;
    },
    set textContent(val) {
      text = String(val);
    },
    get innerHTML() {
      return html;
    },
    set innerHTML(val) {
      html = String(val);
      text = val.replace(/<[^>]+>/g, '');
    },
    setAttribute(name, val) {
      attributes.set(name, String(val));
    },
    getAttribute(name) {
      return attributes.get(name) || null;
    },
    removeAttribute(name) {
      attributes.delete(name);
    },
    focus() {},
    scrollIntoView() {},
    children,
    append(...nodes) {
      children.push(...nodes);
    },
    querySelector(sel) {
      return null;
    },
    querySelectorAll(sel) {
      return [];
    },
    closest(sel) {
      return null;
    },
    addEventListener(evt, fn) {
      if (!listeners.has(evt)) listeners.set(evt, []);
      listeners.get(evt).push(fn);
    },
    dispatchEvent(evt) {
      const fns = listeners.get(evt.type) || [];
      for (const fn of fns) fn(evt);
    },
  };
  return el;
}

test('createHelpController — monta com renderizador injetado sem atraso', () => {
  const helpCenter = createMockElement('helpCenter');
  const doc = {
    getElementById(id) {
      return id === 'helpCenter' ? helpCenter : null;
    },
    querySelector() {
      return null;
    },
    querySelectorAll() {
      return [];
    },
    addEventListener() {},
  };
  const win = {
    CSS: { escape: s => s },
    matchMedia: () => ({ matches: false }),
    requestAnimationFrame: fn => fn(),
  };

  let activated = '';
  const controller = createHelpController({
    document: doc,
    window: win,
    activateTab: tab => {
      activated = tab;
    },
    renderHelpCenter: () => '<section id="guide-start" data-help-group><div id="helpGroups"></div></section>',
  });

  const mounted = controller.mount();
  assert.equal(mounted, true);
  assert.match(helpCenter.innerHTML, /id="guide-start"/);
});

test('createHelpController — inicializa destinos e navegação corretamente', () => {
  const helpCenter = createMockElement('helpCenter');
  const doc = {
    getElementById(id) {
      return id === 'helpCenter' ? helpCenter : null;
    },
    querySelector() {
      return null;
    },
    querySelectorAll() {
      return [];
    },
    addEventListener() {},
  };
  let targetTab = '';
  const controller = createHelpController({
    document: doc,
    window: { matchMedia: () => ({ matches: false }), requestAnimationFrame: fn => fn() },
    activateTab: tab => {
      targetTab = tab;
    },
    renderHelpCenter: () => '<div id="helpGroups"></div>',
  });
  controller.mount();
  controller.navigate('projection');
  assert.equal(targetTab, 'desempenho');
  controller.navigate('questions');
  assert.equal(targetTab, 'questoes');
});

test('loadHelpBundle — retorna StudyTrackHelp existente se já inicializado', async () => {
  const mockHelp = { renderHelpCenter: () => '<div>Ajuda</div>' };
  globalThis.StudyTrackHelp = mockHelp;

  const result = await loadHelpBundle(null);
  assert.equal(result, mockHelp);
});
