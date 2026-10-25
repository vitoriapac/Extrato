import test from 'node:test';
import assert from 'node:assert/strict';
import {
  addLocalDays,
  endOfLocalDay,
  formatLocalDate,
  localDateRange,
  parseLocalDate,
  startOfLocalDay,
} from '../../src/core/date-utils.js';

test('datas civis permanecem estáveis em qualquer fuso', () => {
  assert.equal(formatLocalDate(parseLocalDate('2026-09-15')), '2026-09-15');
  assert.equal(addLocalDays('2026-09-15', -1), '2026-09-14');
  assert.deepEqual(localDateRange('2026-09-15', '2026-09-17'), [
    '2026-09-15',
    '2026-09-16',
    '2026-09-17',
  ]);
  assert.equal(startOfLocalDay('2026-09-15').getHours(), 0);
  assert.equal(endOfLocalDay('2026-09-15').getHours(), 23);
});

test('datas inválidas não são convertidas silenciosamente', () => {
  assert.equal(parseLocalDate('2026-02-30'), null);
  assert.equal(addLocalDays('não é data', 1), null);
});

test('parseLocalDate em cache devolve objetos novos e segue o fuso atual', () => {
  assert.equal(parseLocalDate('2026-02-30'), null);
  assert.equal(parseLocalDate('2026-02-30'), null);
  const first = parseLocalDate('2026-10-25'),
    second = parseLocalDate('2026-10-25');
  assert.notEqual(first, second);
  first.setDate(1);
  assert.equal(parseLocalDate('2026-10-25').getDate(), 25);
  const originalTimezone = process.env.TZ;
  try {
    for (const zone of ['UTC', 'America/Sao_Paulo', 'Asia/Tokyo']) {
      process.env.TZ = zone;
      const date = parseLocalDate('2026-10-25');
      assert.deepEqual(
        [date.getFullYear(), date.getMonth(), date.getDate(), date.getHours()],
        [2026, 9, 25, 12]
      );
    }
  } finally {
    if (originalTimezone === undefined) delete process.env.TZ;
    else process.env.TZ = originalTimezone;
  }
});
