import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveEntitlements } from '../../src/domain/billing/entitlements.js';

test('resolveEntitlements — perfil nulo ou ausente retorna tier free com recursos essenciais', () => {
  const result = resolveEntitlements(null);
  assert.equal(result.tier, 'free');
  assert.equal(result.canCloudSync, false);
  assert.equal(result.canUseWhatIfSimulator, true);
  assert.equal(result.canUseAutoStudyCycle, true);
  assert.equal(result.canUseErrorNotebook, true);
  assert.equal(result.maxActiveSubjects, 30);
  assert.equal(result.isMentor, false);
});

test('resolveEntitlements — assinatura pro ativa libera cloud sync e limites expandidos', () => {
  const futureDate = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString();
  const result = resolveEntitlements({
    planTier: 'pro',
    subscriptionStatus: 'active',
    subscriptionPeriodEnd: futureDate,
  });

  assert.equal(result.tier, 'pro');
  assert.equal(result.canCloudSync, true);
  assert.equal(result.maxActiveSubjects, 100);
  assert.equal(result.isMentor, false);
});

test('resolveEntitlements — assinatura expirada ou cancelada faz fallback seguro para free', () => {
  const pastDate = new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString();
  const result = resolveEntitlements({
    planTier: 'pro',
    subscriptionStatus: 'past_due',
    subscriptionPeriodEnd: pastDate,
  });

  assert.equal(result.tier, 'free');
  assert.equal(result.canCloudSync, false);
  assert.equal(result.maxActiveSubjects, 30);
});

test('resolveEntitlements — tier mentor ativa flag isMentor', () => {
  const result = resolveEntitlements({
    planTier: 'mentor',
    subscriptionStatus: 'active',
  });

  assert.equal(result.tier, 'mentor');
  assert.equal(result.isMentor, true);
  assert.equal(result.canCloudSync, true);
});
