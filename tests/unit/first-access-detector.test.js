import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isFirstAccessSession,
  markFirstAccessDismissed,
  FIRST_ACCESS_STORAGE_KEY,
} from '../../src/features/onboarding/first-access-detector.js';

test('first-access-detector: identifica primeiro acesso real em estado totalmente zerado', () => {
  const cleanState = {
    subjects: [],
    studySessions: [],
    studyPlans: [],
    questoes: [],
    examDate: null,
  };

  const isFirst = isFirstAccessSession(cleanState, {
    isDemoMode: false,
    isTestMode: false,
    storage: { getItem: () => null },
  });

  assert.equal(isFirst, true);
});

test('first-access-detector: não dispara quando há disciplinas cadastradas', () => {
  const stateWithSubjects = {
    subjects: [{ id: 's1', name: 'Português' }],
    studySessions: [],
    studyPlans: [],
    questoes: [],
    examDate: null,
  };

  assert.equal(
    isFirstAccessSession(stateWithSubjects, { storage: { getItem: () => null } }),
    false
  );
});

test('first-access-detector: não dispara quando data da prova já foi definida', () => {
  const stateWithExamDate = {
    subjects: [],
    studySessions: [],
    studyPlans: [],
    questoes: [],
    examDate: '2026-12-31',
  };

  assert.equal(
    isFirstAccessSession(stateWithExamDate, { storage: { getItem: () => null } }),
    false
  );
});

test('first-access-detector: não dispara em modo demo ou modo teste', () => {
  const cleanState = {
    subjects: [],
    studySessions: [],
    studyPlans: [],
    questoes: [],
    examDate: null,
  };

  assert.equal(isFirstAccessSession(cleanState, { isDemoMode: true }), false);
  assert.equal(isFirstAccessSession(cleanState, { isTestMode: true }), false);
});

test('first-access-detector: respeita flag de descarte no storage', () => {
  const cleanState = {
    subjects: [],
    studySessions: [],
    studyPlans: [],
    questoes: [],
    examDate: null,
  };

  const mockStorage = {
    store: { [FIRST_ACCESS_STORAGE_KEY]: 'true' },
    getItem(key) {
      return this.store[key] || null;
    },
    setItem(key, val) {
      this.store[key] = val;
    },
  };

  assert.equal(isFirstAccessSession(cleanState, { storage: mockStorage }), false);

  const freshStorage = {
    store: {},
    getItem(key) {
      return this.store[key] || null;
    },
    setItem(key, val) {
      this.store[key] = val;
    },
  };

  assert.equal(isFirstAccessSession(cleanState, { storage: freshStorage }), true);
  markFirstAccessDismissed(freshStorage);
  assert.equal(freshStorage.store[FIRST_ACCESS_STORAGE_KEY], 'true');
  assert.equal(isFirstAccessSession(cleanState, { storage: freshStorage }), false);
});
