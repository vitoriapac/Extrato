import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildDelegatedActionHandlers,
  registerDelegatedActions,
} from '../../src/ui/navigation/delegated-actions-registry.js';

test('buildDelegatedActionHandlers — mapeia métodos dos controladores delegados', () => {
  let openWeeklyCloseCalled = false;
  let addAgendaRowCalled = false;
  let applyGoalCalled = false;
  let planPreviewCalled = false;

  const mockControllers = {
    weeklyClose: {
      openWeeklyClose: () => {
        openWeeklyCloseCalled = true;
      },
    },
    reviews: {
      addAgendaRow: () => {
        addAgendaRowCalled = true;
      },
    },
    goals: {
      applyTodayGoalToAllDays: () => {
        applyGoalCalled = true;
      },
    },
    studyPlan: {
      calculateStudyPlanPreview: () => {
        planPreviewCalled = true;
      },
    },
  };

  const handlers = buildDelegatedActionHandlers({
    document: {},
    todayISO: () => '2026-10-29',
    parseLocalDate: () => new Date(),
    showToast: () => {},
    activateTab: () => {},
    controllers: mockControllers,
  });

  assert.equal(Object.getPrototypeOf(handlers), null);
  assert.equal(typeof handlers.openWeeklyClose, 'function');
  assert.equal(typeof handlers.addAgendaRow, 'function');
  assert.equal(typeof handlers.applyTodayGoalToAllDays, 'function');
  assert.equal(typeof handlers.calculateStudyPlanPreview, 'function');

  handlers.openWeeklyClose();
  assert.equal(openWeeklyCloseCalled, true);

  handlers.addAgendaRow();
  assert.equal(addAgendaRowCalled, true);

  handlers.applyTodayGoalToAllDays();
  assert.equal(applyGoalCalled, true);

  handlers.calculateStudyPlanPreview();
  assert.equal(planPreviewCalled, true);
});

test('buildDelegatedActionHandlers — suporta customHandlers prioritários', () => {
  let customActionCalled = false;

  const handlers = buildDelegatedActionHandlers({
    document: {},
    todayISO: () => '2026-10-29',
    parseLocalDate: () => new Date(),
    showToast: () => {},
    activateTab: () => {},
    customHandlers: {
      myCustomAction: () => {
        customActionCalled = true;
      },
    },
  });

  assert.equal(typeof handlers.myCustomAction, 'function');
  handlers.myCustomAction();
  assert.equal(customActionCalled, true);
});

test('registerDelegatedActions — registra controller e escuta eventos', () => {
  const events = {};
  const mockDoc = {
    addEventListener: (type, handler) => {
      events[type] = handler;
    },
  };

  let toastMessage = '';
  const result = registerDelegatedActions({
    document: mockDoc,
    todayISO: () => '2026-10-29',
    parseLocalDate: () => new Date(2026, 9, 29),
    showToast: msg => {
      toastMessage = msg;
    },
    activateTab: () => {},
    controllers: {},
  });

  assert.ok(result.controller);
  assert.ok(result.handlers);
  assert.equal(typeof events['click'], 'function');
  assert.equal(typeof events['change'], 'function');
});
