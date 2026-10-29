import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  setupApplicationLifecycle,
  mountTestBridge,
  bootstrapAppRuntime,
} from '../../src/bootstrap/application-bootstrap.js';

test('Application Bootstrap — setupApplicationLifecycle registra eventos e salva no unload sob condições válidas', () => {
  let unloadHandler = null;
  const mockWindow = {
    addEventListener(event, fn) {
      if (event === 'beforeunload') unloadHandler = fn;
    },
    removeEventListener: () => {},
    matchMedia: () => ({ matches: false, addEventListener: () => {} }),
  };
  const mockDocument = {
    body: {},
    addEventListener: () => {},
  };

  let persisted = 0;
  setupApplicationLifecycle({
    window: mockWindow,
    document: mockDocument,
    isTestMode: false,
    canSaveBeforeUnload: () => true,
    onPersistLocal: () => {
      persisted++;
    },
    onResponsiveChange: () => {},
  });

  assert.ok(unloadHandler);
  unloadHandler();
  assert.equal(persisted, 1);

  // Com canSaveBeforeUnload falso:
  setupApplicationLifecycle({
    window: mockWindow,
    document: mockDocument,
    isTestMode: false,
    canSaveBeforeUnload: () => false,
    onPersistLocal: () => {
      persisted++;
    },
    onResponsiveChange: () => {},
  });
  unloadHandler();
  assert.equal(persisted, 1); // Permanece 1
});

test('Application Bootstrap — mountTestBridge inicializa bridge e executa sequência de ciclo de vida', () => {
  const mockWindow = {};
  const scripts = [];
  const mockDocument = {
    createElement(tag) {
      return { tagName: tag.toUpperCase(), src: '' };
    },
    body: {
      appendChild(el) {
        scripts.push(el);
      },
    },
  };

  const lifecycleOrder = [];
  const api = { version: '1.0.0-test' };

  mountTestBridge({
    window: mockWindow,
    document: mockDocument,
    api,
    activateInitialTab: () => lifecycleOrder.push('activateInitialTab'),
    ensureStateDefaults: () => lifecycleOrder.push('ensureStateDefaults'),
    restoreTimerFromState: () => lifecycleOrder.push('restoreTimerFromState'),
    render: () => lifecycleOrder.push('render'),
  });

  assert.equal(mockWindow.__EXTRATO_TEST__, api);
  assert.deepEqual(lifecycleOrder, [
    'activateInitialTab',
    'ensureStateDefaults',
    'restoreTimerFromState',
    'render',
  ]);
  assert.equal(scripts.length, 1);
  assert.equal(scripts[0].src, 'tests/tests.js');
});

test('Application Bootstrap — bootstrapAppRuntime seleciona fluxo correto baseado em isTestMode', async () => {
  let mode = '';
  const testBridgeConfig = {
    window: {},
    document: {
      createElement: () => ({}),
      body: { appendChild: () => {} },
    },
    api: {},
    activateInitialTab: () => {},
    ensureStateDefaults: () => {},
    restoreTimerFromState: () => {},
    render: () => {},
  };

  // 1. Modo Teste:
  await bootstrapAppRuntime({
    isTestMode: true,
    context: {},
    loadState: async () => {
      mode = 'prod';
    },
    activateInitialTab: () => {},
    testBridgeConfig,
  });
  assert.equal(Boolean(testBridgeConfig.window.__EXTRATO_TEST__), true);
  assert.equal(mode, '');

  // 2. Modo Produção:
  await bootstrapAppRuntime({
    isTestMode: false,
    context: { id: 'ctx' },
    loadState: async () => {
      mode = 'prod';
    },
    activateInitialTab: () => {
      mode += '-started';
    },
  });
  assert.equal(mode, 'prod-started');
});
