import test from 'node:test';
import assert from 'node:assert/strict';
import { createStudyTimerViewController } from '../../src/ui/controllers/study-timer-view-controller.js';

function createMockDocument() {
  const elements = new Map();

  function getOrCreate(id) {
    if (!elements.has(id)) {
      elements.set(id, {
        id,
        value: '',
        textContent: '',
        innerHTML: '',
        hidden: false,
        disabled: false,
        style: {},
        attributes: new Map(),
        setAttribute(name, val) {
          this.attributes.set(name, String(val));
        },
        removeAttribute(name) {
          this.attributes.delete(name);
        },
        getAttribute(name) {
          return this.attributes.get(name) ?? null;
        },
      });
    }
    return elements.get(id);
  }

  return {
    title: 'StudyTrack',
    body: {
      classList: {
        contains: name => name === 'timer-focus-active',
      },
    },
    getElementById: id => getOrCreate(id),
  };
}

test('createStudyTimerViewController — updateTimerDisplay formata tempo e meta', () => {
  const mockDoc = createMockDocument();
  let pipRendered = false;
  let activeTimerState = {
    startedAt: '2026-10-25T10:00:00Z',
    isRunning: true,
    subjectId: 'sub-1',
    topicId: 'top-1',
    targetMinutes: 30,
    planItemId: 'item-1',
  };

  const controller = createStudyTimerViewController({
    document: mockDoc,
    formatTimer: s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`,
    escapeHtml: s => s,
    escapeAttr: s => s,
    getSubjectName: id => (id === 'sub-1' ? 'Direito' : ''),
    getTopicName: id => (id === 'top-1' ? 'Controle de Constitucionalidade' : ''),
    getSubjectById: () => null,
    subjectsForSelection: () => [],
    topicsForSelection: () => [],
    topicResumeLabel: () => 'Pág 10',
    findDailyPlanItem: id => ({
      item: { id, subjectId: 'sub-1', topicId: 'top-1' },
    }),
    getActiveTimer: () => activeTimerState,
    onPipRender: () => {
      pipRendered = true;
    },
  });

  controller.updateTimerDisplay(600, true);

  assert.equal(mockDoc.getElementById('studyTimerDisplay').textContent, '10:00');
  assert.equal(pipRendered, true);
  assert.match(mockDoc.getElementById('studyTimerTarget').textContent, /Direito — Controle de Constitucionalidade/);
  assert.match(mockDoc.getElementById('studyTimerTarget').textContent, /restantes/);
  assert.equal(mockDoc.getElementById('studyTimerProgress').value, 33);
});

test('createStudyTimerViewController — updateTimerControls alterna visibilidade dos botões', () => {
  const mockDoc = createMockDocument();
  const controller = createStudyTimerViewController({
    document: mockDoc,
    formatTimer: s => `${s}`,
    escapeHtml: s => s,
    escapeAttr: s => s,
    getSubjectName: () => '',
    getTopicName: () => '',
    getSubjectById: () => null,
    subjectsForSelection: () => [],
    topicsForSelection: () => [],
    topicResumeLabel: () => '',
    findDailyPlanItem: () => null,
    getActiveTimer: () => ({}),
  });

  // Em execução
  controller.updateTimerControls(120, true);
  assert.equal(mockDoc.getElementById('timerStartBtn').style.display, 'none');
  assert.equal(mockDoc.getElementById('timerPauseBtn').style.display, 'inline-block');
  assert.equal(mockDoc.getElementById('timerResetBtn').disabled, false);
  assert.equal(mockDoc.getElementById('timerFinishBtn').disabled, false);

  // Pausado com tempo zerado
  controller.updateTimerControls(0, false);
  assert.equal(mockDoc.getElementById('timerStartBtn').style.display, 'inline-block');
  assert.equal(mockDoc.getElementById('timerPauseBtn').style.display, 'none');
  assert.equal(mockDoc.getElementById('timerResetBtn').disabled, true);
  assert.equal(mockDoc.getElementById('timerFinishBtn').disabled, true);
});

test('createStudyTimerViewController — popula seletores de contexto', () => {
  const mockDoc = createMockDocument();
  let activeTimerState = {
    subjectId: 'sub-1',
    topicId: 'top-1',
    type: 'review',
  };

  const controller = createStudyTimerViewController({
    document: mockDoc,
    formatTimer: s => `${s}`,
    escapeHtml: s => s,
    escapeAttr: s => s,
    getSubjectName: () => 'Direito',
    getTopicName: () => 'Tópico 1',
    getSubjectById: id => ({ id, name: 'Direito' }),
    subjectsForSelection: () => [{ id: 'sub-1', name: 'Direito' }],
    topicsForSelection: () => [{ id: 'top-1', name: 'Tópico 1' }],
    topicResumeLabel: () => '',
    findDailyPlanItem: () => null,
    getActiveTimer: () => activeTimerState,
  });

  controller.populateTimerContextControls();

  assert.equal(mockDoc.getElementById('timerSubjectSelect').value, 'sub-1');
  assert.equal(mockDoc.getElementById('timerTopicSelect').value, 'top-1');
  assert.equal(mockDoc.getElementById('timerTypeSelect').value, 'review');
});
