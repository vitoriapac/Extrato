import test from 'node:test';
import assert from 'node:assert/strict';
import { h } from 'preact';
import { renderToString } from 'preact-render-to-string';
import {
  FREE_TIER_LIMITS,
  PRICING_PLANS,
  partitionOnboardingSubjectsByEntitlement,
  resolveEntitlements,
} from '../../src/domain/billing/entitlements.js';
import { createSaaSAuthService } from '../../src/auth/saas-auth-service.js';
import { PaywallModal } from '../../src/ui/components/PaywallModal.js';
import { AuthAccountModal } from '../../src/ui/components/AuthAccountModal.js';
import { SalesLandingPage } from '../../src/ui/components/SalesLandingPage.js';

test('resolveEntitlements — perfil nulo ou ausente retorna tier free com limites calibrados (8 disciplinas, 1 concurso, 30 flashcards)', () => {
  const result = resolveEntitlements(null);
  assert.equal(result.tier, 'free');
  assert.equal(result.isDemoBypass, false);
  assert.equal(result.canCloudSync, false);
  assert.equal(result.canUseWhatIfSimulator, false);
  assert.equal(result.canParsePdfSyllabus, false);
  assert.equal(result.canImportCsvQuestions, false);
  assert.equal(result.canUseFocusEnergyAnalytics, false);
  assert.equal(result.canExportStrategicPdf, false);
  assert.equal(result.canUseAutoStudyCycle, true);
  assert.equal(result.canUseErrorNotebook, true);
  assert.equal(result.canUseOfficialExamCatalog, true);
  assert.equal(result.maxActiveSubjects, FREE_TIER_LIMITS.maxActiveSubjects);
  assert.equal(result.maxActiveSubjects, 8);
  assert.equal(result.maxActiveExams, 1);
  assert.equal(result.maxErrorFlashcards, 30);
  assert.equal(result.isMentor, false);
});

test('resolveEntitlements — modo demonstração (isDemoMode: true) libera degustação analítica mantendo canCloudSync falso', () => {
  const result = resolveEntitlements(null, Date.now(), { isDemoMode: true });
  assert.equal(result.tier, 'free');
  assert.equal(result.isDemoBypass, true);
  assert.equal(result.canCloudSync, false);
  assert.equal(result.canUseWhatIfSimulator, true);
  assert.equal(result.canParsePdfSyllabus, true);
  assert.equal(result.canImportCsvQuestions, true);
  assert.equal(result.canUseFocusEnergyAnalytics, true);
  assert.equal(result.canExportStrategicPdf, true);
  assert.equal(result.maxActiveSubjects, 100);
});

