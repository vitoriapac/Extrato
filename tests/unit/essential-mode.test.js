import test from 'node:test';
import assert from 'node:assert/strict';
import { createEssentialController } from '../../src/ui/controllers/preferences-controller.js';

function fakeDocument() {
  const attrs = new Map();
  return {
    documentElement: {
      getAttribute: name => attrs.get(name) ?? null,
      setAttribute: (name, value) => attrs.set(name, value),
      removeAttribute: name => attrs.delete(name),
    },
    getElementById: () => null,
  };
}
function fakeStorage(initial = {}) {
  const data = { ...initial };
  return { data, getItem: key => data[key] ?? null, setItem: (key, value) => (data[key] = String(value)) };
}

test('modo Essencial começa ligado para quem não tem dados e grava a escolha (F10)', () => {
  const storage = fakeStorage();
  const essential = createEssentialController({ document: fakeDocument(), storage });
  assert.equal(essential.decide({ hasData: false }), true);
  assert.equal(storage.data['studytrack.essential'], 'on');
  // Once decided, later data does not flip the mode.
  assert.equal(essential.decide({ hasData: true }), true);
});

test('quem já tem registros começa no modo completo; a escolha manual prevalece (F10)', () => {
  const storage = fakeStorage();
  const essential = createEssentialController({ document: fakeDocument(), storage });
  assert.equal(essential.decide({ hasData: true }), false);
  assert.equal(storage.data['studytrack.essential'], 'off');
  assert.equal(essential.toggle(), true);
  assert.equal(storage.data['studytrack.essential'], 'on');
});

test('demonstração e testes automatizados mostram o app completo sem decidir o padrão (F10)', () => {
  const storage = fakeStorage();
  const essential = createEssentialController({ document: fakeDocument(), storage });
  assert.equal(essential.decide({ demo: true }), false);
  assert.equal(essential.decide({ testMode: true }), false);
  assert.equal(storage.data['studytrack.essential'], undefined);
  const chosen = createEssentialController({
    document: fakeDocument(),
    storage: fakeStorage({ 'studytrack.essential': 'on' }),
  });
  assert.equal(chosen.decide({ demo: true }), false);
  assert.equal(chosen.decide({ testMode: true }), true);
});
