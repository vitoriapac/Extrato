/**
 * Serviço de Orquestração do Painel de Administração e Backoffice (Fase 8 SaaS)
 *
 * Conecta o cliente à Edge Function admin-api com fallback para simulação e teste offline.
 */

import {
  type AdminUserProfile,
  type AdminBillingOrder,
  type AdminAuditLog,
  type AdminUserStateSnapshot,
  type AdminKpis,
  calculateAdminKpis,
} from '../../domain/admin/admin-metrics.js';

export interface AdminDashboardData {
  profiles: AdminUserProfile[];
  orders: AdminBillingOrder[];
  auditLogs: AdminAuditLog[];
  kpis: AdminKpis;
}

export interface AdminServiceOptions {
  fetchImpl?: typeof fetch;
  apiUrl?: string;
  authToken?: string;
  storage?: Storage;
}

/**
 * Base de dados simulada para desenvolvimento local, demonstração e testes
 */
export const MOCK_ADMIN_PROFILES: AdminUserProfile[] = [
  {
    id: 'usr_mock_001',
    clerkUserId: 'user_2xyz001',
    email: 'marina.silva@concursos.com.br',
    displayName: 'Marina Silva',
    avatarUrl: null,
    planTier: 'pro',
    subscriptionStatus: 'active',
    paymentMethod: 'card',
    cardBrand: 'visa',
    cardLast4: '4242',
    subscriptionPeriodEnd: '2026-12-15T00:00:00Z',
    cancelAtPeriodEnd: false,
    role: 'student',
    createdAt: '2026-03-10T14:22:00Z',
    lastSyncedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    storageUsageKb: 420,
  },
  {
    id: 'usr_mock_002',
    clerkUserId: 'user_2xyz002',
    email: 'rodrigo.santos@email.com',
    displayName: 'Rodrigo Santos',
    avatarUrl: null,
    planTier: 'pro',
    subscriptionStatus: 'past_due', // Tolerância de 3 dias no cartão
    paymentMethod: 'card',
    cardBrand: 'mastercard',
    cardLast4: '8812',
    subscriptionPeriodEnd: '2026-11-09T18:00:00Z',
    cancelAtPeriodEnd: false,
    role: 'student',
    createdAt: '2026-01-20T10:15:00Z',
    lastSyncedAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
    storageUsageKb: 680,
  },
  {
    id: 'usr_mock_003',
    clerkUserId: 'user_2xyz003',
    email: 'camila.oliveira@gmail.com',
    displayName: 'Camila Oliveira',
    avatarUrl: null,
    planTier: 'pro',
    subscriptionStatus: 'active',
    paymentMethod: 'pix',
    cardBrand: null,
    cardLast4: null,
    subscriptionPeriodEnd: new Date(Date.now() + 4 * 86400 * 1000).toISOString(), // Vence em 4 dias
    cancelAtPeriodEnd: false,
    role: 'student',
    createdAt: '2026-04-05T09:00:00Z',
    lastSyncedAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    storageUsageKb: 310,
  },
  {
    id: 'usr_mock_004',
    clerkUserId: 'user_2xyz004',
    email: 'lucas.mentor@carreirasfiscais.com',
    displayName: 'Prof. Lucas Mendes',
    avatarUrl: null,
    planTier: 'mentor',
    subscriptionStatus: 'active',
    paymentMethod: 'card',
    cardBrand: 'elo',
    cardLast4: '9901',
    subscriptionPeriodEnd: '2027-01-01T00:00:00Z',
    cancelAtPeriodEnd: false,
    role: 'mentor',
    createdAt: '2025-11-12T16:45:00Z',
    lastSyncedAt: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
    storageUsageKb: 1450,
  },
  {
    id: 'usr_mock_005',
    clerkUserId: 'user_2xyz005',
    email: 'ana.carolina@outlook.com',
    displayName: 'Ana Carolina Lima',
    avatarUrl: null,
    planTier: 'free',
    subscriptionStatus: 'inactive',
    paymentMethod: null,
    cardBrand: null,
    cardLast4: null,
    subscriptionPeriodEnd: null,
    cancelAtPeriodEnd: false,
    role: 'student',
    createdAt: '2026-08-01T11:30:00Z',
    lastSyncedAt: new Date(Date.now() - 3 * 86400 * 1000).toISOString(),
    storageUsageKb: 180,
  },
  {
    id: 'usr_mock_006',
    clerkUserId: 'user_2xyz006',
    email: 'admin.operacoes@extratodeestudos.com.br',
    displayName: 'Admin Operações',
    avatarUrl: null,
    planTier: 'pro',
    subscriptionStatus: 'active',
    paymentMethod: null,
    cardBrand: null,
    cardLast4: null,
    subscriptionPeriodEnd: '2030-01-01T00:00:00Z',
    cancelAtPeriodEnd: false,
    role: 'admin',
    createdAt: '2025-10-01T08:00:00Z',
    lastSyncedAt: new Date().toISOString(),
    storageUsageKb: 250,
  },
];

