/**
 * Controle de Planos e Entitlements SaaS (src/domain/billing/entitlements.ts)
 *
 * Centraliza em funções puras de domínio as regras de acesso a recursos
 * por nível de assinatura (Free, Pro, Mentor), preparando o StudyTrack para a transição SaaS
 * sem acoplamento da interface a flags booleanas soltas.
 */

export type PlanTier = 'free' | 'pro' | 'mentor';
export type SubscriptionStatus = 'inactive' | 'trialing' | 'active' | 'past_due' | 'canceled';

export interface UserSubscriptionProfile {
  planTier: PlanTier;
  subscriptionStatus: SubscriptionStatus;
  subscriptionPeriodEnd?: string | null;
}

export interface FeatureEntitlements {
  tier: PlanTier;
  canCloudSync: boolean;
  canImportCsvQuestions: boolean;
  canUseOfficialExamCatalog: boolean;
  canUseWhatIfSimulator: boolean;
  canUseAutoStudyCycle: boolean;
  canUseFocusEnergyAnalytics: boolean;
  canUseErrorNotebook: boolean;
  maxActiveSubjects: number;
  isMentor: boolean;
}

/**
 * Resolve os direitos de acesso e limites do usuário a partir do seu perfil de assinatura.
 */
export function resolveEntitlements(
  profile?: UserSubscriptionProfile | null,
  nowMs = Date.now()
): FeatureEntitlements {
  const isPaidActive =
    Boolean(profile) &&
    (profile?.planTier === 'pro' || profile?.planTier === 'mentor') &&
    (profile?.subscriptionStatus === 'active' || profile?.subscriptionStatus === 'trialing') &&
    (!profile?.subscriptionPeriodEnd || Date.parse(profile.subscriptionPeriodEnd) > nowMs);

  const tier: PlanTier = isPaidActive ? profile!.planTier : 'free';

  return Object.freeze({
    tier,
    canCloudSync: isPaidActive,
    canImportCsvQuestions: true, // Modo local gratuito sempre permite importação pessoal
    canUseOfficialExamCatalog: true, // Catálogo offline embutido é livre
    canUseWhatIfSimulator: true, // Inteligência local inclusa
    canUseAutoStudyCycle: true, // Ciclo rotativo incluso
    canUseFocusEnergyAnalytics: true, // Cronobiologia inclusa
    canUseErrorNotebook: true, // Caderno de erros ativo incluso
    maxActiveSubjects: isPaidActive ? 100 : 30,
    isMentor: tier === 'mentor',
  });
}
