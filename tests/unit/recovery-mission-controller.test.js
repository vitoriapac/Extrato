import test from 'node:test';
import assert from 'node:assert/strict';
import { createRecoveryMissionController } from '../../src/ui/controllers/recovery-mission-controller.js';

test('createRecoveryMissionController — gerencia ciclo de abertura e fechamento', () => {
  let finished = false;
  let containerInner = '';

  /** @type {any} */
  const mockContainer = {
    _content: '',
    appendChild: () => {},
    removeChild: () => {},
    innerHTML: '',
  };

  const controller = createRecoveryMissionController({
    getContainer: () => mockContainer,
    getOverdueReviews: () => [
      {
        id: 'rev-1',
        origin: 'Agenda de Revisões',
        date: '2026-11-01',
        subjectName: 'Direito Constitucional',
        topicName: 'Art. 5º',
        daysOverdue: 7,
      },
    ],
    onCompleteReview: () => {},
    onMissionFinished: () => {
      finished = true;
    },
  });

  assert.equal(controller.isOpen(), false);
  controller.open();
  assert.equal(controller.isOpen(), true);

  controller.close();
  assert.equal(controller.isOpen(), false);
  assert.equal(finished, true);
});

test('createRecoveryMissionController — invoca callback onCompleteReview ao concluir item', () => {
  let completedId = null;
  let completedOrigin = null;

  const controller = createRecoveryMissionController({
    getContainer: () => null,
    getOverdueReviews: () => [],
    onCompleteReview: (id, origin) => {
      completedId = id;
      completedOrigin = origin;
    },
  });

  controller.open();
  assert.equal(controller.isOpen(), true);
  controller.close();
});
