/**
 * Controle de Planos, Precificação, Parcelamento e Entitlements SaaS (src/domain/billing/entitlements.ts)
 *
 * Centraliza em funções puras e determinísticas de domínio as regras de acesso a recursos
 * por nível de assinatura (Free, Pro, Mentor), precificação oficial, modalidades de pagamento
 * (PIX e Cartão de Crédito com parcelamento em até 12x), janela de tolerância (grace period)
 * e limites quantitativos, sem acoplamento a DOM, storage ou variáveis globais.
 */

export type PlanTier = 'free' | 'pro' | 'mentor';
export type BillingCycle = 'monthly' | 'annual';
export type SubscriptionStatus = 'inactive' | 'trialing' | 'active' | 'past_due' | 'canceled';
export type PaymentMethod = 'pix' | 'card';

/**
 * Janela de tolerância em dias para cobranças com falha no cartão ('past_due')
 * antes de revogar a sincronização e ferramentas Pro do estudante.
 */
export const GRACE_PERIOD_DAYS = 3;
export const GRACE_PERIOD_MS = GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000;

export interface UserSubscriptionProfile {
  planTier: PlanTier;
  subscriptionStatus: SubscriptionStatus;
  subscriptionPeriodEnd?: string | null;
  paymentMethod?: PaymentMethod | null;
}

export interface ResolveEntitlementsOptions {
  isDemoMode?: boolean;
}

export interface FeatureEntitlements {
  tier: PlanTier;
  isDemoBypass: boolean;
  isInGracePeriod: boolean;
  canCloudSync: boolean;
  canImportCsvQuestions: boolean;
  canParsePdfSyllabus: boolean;
  canUseOfficialExamCatalog: boolean;
  canUseWhatIfSimulator: boolean;
  canUseAutoStudyCycle: boolean;
  canUseFocusEnergyAnalytics: boolean;
  canUseErrorNotebook: boolean;
  canExportStrategicPdf: boolean;
  maxActiveSubjects: number;
  maxActiveExams: number;
  maxErrorFlashcards: number;
  maxOnboardingCatalogSubjects: number;
  isMentor: boolean;
}

export interface CardInstallmentOption {
  installments: number;
  installmentCents: number;
  installmentFormatted: string;
  totalCents: number;
  totalFormatted: string;
  label: string;
}

export interface PricingPlanOffer {
  id: 'pro_monthly' | 'pro_annual';
  cycle: BillingCycle;
  name: string;
  priceCents: number;
  monthlyEquivalentCents: number;
  priceFormatted: string;
  monthlyEquivalentFormatted: string;
  billingNotice: string;
  savingsPercent: number;
  badgeLabel?: string;
  durationDays: number;
  isRecommended: boolean;
  availablePaymentMethods: readonly PaymentMethod[];
  cardRecurrenceNotice?: string;
  cardInstallmentNotice?: string;
  maxCardInstallments: number;
  installments: readonly CardInstallmentOption[];
}

export const FREE_TIER_LIMITS = Object.freeze({
  maxActiveSubjects: 8,
  maxActiveExams: 1,
  maxErrorFlashcards: 30,
  maxOnboardingCatalogSubjects: 8,
});

export const PRO_TIER_LIMITS = Object.freeze({
  maxActiveSubjects: 100,
  maxActiveExams: 10,
  maxErrorFlashcards: 5000,
  maxOnboardingCatalogSubjects: 100,
});

/**
 * Calcula tabela de parcelamento sem juros no cartão de crédito em até 12x.
 */
export function calculateCardInstallments(
  totalCents: number,
  maxInstallments = 12
): CardInstallmentOption[] {
  const list: CardInstallmentOption[] = [];
  const count = Math.max(1, Math.min(12, maxInstallments));
  for (let i = 1; i <= count; i++) {
    const perMonth = Math.round(totalCents / i);
    const perMonthFormatted = `R$ ${(perMonth / 100).toFixed(2).replace('.', ',')}`;
    const totalFormatted = `R$ ${(totalCents / 100).toFixed(2).replace('.', ',')}`;
    list.push({
      installments: i,
      installmentCents: perMonth,
      installmentFormatted: perMonthFormatted,
      totalCents,
      totalFormatted,
      label: i === 1 ? `1x de ${totalFormatted} à vista` : `${i}x de ${perMonthFormatted} sem juros`,
    });
  }
  return list;
}

