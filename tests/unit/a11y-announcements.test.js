import test from 'node:test';
import assert from 'node:assert/strict';
import { announceAriaLive, announceTimerEvent } from '../../src/ui/primitives/a11y.ts';
import { createTimerController } from '../../src/ui/controllers/timer-controller.ts';

test('announceAriaLive atualiza o elemento após pequeno timeout', async () => {
  let text = '';
  // Mock global document
  const mockElement = {
    set textContent(val) {
      text = val;
    },
    get textContent() {
      return text;
    },
  };

  const originalDocument = globalThis.document;
  /** @type {any} */ (globalThis).document = {
    getElementById(/** @type {string} */ id) {
      if (id === 'timerAriaLive') return mockElement;
      return null;
    },
  };

  try {
    announceTimerEvent('start');
    assert.equal(mockElement.textContent, '', 'Limpa primeiro para forçar anúncio');
    await new Promise(resolve => setTimeout(resolve, 50));
    assert.equal(mockElement.textContent, 'Cronômetro iniciado.');

    announceTimerEvent('pause');
    await new Promise(resolve => setTimeout(resolve, 50));
    assert.equal(mockElement.textContent, 'Cronômetro pausado.');

    announceTimerEvent('reset');
    await new Promise(resolve => setTimeout(resolve, 50));
    assert.equal(mockElement.textContent, 'Cronômetro zerado.');

    announceTimerEvent('finish');
    await new Promise(resolve => setTimeout(resolve, 50));
    assert.equal(mockElement.textContent, 'Cronômetro finalizado. Abrindo registro de sessão.');
  } finally {
    globalThis.document = originalDocument;
  }
});

test('createTimerController dispara onAnnounce em start, pause e reset', () => {
  const announcements = [];
  const activeTimer = {
    accumulatedSeconds: 0,
    isRunning: false,
    startedAt: null,
    runStartedAt: null,
  };

  const controller = createTimerController({
    getActiveTimer: () => activeTimer,
    nowISO: () => '2026-10-27T10:00:00.000Z',
    onAnnounce: event => announcements.push(event),
  });

  controller.start();
  assert.deepEqual(announcements, ['start']);

  controller.pause();
  assert.deepEqual(announcements, ['start', 'pause']);

  controller.reset();
  // pause(false) seguido por reset
  assert.deepEqual(announcements, ['start', 'pause', 'pause', 'reset']);
});
