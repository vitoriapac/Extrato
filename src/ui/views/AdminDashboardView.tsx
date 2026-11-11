import { useState, useEffect, useMemo } from 'preact/hooks';
import { Dialog } from '../primitives/dialog.js';
import { Button } from '../primitives/button.js';
import { Badge } from '../primitives/badge.js';
import { Icon } from '../primitives/icon.js';
import { Tabs } from '../primitives/tabs.js';
import {
  type AdminUserProfile,
  type AdminBillingOrder,
  type AdminAuditLog,
  type AdminUserStateSnapshot,
  type AdminKpis,
  filterAdminUsers,
  formatCurrencyBRL,
  formatDateBR,
  detectRetentionRadar,
} from '../../domain/admin/admin-metrics.js';
import {
  fetchAdminDashboard,
  adminExtendUserSubscription,
  adminChangeUserRole,
  adminRefundOrder,
  adminRestoreUserSnapshot,
  MOCK_ADMIN_PROFILES,
  MOCK_ADMIN_ORDERS,
  MOCK_ADMIN_AUDIT_LOGS,
  MOCK_ADMIN_SNAPSHOTS,
} from '../../application/admin/admin-service.js';
import { calculateAdminKpis } from '../../domain/admin/admin-metrics.js';

export interface AdminDashboardViewProps {
  open: boolean;
  onClose: () => void;
  apiUrl?: string;
  authToken?: string;
}

type AdminTab = 'cockpit' | 'users' | 'orders' | 'snapshots' | 'audit';

