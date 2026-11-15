import test from 'node:test';
import assert from 'node:assert/strict';
import { isCapacityInformed } from '../../src/application/goals/capacity-informed.js';
import { createSettingsRepository } from '../../src/repositories/settings-repository.js';

const empty = () => ({ metas: { horasPorDia: { 0: 2.5, 1: 2.5, 2: 2.5, 3: 2.5, 4: 2.5, 5: 2.5, 6: 2.5 } }, studySessions: [], studyPlans: [], dailyPlans: [] });

test('perfil vazio com o padrão de 17 h 30 não tem capacidade informada', () => {
  assert.equal(isCapacityInformed(empty()), false);
  assert.equal(isCapacityInformed(null), false);
});

test('capacidade conta como informada com flag, valores diferentes do padrão ou histórico', () => {
  const flagged = empty();
  flagged.metas.horasInformadas = true;
  assert.equal(isCapacityInformed(flagged), true);
  const custom = empty();
  custom.metas.horasPorDia[0] = 0;
  assert.equal(isCapacityInformed(custom), true);
  const used = empty();
  used.studySessions.push({ id: 's' });
  assert.equal(isCapacityInformed(used), true);
});

test('editar qualquer dia grava a flag, mesmo para o valor padrão', () => {
  const state = empty();
  const repo = createSettingsRepository({ getState: () => state });
  repo.updateDailyHours(1, 2.5);
  assert.equal(state.metas.horasInformadas, true);
  assert.equal(isCapacityInformed(state), true);
});
