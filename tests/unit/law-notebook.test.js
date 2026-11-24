import test from 'node:test';
import assert from 'node:assert/strict';
import {
  completeLawLap,
  lawStatus,
  normalizeLaw,
  registerLawReading,
  sortLawsForReview,
} from '../../src/domain/law-notebook.js';
import { validateBackupData } from '../../src/storage/backup-validator.js';
import { createDefaultState } from '../../src/state/defaults.js';

const law = (over = {}) =>
  normalizeLaw({ id: 'law-1', name: 'Lei 8.112/1990', totalArticles: 253, ...over });

test('normaliza a lei e descarta registros sem nome ou id', () => {
  assert.deepEqual(law({ currentArticle: 999, laps: '2', lastReadAt: 'ontem' }), {
    id: 'law-1',
    name: 'Lei 8.112/1990',
    subjectId: null,
    totalArticles: 253,
    currentArticle: 253,
    laps: 2,
    lastReadAt: null,
    lapCompletedAt: null,
    createdAt: '',
  });
  assert.equal(normalizeLaw({ id: 'x', name: '  ' }), null);
  assert.equal(normalizeLaw(null), null);
});

test('registrar leitura avança o artigo e fechar no último artigo conta uma volta', () => {
  const read = registerLawReading(law(), 120, '2026-11-20');
  assert.equal(read.currentArticle, 120);
  assert.equal(read.lastReadAt, '2026-11-20');
  const done = registerLawReading(read, 253, '2026-11-22');
  assert.equal(done.laps, 1);
  assert.equal(done.currentArticle, 0);
  assert.equal(done.lapCompletedAt, '2026-11-22');
  // Sem total conhecido, a volta só fecha pelo botão.
  const open = registerLawReading(law({ totalArticles: null }), 500, '2026-11-20');
  assert.equal(open.laps, 0);
  assert.equal(completeLawLap(open, '2026-11-21').laps, 1);
});

test('situação: nova, lendo, parada, descansando e hora da próxima volta (7/15/30 dias)', () => {
  assert.equal(lawStatus(law(), '2026-11-24').key, 'new');
  const reading = law({ currentArticle: 40, lastReadAt: '2026-11-20' });
  assert.deepEqual(lawStatus(reading, '2026-11-24'), {
    key: 'reading',
    label: 'Lendo a 1ª volta',
    nextLapDate: null,
  });
  assert.equal(lawStatus(reading, '2026-11-28').label, 'Parada há 8 dias');
  const lap1 = law({ laps: 1, lastReadAt: '2026-11-10', lapCompletedAt: '2026-11-10' });
  assert.deepEqual(lawStatus(lap1, '2026-11-16'), {
    key: 'resting',
    label: '1ª volta concluída',
    nextLapDate: '2026-11-17',
  });
  assert.equal(lawStatus(lap1, '2026-11-17').label, 'Hora da 2ª volta');
  const lap2 = law({ laps: 2, lastReadAt: '2026-11-01', lapCompletedAt: '2026-11-01' });
  assert.equal(lawStatus(lap2, '2026-11-15').key, 'resting');
  assert.equal(lawStatus(lap2, '2026-11-16').key, 'due');
  const lap5 = law({ laps: 5, lastReadAt: '2026-11-01', lapCompletedAt: '2026-11-01' });
  assert.equal(lawStatus(lap5, '2026-12-01').key, 'due');
  assert.equal(lawStatus(lap5, '2026-11-30').key, 'resting');
});

test('ordena vencidas e paradas antes das demais', () => {
  const today = '2026-11-24';
  const sorted = sortLawsForReview(
    [
      law({ id: 'a', name: 'A', laps: 1, lastReadAt: '2026-11-23', lapCompletedAt: '2026-11-23' }),
      law({ id: 'b', name: 'B' }),
      law({ id: 'c', name: 'C', currentArticle: 3, lastReadAt: '2026-11-01' }),
      law({ id: 'd', name: 'D', laps: 1, lastReadAt: '2026-11-01', lapCompletedAt: '2026-11-01' }),
    ],
    today
  );
  assert.deepEqual(
    sorted.map(item => item.id),
    ['d', 'c', 'b', 'a']
  );
});

test('backup aceita o caderno de leis e rejeita leis inválidas', () => {
  const ok = createDefaultState();
  ok.lawNotebook = [law()];
  assert.equal(validateBackupData(ok).valid, true);
  const old = createDefaultState();
  delete old.lawNotebook;
  assert.equal(validateBackupData(old).valid, true);
  const bad = createDefaultState();
  bad.lawNotebook = [{ id: 'law-1', name: '' }];
  assert.equal(validateBackupData(bad).valid, false);
  const dup = createDefaultState();
  dup.lawNotebook = [law(), law()];
  assert.equal(validateBackupData(dup).valid, false);
});
