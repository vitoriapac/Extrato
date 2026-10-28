import test from 'node:test';
import assert from 'node:assert/strict';
import { createDialogFeedback } from '../../src/ui/primitives/modal-dialogs.js';

function createMockDocument() {
  const elements = new Map();

  function getOrCreate(id) {
    if (!elements.has(id)) {
      elements.set(id, {
        id,
        textContent: '',
        classList: {
          classes: new Set(),
          add: c => elements.get(id).classList.classes.add(c),
          remove: c => elements.get(id).classList.classes.delete(c),
          contains: c => elements.get(id).classList.classes.has(c),
        },
      });
    }
    return elements.get(id);
  }

  return {
    getElementById: id => getOrCreate(id),
  };
}

test('createDialogFeedback — showToast exibe mensagem e adiciona classe show', () => {
  const mockDoc = createMockDocument();
  const dialogs = createDialogFeedback({ document: mockDoc });

  dialogs.showToast('Operação realizada com sucesso');

  const toast = mockDoc.getElementById('toast');
  assert.equal(toast.textContent, 'Operação realizada com sucesso');
  assert.equal(toast.classList.contains('show'), true);
});

test('createDialogFeedback — flashSaved adiciona classe show ao indicador', () => {
  const mockDoc = createMockDocument();
  const dialogs = createDialogFeedback({ document: mockDoc });

  dialogs.flashSaved();

  const indicator = mockDoc.getElementById('saveIndicator');
  assert.equal(indicator.classList.contains('show'), true);
});

test('createDialogFeedback — showConfirm e showPrompt delegam ao modalController', () => {
  const mockDoc = createMockDocument();
  let confirmCalled = false;
  let promptCalled = false;

  const mockModalController = {
    confirm: (msg, onConfirm) => {
      confirmCalled = true;
      onConfirm('sim');
    },
    prompt: (msg, opts, onConfirm) => {
      promptCalled = true;
      onConfirm('valor preenchido');
    },
  };

  const dialogs = createDialogFeedback({
    document: mockDoc,
    modalController: mockModalController,
  });

  let confirmedValue = null;
  dialogs.showConfirm('Deseja excluir?', val => {
    confirmedValue = val;
  });
  assert.equal(confirmCalled, true);
  assert.equal(confirmedValue, 'sim');

  let promptedValue = null;
  dialogs.showPrompt('Informe o nome', {}, val => {
    promptedValue = val;
  });
  assert.equal(promptCalled, true);
  assert.equal(promptedValue, 'valor preenchido');
});