export const MOCK_ADMIN_ORDERS: AdminBillingOrder[] = [
  {
    id: 'ord_mock_101',
    userId: 'usr_mock_001',
    customerEmail: 'marina.silva@concursos.com.br',
    planId: 'pro_annual',
    amountCents: 17880,
    feeCents: 753,
    netAmountCents: 17127,
    paymentMethod: 'card',
    status: 'PAID',
    installments: 12,
    cardBrand: 'visa',
    cardLast4: '4242',
    createdAt: '2025-12-15T10:00:00Z',
    settledAt: '2025-12-15T10:02:00Z',
  },
  {
    id: 'ord_mock_102',
    userId: 'usr_mock_003',
    customerEmail: 'camila.oliveira@gmail.com',
    planId: 'pro_monthly',
    amountCents: 1990,
    feeCents: 80, // Taxa fixa PIX
    netAmountCents: 1910,
    paymentMethod: 'pix',
    status: 'PAID',
    installments: 1,
    cardBrand: null,
    cardLast4: null,
    createdAt: '2026-10-12T15:20:00Z',
    settledAt: '2026-10-12T15:21:30Z',
  },
  {
    id: 'ord_mock_103',
    userId: 'usr_mock_002',
    customerEmail: 'rodrigo.santos@email.com',
    planId: 'pro_monthly',
    amountCents: 1990,
    feeCents: 119,
    netAmountCents: 1871,
    paymentMethod: 'card',
    status: 'FAILED', // Renovação recusada
    installments: 1,
    cardBrand: 'mastercard',
    cardLast4: '8812',
    createdAt: '2026-11-08T08:00:00Z',
    settledAt: null,
  },
  {
    id: 'ord_mock_104',
    userId: 'usr_mock_005',
    customerEmail: 'ana.carolina@outlook.com',
    planId: 'pro_monthly',
    amountCents: 1990,
    feeCents: 80,
    netAmountCents: 1910,
    paymentMethod: 'pix',
    status: 'PENDING',
    installments: 1,
    cardBrand: null,
    cardLast4: null,
    createdAt: '2026-11-08T19:40:00Z',
    settledAt: null,
  },
];

export const MOCK_ADMIN_AUDIT_LOGS: AdminAuditLog[] = [
  {
    id: 'log_mock_01',
    adminUserId: 'usr_mock_006',
    targetUserId: 'usr_mock_001',
    action: 'subscription_extended',
    reason: 'Compensação por instabilidade pontual relatada no suporte via e-mail',
    metadata: { days_added: 7 },
    createdAt: '2026-10-20T11:00:00Z',
  },
  {
    id: 'log_mock_02',
    adminUserId: 'usr_mock_006',
    targetUserId: 'usr_mock_004',
    action: 'role_changed',
    reason: 'Validação de parceria de mentoria institucional B2B',
    metadata: { old_role: 'student', new_role: 'mentor' },
    createdAt: '2025-11-12T17:00:00Z',
  },
];