export function AdminDashboardView({
  open,
  onClose,
  apiUrl,
  authToken,
}: AdminDashboardViewProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('cockpit');
  const [profiles, setProfiles] = useState<AdminUserProfile[]>(MOCK_ADMIN_PROFILES);
  const [orders, setOrders] = useState<AdminBillingOrder[]>(MOCK_ADMIN_ORDERS);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>(MOCK_ADMIN_AUDIT_LOGS);
  const [snapshots] = useState<AdminUserStateSnapshot[]>(MOCK_ADMIN_SNAPSHOTS);
  const [kpis, setKpis] = useState<AdminKpis | null>(() =>
    calculateAdminKpis(MOCK_ADMIN_PROFILES, MOCK_ADMIN_ORDERS)
  );
  const [loading, setLoading] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Filtros da aba de usuários
  const [userQuery, setUserQuery] = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');

  const loadData = () => {
    setLoading(true);
    fetchAdminDashboard({ apiUrl, authToken })
      .then(data => {
        setProfiles(data.profiles);
        setOrders(data.orders);
        setAuditLogs(data.auditLogs);
        setKpis(data.kpis);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open, apiUrl, authToken]);

  const filteredUsers = useMemo(() => {
    return filterAdminUsers(profiles, {
      query: userQuery,
      planTier: planFilter,
      role: roleFilter,
    });
  }, [profiles, userQuery, planFilter, roleFilter]);

  const retentionRadar = useMemo(() => {
    return detectRetentionRadar(profiles);
  }, [profiles]);

  // Ações Administrativas com Auditoria
  const handleExtend = async (user: AdminUserProfile, days: number) => {
    const reason = window.prompt(
      `Motivo para conceder +${days} dias a ${user.displayName} (obrigatório para auditoria):`,
      'Ajuste operacional de cortesia'
    );
    if (!reason || !reason.trim()) return;

    try {
      await adminExtendUserSubscription(user.id, days, reason, { apiUrl, authToken });
      setFeedbackMessage(`Assinatura de ${user.displayName} estendida em +${days} dias.`);
      loadData();
    } catch (err: any) {
      alert(err?.message || 'Erro ao estender assinatura.');
    }
  };

  const handleChangeRole = async (user: AdminUserProfile) => {
    const newRole = window.prompt(
      `Definir novo papel para ${user.displayName} (student, mentor ou admin):`,
      user.role === 'student' ? 'mentor' : 'student'
    ) as 'student' | 'mentor' | 'admin' | null;

    if (!newRole || !['student', 'mentor', 'admin'].includes(newRole)) return;
    const reason = window.prompt('Motivo da alteração de papel (obrigatório para auditoria):');
    if (!reason || !reason.trim()) return;

    try {
      await adminChangeUserRole(user.id, newRole, reason, { apiUrl, authToken });
      setFeedbackMessage(`Papel de ${user.displayName} alterado para ${newRole}.`);
      loadData();
    } catch (err: any) {
      alert(err?.message || 'Erro ao alterar papel.');
    }
  };

  const handleRefund = async (order: AdminBillingOrder) => {
    const confirmRefund = window.confirm(
      `Confirmar estorno integral de ${formatCurrencyBRL(order.amountCents)} do pedido ${order.id} (Direito de Arrependimento — Art. 49 CDC)?`
    );
    if (!confirmRefund) return;

    const reason = window.prompt('Motivo do estorno (obrigatório para auditoria):', 'Solicitação de cancelamento no prazo de 7 dias');
    if (!reason || !reason.trim()) return;

    try {
      await adminRefundOrder(order.id, reason, { apiUrl, authToken });
      setFeedbackMessage(`Pedido ${order.id} estornado com sucesso.`);
      loadData();
    } catch (err: any) {
      alert(err?.message || 'Erro ao estornar pedido.');
    }
  };

  const handleRestoreSnapshot = async (snapshot: AdminUserStateSnapshot) => {
    const confirmRestore = window.confirm(
      `Deseja restaurar o snapshot ${snapshot.id} criado em ${formatDateBR(snapshot.createdAt)}? Esta ação será registrada na trilha de auditoria.`
    );
    if (!confirmRestore) return;

    const reason = window.prompt('Justificativa para a restauração (obrigatório para auditoria):', 'Recuperação de dados a pedido do aluno via suporte');
    if (!reason || !reason.trim()) return;

    try {
      await adminRestoreUserSnapshot(snapshot.id, reason, { apiUrl, authToken });
      setFeedbackMessage(`Snapshot ${snapshot.id} restaurado com sucesso.`);
      loadData();
    } catch (err: any) {
      alert(err?.message || 'Erro ao restaurar snapshot.');
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Painel de Administração e Backoffice SaaS"
      maxWidth="xl"
      className="max-h-[92vh]"
    >
      <div class="flex flex-col gap-stack">
        {/* Barra superior de navegação por abas */}
        <Tabs
          variant="contained"
          label="Abas do Painel Administrativo"
          value={activeTab}
          onValueChange={id => setActiveTab(id as AdminTab)}
          items={[
            { id: 'cockpit', label: 'Cockpit & Receita', icon: 'layout-dashboard' },
            { id: 'users', label: 'Usuários CRM', icon: 'users', badge: profiles.length },
            { id: 'orders', label: 'Conciliação', icon: 'credit-card', badge: orders.length },
            { id: 'snapshots', label: 'Telemetria Snapshots', icon: 'database' },
            { id: 'audit', label: 'Auditoria', icon: 'history', badge: auditLogs.length },
          ]}
        />

        {/* Feedback Temporário */}
        {feedbackMessage && (
          <div
            role="alert"
            class="flex items-center justify-between px-3 py-2 rounded-default bg-green-bg text-green text-xs border border-green/20"
          >
            <div class="flex items-center gap-2">
              <Icon name="circle-check" size={16} />
              <span>{feedbackMessage}</span>
            </div>
            <button
              type="button"
              aria-label="Fechar notificação"
              onClick={() => setFeedbackMessage(null)}
              class="min-h-control min-w-control p-2 inline-flex items-center justify-center rounded hover:opacity-75 cursor-pointer"
            >
              <Icon name="x" size={14} />
            </button>
          </div>
        )}

        {/* Conteúdo Principal */}
        <div class="overflow-y-auto max-h-[60vh] pr-1">
          {loading ? (
            <div class="flex flex-col items-center justify-center py-12 gap-2 text-secondary">
              <Icon name="loader-2" size={28} class="animate-spin text-brand dark:text-accent" />
              <span class="text-xs">Carregando telemetria operacional...</span>
            </div>
          ) : (
            <>
              {/* ABA 1: COCKPIT & RECEITA */}
              {activeTab === 'cockpit' && kpis && (
                <div class="flex flex-col gap-stack">
                  {/* Grid de KPIs Principais */}
                  <div class="grid grid-cols-2 md:grid-cols-4 gap-stack-sm">
                    <div class="p-card rounded-default bg-surface-card border border-border-default flex flex-col gap-1">
                      <span class="text-xs font-medium text-secondary">MRR Equivalente</span>
                      <span class="text-xl font-semibold font-display text-text">{formatCurrencyBRL(kpis.mrrCents)}</span>
                      <span class="text-xs text-muted">Receita mensal estimada</span>
                    </div>

                    <div class="p-card rounded-default bg-surface-card border border-border-default flex flex-col gap-1">
                      <span class="text-xs font-medium text-secondary">Receita Líquida</span>
                      <span class="text-xl font-semibold font-display text-brand dark:text-accent">{formatCurrencyBRL(kpis.netRevenueCents)}</span>
                      <span class="text-xs text-muted">Descontadas taxas de gateway</span>
                    </div>

                    <div class="p-card rounded-default bg-surface-card border border-border-default flex flex-col gap-1">
                      <span class="text-xs font-medium text-secondary">Assinantes Pro / Alunos</span>
                      <span class="text-xl font-semibold font-display text-text">
                        {kpis.proUsers} <span class="text-xs font-normal font-body text-secondary">/ {kpis.totalUsers}</span>
                      </span>
                      <span class="text-xs text-muted">{kpis.freeUsers} no plano Free</span>
                    </div>

                    <div class="p-card rounded-default bg-surface-card border border-border-default flex flex-col gap-1">
                      <span class="text-xs font-medium text-secondary">Retenção Ativa D7</span>
                      <span class="text-xl font-semibold font-display text-text">{kpis.activePast7DaysPercent}%</span>
                      <span class="text-xs text-muted">{kpis.activePast7DaysCount} sincronizaram em 7 dias</span>
                    </div>
                  </div>

                  {/* Radar Duplo de Retenção e Alertas de Receita */}
                  <div class="flex flex-col gap-stack-sm">
                    <h4 class="text-xs font-semibold text-secondary uppercase tracking-wider">
                      Radar de Retenção & Cobrança Preventiva
                    </h4>

                    {/* Alerta de Inadimplência no Cartão (past_due) */}
                    {retentionRadar.pastDueCard.length > 0 ? (
                      <div class="p-3 rounded-default bg-amber-bg text-amber border border-amber/30 flex items-start gap-3 text-xs">
                        <span class="inline-flex h-4 items-center shrink-0">
                          <Icon name="alert-triangle" size={18} />
                        </span>
                        <div class="flex-1">
                          <p class="font-semibold">
                            {retentionRadar.pastDueCard.length} aluno(s) com falha na renovação do cartão (Janela de Tolerância de 3 Dias ativa):
                          </p>
                          <ul class="mt-1 list-disc list-inside text-text/80 space-y-1">
                            {retentionRadar.pastDueCard.map(u => (
                              <li key={u.id}>
                                <strong>{u.displayName}</strong> ({u.email}) — Cartão final •••• {u.cardLast4 || '****'}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ) : (
                      <div class="p-3 rounded-default bg-surface-card border border-border-subtle text-secondary text-xs flex items-center gap-2">
                        <Icon name="circle-check" size={16} class="text-green shrink-0" />
                        <span>Zero faturas de cartão pendentes de renovação no momento.</span>
                      </div>
                    )}

                    {/* Alerta de Vencimento Pré-pago PIX (Próximos 7 dias) */}
                    {retentionRadar.expiringSoonPix.length > 0 ? (
                      <div class="p-3 rounded-default bg-info-bg text-brand-secondary border border-border-default flex items-start gap-3 text-xs">
                        <span class="inline-flex h-4 items-center shrink-0">
                          <Icon name="clock" size={18} />
                        </span>
                        <div class="flex-1">
                          <p class="font-semibold">
                            {retentionRadar.expiringSoonPix.length} aluno(s) PIX com plano vencendo nos próximos 7 dias:
                          </p>
                          <ul class="mt-1 list-disc list-inside text-text/80 space-y-1">
                            {retentionRadar.expiringSoonPix.map(u => (
                              <li key={u.id}>
                                <strong>{u.displayName}</strong> — Vence em: {formatDateBR(u.subscriptionPeriodEnd)}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ) : (
                      <div class="p-3 rounded-default bg-surface-card border border-border-subtle text-secondary text-xs flex items-center gap-2">
                        <Icon name="circle-check" size={16} class="text-green shrink-0" />
                        <span>Nenhum plano PIX expirando nos próximos 7 dias.</span>
                      </div>
                    )}
                  </div>

                  {/* Resumo de Métodos de Pagamento & Churn */}
                  <div class="grid grid-cols-1 md:grid-cols-3 gap-stack-sm">
                    <div class="p-card rounded-default bg-surface-card border border-border-default flex flex-col gap-1 text-xs">
                      <span class="font-semibold text-text flex items-center gap-2">
                        <Icon name="building-bank" size={15} /> Pagamentos via PIX
                      </span>
                      <span class="text-secondary">{kpis.pixOrdersPaid} liquidados (Tarifa fixa R$ 0,80)</span>
                    </div>

                    <div class="p-card rounded-default bg-surface-card border border-border-default flex flex-col gap-1 text-xs">
                      <span class="font-semibold text-text flex items-center gap-2">
                        <Icon name="credit-card" size={15} /> Pagamentos via Cartão
                      </span>
                      <span class="text-secondary">{kpis.cardOrdersPaid} aprovados (Recorrência e parcelas)</span>
                    </div>

                    <div class="p-card rounded-default bg-surface-card border border-border-default flex flex-col gap-1 text-xs">
                      <span class="font-semibold text-text flex items-center gap-2">
                        <Icon name="trending-down" size={15} /> Taxa de Churn
                      </span>
                      <span class="text-secondary">{kpis.churnRatePercent}% de cancelamentos acumulados</span>
                    </div>
                  </div>
                </div>
              )}

              {/* ABA 2: GESTÃO DE USUÁRIOS (CRM) */}
              {activeTab === 'users' && (
                <div class="flex flex-col gap-stack-sm">
                  {/* Filtros de Busca */}
                  <div class="flex flex-col md:flex-row items-center gap-2">
                    <div class="relative flex-1 w-full">
                      <span class="absolute left-3 top-1/2 -translate-y-1/2 text-secondary pointer-events-none">
                        <Icon name="search" size={14} />
                      </span>
                      <input
                        type="text"
                        aria-label="Buscar usuário"
                        placeholder="Buscar por nome, e-mail, ID Clerk ou final do cartão..."
                        value={userQuery}
                        onInput={e => setUserQuery((e.target as HTMLInputElement).value)}
                        class="w-full min-h-control pl-10 pr-3 py-2 text-xs rounded border border-border-control bg-surface-subtle text-text focus:outline-none focus:border-brand"
                      />
                    </div>

                    <select
                      aria-label="Filtrar por plano"
                      value={planFilter}
                      onChange={e => setPlanFilter((e.target as HTMLSelectElement).value)}
                      class="min-h-control px-3 py-2 text-xs rounded border border-border-control bg-surface-subtle text-text cursor-pointer"
                    >
                      <option value="all">Todos os Planos</option>
                      <option value="pro">Pro</option>
                      <option value="mentor">Mentor</option>
                      <option value="free">Free</option>
                    </select>

                    <select
                      aria-label="Filtrar por papel"
                      value={roleFilter}
                      onChange={e => setRoleFilter((e.target as HTMLSelectElement).value)}
                      class="min-h-control px-3 py-2 text-xs rounded border border-border-control bg-surface-subtle text-text cursor-pointer"
                    >
                      <option value="all">Todos os Papéis</option>
                      <option value="student">Aluno</option>
                      <option value="mentor">Mentor</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  {/* Tabela de Usuários */}
                  <div class="overflow-x-auto border border-border-default rounded-default">
                    <table class="w-full text-left text-xs border-collapse">
                      <thead class="bg-surface-subtle text-secondary font-medium border-b border-border-default">
                        <tr>
                          <th class="px-3 py-2">Usuário (Clerk)</th>
                          <th class="px-3 py-2">Papel</th>
                          <th class="px-3 py-2">Plano / Status</th>
                          <th class="px-3 py-2">Método</th>
                          <th class="px-3 py-2">Validade</th>
                          <th class="px-3 py-2 text-right">Ações Rápidas</th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-border-subtle bg-surface-card text-text">
                        {filteredUsers.length === 0 ? (
                          <tr>
                            <td colspan={6} class="p-6 text-center text-secondary">
                              Nenhum usuário corresponde aos filtros.
                            </td>
                          </tr>
                        ) : (
                          filteredUsers.map(user => {
                            const isPro = user.planTier === 'pro' || user.planTier === 'mentor';
                            return (
                              <tr key={user.id} class="hover:bg-surface-subtle/50 transition-colors">
                                <td class="px-3 py-2">
                                  <div class="flex items-center gap-2">
                                    <div class="w-6 h-6 rounded-full bg-brand/10 dark:bg-accent/15 text-brand dark:text-accent flex items-center justify-center font-semibold text-xs shrink-0">
                                      {user.displayName.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div class="flex flex-col min-w-0">
                                      <span class="font-medium truncate">{user.displayName}</span>
                                      <span class="text-xs text-secondary truncate">{user.email}</span>
                                    </div>
                                  </div>
                                </td>
                                <td class="px-3 py-2">
                                  <span class="capitalize text-secondary">{user.role}</span>
                                </td>
                                <td class="px-3 py-2">
                                  <div class="flex items-center gap-2 flex-wrap">
                                    <Badge variant={isPro ? 'success' : 'default'}>
                                      {user.planTier.toUpperCase()}
                                    </Badge>
                                    {user.subscriptionStatus === 'past_due' && (
                                      <Badge variant="warning">Tolerância</Badge>
                                    )}
                                  </div>
                                </td>
                                <td class="px-3 py-2">
                                  {user.paymentMethod === 'card' ? (
                                    <span class="text-secondary">Cartão •••• {user.cardLast4 || '****'}</span>
                                  ) : user.paymentMethod === 'pix' ? (
                                    <span class="text-secondary">PIX</span>
                                  ) : (
                                    <span class="text-muted">—</span>
                                  )}
                                </td>
                                <td class="px-3 py-2 text-secondary">
                                  {formatDateBR(user.subscriptionPeriodEnd)}
                                </td>
                                <td class="px-3 py-2 text-right">
                                  <div class="inline-flex items-center gap-2 justify-end">
                                    <Button
                                      variant="ghost"
                                      size="small"
                                      onClick={() => handleExtend(user, 7)}
                                      aria-label={`Conceder 7 dias adicionais a ${user.displayName}`}
                                    >
                                      +7d
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="small"
                                      onClick={() => handleExtend(user, 31)}
                                      aria-label={`Conceder 31 dias Pro a ${user.displayName}`}
                                    >
                                      +31d
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="small"
                                      onClick={() => handleChangeRole(user)}
                                      aria-label={`Promover ou alterar papel de ${user.displayName}`}
                                    >
                                      Papel
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ABA 3: CONCILIAÇÃO FINANCEIRA */}
              {activeTab === 'orders' && (
                <div class="flex flex-col gap-3">
                  <div class="overflow-x-auto border border-border-default rounded-default">
                    <table class="w-full text-left text-xs border-collapse">
                      <thead class="bg-surface-subtle text-secondary font-medium border-b border-border-default">
                        <tr>
                          <th class="px-3 py-2">ID / Data</th>
                          <th class="px-3 py-2">Cliente</th>
                          <th class="px-3 py-2">Método / Parcelas</th>
                          <th class="px-3 py-2">Valor Bruto</th>
                          <th class="px-3 py-2">Taxa Gateway</th>
                          <th class="px-3 py-2">Valor Líquido</th>
                          <th class="px-3 py-2">Status</th>
                          <th class="px-3 py-2 text-right">Ação CDC</th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-border-subtle bg-surface-card text-text">
                        {orders.map(order => (
                          <tr key={order.id} class="hover:bg-surface-subtle/50 transition-colors">
                            <td class="px-3 py-2">
                              <div class="flex flex-col">
                                <span class="font-mono text-xs text-secondary">{order.id}</span>
                                <span class="text-xs text-muted">{formatDateBR(order.createdAt)}</span>
                              </div>
                            </td>
                            <td class="px-3 py-2">
                              <span class="truncate block max-w-[140px]">{order.customerEmail}</span>
                            </td>
                            <td class="px-3 py-2">
                              {order.paymentMethod === 'card'
                                ? `Cartão (${order.installments}x)`
                                : 'PIX à Vista'}
                            </td>
                            <td class="px-3 py-2 font-medium">{formatCurrencyBRL(order.amountCents)}</td>
                            <td class="px-3 py-2 text-red">-{formatCurrencyBRL(order.feeCents)}</td>
                            <td class="px-3 py-2 font-semibold text-green">
                              {formatCurrencyBRL(order.netAmountCents)}
                            </td>
                            <td class="px-3 py-2">
                              <Badge
                                variant={
                                  order.status === 'PAID'
                                    ? 'success'
                                    : order.status === 'PENDING'
                                      ? 'warning'
                                      : order.status === 'REFUNDED'
                                        ? 'default'
                                        : 'danger'
                                }
                              >
                                {order.status}
                              </Badge>
                            </td>
                            <td class="px-3 py-2 text-right">
                              {order.status === 'PAID' ? (
                                <Button
                                  variant="ghost"
                                  size="small"
                                  className="text-red hover:bg-red-bg"
                                  onClick={() => handleRefund(order)}
                                >
                                  Estornar CDC
                                </Button>
                              ) : (
                                <span class="text-muted">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ABA 4: TELEMETRIA SNAPSHOTS */}
              {activeTab === 'snapshots' && (
                <div class="flex flex-col gap-3">
                  <p class="text-xs text-secondary">
                    Inspeção Privacy-First de estados e backups versionados para suporte técnico e recuperação anti-corrupção.
                  </p>
                  <div class="overflow-x-auto border border-border-default rounded-default">
                    <table class="w-full text-left text-xs border-collapse">
                      <thead class="bg-surface-subtle text-secondary font-medium border-b border-border-default">
                        <tr>
                          <th class="px-3 py-2">ID / Aluno</th>
                          <th class="px-3 py-2">Versão Schema</th>
                          <th class="px-3 py-2">Tamanho (KB)</th>
                          <th class="px-3 py-2">Checksum SHA-256</th>
                          <th class="px-3 py-2">Gatilho</th>
                          <th class="px-3 py-2">Data Criação</th>
                          <th class="px-3 py-2 text-right">Restauração</th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-border-subtle bg-surface-card text-text">
                        {snapshots.map(snp => (
                          <tr key={snp.id} class="hover:bg-surface-subtle/50 transition-colors">
                            <td class="px-3 py-2 font-mono text-xs">{snp.id}</td>
                            <td class="px-3 py-2">v{snp.schemaVersion}</td>
                            <td class="px-3 py-2">{Math.round(snp.sizeBytes / 1024)} KB</td>
                            <td class="px-3 py-2 font-mono text-xs text-muted">
                              {snp.checksumSha256.substring(0, 12)}...
                            </td>
                            <td class="px-3 py-2">
                              <Badge variant="info">{snp.reason}</Badge>
                            </td>
                            <td class="px-3 py-2 text-secondary">{formatDateBR(snp.createdAt)}</td>
                            <td class="px-3 py-2 text-right">
                              <Button
                                variant="secondary"
                                size="small"
                                iconLeft="refresh"
                                onClick={() => handleRestoreSnapshot(snp)}
                              >
                                Restaurar
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ABA 5: TRILHA DE AUDITORIA */}
              {activeTab === 'audit' && (
                <div class="flex flex-col gap-3">
                  <div class="overflow-x-auto border border-border-default rounded-default">
                    <table class="w-full text-left text-xs border-collapse">
                      <thead class="bg-surface-subtle text-secondary font-medium border-b border-border-default">
                        <tr>
                          <th class="px-3 py-2">Data / Hora</th>
                          <th class="px-3 py-2">Operador</th>
                          <th class="px-3 py-2">Ação</th>
                          <th class="px-3 py-2">Justificativa Textual</th>
                          <th class="px-3 py-2">Metadados</th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-border-subtle bg-surface-card text-text">
                        {auditLogs.map(log => (
                          <tr key={log.id} class="hover:bg-surface-subtle/50 transition-colors">
                            <td class="px-3 py-2 text-secondary whitespace-nowrap">
                              {formatDateBR(log.createdAt)}
                            </td>
                            <td class="px-3 py-2 font-mono text-xs">{log.adminUserId}</td>
                            <td class="px-3 py-2">
                              <Badge variant="default">{log.action}</Badge>
                            </td>
                            <td class="px-3 py-2 max-w-xs">{log.reason}</td>
                            <td class="px-3 py-2 font-mono text-xs text-muted">
                              {JSON.stringify(log.metadata)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Rodapé */}
        <footer class="pt-3 border-t border-border-subtle flex items-center justify-between text-xs text-secondary">
          <span class="inline-flex items-center gap-2 text-muted">
            <Icon name="shield-check" size={14} />
            <span>Sessão administrativa auditada e segura.</span>
          </span>
          <Button variant="ghost" size="small" onClick={onClose}>
            Fechar Painel
          </Button>
        </footer>
      </div>
    </Dialog>
  );
}
