import test from 'node:test';
import assert from 'node:assert/strict';
import { createDailyFocusController } from '../../src/ui/controllers/preferences-controller.js';

function createFakeDocument() {
  const attrs = new Map();
  return {
    documentElement: {
      setAttribute: (k, v) => attrs.set(k, String(v)),
      getAttribute: k => attrs.get(k) ?? null,
      removeAttribute: k => attrs.delete(k),
    },
  };
}

function createFakeStorage(initial = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: k => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
  };
}

test('createDailyFocusController inicia desativado por padrão e persiste alternância', () => {
  const doc = createFakeDocument();
  const storage = createFakeStorage();
  const ctrl = createDailyFocusController({ document: doc, storage });

  assert.equal(ctrl.init(), false);
  assert.equal(ctrl.current(), false);
  assert.equal(doc.documentElement.getAttribute('data-daily-focus'), null);

  assert.equal(ctrl.toggle(), true);
  assert.equal(ctrl.current(), true);
  assert.equal(doc.documentElement.getAttribute('data-daily-focus'), 'on');
  assert.equal(storage.getItem('studytrack.dailyFocus'), 'on');

  const ctrlReloaded = createDailyFocusController({ document: doc, storage });
  assert.equal(ctrlReloaded.init(), true);

  assert.equal(ctrlReloaded.set(false), false);
  assert.equal(storage.getItem('studytrack.dailyFocus'), 'off');
  assert.equal(doc.documentElement.getAttribute('data-daily-focus'), null);
});
