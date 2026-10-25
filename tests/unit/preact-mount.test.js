import test from 'node:test';
import assert from 'node:assert/strict';
import { h } from 'preact';
import { mountPreact, unmountPreact } from '../../src/ui/preact-mount.js';
import { createDashboardTabController } from '../../src/ui/tabs/dashboard/dashboard-tab-controller.js';
import { createTodayTabController } from '../../src/ui/tabs/today/today-tab-controller.js';
import { createGoalsTabController } from '../../src/ui/tabs/goals/goals-tab-controller.js';

function createMockContainer() {
  const container = {
    nodeType: 1,
    tagName: 'DIV',
    childNodes: [],
    children: [],
    appendChild(child) {
      this.childNodes.push(child);
      this.children.push(child);
      child.parentNode = this;
      return child;
    },
    removeChild(child) {
      const idx = this.childNodes.indexOf(child);
      if (idx !== -1) this.childNodes.splice(idx, 1);
      const cIdx = this.children.indexOf(child);
      if (cIdx !== -1) this.children.splice(cIdx, 1);
      child.parentNode = null;
      return child;
    },
    insertBefore(newChild, refChild) {
      const idx = this.childNodes.indexOf(refChild);
      if (idx !== -1) {
        this.childNodes.splice(idx, 0, newChild);
        this.children.splice(idx, 0, newChild);
      } else {
        this.appendChild(newChild);
      }
      newChild.parentNode = this;
      return newChild;
    },
    setAttribute() {},
    removeAttribute() {},
    addEventListener() {},
    removeEventListener() {},
    style: {},
    innerHTML: '',
  };
  return container;
}

test('preact-mount — exporta mountPreact e unmountPreact', () => {
  assert.equal(typeof mountPreact, 'function');
  assert.equal(typeof unmountPreact, 'function');
});

test('dashboard-tab-controller — expõe métodos mount além de renderHtml', () => {
  const controller = createDashboardTabController();
  assert.equal(typeof controller.mountQuickStats, 'function');
  assert.equal(typeof controller.mountProgressBars, 'function');
  assert.equal(typeof controller.mountUpcomingList, 'function');
  assert.equal(typeof controller.renderQuickStatsHtml, 'function');
  assert.equal(typeof controller.renderProgressBarsHtml, 'function');
  assert.equal(typeof controller.renderUpcomingListHtml, 'function');
});

test('today-tab-controller — expõe mountExecutionSummary e mountAgendaSections', () => {
  const controller = createTodayTabController({
    formatPlanMinutes: m => `${m}m`,
    formatDatePt: d => d,
  });
  assert.equal(typeof controller.mountExecutionSummary, 'function');
  assert.equal(typeof controller.mountAgendaSections, 'function');
  assert.equal(typeof controller.renderExecutionSummaryHtml, 'function');
  assert.equal(typeof controller.renderAgendaSectionsHtml, 'function');
});

test('goals-tab-controller — expõe mountWeeklyAvailability e mountPlanExecution', () => {
  const controller = createGoalsTabController({
    state: { metas: { horasPorDia: {} } },
    parseLocalDate: () => new Date(),
    todayISO: () => '2026-03-16',
    buildWeeklyAvailability: () => ({ totalMinutes: 0, activeDays: 0, averageHours: 0 }),
    formatPlanMinutes: m => `${m}m`,
    metaHoursToday: () => 0,
    metaHoursForDate: () => 0,
    addDays: d => d,
    startOfWeek: d => d,
    WEEKDAY_LABELS: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
  });
  assert.equal(typeof controller.mountWeeklyAvailability, 'function');
  assert.equal(typeof controller.mountPlanExecution, 'function');
  assert.equal(typeof controller.renderWeeklyAvailabilityHtml, 'function');
  assert.equal(typeof controller.renderPlanExecutionHtml, 'function');
});
