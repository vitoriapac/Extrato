import test from 'node:test';
import assert from 'node:assert/strict';
import { initRememberedSections, openSectionFor } from '../../src/ui/remembered-sections.js';

const section = (remember, defaultOpen) => {
  const listeners = {};
  const node = {
    open: false,
    dataset: { remember, defaultOpen },
    addEventListener: (type, fn) => (listeners[type] = fn),
    closest: () => node,
    toggle(open) {
      node.open = open;
      listeners.toggle?.();
    },
  };
  return node;
};
const memoryStorage = (initial = {}) => {
  const data = { 'studytrack.sectionsOpen': JSON.stringify(initial) };
  return { getItem: key => data[key] ?? null, setItem: (key, value) => (data[key] = value), data };
};
const root = sections => ({ querySelectorAll: () => sections, addEventListener() {} });

test('seções lembradas: padrão por largura, escolha salva e restaurada', () => {
  const a = section('a', 'wide'),
    b = section('b', 'wide');
  const storage = memoryStorage({ b: true });
  initRememberedSections({ root: root([a, b]), storage, wide: false });
  assert.equal(a.open, false, 'celular sem escolha salva: fechada');
  assert.equal(b.open, true, 'escolha salva vence o padrão');
  a.toggle(true);
  assert.deepEqual(JSON.parse(storage.data['studytrack.sectionsOpen']), { b: true, a: true });
  const again = section('a', 'wide');
  initRememberedSections({ root: root([again]), storage, wide: false });
  assert.equal(again.open, true);
  const desktop = section('c', 'wide');
  initRememberedSections({ root: root([desktop]), storage: memoryStorage(), wide: true });
  assert.equal(desktop.open, true, 'desktop sem escolha: aberta');
});

test('seções lembradas: armazenamento indisponível não quebra e âncora abre a seção', () => {
  const broken = { getItem() { throw new Error('bloqueado'); }, setItem() { throw new Error('bloqueado'); } };
  const s = section('x', 'wide');
  initRememberedSections({ root: root([s]), storage: broken, wide: false });
  s.toggle(true);
  assert.equal(s.open, true);
  const closed = section('y', 'wide');
  openSectionFor({ closest: () => closed });
  assert.equal(closed.open, true);
  openSectionFor(null);
});
