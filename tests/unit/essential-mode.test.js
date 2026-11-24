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
  return {
    data,
    getItem: key => data[key] ?? null,
    setItem: (key, value) => (data[key] = String(value)),
  };
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

test('a Semana marca como avançados a execução das prioridades, o histórico de adaptações e a estratégia por fase', async () => {
  const { readFileSync } = await import('node:fs');
  const { renderStrategicExecution } =
    await import('../../src/ui/renderers/strategic-execution-renderer.js');
  const priorities = renderStrategicExecution(
    { priorityPlannedMinutes: 60, priorityExecutedMinutes: 30, strategicAdherence: 50 },
    '09/11 a 15/11'
  );
  assert.match(priorities, /data-advanced="execução das prioridades"/);
  assert.match(
    readFileSync('index.html', 'utf8'),
    /id="adaptivePlanningHistory" data-advanced="histórico de adaptações"/
  );
  const controller = readFileSync('src/ui/tabs/goals/study-plan-builder-controller.ts', 'utf8');
  assert.match(controller, /'Revisar proposta de estratégia', 'estratégia por fase'/);
});

test('decorateAdvancedReveals põe "Mostrar …" antes do bloco avançado e uma vez só', async () => {
  const { decorateAdvancedReveals } = await import('../../src/ui/essential-mode.js');
  const made = [];
  const block = {
    dataset: { advanced: 'execução das prioridades' },
    ownerDocument: {
      createElement: () => {
        const el = { className: '', textContent: '', addEventListener() {}, type: '' };
        made.push(el);
        return el;
      },
    },
    before(el) {
      block.inserted = el;
    },
  };
  const root = /** @type {any} */ ({
    querySelectorAll: () => (block.dataset.advancedReady === undefined ? [block] : []),
  });
  decorateAdvancedReveals(root);
  decorateAdvancedReveals(root);
  assert.equal(made.length, 1);
  assert.equal(block.inserted.textContent, 'Mostrar execução das prioridades');
});

test('modo completo é sugerido a quem tem 14 dias de registros ou 300 questões (item 10)', async () => {
  const { essentialGraduation, renderEssentialGraduation } =
    await import('../../src/ui/essential-mode.js');
  const days = n =>
    Array.from({ length: n }, (_, i) => ({ date: `2026-11-${String(i + 1).padStart(2, '0')}` }));
  assert.deepEqual(essentialGraduation({ studySessions: days(13) }), {
    ready: false,
    days: 13,
    questions: 0,
  });
  assert.equal(essentialGraduation({ studySessions: days(10), questoes: days(14) }).ready, true);
  assert.equal(
    essentialGraduation({ questoes: [{ date: '2026-11-01', resolved: 300 }] }).ready,
    true
  );

  const el = () => ({
    children: [],
    listeners: {},
    setAttribute() {},
    append(...items) {
      this.children.push(...items);
    },
    addEventListener(type, fn) {
      this.listeners[type] = fn;
    },
  });
  const slot = {
    children: [],
    ownerDocument: { createElement: el },
    replaceChildren(...items) {
      this.children = items;
    },
  };
  const storage = fakeStorage();
  let full = 0;
  const show = (essentialOn, state = { studySessions: days(14) }) =>
    renderEssentialGraduation({ slot, essentialOn, state, storage, onShowFull: () => full++ });

  show(false);
  assert.equal(slot.children.length, 0, 'fora do Essencial não aparece');
  show(true, { studySessions: days(3) });
  assert.equal(slot.children.length, 0, 'sem evidência não aparece');
  show(true);
  assert.equal(slot.children.length, 1);
  const [, showFull] = slot.children[0].children;
  showFull.listeners.click();
  assert.equal(full, 1);
  assert.equal(storage.data['studytrack.essential.graduation'], 'full');
  assert.equal(slot.children.length, 0);
  show(true);
  assert.equal(slot.children.length, 0, 'depois de respondido não volta');
});
