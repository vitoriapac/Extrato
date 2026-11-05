/**
 * Controle de Planos, Precificação e Entitlements SaaS (src/domain/billing/entitlements.ts)
 *
 * Centraliza em funções puras e determinísticas de domínio as regras de acesso a recursos
 * por nível de assinatura (Free, Pro, Mentor), precificação oficial e limites quantitativos,
 * sem acoplamento a DOM, storage ou variáveis globais.
 */

export type PlanTier = 'free' | 'pro' | 'mentor';
export type BillingCycle = 'monthly' | 'annual';
export type SubscriptionStatus = 'inactive' | 'trialing' | 'active' | 'past_due' | 'canceled';

export interface UserSubscriptionProfile {
  planTier: PlanTier;
  subscriptionStatus: SubscriptionStatus;
  subscriptionPeriodEnd?: string | null;
}

export interface ResolveEntitlementsOptions {
  isDemoMode?: boolean;
}

export interface FeatureEntitlements {
  tier: PlanTier;
  isDemoBypass: boolean;
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

export const PRICING_PLANS: Readonly<Record<'monthly' | 'annual', PricingPlanOffer>> = Object.freeze({
  monthly: Object.freeze({
    id: 'pro_monthly',
    cycle: 'monthly',
    name: 'Plano Pro Mensal',
    priceCents: 1990,
    monthlyEquivalentCents: 1990,
    priceFormatted: 'R$ 19,90',
    monthlyEquivalentFormatted: 'R$ 19,90',
    billingNotice: 'Cobrado mensalmente via PIX (R$ 19,90/mês)',
    savingsPercent: 0,
    durationDays: 31,
    isRecommended: false,
  }),
  annual: Object.freeze({
    id: 'pro_annual',
    cycle: 'annual',
    name: 'Plano Pro Anual',
    priceCents: 17880,
    monthlyEquivalentCents: 1490,
    priceFormatted: 'R$ 178,80',
    monthlyEquivalentFormatted: 'R$ 14,90',
    billingNotice: 'R$ 178,80/ano à vista no PIX (equivale a R$ 14,90/mês)',
    savingsPercent: 25,
    badgeLabel: 'Economize 25% — Mais escolhido',
    durationDays: 366,
    isRecommended: true,
  }),
});

/**
 * Resolve os direitos de acesso e limites do usuário a partir do seu perfil de assinatura.
 * No Modo Demonstração (`isDemoMode: true`), as ferramentas analíticas e simuladores ficam
 * desbloqueados para degustação, preservando `canCloudSync: false`.
 */
export function resolveEntitlements(
  profile?: UserSubscriptionProfile | null,
  nowMs = Date.now(),
  options: ResolveEntitlementsOptions = {}
): FeatureEntitlements {
  const isPaidActive =
    Boolean(profile) &&
    (profile?.planTier === 'pro' || profile?.planTier === 'mentor') &&
    (profile?.subscriptionStatus === 'active' || profile?.subscriptionStatus === 'trialing') &&
    (!profile?.subscriptionPeriodEnd || Date.parse(profile.subscriptionPeriodEnd) > nowMs);

  const tier: PlanTier = isPaidActive ? profile!.planTier : 'free';
  const isDemoBypass = Boolean(options.isDemoMode) && !isPaidActive;
  const hasProFeatures = isPaidActive || isDemoBypass;

  return Object.freeze({
    tier,
    isDemoBypass,
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
