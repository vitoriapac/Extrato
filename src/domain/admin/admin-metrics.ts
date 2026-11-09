/**
 * Métricas e Regras de Negócio do Painel Administrativo / Backoffice (Fase 8 SaaS)
 *
 * Módulo puro, determinístico e sem dependências de UI/DOM.
 */

export interface AdminUserProfile {
  id: string;
  clerkUserId: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  planTier: 'free' | 'pro' | 'mentor';
  subscriptionStatus: 'active' | 'past_due' | 'canceled' | 'trialing' | 'inactive';
  paymentMethod: 'pix' | 'card' | null;
  cardBrand: string | null;
  cardLast4: string | null;
  subscriptionPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  role: 'student' | 'mentor' | 'admin';
  createdAt: string;
  lastSyncedAt: string | null;
  storageUsageKb: number;
}

export interface AdminBillingOrder {
  id: string;
  userId: string;
  customerEmail: string;
  planId: 'pro_monthly' | 'pro_annual';
  amountCents: number;
  feeCents: number;
  netAmountCents: number;
  paymentMethod: 'pix' | 'card';
  status: 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED' | 'REFUNDED';
  installments: number;
  cardBrand: string | null;
  cardLast4: string | null;
  createdAt: string;
  settledAt: string | null;
}

export interface AdminAuditLog {
  id: string;
  adminUserId: string;
  targetUserId: string | null;
  action: string;
  reason: string;
  metadata: Record<string, any>;
  createdAt: string;
}

export interface AdminUserStateSnapshot {
  id: string;
  userId: string;
  schemaVersion: number;
  sizeBytes: number;
  checksumSha256: string;
  reason: string;
  createdAt: string;
}

export interface AdminKpis {
  totalUsers: number;
  freeUsers: number;
  proUsers: number;
  mentorUsers: number;
  adminUsers: number;
  activePast7DaysCount: number;
  activePast7DaysPercent: number;
  mrrCents: number;
  grossRevenueCents: number;
  totalFeesCents: number;
  netRevenueCents: number;
  paidOrdersCount: number;
  pendingOrdersCount: number;
  refundedOrdersCount: number;
  pixOrdersPaid: number;
  cardOrdersPaid: number;
  cardPastDueCount: number;
  pixExpiringCount: number;
  churnRatePercent: number;
}

export interface AdminUserFilter {
  query?: string;
  planTier?: string;
  subscriptionStatus?: string;
  paymentMethod?: string;
  role?: string;
}

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
export const FLAT_PIX_FEE_CENTS = 80; // R$ 0,80 por transação PIX

/**
 * Calcula taxa do gateway e receita líquida de um pedido
 */
export function calculateNetRevenue(order: {
  amountCents: number;
  paymentMethod: 'pix' | 'card';
  feeCents?: number;
}): { feeCents: number; netAmountCents: number } {
  let fee = order.feeCents;
  if (typeof fee !== 'number' || fee < 0) {
    if (order.paymentMethod === 'pix') {
      fee = FLAT_PIX_FEE_CENTS;
    } else {
      // Padrão de mercado para cartão: 3.99% + R$ 0,40
      fee = Math.round(order.amountCents * 0.0399 + 40);
    }
  }
  const net = Math.max(0, order.amountCents - fee);
  return { feeCents: fee, netAmountCents: net };
}

/**
 * Normaliza termo de busca removendo acentos e convertendo para minúsculas
 */
