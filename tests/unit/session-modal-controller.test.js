import test from 'node:test';
import assert from 'node:assert/strict';
import { createSessionModalController } from '../../src/ui/controllers/session-modal-controller.js';

function createMockDocument() {
  const elements = new Map();

  function getOrCreate(id) {
    if (!elements.has(id)) {
      const listeners = new Map();
      elements.set(id, {
        id,
        value: '',
        textContent: '',
        innerHTML: '',
        hidden: false,
        open: false,
        disabled: false,
        dataset: {},
        classList: {
          classes: new Set(),
          add: c => elements.get(id).classList.classes.add(c),
          remove: c => elements.get(id).classList.classes.delete(c),
          contains: c => elements.get(id).classList.classes.has(c),
        },
        addEventListener: (event, handler) => {
          if (!listeners.has(event)) listeners.set(event, []);
          listeners.get(event).push(handler);
        },
        dispatchEvent: eventName => {
          const list = listeners.get(eventName) || [];
          for (const fn of list) fn();
        },
      });
    }
    return elements.get(id);
  }

  return {
    getElementById: id => getOrCreate(id),
    querySelectorAll: selector => [],
  };
}

test('createSessionModalController — abre modal e popula dados iniciais', () => {
  const mockDoc = createMockDocument();
  const controller = createSessionModalController({
    document: mockDoc,
    formatTimer: s => `${s}s`,
    escapeHtml: s => s,
    escapeAttr: s => s,
    getSubjectById: id => ({ id, name: 'Direito' }),
    getTopicById: id => ({ topic: { bookmark: { label: 'Artigo 5' } } }),
    subjectsForSelection: () => [{ id: 'sub-1', name: 'Direito Constitucional' }],
    topicsForSelection: () => [{ id: 'top-1', name: 'Direitos Fundamentais' }],
  });

  controller.show(120, { subjectId: 'sub-1', topicId: 'top-1', type: 'study' });

  assert.equal(mockDoc.getElementById('sessionModalDuration').textContent, '120s');
  assert.equal(mockDoc.getElementById('sessionModalSubject').value, 'sub-1');
  assert.equal(mockDoc.getElementById('sessionModalTopic').value, 'top-1');
  assert.equal(mockDoc.getElementById('sessionModalOverlay').classList.contains('show'), true);

  controller.hide();
  assert.equal(mockDoc.getElementById('sessionModalOverlay').classList.contains('show'), false);
});

test('createSessionModalController — lê valores do formulário', () => {
  const mockDoc = createMockDocument();
  const controller = createSessionModalController({
    document: mockDoc,
    formatTimer: s => `${s}s`,
    escapeHtml: s => s,
    escapeAttr: s => s,
    getSubjectById: () => null,
    getTopicById: () => null,
    subjectsForSelection: () => [],
    topicsForSelection: () => [],
  });

  mockDoc.getElementById('sessionModalSubject').value = 'sub-1';
  mockDoc.getElementById('sessionModalTopic').value = 'top-1';
  mockDoc.getElementById('sessionModalType').value = 'questions';
  mockDoc.getElementById('sessionModalResolved').value = '20';
  mockDoc.getElementById('sessionModalCorrect').value = '18';
  mockDoc.getElementById('sessionModalNotes').value = ' Anotação ';

  const formValues = controller.readFormValues();
  assert.equal(formValues.subjectId, 'sub-1');
  assert.equal(formValues.topicId, 'top-1');
  assert.equal(formValues.type, 'questions');
  assert.equal(formValues.resolved, 20);
  assert.equal(formValues.correct, 18);
  assert.equal(formValues.notes, 'Anotação');
});

test('createSessionModalController — manipula ponto de parada (bookmark)', () => {
  const mockDoc = createMockDocument();
  const controller = createSessionModalController({
    document: mockDoc,
    formatTimer: s => `${s}s`,
    escapeHtml: s => s,
    escapeAttr: s => s,
    getSubjectById: () => null,
    getTopicById: id => (id === 'top-1' ? { topic: { bookmark: { label: 'Página 42' } } } : null),
    subjectsForSelection: () => [],
    topicsForSelection: () => [],
  });

  controller.fillSessionBookmarkFields('top-1');
  assert.equal(mockDoc.getElementById('sessionBookmarkSection').hidden, false);
  assert.equal(mockDoc.getElementById('sessionBookmarkLabel').value, 'Página 42');

  controller.clearSessionBookmarkFields();
  assert.equal(mockDoc.getElementById('sessionBookmarkSection').dataset.clear, '1');
  assert.equal(mockDoc.getElementById('sessionBookmarkLabel').value, '');
});

test('createSessionModalController — bindEvents propaga ações aos manipuladores', () => {
  const mockDoc = createMockDocument();
  const controller = createSessionModalController({
    document: mockDoc,
    formatTimer: s => `${s}s`,
    escapeHtml: s => s,
    escapeAttr: s => s,
    getSubjectById: () => null,
    getTopicById: () => null,
    subjectsForSelection: () => [],
    topicsForSelection: () => [],
  });

  let skipped = false;
  let dismissed = false;
  let savedValues = null;

  controller.bindEvents({
    onSkip: () => {
      skipped = true;
    },
    onDismiss: () => {
      dismissed = true;
    },
    onSave: values => {
      savedValues = values;
    },
  });

  mockDoc.getElementById('sessionModalSubject').value = 'sub-1';
  mockDoc.getElementById('sessionModalNotes').value = 'Notas de teste';

  mockDoc.getElementById('sessionModalSkipBtn').dispatchEvent('click');
  assert.equal(skipped, true);

  mockDoc.getElementById('sessionModalOverlay').dispatchEvent('session-modal-dismiss');
  assert.equal(dismissed, true);

  mockDoc.getElementById('sessionModalSaveBtn').dispatchEvent('click');
  assert.notEqual(savedValues, null);
  assert.equal(savedValues.subjectId, 'sub-1');
  assert.equal(savedValues.notes, 'Notas de teste');
});
