import test from 'node:test';
import assert from 'node:assert/strict';
import { generateDemoData } from '../../src/demo/demo-generator.js';

const addDays = (date, days) => {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
};

// Datas em dias da semana diferentes: a coerência não pode depender de o dia cair numa sexta.
for (const today of ['2026-11-13', '2026-11-15', '2026-11-16', '2026-11-18']) {
  test(`demo ${today}: toda sessão dos últimos 14 dias está ligada a uma atividade do plano`, () => {
    const state = generateDemoData({ today });
    const recent = state.studySessions.filter(
      session => session.date >= addDays(today, -14) && session.date < today
    );
    assert.ok(recent.length > 0);
    const unlinked = recent.filter(session => !session.planItemId);
    assert.deepEqual(
      unlinked.map(session => session.date),
      [],
      'sessões recentes sem vínculo com o plano'
    );
  });

  test(`demo ${today}: o plano dos últimos 7 dias cobre os dias estudados`, () => {
    const state = generateDemoData({ today });
    const start = addDays(today, -6);
    const studiedDays = new Set(
      state.studySessions
        .filter(session => session.date >= start && session.date < today)
        .map(session => session.date)
    );
    const plannedDays = new Set(
      state.dailyPlans
        .filter(plan => plan.date >= start && plan.date < today)
        .map(plan => plan.date)
    );
    for (const day of studiedDays) assert.ok(plannedDays.has(day), `sem plano em ${day}`);
    const planned = state.dailyPlans
      .filter(plan => plan.date >= start && plan.date < today)
      .reduce((sum, plan) => sum + plan.plannedMinutes, 0);
    const studied =
      state.studySessions
        .filter(session => session.date >= start && session.date < today)
        .reduce((sum, session) => sum + session.durationSeconds, 0) / 60;
    // Volume de carga plausível (a demo não pode mostrar 286%).
    assert.ok(studied / planned > 0.6 && studied / planned < 1.3, `volume ${studied / planned}`);
  });

  test(`demo ${today}: a meta semanal é de tópicos e a semana tem tópico concluído`, () => {
    const state = generateDemoData({ today });
    assert.equal(state.metas.semanal, 5);
    assert.equal(state.metas.mensal, 20);
    const completedRecently = state.topicHistory.filter(
      event => event.type === 'topic_completed' && event.date >= addDays(today, -3)
    );
    assert.ok(completedRecently.length >= 1);
  });
}
