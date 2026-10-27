import test from 'node:test';
import assert from 'node:assert/strict';
import { createErrorNotebookController } from '../../src/ui/controllers/error-notebook-controller.js';

test('error-notebook-controller — inicializa inativo e alterna com toggle() e open()', () => {
  let activatedTab = '';
  const controller = createErrorNotebookController({
    getState: () => /** @type {any} */ ({ errorFlashcards: [], subjects: [], questoes: [] }),
    getMount: () => null,
    getMainContainer: () => null,
    getToggleBtn: () => null,
    getDueAgendaMount: () => null,
    getDueTodayMount: () => null,
    todayISO: () => '2026-10-27',
    nowISO: () => '2026-10-27T12:00:00.000Z',
    persistAndRender: () => {},
    showToast: () => {},
    activateTab: tab => {
      activatedTab = tab;
    },
  });

  assert.equal(controller.isActive(), false);
  controller.toggle();
  assert.equal(controller.isActive(), true);
  controller.setActive(false);
  assert.equal(controller.isActive(), false);

  controller.open();
  assert.equal(controller.isActive(), true);
  assert.equal(activatedTab, 'questoes');
});

test('error-notebook-controller — syncView atualiza visibilidade dos elementos DOM e labels', () => {
  const mount = { hidden: true };
  const mainContainer = { hidden: false };
  const toggleBtn = {
    textContent: '',
    classList: {
      added: '',
      removed: '',
      add(cls) {
        this.added = cls;
      },
      remove(cls) {
        this.removed = cls;
      },
    },
  };

  let mounted = false;
  let unmounted = false;

  const controller = createErrorNotebookController({
    getState: () => /** @type {any} */ ({ errorFlashcards: [], subjects: [], questoes: [] }),
    getMount: () => /** @type {any} */ (mount),
    getMainContainer: () => /** @type {any} */ (mainContainer),
    getToggleBtn: () => /** @type {any} */ (toggleBtn),
    getDueAgendaMount: () => null,
    getDueTodayMount: () => null,
    todayISO: () => '2026-10-27',
    nowISO: () => '2026-10-27T12:00:00.000Z',
    persistAndRender: () => {},
    showToast: () => {},
    activateTab: () => {},
    mount: () => {
      mounted = true;
    },
    unmount: () => {
      unmounted = true;
    },
  });

  // Inicialmente inativo: mainContainer visível, mount escondido
  assert.equal(controller.syncView(), false);
  assert.equal(mount.hidden, true);
  assert.equal(mainContainer.hidden, false);
  assert.equal(toggleBtn.textContent, 'Caderno de Erros (Flashcards)');

  // Ativa: mainContainer escondido, mount visível
  controller.setActive(true);
  assert.equal(controller.syncView(), true);
  assert.equal(mount.hidden, false);
  assert.equal(mainContainer.hidden, true);
  assert.equal(toggleBtn.textContent, 'Visão de questões');
  assert.equal(toggleBtn.classList.added, 'btn-primary');
});