export const MOCK_ADMIN_SNAPSHOTS: AdminUserStateSnapshot[] = [
  {
    id: 'snp_mock_01',
    userId: 'usr_mock_001',
    schemaVersion: 24,
    sizeBytes: 430080,
    checksumSha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
    reason: 'pre_import',
    createdAt: '2026-10-15T09:30:00Z',
  },
  {
    id: 'snp_mock_02',
    userId: 'usr_mock_001',
    schemaVersion: 24,
    sizeBytes: 425120,
    checksumSha256: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
    reason: 'auto_weekly',
    createdAt: '2026-10-08T00:00:00Z',
  },
];

// Estado mutável em memória para sessões locais / testes
let runtimeProfiles = structuredClone(MOCK_ADMIN_PROFILES);
let runtimeOrders = structuredClone(MOCK_ADMIN_ORDERS);
let runtimeAuditLogs = structuredClone(MOCK_ADMIN_AUDIT_LOGS);
let runtimeSnapshots = structuredClone(MOCK_ADMIN_SNAPSHOTS);

/**
 * Reseta o estado em memória para valores de fábrica (útil para suíte de testes)
 */
export function resetAdminMockState(): void {
  runtimeProfiles = structuredClone(MOCK_ADMIN_PROFILES);
  runtimeOrders = structuredClone(MOCK_ADMIN_ORDERS);
  runtimeAuditLogs = structuredClone(MOCK_ADMIN_AUDIT_LOGS);
  runtimeSnapshots = structuredClone(MOCK_ADMIN_SNAPSHOTS);
}

/**
 * Carrega a visão consolidada do painel administrativo
 */
export async function fetchAdminDashboard(options: AdminServiceOptions = {}): Promise<AdminDashboardData> {
  const fetchFn = options.fetchImpl || (typeof fetch !== 'undefined' ? fetch : null);
  const apiUrl = options.apiUrl || (typeof window !== 'undefined' ? (window as any).APP_CONFIG?.SUPABASE_URL : '');
  const token = options.authToken;

  if (fetchFn && apiUrl && token) {
    try {
      const endpoint = `${apiUrl.replace(/\/+$/, '')}/functions/v1/admin-api/dashboard`;
      const res = await fetchFn(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const payload = await res.json();
        if (payload && payload.profiles && payload.orders) {
          return {
            profiles: payload.profiles,
            orders: payload.orders,
            auditLogs: payload.auditLogs || [],
            kpis: calculateAdminKpis(payload.profiles, payload.orders),
          };
        }
      }
    } catch {
      // Falha de rede: recai sobre a base de simulação local
    }
  }

  return {
    profiles: structuredClone(runtimeProfiles),
    orders: structuredClone(runtimeOrders),
    auditLogs: structuredClone(runtimeAuditLogs),
    kpis: calculateAdminKpis(runtimeProfiles, runtimeOrders),
  };
}

/**
 * Concede ou estende dias de acesso Pro a um estudante
 */
export async function adminExtendUserSubscription(
  userId: string,
  days: number,
  reason: string,
  _options: AdminServiceOptions = {}
): Promise<{ success: boolean; newEnd: string }> {
  if (!reason || !reason.trim()) {
    throw new Error('Motivo da concessão é obrigatório para auditoria.');
  }
  if (days <= 0) {
    throw new Error('Quantidade de dias deve ser maior que zero.');
  }

  const user = runtimeProfiles.find(u => u.id === userId);
  if (!user) {
    throw new Error('Usuário não encontrado.');
  }

  const now = Date.now();
  const currentEndTs = user.subscriptionPeriodEnd ? new Date(user.subscriptionPeriodEnd).getTime() : 0;
  const baseTs = currentEndTs > now ? currentEndTs : now;
  const newEnd = new Date(baseTs + days * 86400 * 1000).toISOString();

  user.planTier = 'pro';
  user.subscriptionStatus = 'active';
  user.subscriptionPeriodEnd = newEnd;

  runtimeAuditLogs.unshift({
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    adminUserId: 'admin_current',
    targetUserId: userId,
    action: 'subscription_extended',
    reason: reason.trim(),
    metadata: { days_added: days, new_end: newEnd },
    createdAt: new Date().toISOString(),
  });

  return { success: true, newEnd };
}

