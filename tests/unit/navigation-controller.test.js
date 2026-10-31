import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MAIN_TABS,
  nextNavigationIndex,
  shortcutTabIndex,
  createNavigationController,
} from '../../src/ui/controllers/navigation-controller.js';
test('ordem dos atalhos permanece estável', () => {
  assert.deepEqual(MAIN_TABS, [
    'dashboard',
    'hoje',
    'disciplinas',
    'calendario',
    'agenda',
    'questoes',
    'metas',
    'instrucoes',
  ]);
});
test('navegação circular respeita setas, início e fim', () => {
  assert.equal(nextNavigationIndex(0, 7, 'ArrowLeft'), 6);
  assert.equal(nextNavigationIndex(6, 7, 'ArrowRight'), 0);
  assert.equal(nextNavigationIndex(3, 7, 'Home'), 0);
  assert.equal(nextNavigationIndex(3, 7, 'End'), 6);
});
test('atalho de área exige Ctrl ou Cmd junto de Shift', () => {
  assert.equal(shortcutTabIndex({ ctrlKey: true, shiftKey: true, code: 'Digit1' }), 0);
  assert.equal(shortcutTabIndex({ metaKey: true, shiftKey: true, code: 'Digit8' }), 7);
  assert.equal(shortcutTabIndex({ ctrlKey: true, code: 'Digit2' }), -1);
  assert.equal(
    shortcutTabIndex({ ctrlKey: true, shiftKey: true, altKey: true, code: 'Digit3' }),
    -1
  );
  assert.equal(shortcutTabIndex({ ctrlKey: true, shiftKey: true, code: 'Numpad1' }), -1);
});

test('trocar de área abre no topo; reativar a mesma área não rola', () => {
  const panels = {
    dashboard: { classList: new Set(['active']) },
    hoje: { classList: new Set() },
  };
  for (const panel of Object.values(panels)) {
    const set = panel.classList;
    panel.classList = {
      contains: name => set.has(name),
      toggle: (name, on) => (on ? set.add(name) : set.delete(name)),
    };
  }
  const tab = { classList: { toggle() {} }, setAttribute() {}, removeAttribute() {} };
  const scrolls = [];
  const document = {
    getElementById: id => panels[id.replace('panel-', '')] || null,
    querySelector: sel =>
      sel.includes('data-tab="dashboard"') || sel.includes('data-tab="hoje"') ? tab : null,
    querySelectorAll: sel => (sel === '.panel' ? Object.values(panels) : []),
    addEventListener() {},
    dispatchEvent() {},
  };
  const window = {
    Event: class {},
    scrollTo: options => scrolls.push(options),
    history: { replaceState() {} },
    navigator: { platform: 'Win32' },
  };
  const navigation = createNavigationController({ document, window, render() {} });
  navigation.activate('hoje', false);
  assert.deepEqual(scrolls, [{ top: 0, left: 0 }]);
  navigation.activate('hoje', false);
  assert.equal(scrolls.length, 1);
});
