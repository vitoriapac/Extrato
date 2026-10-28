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
    getListViewSteps: () => ({ questions: 10 }),
    getListViewState: () => ({ questionsVisible: 20 }),
    changeListLimit: (key, delta, renderer) => {
      changedList = { key, delta, renderer };
      renderer();
    },
    getRenderers: () => ({
      renderQuestoes: () => 'rendered',
    }),
  });

  // Caso 1: performanceSubjectId
  const handled1 = resolver('performanceSubjectId=this.value;renderQuestionAnalytics()', null, {
    value: 'sub-123',
  });
  assert.equal(handled1, true);
  assert.equal(perfSubject, 'sub-123');
  assert.equal(renderAnalyticsCalled, true);

  // Caso 2: changeListLimit
  const handled2 = resolver(
    "changeListLimit('questions',LIST_VIEW_STEPS.questions,renderQuestoes)",
    null,
    {}
  );
  assert.equal(handled2, true);
  assert.equal(changedList?.key, 'questions');
  assert.equal(changedList?.delta, 10);

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
