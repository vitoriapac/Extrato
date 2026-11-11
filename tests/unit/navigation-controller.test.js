import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MAIN_TABS,
  TAB_ALIASES,
  nextNavigationIndex,
  shortcutTabIndex,
  createNavigationController,
} from '../../src/ui/controllers/navigation-controller.js';
test('ordem dos atalhos permanece estável', () => {
  assert.deepEqual(MAIN_TABS, [
    'dashboard',
    'desempenho',
    'hoje',
    'disciplinas',
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
  assert.equal(shortcutTabIndex({ metaKey: true, shiftKey: true, code: 'Digit9' }), 8);
  assert.equal(shortcutTabIndex({ ctrlKey: true, code: 'Digit2' }), -1);
  assert.equal(
    shortcutTabIndex({ ctrlKey: true, shiftKey: true, altKey: true, code: 'Digit3' }),
    -1
  );
  assert.equal(shortcutTabIndex({ ctrlKey: true, shiftKey: true, code: 'Numpad1' }), -1);
});

test('trocar de área abre no topo; reativar a mesma área não rola', () => {
  const makeClassList = (initial = []) => {
    const set = new Set(initial);
    return {
      contains: name => set.has(name),
      toggle: (name, on) => (on ? set.add(name) : set.delete(name)),
    };
  };
  const panels = {
    dashboard: { classList: makeClassList(['active']) },
    hoje: { classList: makeClassList() },
  };
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
test('o Calendário virou a visão Mês da Agenda e o nome antigo continua abrindo a Agenda', () => {
  assert.equal(TAB_ALIASES.calendario, 'agenda');
  assert.ok(!MAIN_TABS.includes('calendario'));
});

test('atalhos Ctrl/Cmd+Shift+N funcionam com botão focado e Alt+S cede à Visão Geral ativa', () => {
  const listeners = new Map();
  const makeClassList = (initial = []) => {
    const set = new Set(initial);
    return {
      contains: name => set.has(name),
      toggle: (name, on) => (on ? set.add(name) : set.delete(name)),
    };
  };
  const panels = {
    dashboard: { classList: makeClassList(['active']) },
    desempenho: { classList: makeClassList() },
    hoje: { classList: makeClassList() },
  };
  const makeTabButton = tab => ({
    dataset: { tab },
    classList: makeClassList(),
    setAttribute() {},
    removeAttribute() {},
    scrollIntoView() {},
    addEventListener() {},
    focus() {},
  });
  const tabButtons = {
    dashboard: makeTabButton('dashboard'),
    desempenho: makeTabButton('desempenho'),
    hoje: makeTabButton('hoje'),
  };
  let dashboardPrimaryPresent = true;
  let timerStartClicked = false;

  const document = {
    activeElement: { tagName: 'BUTTON', isContentEditable: false },
    getElementById: id => {
      if (id === 'timerStartBtn') {
        return {
          click() {
            timerStartClicked = true;
          },
        };
      }
      return panels[id.replace('panel-', '')] || null;
    },
    querySelector: sel => {
      if (sel.includes('#panel-dashboard.active')) {
        return dashboardPrimaryPresent ? { click() {} } : null;
      }
      const tabMatch = /^\.tab-btn\[data-tab="([^"]+)"\]$/.exec(sel);
      if (tabMatch) {
        return tabButtons[tabMatch[1]] || null;
      }
      return null;
    },
    querySelectorAll: sel => {
      if (sel === '.panel') return Object.values(panels);
      if (sel === '.tab-btn[data-tab]') return Object.values(tabButtons);
      return [];
    },
    addEventListener: (type, fn) => {
      if (!listeners.has(type)) listeners.set(type, []);
      listeners.get(type).push(fn);
    },
    dispatchEvent() {},
  };
  const window = {
    Event: class {},
    scrollTo() {},
    getComputedStyle: () => ({ display: 'inline-flex' }),
    history: { replaceState() {} },
    navigator: { platform: 'Win32' },
  };

  const navigation = createNavigationController({ document, window, render() {} });
  navigation.registerShortcuts();
  const keydown = listeners.get('keydown')[0];

  // Alt+S com botão da próxima ação visível na Visão Geral não força troca para Hoje
  let altSPrevented = false;
  keydown({
    key: 's',
    code: 'KeyS',
    altKey: true,
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    defaultPrevented: false,
    preventDefault() {
      altSPrevented = true;
    },
  });
  assert.equal(altSPrevented, false);
  assert.equal(timerStartClicked, false);
  assert.equal(panels.hoje.classList.contains('active'), false);

  // Ctrl+Shift+2 ativa Desempenho mesmo quando o foco está em um botão
  let tabShortcutPrevented = false;
  keydown({
    key: '@',
    code: 'Digit2',
    ctrlKey: true,
    shiftKey: true,
    altKey: false,
    metaKey: false,
    defaultPrevented: false,
    preventDefault() {
      tabShortcutPrevented = true;
    },
  });
  assert.equal(tabShortcutPrevented, true);
  assert.equal(panels.desempenho.classList.contains('active'), true);

  // Sem botão primário na Visão Geral, Alt+S navega para Hoje e aciona #timerStartBtn
  dashboardPrimaryPresent = false;
  keydown({
    key: 's',
    code: 'KeyS',
    altKey: true,
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    defaultPrevented: false,
    preventDefault() {},
  });
  assert.equal(panels.hoje.classList.contains('active'), true);
  assert.equal(timerStartClicked, true);
});
