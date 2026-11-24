import test from 'node:test';
import assert from 'node:assert/strict';
import { h } from 'preact';
import { render } from 'preact-render-to-string';
import {
  compareStudyBySleep,
  normalizeSleepEntry,
  recordSleep,
} from '../../src/domain/sleep-log.js';
import { SleepCheckin } from '../../src/ui/components/SleepCheckin.js';
import { validateBackupData } from '../../src/storage/backup-validator.js';
import { createDefaultState } from '../../src/state/defaults.js';

const day = n => `2026-11-${String(n).padStart(2, '0')}`;

test('um registro de sono por dia, válido e ordenado', () => {
  assert.equal(normalizeSleepEntry({ date: '2026-11-01', quality: 'meh' }), null);
  assert.equal(normalizeSleepEntry({ date: 'ontem', quality: 'good' }), null);
  let log = recordSleep([], day(2), 'good');
  log = recordSleep(log, day(1), 'poor');
  log = recordSleep(log, day(2), 'ok');
  assert.deepEqual(log, [
    { date: day(1), quality: 'poor' },
    { date: day(2), quality: 'ok' },
  ]);
});

test('compara estudo e acerto após sono bom × ruim só com 5 dias de cada', () => {
  const sleepLog = [
    ...[1, 2, 3, 4, 5].map(n => ({ date: day(n), quality: 'good' })),
    ...[6, 7, 8, 9].map(n => ({ date: day(n), quality: 'poor' })),
    { date: day(10), quality: 'ok' },
  ];
  const studySessions = [
    ...[1, 2, 3, 4, 5].map(n => ({ date: day(n), durationSeconds: 7200 })),
    ...[6, 7, 8, 9].map(n => ({ date: day(n), durationSeconds: 3600 })),
    { date: day(10), durationSeconds: 99999 },
  ];
  const questoes = [
    { date: day(1), resolved: 20, correct: 16 },
    { date: day(6), resolved: 10, correct: 5 },
  ];
  const few = compareStudyBySleep({ sleepLog, studySessions, questoes });
  assert.equal(few.enough, false);
  assert.deepEqual(few.good, { days: 5, minutesPerDay: 120, accuracy: 80 });
  assert.deepEqual(few.poor, { days: 4, minutesPerDay: 60, accuracy: 50 });
  const enough = compareStudyBySleep({
    sleepLog: [...sleepLog, { date: day(11), quality: 'poor' }],
    studySessions,
    questoes,
  });
  assert.equal(enough.enough, true);
  assert.equal(enough.poor.minutesPerDay, 48);
});

test('toque de sono: pergunta até responder, depois mostra a resposta com alterar', () => {
  const ask = render(h(SleepCheckin, { quality: null, onChoose() {} }));
  assert.match(ask, /Como você dormiu esta noite\?/);
  assert.match(ask, /Mais ou menos/);
  const done = render(h(SleepCheckin, { quality: 'poor', onChoose() {} }));
  assert.match(done, /Sono de hoje: <strong>Mal<\/strong>/);
  assert.match(done, /Alterar/);
});

test('backup aceita o registro de sono e rejeita valores inválidos', () => {
  const ok = createDefaultState();
  ok.sleepLog = [{ date: day(1), quality: 'good' }];
  assert.equal(validateBackupData(ok).valid, true);
  const bad = createDefaultState();
  bad.sleepLog = [{ date: day(1), quality: 'otimo' }];
  assert.equal(validateBackupData(bad).valid, false);
});
