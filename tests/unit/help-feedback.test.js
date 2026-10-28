import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getHelpFeedbackMap,
  getTopicFeedback,
  saveTopicFeedback,
  clearTopicFeedback,
} from '../../src/domain/help/help-feedback.js';

function createMockStorage(initial = {}) {
  const store = new Map(Object.entries(initial));
  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, String(value));
    },
    removeItem(key) {
      store.delete(key);
    },
  };
}

test('getTopicFeedback — retorna null para tópico não avaliado ou sem storage', () => {
  assert.equal(getTopicFeedback(null, 'topic-1'), null);
  const storage = createMockStorage();
  assert.equal(getTopicFeedback(storage, 'topic-1'), null);
});

test('saveTopicFeedback & getTopicFeedback — salva e recupera avaliação booleana', () => {
  const storage = createMockStorage();
  saveTopicFeedback(storage, 'spaced-repetition', true, '2026-10-27T20:00:00Z');
  assert.equal(getTopicFeedback(storage, 'spaced-repetition'), true);

  const map = getHelpFeedbackMap(storage);
  assert.equal(map['spaced-repetition'].helpful, true);
  assert.equal(map['spaced-repetition'].timestamp, '2026-10-27T20:00:00Z');

  saveTopicFeedback(storage, 'projections', false);
  assert.equal(getTopicFeedback(storage, 'projections'), false);
});

test('clearTopicFeedback — remove a avaliação existente sem afetar outras', () => {
  const storage = createMockStorage();
  saveTopicFeedback(storage, 'topic-a', true);
  saveTopicFeedback(storage, 'topic-b', false);

  clearTopicFeedback(storage, 'topic-a');
  assert.equal(getTopicFeedback(storage, 'topic-a'), null);
  assert.equal(getTopicFeedback(storage, 'topic-b'), false);
});
