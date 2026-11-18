import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createDelegatedArgumentResolver,
  createSpecialActionResolver,
  composeDelegatedActionHandlers,
} from '../../src/ui/events/delegated-actions.js';

test('createDelegatedArgumentResolver — resolve valores de contexto e literais', () => {
  const resolver = createDelegatedArgumentResolver({
    getTodayDayOfWeek: () => 3,
  });

  const dummyEl = { value: '42', textContent: 'Texto', checked: true };

  assert.equal(resolver('this.value', dummyEl), '42');
  assert.equal(resolver('this.value||null', { value: '' }), null);
  assert.equal(resolver('this.textContent', dummyEl), 'Texto');
  assert.equal(resolver('this.checked', dummyEl), true);
  assert.equal(resolver('this', dummyEl), dummyEl);
  assert.equal(resolver('true', dummyEl), true);
  assert.equal(resolver('false', dummyEl), false);
  assert.equal(resolver('null', dummyEl), null);
  assert.equal(resolver('123.45', dummyEl), 123.45);
  assert.equal(resolver("'hello'", dummyEl), 'hello');
  assert.equal(resolver('"world"', dummyEl), 'world');
  assert.equal(resolver('parseLocalDate(todayISO()).getDay()', dummyEl), 3);

  assert.throws(() => resolver('invalido()', dummyEl), /Argumento de evento não permitido/);
});

test('createSpecialActionResolver — intercepta e despacha casos especiais', () => {
  let perfSubject = '';
  let renderAnalyticsCalled = false;
  let changedList = null;

  const resolver = createSpecialActionResolver({
    onSetPerformanceSubject: val => {
      perfSubject = val;
    },
    renderQuestionAnalytics: () => {
      renderAnalyticsCalled = true;
    },
    goToListPage: (key, page, renderer) => {
      changedList = { key, page, renderer };
      renderer();
    },
    getRenderers: () => ({
      renderStudySessionsHistory: () => 'rendered',
    }),
  });

  // Caso 1: performanceSubjectId
  const handled1 = resolver('performanceSubjectId=this.value;renderQuestionAnalytics()', null, {
    value: 'sub-123',
  });
  assert.equal(handled1, true);
  assert.equal(perfSubject, 'sub-123');
  assert.equal(renderAnalyticsCalled, true);

  // Caso 2: goToListPage
  const handled2 = resolver("goToListPage('sessionDays',2)", null, {});
  assert.equal(handled2, true);
  assert.equal(changedList?.key, 'sessionDays');
  assert.equal(changedList?.page, 2);

  // Caso 3: não reconhecido
  const handled3 = resolver('outroComando()', null, {});
  assert.equal(handled3, false);
});

test('composeDelegatedActionHandlers — combina múltiplos grupos de ações com segurança', () => {
  const groupA = { action1: () => 'a1', action2: () => 'a2' };
  const groupB = { action3: () => 'b3', notAFunction: 'invalid' };

  const combined = composeDelegatedActionHandlers(groupA, groupB);
  assert.equal(typeof combined.action1, 'function');
  assert.equal(typeof combined.action2, 'function');
  assert.equal(typeof combined.action3, 'function');
  assert.equal(combined.notAFunction, undefined);
  assert.equal(Object.getPrototypeOf(combined), null);
});

test('createSpecialActionResolver — goToListPage só aceita lista conhecida e página inteira', () => {
  const calls = [];
  const resolver = createSpecialActionResolver({
    onSetPerformanceSubject() {},
    renderQuestionAnalytics() {},
    goToListPage: (key, page, renderer) => calls.push({ key, page, rendered: renderer() }),
    getRenderers: () => ({
      renderSimulados: () => 'ok',
      renderQuestoes: () => 'q',
      renderAgenda: () => 'a',
      renderCalendar: () => 'cal',
      renderSubjects: () => 'sub',
    }),
  });
  assert.equal(resolver("goToListPage('simulations',3)", null, {}), true);
  assert.deepEqual(calls, [{ key: 'simulations', page: 3, rendered: 'ok' }]);
  assert.equal(resolver("goToListPage('simulations',0)", null, {}), true);
  assert.equal(calls[1].page, 1);
  assert.equal(resolver("goToListPage('questions',2)", null, {}), true);
  assert.deepEqual(calls[2], { key: 'questions', page: 2, rendered: 'q' });
  assert.equal(resolver("goToListPage('agendaCompleted',4)", null, {}), true);
  assert.deepEqual(calls[3], { key: 'agendaCompleted', page: 4, rendered: 'a' });
  assert.equal(resolver("goToListPage('calendar',2)", null, {}), true);
  assert.deepEqual(calls[4], { key: 'calendar', page: 2, rendered: 'cal' });
  assert.equal(resolver("goToListPage('subjectTopics:subject-ab_12',2)", null, {}), true);
  assert.deepEqual(calls[5], { key: 'subjectTopics:subject-ab_12', page: 2, rendered: 'sub' });
  assert.equal(resolver("goToListPage('subjectTopics:x'+alert(1),2)", null, {}), false);
  assert.equal(resolver("goToListPage('subjectTopics:',2)", null, {}), false);
  assert.equal(resolver("goToListPage('outra',2)", null, {}), false);
  assert.equal(resolver("goToListPage('simulations',-1)", null, {}), false);
  assert.equal(resolver("goToListPage('simulations',2);alert(1)", null, {}), false);
  assert.equal(calls.length, 6);
});