test('resolveEntitlements — assinatura pro ativa libera cloud sync, ferramentas avançadas e limites expandidos', () => {
  const futureDate = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString();
  const result = resolveEntitlements({
    planTier: 'pro',
    subscriptionStatus: 'active',
    subscriptionPeriodEnd: futureDate,
  });

  assert.equal(result.tier, 'pro');
  assert.equal(result.canCloudSync, true);
  assert.equal(result.canUseWhatIfSimulator, true);
  assert.equal(result.canParsePdfSyllabus, true);
  assert.equal(result.canImportCsvQuestions, true);
  assert.equal(result.canUseFocusEnergyAnalytics, true);
  assert.equal(result.canExportStrategicPdf, true);
  assert.equal(result.maxActiveSubjects, 100);
  assert.equal(result.maxActiveExams, 10);
  assert.equal(result.maxErrorFlashcards, 5000);
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
  assert.equal(result.canUseWhatIfSimulator, false);
  assert.equal(result.maxActiveSubjects, 8);
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

test('PRICING_PLANS — expõe ofertas Mensal (R$ 19,90) e Anual (R$ 14,90/mês — R$ 178,80/ano)', () => {
  assert.equal(PRICING_PLANS.monthly.priceCents, 1990);
  assert.equal(PRICING_PLANS.monthly.priceFormatted, 'R$ 19,90');
  assert.equal(PRICING_PLANS.annual.priceCents, 17880);
  assert.equal(PRICING_PLANS.annual.monthlyEquivalentCents, 1490);
  assert.equal(PRICING_PLANS.annual.monthlyEquivalentFormatted, 'R$ 14,90');
  assert.equal(PRICING_PLANS.annual.savingsPercent, 25);
  assert.equal(PRICING_PLANS.annual.isRecommended, true);
});

test('partitionOnboardingSubjectsByEntitlement — seleciona as 8 disciplinas de maior peso no Free e libera todas no Pro', () => {
  const catalogSubjects = Array.from({ length: 12 }, (_, idx) => ({
    id: `sub-${idx + 1}`,
    name: `Disciplina ${idx + 1}`,
    weight: (idx + 1) * 10,
  }));

  const freeEntitlements = resolveEntitlements(null);
  const freePartition = partitionOnboardingSubjectsByEntitlement(catalogSubjects, freeEntitlements);
  assert.equal(freePartition.unlockedSubjects.length, 8);
  assert.equal(freePartition.lockedCount, 4);
  assert.equal(freePartition.requiresUpgradeForFullCatalog, true);
  // As 4 de menor peso (10, 20, 30, 40) devem ficar bloqueadas
  assert.deepEqual(
    freePartition.lockedSubjects.map(s => s.weight),
    [10, 20, 30, 40]
  );

  const proEntitlements = resolveEntitlements({ planTier: 'pro', subscriptionStatus: 'active' });
  const proPartition = partitionOnboardingSubjectsByEntitlement(catalogSubjects, proEntitlements);
  assert.equal(proPartition.unlockedSubjects.length, 12);
  assert.equal(proPartition.lockedCount, 0);
  assert.equal(proPartition.requiresUpgradeForFullCatalog, false);
});

test('createSaaSAuthService — valida Magic Link, gera URL Google OAuth e dispara checkout PIX AbacatePay', async () => {
  const calls = [];
  const fakeFetch = async (url, init) => {
    calls.push({ url, init });
    if (String(url).includes('/auth/v1/otp')) {
      return { ok: true, status: 200, json: async () => ({}) };
    }
    if (String(url).includes('/functions/v1/abacatepay-checkout')) {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          billingId: 'bill_123',
          checkoutUrl: 'https://abacatepay.com/pay/bill_123',
        }),
      };
    }
    return { ok: false, status: 404, json: async () => ({}) };
  };

  const authService = createSaaSAuthService({
    config: {
      supabaseUrl: 'https://exemplo.supabase.co',
      supabaseAnonKey: 'anon-key-123',
      redirectTo: 'https://app.studytrack.com.br',
    },
    fetchImpl: fakeFetch,
  });

  const invalidEmail = await authService.requestMagicLink('invalido');
  assert.equal(invalidEmail.success, false);

  const validEmail = await authService.requestMagicLink('estudante@exemplo.com');
  assert.equal(validEmail.success, true);

  const googleUrl = authService.getGoogleOAuthUrl();
  assert.ok(googleUrl.includes('provider=google'));

  const checkout = await authService.createAbacatePayCheckout({
    cycle: 'annual',
    customerEmail: 'estudante@exemplo.com',
  });
  assert.equal(checkout.success, true);
  assert.equal(checkout.billingId, 'bill_123');
  assert.equal(checkout.checkoutUrl, 'https://abacatepay.com/pay/bill_123');
  assert.equal(calls.length, 2);
});

test('PaywallModal e AuthAccountModal — renderizam sem emojis e com preços/limites corretos', () => {
  const paywallHtml = renderToString(
    h(PaywallModal, {
      open: true,
      onClose: () => {},
      featureTitle: 'Simulador de Cenários E se?',
      onSelectCheckout: () => {},
    })
  );

  assert.ok(paywallHtml.includes('R$ 14,90'));
  assert.ok(paywallHtml.includes('R$ 178,80'));
  assert.ok(paywallHtml.includes('R$ 19,90'));
  assert.ok(paywallHtml.includes('AbacatePay'));
  assert.ok(!/\p{Extended_Pictographic}/u.test(paywallHtml));

  const authHtml = renderToString(
    h(AuthAccountModal, {
      open: true,
      onClose: () => {},
      onRequestMagicLink: async () => ({ success: true }),
    })
  );

  assert.ok(authHtml.includes('Receber link de acesso'));
  assert.ok(!/\p{Extended_Pictographic}/u.test(authHtml));

  const landingHtml = renderToString(
    h(SalesLandingPage, {
      onStartFreeApp: () => {},
      onStartLiveDemo: () => {},
      onSelectProPlan: () => {},
    })
  );

  assert.ok(landingHtml.includes('Pare de estudar no escuro'));
  assert.ok(landingHtml.includes('R$ 14,90'));
  assert.ok(landingHtml.includes('R$ 19,90'));
  assert.ok(!/\p{Extended_Pictographic}/u.test(landingHtml));
});
