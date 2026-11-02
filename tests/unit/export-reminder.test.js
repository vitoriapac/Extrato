import test from 'node:test';
import assert from 'node:assert/strict';
import { buildExportReminder, EXPORT_REMINDER_DAYS } from '../../src/domain/backup/export-reminder.js';

test('quem nunca exportou vê o aviso em atenção', () => {
  assert.deepEqual(buildExportReminder(null, '2026-11-02'), {
    days: null,
    stale: true,
    text: 'Nenhum backup exportado ainda',
  });
});

test('dias desde o último backup exportado; atenção depois de 7 dias', () => {
  assert.equal(EXPORT_REMINDER_DAYS, 7);
  const at = days => {
    const date = new Date(2026, 10, 2 - days, 9, 30);
    return buildExportReminder(date.toISOString(), '2026-11-02');
  };
  assert.equal(at(0).text, 'Último backup exportado hoje');
  assert.equal(at(1).text, 'Último backup exportado ontem');
  assert.deepEqual(at(7), { days: 7, stale: false, text: 'Último backup exportado há 7 dias' });
  assert.equal(at(8).stale, true);
});
