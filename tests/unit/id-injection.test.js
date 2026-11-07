import test from 'node:test';
import assert from 'node:assert/strict';
import { createDelegatedEventsController } from '../../src/ui/controllers/delegated-events-controller.js';
import { validateNormalizedBackup } from '../../src/storage/backup-validator.js';
import { isSafeId } from '../../src/core/utils.js';

const evil = "x','y',true,'";

test('ids com aspas/vírgula não passam pelo validador de backup (barreira contra injeção de argumentos)', () => {
  assert.equal(isSafeId(evil), false);
  assert.equal(isSafeId("x',deleteAll"), false);
  const result = validateNormalizedBackup({
    schemaVersion: 28,
    subjects: [{ id: evil, name: 'A', topics: [] }],
  });
  assert.equal(result.valid, false);
});

test('documenta o risco: interpolar id cru na expressão injetaria argumentos extras', () => {
  const calls = [];
  const controller = createDelegatedEventsController({
    document: {},
    handlers: { save: (...a) => calls.push(a) },
  });
  controller.dispatch(`save('${evil}')`, {}, {});
  assert.notDeepEqual(calls[0], [evil]); // sem validação de id, o parse divide em vários argumentos
  assert.ok(calls[0].length > 1);
});
