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
