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
