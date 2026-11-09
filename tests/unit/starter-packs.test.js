import test from 'node:test';
import assert from 'node:assert/strict';
import { STARTER_PACKS, findStarterPackById } from '../../src/domain/onboarding/starter-packs.js';

test('STARTER_PACKS — expõe pacotes válidos e congelados', () => {
  assert.ok(Array.isArray(STARTER_PACKS));
  assert.ok(STARTER_PACKS.length >= 7);

  const adminPack = findStarterPackById('admin_general');
  assert.ok(adminPack);
  assert.equal(adminPack.name, 'Área Administrativa Geral');
  assert.ok(adminPack.subjects.length >= 4);

  const tribunaisPack = findStarterPackById('tribunais_general');
  assert.ok(tribunaisPack);
  assert.equal(tribunaisPack.badge, 'Judiciário');
  assert.ok(tribunaisPack.subjects.length >= 5);

  const inssPack = findStarterPackById('inss_tecnico');
  assert.ok(inssPack);
  assert.equal(inssPack.badge, 'Previdenciário');
  assert.ok(inssPack.subjects.length >= 6);

  const bancariaPack = findStarterPackById('bancaria_general');
  assert.ok(bancariaPack);
  assert.equal(bancariaPack.badge, 'Bancário');

  const pfPack = findStarterPackById('policia_federal');
  assert.ok(pfPack);
  assert.equal(pfPack.badge, 'Polícia Federal');
  assert.ok(pfPack.subjects.length >= 6);

  for (const pack of STARTER_PACKS) {
    assert.ok(pack.id);
    assert.ok(pack.name);
    assert.ok(pack.description);
    assert.ok(Array.isArray(pack.subjects));
    for (const subj of pack.subjects) {
      assert.ok(subj.name);
      assert.ok(subj.topics.length > 0);
      for (const topic of subj.topics) {
        assert.ok(topic.name);
        assert.ok(topic.estimatedStudyMinutes > 0);
      }
    }
  }
});

test('findStarterPackById — retorna nulo para id inexistente', () => {
  assert.equal(findStarterPackById('nao_existe'), null);
});
