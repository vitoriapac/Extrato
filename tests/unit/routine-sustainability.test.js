import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateRoutineSustainability,
  applySundayRestDay,
} from '../../src/domain/onboarding/routine-sustainability.js';

test('validateRoutineSustainability — identifica rotina sustentável padrão', () => {
  const result = validateRoutineSustainability({
    hoursByDay: { 0: 0, 1: 2, 2: 2, 3: 2, 4: 2, 5: 2, 6: 4 },
  });

  assert.equal(result.isExcessive, false);
  assert.equal(result.hasRestDay, true);
  assert.equal(result.totalWeeklyHours, 14);
  assert.equal(result.statusTag, 'Sustentável');
  assert.ok(result.feedbackMessage.includes('Ritmo sustentável'));
});

test('validateRoutineSustainability — alerta sobre carga excessiva (> 35h/sem)', () => {
  const result = validateRoutineSustainability({
    hoursByDay: { 0: 5, 1: 6, 2: 6, 3: 6, 4: 6, 5: 6, 6: 5 },
  });

  assert.equal(result.isExcessive, true);
  assert.equal(result.statusTag, 'Carga intensa');
  assert.ok(result.feedbackMessage.includes('Constância vence intensidade'));
});

test('validateRoutineSustainability — alerta quando todos os 7 dias têm carga pesada sem folga', () => {
  const result = validateRoutineSustainability({
    hoursByDay: { 0: 4, 1: 4, 2: 4, 3: 4, 4: 4, 5: 4, 6: 4 },
  });

  assert.equal(result.isExcessive, true);
  assert.equal(result.hasRestDay, false);
  assert.equal(result.statusTag, 'Sem descanso');
  assert.ok(result.feedbackMessage.includes('Reservar o domingo'));
});

test('applySundayRestDay — zera domingo e redistribui carga nos dias úteis', () => {
  const initial = { 0: 2.5, 1: 2, 2: 2, 3: 2, 4: 2, 5: 2, 6: 3 };
  const updated = applySundayRestDay(initial);

  assert.equal(updated['0'], 0);
  assert.equal(updated['1'], 2.5); // 2 + (2.5 / 5) = 2.5
  assert.equal(updated['2'], 2.5);
  assert.equal(updated['6'], 3); // sábado não alterado
});

test('applySundayRestDay — não altera se domingo já era zero', () => {
  const initial = { 0: 0, 1: 2, 2: 2, 3: 2, 4: 2, 5: 2, 6: 4 };
  const updated = applySundayRestDay(initial);

  assert.deepEqual(updated, initial);
});