function normalizeQuery(str: unknown): string {
  return String(str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

/**
 * Filtra lista de perfis administrativos por múltiplos critérios
 */
export function filterAdminUsers(
  profiles: AdminUserProfile[],
  filter: AdminUserFilter = {}
): AdminUserProfile[] {
  const q = normalizeQuery(filter.query);
  const plan = filter.planTier && filter.planTier !== 'all' ? filter.planTier : null;
  const status = filter.subscriptionStatus && filter.subscriptionStatus !== 'all' ? filter.subscriptionStatus : null;
  const method = filter.paymentMethod && filter.paymentMethod !== 'all' ? filter.paymentMethod : null;
  const role = filter.role && filter.role !== 'all' ? filter.role : null;

  return profiles.filter(user => {
    if (plan && user.planTier !== plan) return false;
    if (status && user.subscriptionStatus !== status) return false;
    if (method && user.paymentMethod !== method) return false;
    if (role && user.role !== role) return false;

    if (q) {
      const matchName = normalizeQuery(user.displayName).includes(q);
      const matchEmail = normalizeQuery(user.email).includes(q);
      const matchClerk = normalizeQuery(user.clerkUserId).includes(q);
      const matchCard = user.cardLast4 ? user.cardLast4.includes(q) : false;
      if (!matchName && !matchEmail && !matchClerk && !matchCard) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Identifica alunos sob risco no radar de retenção:
 * 1. Inadimplência no cartão (past_due) na janela de 3 dias
 * 2. Vencimento de assinatura pré-paga PIX nos próximos 7 dias
 */
export function detectRetentionRadar(
  profiles: AdminUserProfile[],
  nowTimestamp: number = Date.now()
): {
  pastDueCard: AdminUserProfile[];
  expiringSoonPix: AdminUserProfile[];
} {
  const pastDueCard: AdminUserProfile[] = [];
  const expiringSoonPix: AdminUserProfile[] = [];

  for (const user of profiles) {
    if (user.subscriptionStatus === 'past_due' && user.paymentMethod === 'card') {
      pastDueCard.push(user);
    } else if (user.planTier === 'pro' && user.paymentMethod === 'pix' && user.subscriptionPeriodEnd) {
      const endTs = new Date(user.subscriptionPeriodEnd).getTime();
      if (!isNaN(endTs) && endTs >= nowTimestamp && endTs <= nowTimestamp + SEVEN_DAYS_MS) {
        expiringSoonPix.push(user);
      }
    }
  }

  return { pastDueCard, expiringSoonPix };
}

/**
 * Consolida todas as métricas executivas e operacionais do SaaS
 */
export function calculateAdminKpis(
  profiles: AdminUserProfile[],
  orders: AdminBillingOrder[],
  nowTimestamp: number = Date.now()
): AdminKpis {
  let freeUsers = 0;
  let proUsers = 0;
  let mentorUsers = 0;
  let adminUsers = 0;
  let activePast7DaysCount = 0;
  let mrrCents = 0;
  let canceledCount = 0;

  for (const user of profiles) {
    if (user.role === 'admin') adminUsers++;
    if (user.role === 'mentor') mentorUsers++;

    if (user.planTier === 'free') {
      freeUsers++;
    } else if (user.planTier === 'pro' || user.planTier === 'mentor') {
      proUsers++;
      // Cálculo de MRR Equivalente
      const isActive =
        user.subscriptionStatus === 'active' ||
        user.subscriptionStatus === 'trialing' ||
        user.subscriptionStatus === 'past_due';
      if (isActive) {
        // Se usuário possui plano anual, divide por 12 meses (R$ 14,90/mês); se mensal, R$ 19,90/mês
        const isAnnual = user.subscriptionPeriodEnd
          ? new Date(user.subscriptionPeriodEnd).getTime() - nowTimestamp > 45 * 24 * 60 * 60 * 1000
          : false;
        mrrCents += isAnnual ? 1490 : 1990;
      }
    }

    if (user.subscriptionStatus === 'canceled') {
      canceledCount++;
    }

    if (user.lastSyncedAt) {
      const lastSyncTs = new Date(user.lastSyncedAt).getTime();
      if (!isNaN(lastSyncTs) && nowTimestamp - lastSyncTs <= SEVEN_DAYS_MS) {
        activePast7DaysCount++;
      }
    }
  }

  let grossRevenueCents = 0;
  let totalFeesCents = 0;
  let netRevenueCents = 0;
  let paidOrdersCount = 0;
  let pendingOrdersCount = 0;
  let refundedOrdersCount = 0;
  let pixOrdersPaid = 0;
  let cardOrdersPaid = 0;

  for (const order of orders) {
    if (order.status === 'PAID') {
      paidOrdersCount++;
      grossRevenueCents += order.amountCents;

      const { feeCents, netAmountCents } = calculateNetRevenue(order);
      totalFeesCents += feeCents;
      netRevenueCents += netAmountCents;

      if (order.paymentMethod === 'pix') pixOrdersPaid++;
      if (order.paymentMethod === 'card') cardOrdersPaid++;
    } else if (order.status === 'PENDING') {
      pendingOrdersCount++;
    } else if (order.status === 'REFUNDED') {
      refundedOrdersCount++;
    }
  }

  const { pastDueCard, expiringSoonPix } = detectRetentionRadar(profiles, nowTimestamp);

  const totalUsers = profiles.length;
  const activePast7DaysPercent = totalUsers > 0 ? Math.round((activePast7DaysCount / totalUsers) * 100) : 0;
  const churnDenom = proUsers + canceledCount;
  const churnRatePercent = churnDenom > 0 ? Number(((canceledCount / churnDenom) * 100).toFixed(1)) : 0;

  return {
    totalUsers,
    freeUsers,
    proUsers,
    mentorUsers,
    adminUsers,
    activePast7DaysCount,
    activePast7DaysPercent,
    mrrCents,
    grossRevenueCents,
    totalFeesCents,
    netRevenueCents,
    paidOrdersCount,
    pendingOrdersCount,
    refundedOrdersCount,
    pixOrdersPaid,
    cardOrdersPaid,
    cardPastDueCount: pastDueCard.length,
    pixExpiringCount: expiringSoonPix.length,
    churnRatePercent,
  };
}

/**
 * Formata centavos em moeda brasileira BRL (ex: R$ 1.490,00)
 */
export function formatCurrencyBRL(cents: number): string {
  const value = (cents || 0) / 100;
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/**
 * Formata data ISO para padrão brasileiro civil (DD/MM/AAAA HH:MM)
 */
export function formatDateBR(isoString: string | null | undefined): string {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '—';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return '—';
  }
}