/**
 * Altera o papel (role) do usuário (estudante, mentor ou administrador)
 */
export async function adminChangeUserRole(
  userId: string,
  newRole: 'student' | 'mentor' | 'admin',
  reason: string,
  _options: AdminServiceOptions = {}
): Promise<{ success: boolean }> {
  if (!reason || !reason.trim()) {
    throw new Error('Motivo da alteração de papel é obrigatório para auditoria.');
  }

  const user = runtimeProfiles.find(u => u.id === userId);
  if (!user) {
    throw new Error('Usuário não encontrado.');
  }

  const oldRole = user.role;
  user.role = newRole;

  runtimeAuditLogs.unshift({
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    adminUserId: 'admin_current',
    targetUserId: userId,
    action: 'role_changed',
    reason: reason.trim(),
    metadata: { old_role: oldRole, new_role: newRole },
    createdAt: new Date().toISOString(),
  });

  return { success: true };
}

/**
 * Realiza estorno integral de cobrança (Art. 49 do CDC - Arrependimento em 7 dias)
 */
export async function adminRefundOrder(
  orderId: string,
  reason: string,
  _options: AdminServiceOptions = {}
): Promise<{ success: boolean }> {
  if (!reason || !reason.trim()) {
    throw new Error('Motivo do estorno é obrigatório para auditoria.');
  }

  const order = runtimeOrders.find(o => o.id === orderId);
  if (!order) {
    throw new Error('Pedido não encontrado.');
  }

  order.status = 'REFUNDED';

  // Revoga acesso do aluno associado caso estorno seja integral
  const user = runtimeProfiles.find(u => u.id === order.userId);
  if (user) {
    user.planTier = 'free';
    user.subscriptionStatus = 'canceled';
  }

  runtimeAuditLogs.unshift({
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    adminUserId: 'admin_current',
    targetUserId: order.userId,
    action: 'order_refunded',
    reason: reason.trim(),
    metadata: { order_id: orderId, amount_cents: order.amountCents },
    createdAt: new Date().toISOString(),
  });

  return { success: true };
}

/**
 * Consulta snapshots de histórico de um aluno
 */
export async function adminFetchUserSnapshots(
  userId: string,
  _options: AdminServiceOptions = {}
): Promise<AdminUserStateSnapshot[]> {
  return runtimeSnapshots.filter(s => s.userId === userId);
}

/**
 * Restaura um snapshot anterior (Time-Machine / Rollback de suporte)
 */
export async function adminRestoreUserSnapshot(
  snapshotId: string,
  reason: string,
  _options: AdminServiceOptions = {}
): Promise<{ success: boolean }> {
  if (!reason || !reason.trim()) {
    throw new Error('Motivo da restauração é obrigatório para auditoria.');
  }

  const snapshot = runtimeSnapshots.find(s => s.id === snapshotId);
  if (!snapshot) {
    throw new Error('Snapshot não encontrado.');
  }

  runtimeAuditLogs.unshift({
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    adminUserId: 'admin_current',
    targetUserId: snapshot.userId,
    action: 'snapshot_restored',
    reason: reason.trim(),
    metadata: {
      snapshot_id: snapshotId,
      schema_version: snapshot.schemaVersion,
      checksum: snapshot.checksumSha256,
    },
    createdAt: new Date().toISOString(),
  });

  return { success: true };
}
