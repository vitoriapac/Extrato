import test from 'node:test';
import assert from 'node:assert/strict';
import { createKeyboardShortcutsController } from '../../src/ui/events/keyboard-shortcuts.js';

function createMockDocument() {
  const listeners = new Map();
  const menus = [];

  return {
    body: {
      classList: {
        contains: name => name === 'timer-focus-active',
      },
    },
    addEventListener: (type, fn) => {
      if (!listeners.has(type)) listeners.set(type, []);
      listeners.get(type).push(fn);
    },
    removeEventListener: (type, fn) => {
      const list = listeners.get(type) || [];
      listeners.set(
        type,
        list.filter(f => f !== fn)
      );
    },
    dispatch: (type, event) => {
      const list = listeners.get(type) || [];
      for (const fn of list) fn(event);
    },
    querySelectorAll: selector => {
      if (selector === '.action-menu[open]') {
        return menus.filter(m => m.open);
      }
      return [];
    },
    querySelector: selector => null,
    _menus: menus,
  };
}

test('createKeyboardShortcutsController — Escape sai do modo foco do cronômetro', () => {
  const mockDoc = createMockDocument();
  let exitCalled = false;
  let prevented = false;

  const controller = createKeyboardShortcutsController({
    document: mockDoc,
    onExitTimerFocus: () => {
      exitCalled = true;
    },
  });

  controller.handleTimerFocusKeydown({
    key: 'Escape',
    preventDefault: () => {
      prevented = true;
    },
  });

  assert.equal(exitCalled, true);
  assert.equal(prevented, true);
});

test('createKeyboardShortcutsController — Escape fecha menus de ação abertos e foca o resumo', () => {
  const mockDoc = createMockDocument();
  let summaryFocused = false;
  const menu1 = {
    open: true,
    querySelector: sel =>
      sel === 'summary'
        ? {
            focus: () => {
              summaryFocused = true;
            },
          }
        : null,
  };
  mockDoc._menus.push(menu1);

  const controller = createKeyboardShortcutsController({
    document: mockDoc,
  });

  let prevented = false;
  controller.handleActionMenuKeydown({
    key: 'Escape',
    preventDefault: () => {
      prevented = true;
    },
  });

  assert.equal(menu1.open, false);
  assert.equal(summaryFocused, true);
  assert.equal(prevented, true);
});

test('createKeyboardShortcutsController — clique fora fecha menus de ação abertos', () => {
  const mockDoc = createMockDocument();
  const menu1 = { open: true };
  mockDoc._menus.push(menu1);

  const controller = createKeyboardShortcutsController({
    document: mockDoc,
  });

  controller.handleActionMenuClick({
    target: { closest: selector => null },
  });

  assert.equal(menu1.open, false);
});

test('createKeyboardShortcutsController — Alt+Enter e Alt+S acionam botão da próxima ação na Visão Geral', () => {
  let clicked = false;
  let prevented = false;
  const mockBtn = {
    click: () => {
      clicked = true;
    },
  };
  const mockDashboard = {
    querySelector: sel => mockBtn,
  };
  const mockDoc = createMockDocument();
  mockDoc.querySelector = sel => (sel === '#panel-dashboard.active' ? mockDashboard : null);

  const controller = createKeyboardShortcutsController({
    document: mockDoc,
  });

  controller.handlePrimaryActionKeydown({
    altKey: true,
    key: 'Enter',
    preventDefault: () => {
      prevented = true;
    },
  });

  assert.equal(clicked, true);
  assert.equal(prevented, true);

  // Testa Alt+S
  clicked = false;
  prevented = false;
  controller.handlePrimaryActionKeydown({
    altKey: true,
    key: 's',
    preventDefault: () => {
      prevented = true;
    },
  });

  assert.equal(clicked, true);
  assert.equal(prevented, true);
});

test('createKeyboardShortcutsController — Alt+Enter ignorado se modal aberto ou digitando', () => {
  let clicked = false;
  const mockBtn = {
    click: () => {
      clicked = true;
    },
  };
  const mockDashboard = {
    querySelector: () => mockBtn,
  };
  const mockDoc = createMockDocument();
  // Simula modal aberto
  mockDoc.querySelector = sel => {
    if (sel.includes('.modal-overlay.show')) return {};
    if (sel === '#panel-dashboard.active') return mockDashboard;
    return null;
  };

  const controller = createKeyboardShortcutsController({
    document: mockDoc,
  });

  controller.handlePrimaryActionKeydown({
    altKey: true,
    key: 'Enter',
    preventDefault: () => {},
  });

  assert.equal(clicked, false);

  // Simula digitando em INPUT
  mockDoc.querySelector = sel => (sel === '#panel-dashboard.active' ? mockDashboard : null);
  mockDoc.activeElement = { tagName: 'INPUT' };

  controller.handlePrimaryActionKeydown({
    altKey: true,
    key: 'Enter',
    preventDefault: () => {},
  });

  assert.equal(clicked, false);
});

test('createKeyboardShortcutsController — Escape no modo foco ignora quando há dialog aberto', () => {
  const mockDoc = createMockDocument();
  mockDoc.querySelector = sel => (sel.includes('dialog[open]') ? {} : null);
  let exitCalled = false;
  let prevented = false;

  const controller = createKeyboardShortcutsController({
    document: mockDoc,
    onExitTimerFocus: () => {
      exitCalled = true;
    },
  });

  controller.handleTimerFocusKeydown({
    key: 'Escape',
    preventDefault: () => {
      prevented = true;
    },
  });

  assert.equal(exitCalled, false);
  assert.equal(prevented, false);
});