export const PRICING_PLANS: Readonly<Record<'monthly' | 'annual', PricingPlanOffer>> = Object.freeze({
  monthly: Object.freeze({
    id: 'pro_monthly',
    cycle: 'monthly',
    name: 'Plano Pro Mensal',
    priceCents: 1990,
    monthlyEquivalentCents: 1990,
    priceFormatted: 'R$ 19,90',
    monthlyEquivalentFormatted: 'R$ 19,90',
    billingNotice: 'Cobrado mensalmente via PIX ou Cartão (R$ 19,90/mês)',
    savingsPercent: 0,
    durationDays: 31,
    isRecommended: false,
    availablePaymentMethods: Object.freeze(['pix', 'card'] as PaymentMethod[]),
    cardRecurrenceNotice: 'Cobrança recorrente mensal com renovação automática no cartão',
    maxCardInstallments: 1,
    installments: Object.freeze(calculateCardInstallments(1990, 1)),
  }),
  annual: Object.freeze({
    id: 'pro_annual',
    cycle: 'annual',
    name: 'Plano Pro Anual',
    priceCents: 17880,
    monthlyEquivalentCents: 1490,
    priceFormatted: 'R$ 178,80',
    monthlyEquivalentFormatted: 'R$ 14,90',
    billingNotice: 'R$ 178,80/ano à vista no PIX ou até 12x de R$ 14,90 no Cartão',
    savingsPercent: 25,
    badgeLabel: 'Economize 25% — Mais escolhido',
    durationDays: 366,
    isRecommended: true,
    availablePaymentMethods: Object.freeze(['pix', 'card'] as PaymentMethod[]),
    cardInstallmentNotice: 'Até 12x de R$ 14,90 sem juros no cartão de crédito',
    maxCardInstallments: 12,
    installments: Object.freeze(calculateCardInstallments(17880, 12)),
  }),
});

/**
 * Resolve os direitos de acesso e limites do usuário a partir do seu perfil de assinatura.
 * Inclui janela de tolerância de 3 dias para assinaturas 'past_due' (falha temporária no cartão).
 * No Modo Demonstração (`isDemoMode: true`), as ferramentas analíticas e simuladores ficam
 * desbloqueados para degustação, preservando `canCloudSync: false`.
 */
export function resolveEntitlements(
  profile?: UserSubscriptionProfile | null,
  nowMs = Date.now(),
  options: ResolveEntitlementsOptions = {}
): FeatureEntitlements {
  const isDirectActive =
    Boolean(profile) &&
    (profile?.planTier === 'pro' || profile?.planTier === 'mentor') &&
    (profile?.subscriptionStatus === 'active' || profile?.subscriptionStatus === 'trialing') &&
    (!profile?.subscriptionPeriodEnd || Date.parse(profile.subscriptionPeriodEnd) > nowMs);

  const isGraceActive =
    Boolean(profile) &&
    (profile?.planTier === 'pro' || profile?.planTier === 'mentor') &&
    profile?.subscriptionStatus === 'past_due' &&
    Boolean(profile?.subscriptionPeriodEnd) &&
    Date.parse(profile.subscriptionPeriodEnd!) + GRACE_PERIOD_MS > nowMs;

  const isPaidActive = isDirectActive || isGraceActive;
  const isInGracePeriod = isGraceActive;

  const tier: PlanTier = isPaidActive ? profile!.planTier : 'free';
  const isDemoBypass = Boolean(options.isDemoMode) && !isPaidActive;
  const hasProFeatures = isPaidActive || isDemoBypass;

  return Object.freeze({
    tier,
    isDemoBypass,
    isInGracePeriod,
    canCloudSync: isPaidActive,
    canImportCsvQuestions: hasProFeatures,
    canParsePdfSyllabus: hasProFeatures,
    canUseOfficialExamCatalog: true,
    canUseWhatIfSimulator: hasProFeatures,
    canUseAutoStudyCycle: true,
    canUseFocusEnergyAnalytics: hasProFeatures,
    canUseErrorNotebook: true,
    canExportStrategicPdf: hasProFeatures,
    maxActiveSubjects: hasProFeatures
      ? PRO_TIER_LIMITS.maxActiveSubjects
      : FREE_TIER_LIMITS.maxActiveSubjects,
    maxActiveExams: hasProFeatures
      ? PRO_TIER_LIMITS.maxActiveExams
      : FREE_TIER_LIMITS.maxActiveExams,
    maxErrorFlashcards: hasProFeatures
      ? PRO_TIER_LIMITS.maxErrorFlashcards
      : FREE_TIER_LIMITS.maxErrorFlashcards,
    maxOnboardingCatalogSubjects: hasProFeatures
      ? PRO_TIER_LIMITS.maxOnboardingCatalogSubjects
      : FREE_TIER_LIMITS.maxOnboardingCatalogSubjects,
    isMentor: tier === 'mentor',
  });
}

