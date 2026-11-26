import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveModules } from '../../src/ui/controllers/optional-modules-controller.js';

const empty = { sleepLog: [], studySessions: [], achievementUnlocks: {}, learningJournal: [] };

test('módulos opcionais: desligados para quem nunca usou, ligados para quem já tem registros', () => {
  assert.deepEqual(resolveModules(empty, {}), {
    energy: false,
    achievements: false,
    journal: false,
  });
  const using = {
    ...empty,
    sleepLog: [{ date: '2026-11-26', quality: 'bem' }],
    achievementUnlocks: { streak7: { unlockedAt: '2026-11-01' } },
    learningJournal: [{ id: 'j1' }],
  };
  assert.deepEqual(resolveModules(using, {}), { energy: true, achievements: true, journal: true });
  assert.equal(
    resolveModules({ ...empty, studySessions: [{ focusLevel: 'deep' }] }, {}).energy,
    true,
    'avaliar foco/energia nas sessões conta como uso'
  );
});

test('módulos opcionais: a escolha salva vale sobre os dados', () => {
  assert.equal(resolveModules(empty, { journal: true }).journal, true);
  assert.equal(
    resolveModules({ ...empty, learningJournal: [{ id: 'j' }] }, { journal: false }).journal,
    false
  );
});
