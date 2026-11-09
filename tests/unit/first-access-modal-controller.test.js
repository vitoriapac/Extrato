import test from 'node:test';
import assert from 'node:assert/strict';
import { createFirstAccessModalController } from '../../src/ui/controllers/first-access-modal-controller.js';

test('first-access-modal-controller — inicializa fechado e responde a open/close', () => {
  let mounted = false;
  const mockContainer = {
    _preactRoot: null,
  };

  const controller = createFirstAccessModalController({
    getContainer: () => mockContainer,
    getState: () => ({ subjects: [] }),
    isDemoMode: () => false,
    isTestMode: () => false,
    onStartGuidedPlan: () => {},
    onStartDemo: () => {},
  });

  assert.equal(controller.isOpen(), false);
  controller.open();
  assert.equal(controller.isOpen(), true);
  assert.equal(controller.getActiveView(), 'welcome');
  controller.openSalesLanding();
  assert.equal(controller.isOpen(), true);
  assert.equal(controller.getActiveView(), 'landing');
  controller.openPaywall('annual', 'Simulador');
  assert.equal(controller.getActiveView(), 'paywall');
  controller.openAdmin();
  assert.equal(controller.getActiveView(), 'admin');
  controller.openLegal('terms');
  assert.equal(controller.getActiveView(), 'legal');
  controller.openCatalog();
  assert.equal(controller.getActiveView(), 'catalog');
  controller.close();
  assert.equal(controller.isOpen(), false);
});

test('first-access-modal-controller — checkAndTrigger abre automaticamente quando é primeiro acesso', () => {
  const mockContainer = {
    _preactRoot: null,
  };

  const mockStorage = {
    store: {},
    getItem(k) {
      return this.store[k] || null;
    },
    setItem(k, v) {
      this.store[k] = v;
    },
  };

  const controller = createFirstAccessModalController({
    getContainer: () => mockContainer,
    getState: () => ({
      subjects: [],
      studySessions: [],
      studyPlans: [],
      questoes: [],
      examDate: null,
    }),
    isDemoMode: () => false,
    isTestMode: () => false,
    storage: mockStorage,
    onStartGuidedPlan: () => {},
    onStartDemo: () => {},
  });

  const didTrigger = controller.checkAndTrigger();
  assert.equal(didTrigger, true);
  assert.equal(controller.isOpen(), true);
});

test('first-access-modal-controller — checkAndTrigger não abre quando já há matérias', () => {
  const controller = createFirstAccessModalController({
    getContainer: () => null,
    getState: () => ({
      subjects: [{ id: 's1', name: 'Direito' }],
      studySessions: [],
      studyPlans: [],
      questoes: [],
      examDate: null,
    }),
    isDemoMode: () => false,
    isTestMode: () => false,
    onStartGuidedPlan: () => {},
    onStartDemo: () => {},
  });

  const didTrigger = controller.checkAndTrigger();
  assert.equal(didTrigger, false);
  assert.equal(controller.isOpen(), false);
});

test('first-access-modal-controller — checkAndTrigger abre admin quando ?admin=1', () => {
  const mockContainer = { _preactRoot: null };
  const mockWindow = {
    location: { search: '?admin=1' },
    document: {},
    addEventListener: () => {},
  };

  const controller = createFirstAccessModalController({
    getContainer: () => mockContainer,
    getState: () => ({ subjects: [{ id: 's1' }] }), // Mesmo com matérias existentes
    isDemoMode: () => false,
    isTestMode: () => false,
    window: mockWindow,
    onStartGuidedPlan: () => {},
    onStartDemo: () => {},
  });

  const didTrigger = controller.checkAndTrigger();
  assert.equal(didTrigger, true);
  assert.equal(controller.isOpen(), true);
  assert.equal(controller.getActiveView(), 'admin');
});

test('first-access-modal-controller — checkAndTrigger abre legal quando ?legal=privacy', () => {
  const mockContainer = { _preactRoot: null };
  const mockWindow = {
    location: { search: '?legal=privacy' },
    document: {},
    addEventListener: () => {},
  };

  const controller = createFirstAccessModalController({
    getContainer: () => mockContainer,
    getState: () => ({ subjects: [{ id: 's1' }] }),
    isDemoMode: () => false,
    isTestMode: () => false,
    window: mockWindow,
    onStartGuidedPlan: () => {},
    onStartDemo: () => {},
  });

  const didTrigger = controller.checkAndTrigger();
  assert.equal(didTrigger, true);
  assert.equal(controller.isOpen(), true);
  assert.equal(controller.getActiveView(), 'legal');
});

test('first-access-modal-controller — checkAndTrigger abre catalogo quando ?catalogo=1', () => {
  const mockContainer = { _preactRoot: null };
  const mockWindow = {
    location: { search: '?catalogo=1' },
    document: {},
    addEventListener: () => {},
  };

  const controller = createFirstAccessModalController({
    getContainer: () => mockContainer,
    getState: () => ({ subjects: [{ id: 's1' }] }),
    isDemoMode: () => false,
    isTestMode: () => false,
    window: mockWindow,
    onStartGuidedPlan: () => {},
    onStartDemo: () => {},
  });

  const didTrigger = controller.checkAndTrigger();
  assert.equal(didTrigger, true);
  assert.equal(controller.isOpen(), true);
  assert.equal(controller.getActiveView(), 'catalog');
});

test('first-access-modal-controller — bindGlobalTriggers expõe __EXTRATO_MODALS__ e responde a eventos', () => {
  const mockContainer = { _preactRoot: null };
  const listeners = {};
  const mockWindow = {
    location: { search: '' },
    document: {},
    addEventListener: (event, handler) => {
      listeners[event] = handler;
    },
  };

  const controller = createFirstAccessModalController({
    getContainer: () => mockContainer,
    getState: () => ({ subjects: [{ id: 's1' }] }),
    isDemoMode: () => false,
    isTestMode: () => false,
    window: mockWindow,
    onStartGuidedPlan: () => {},
    onStartDemo: () => {},
  });

  controller.checkAndTrigger();

  assert.ok(mockWindow.__EXTRATO_MODALS__);
  assert.equal(typeof mockWindow.__EXTRATO_MODALS__.openAdmin, 'function');

  // Testar chamada direta via __EXTRATO_MODALS__
  mockWindow.__EXTRATO_MODALS__.openAdmin();
  assert.equal(controller.isOpen(), true);
  assert.equal(controller.getActiveView(), 'admin');

  // Testar disparo de evento
  assert.ok(listeners['open-legal-terms']);
  listeners['open-legal-terms']();
  assert.equal(controller.getActiveView(), 'legal');

  assert.ok(listeners['open-cloud-catalog']);
  listeners['open-cloud-catalog']();
  assert.equal(controller.getActiveView(), 'catalog');
});