/**
 * Utilitários determinísticos para conferência de limites quantitativos na UI e controladores.
 */
export function checkSubjectLimit(
  activeSubjectCount: number,
  entitlements: FeatureEntitlements
): { allowed: boolean; current: number; max: number; remaining: number } {
  const max = entitlements.maxActiveSubjects;
  return {
    allowed: activeSubjectCount < max,
    current: activeSubjectCount,
    max,
    remaining: Math.max(0, max - activeSubjectCount),
  };
}

export function checkExamLimit(
  activeExamCount: number,
  entitlements: FeatureEntitlements
): { allowed: boolean; current: number; max: number; remaining: number } {
  const max = entitlements.maxActiveExams;
  return {
    allowed: activeExamCount < max,
    current: activeExamCount,
    max,
    remaining: Math.max(0, max - activeExamCount),
  };
}

export function checkFlashcardLimit(
  flashcardCount: number,
  entitlements: FeatureEntitlements
): { allowed: boolean; current: number; max: number; remaining: number } {
  const max = entitlements.maxErrorFlashcards;
  return {
    allowed: flashcardCount < max,
    current: flashcardCount,
    max,
    remaining: Math.max(0, max - flashcardCount),
  };
}

export interface OnboardingSubjectPartition<T> {
  unlockedSubjects: T[];
  lockedSubjects: T[];
  lockedCount: number;
  requiresUpgradeForFullCatalog: boolean;
}

/**
 * Seleciona até `maxOnboardingCatalogSubjects` disciplinas mais relevantes para o Onboarding
 * quando o usuário está no Plano Free, ordenando de forma estável por importância/peso.
 */
export function partitionOnboardingSubjectsByEntitlement<
  T extends { weight?: number; importance?: number; priority?: number },
>(subjects: readonly T[], entitlements: FeatureEntitlements): OnboardingSubjectPartition<T> {
  const list = Array.isArray(subjects) ? [...subjects] : [];
  const limit = Math.max(1, entitlements.maxOnboardingCatalogSubjects);

  if (list.length <= limit) {
    return {
      unlockedSubjects: list,
      lockedSubjects: [],
      lockedCount: 0,
      requiresUpgradeForFullCatalog: false,
    };
  }

  const indexed = list.map((item, index) => ({
    item,
    index,
    score: Number(item?.weight ?? item?.importance ?? item?.priority ?? 0),
  }));

  indexed.sort((a, b) => (b.score !== a.score ? b.score - a.score : a.index - b.index));

  const unlockedSet = new Set(indexed.slice(0, limit).map(entry => entry.index));
  const unlockedSubjects: T[] = [];
  const lockedSubjects: T[] = [];

  list.forEach((subject, idx) => {
    if (unlockedSet.has(idx)) {
      unlockedSubjects.push(subject);
    } else {
      lockedSubjects.push(subject);
    }
  });

  return {
    unlockedSubjects,
    lockedSubjects,
    lockedCount: lockedSubjects.length,
    requiresUpgradeForFullCatalog: lockedSubjects.length > 0,
  };
}
