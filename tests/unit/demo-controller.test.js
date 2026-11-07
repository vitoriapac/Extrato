import test from 'node:test';
import assert from 'node:assert/strict';
import { createDemoController } from '../../src/ui/controllers/demo-controller.js';
function node(dataset = {}) {
  const handlers = {};
  return {
    dataset,
    hidden: false,
    disabled: false,
    title: '',
    addEventListener: (name, handler) => (handlers[name] = handler),
    removeEventListener: name => delete handlers[name],
    click: () => handlers.click?.(),
    handlers,
  };
}
test('controlador sincroniza proteção e gerencia o ciclo da demo', () => {
  const nodes = {
      demoBanner: node(),
      enterDemoBtn: node(),
      timerFocusDemoLabel: node(),
      demoEmptyCta: node(),
      resetDemoBtn: node(),
      exitDemoBtn: node(),
      demoReportShortcut: node(),
      exportReportBtn: node(),
    },
    target = node({ demoTarget: 'hoje' }),
    storage = {
      values: new Map(),
      setItem(key, value) {
        this.values.set(key, value);
      },
    },
    calls = [],
    document = {
      getElementById: id => nodes[id],
      querySelectorAll: selector =>
        selector === '[data-demo-protected]'
          ? [target]
          : selector === '[data-demo-target]'
            ? [target]
            : [],
    },
    controller = createDemoController({
      document,
      storage,
      demoKey: 'demo',
      flashKey: 'flash',
      isDemo: true,
      getState: () => ({ subjects: [], studySessions: [] }),
      enterMode: () => calls.push('enter'),
      resetMode: () => calls.push('reset'),
      exitMode: () => calls.push('exit'),
      confirm: (_message, action) => action(),
      reload: tab => calls.push(tab ? `reload:${tab}` : 'reload'),
      activateTab: name => calls.push(name),
    });
  nodes.timerFocusDemoLabel.hidden = true;
  controller.mount();
  assert.equal(nodes.demoBanner.hidden, false);
  assert.equal(nodes.timerFocusDemoLabel.hidden, false);
  assert.equal(nodes.enterDemoBtn.hidden, true);
  assert.equal(target.disabled, true);
  nodes.resetDemoBtn.click();
  nodes.exitDemoBtn.click();
  target.click();
  assert.deepEqual(calls, ['reset', 'reload', 'exit', 'reload:dashboard', 'hoje']);
  assert.match(storage.values.get('flash'), /restaurados/);
});
test('prévia da demo só carrega os dados após escolha explícita', () => {
  const nodes = {
      enterDemoBtn: node(),
      confirmDemoIntroBtn: node(),
      cancelDemoIntroBtn: node(),
      demoHeaderBadge: node(),
    },
    dialog = {
      open: false,
      showModal() {
        this.open = true;
      },
      close() {
        this.open = false;
      },
    },
    calls = [],
    document = {
      getElementById: id => (id === 'demoIntroDialog' ? dialog : nodes[id]),
      querySelectorAll: () => [],
    },
    controller = createDemoController({
      document,
      storage: {},
      isDemo: false,
      getState: () => ({ subjects: [], studySessions: [] }),
      enterMode: () => calls.push('enter'),
      reload: () => calls.push('reload'),
    });
  controller.mount();
  nodes.enterDemoBtn.click();
  assert.equal(dialog.open, true);
  assert.deepEqual(calls, []);
  nodes.cancelDemoIntroBtn.click();
  assert.equal(dialog.open, false);
  nodes.enterDemoBtn.click();
  nodes.confirmDemoIntroBtn.click();
  assert.deepEqual(calls, ['enter', 'reload']);
  assert.equal(nodes.demoHeaderBadge.hidden, true);
});

test('confirmar a demonstração solicita reinicialização na visão geral', () => {
  const enterButton = node(),
    confirmButton = node(),
    calls = [],
    dialog = {
      open: false,
      showModal() {
        this.open = true;
      },
    },
    document = {
      getElementById: id =>
        ({ demoIntroDialog: dialog, enterDemoBtn: enterButton, confirmDemoIntroBtn: confirmButton })[
          id
        ],
      querySelectorAll: () => [],
    },
    controller = createDemoController({
      document,
      storage: {},
      isDemo: false,
      getState: () => ({ subjects: [], studySessions: [] }),
      enterMode: () => calls.push('enter'),
      reload: tab => calls.push(`reload:${tab}`),
    });

  controller.mount();
  enterButton.click();
  confirmButton.click();

  assert.deepEqual(calls, ['enter', 'reload:dashboard']);
});

test('demoEmptyCta oculta imediatamente ao criar disciplinas, planos ou sessões', () => {
  const nodes = {
    demoEmptyCta: node(),
  };
  let state = { subjects: [], studySessions: [], studyPlans: [], dailyPlans: [] };
  const document = {
    getElementById: id => nodes[id],
    querySelectorAll: () => [],
  };
  const controller = createDemoController({
    document,
    storage: {},
    isDemo: false,
    getState: () => state,
  });
  controller.mount();
  assert.equal(nodes.demoEmptyCta.hidden, false);

  state = { subjects: [{ id: 's1' }], studySessions: [], studyPlans: [], dailyPlans: [] };
  controller.sync();
  assert.equal(nodes.demoEmptyCta.hidden, true);

  state = {
    subjects: [],
    studySessions: [],
    studyPlans: [],
    dailyPlans: [{ date: '2026-10-01', items: [{ id: 'i1' }] }],
  };
  controller.sync();
  assert.equal(nodes.demoEmptyCta.hidden, true);
});
