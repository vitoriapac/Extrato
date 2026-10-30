import test from 'node:test';
import assert from 'node:assert/strict';
import { createTabRouter } from '../../src/ui/navigation/tab-router.js';

test('createTabRouter — gerencia ativação e identificação de aba ativa', () => {
  const rendered = [];
  const fakeDoc = {
    getElementById: id => {
      if (id === 'panel-dashboard') return { hidden: false };
      if (id === 'panel-metas') return { hidden: true };
      return null;
    },
    querySelector: sel => {
      if (sel === '.tab-btn.active') return { dataset: { tab: 'dashboard' } };
      if (sel === '.tab-btn[data-tab="metas"]') return { classList: { toggle() {} }, focus() {} };
      if (sel === '.tab-btn[data-tab="dashboard"]')
        return { classList: { toggle() {} }, focus() {} };
      return null;
    },
    querySelectorAll: () => [],
    addEventListener: () => {},
  };

  const fakeWin = {
    location: { hash: '#planejamento' },
    addEventListener: () => {},
    scrollTo: () => {},
  };

  const router = createTabRouter({
    document: fakeDoc,
    window: fakeWin,
    onRenderTab: tab => rendered.push(tab),
  });

  assert.equal(router.activeTabName(), 'dashboard');
  assert.equal(typeof router.activateTab, 'function');
  assert.equal(typeof router.registerShortcuts, 'function');
  assert.equal(typeof router.activateInitialTab, 'function');
});

test('createTabRouter — hashchange troca de aba e ignora âncoras internas', () => {
  const rendered = [];
  const listeners = {};
  const button = { classList: { toggle() {} }, focus() {}, setAttribute() {} };
  const fakeDoc = {
    getElementById: id => (id === 'panel-dashboard' || id === 'panel-metas' ? {} : null),
    querySelector: sel =>
      sel === '.tab-btn[data-tab="metas"]' || sel === '.tab-btn[data-tab="dashboard"]'
        ? button
        : null,
    querySelectorAll: () => [],
    addEventListener: () => {},
    dispatchEvent: () => {},
  };
  const fakeWin = {
    location: { hash: '' },
    addEventListener: (type, fn) => (listeners[type] = fn),
    scrollTo: () => {},
    Event: class {},
  };
  const router = createTabRouter({
    document: fakeDoc,
    window: fakeWin,
    onRenderTab: tab => rendered.push(tab),
  });

  router.activateInitialTab();
  assert.deepEqual(rendered, ['dashboard']);

  fakeWin.location.hash = '#planejamento';
  listeners.hashchange();
  assert.deepEqual(rendered, ['dashboard', 'metas']);

  fakeWin.location.hash = '#overview-summary';
  listeners.hashchange();
  assert.deepEqual(rendered, ['dashboard', 'metas']);
});
