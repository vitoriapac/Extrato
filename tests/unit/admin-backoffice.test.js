import test from 'node:test';
import assert from 'node:assert/strict';
import { h } from 'preact';
import { renderToString } from 'preact-render-to-string';
import {
  calculateNetRevenue,
  calculateAdminKpis,
  filterAdminUsers,
  detectRetentionRadar,
  formatCurrencyBRL,
  formatDateBR,
  FLAT_PIX_FEE_CENTS,
} from '../../src/domain/admin/admin-metrics.js';
import {
  fetchAdminDashboard,
  adminExtendUserSubscription,
  adminChangeUserRole,
  adminRefundOrder,
  adminRestoreUserSnapshot,
  resetAdminMockState,
  MOCK_ADMIN_PROFILES,
  MOCK_ADMIN_ORDERS,
} from '../../src/application/admin/admin-service.js';
import { AdminDashboardView } from '../../src/ui/views/AdminDashboardView.js';

test('calculateNetRevenue — desconta tarifa fixa de R$ 0,80 no PIX e percentual no Cartão', () => {
  // PIX: R$ 19,90 com tarifa de R$ 0,80
  const pix = calculateNetRevenue({
    amountCents: 1990,
    paymentMethod: 'pix',
  });
  assert.equal(pix.feeCents, FLAT_PIX_FEE_CENTS);
  assert.equal(pix.netAmountCents, 1910);

  // Cartão com fee explícito
  const cardCustom = calculateNetRevenue({
    amountCents: 17880,
    paymentMethod: 'card',
    feeCents: 753,
  });
  assert.equal(cardCustom.feeCents, 753);
  assert.equal(cardCustom.netAmountCents, 17127);

  // Cartão com estimativa automática
  const cardAuto = calculateNetRevenue({
    amountCents: 10000,
    paymentMethod: 'card',
  });
  assert.equal(cardAuto.feeCents, 439); // 3.99% de 10000 + 40 = 399 + 40 = 439
  assert.equal(cardAuto.netAmountCents, 9561);
});

test('calculateAdminKpis — consolida MRR, receita líquida, retenção D7 e contadores de plano', () => {
  const kpis = calculateAdminKpis(MOCK_ADMIN_PROFILES, MOCK_ADMIN_ORDERS);

  assert.equal(kpis.totalUsers, MOCK_ADMIN_PROFILES.length);
  assert.ok(kpis.proUsers >= 4);
  assert.equal(kpis.freeUsers, 1);
  assert.equal(kpis.adminUsers, 1);
  assert.equal(kpis.mentorUsers, 1);

  // MRR deve ser positivo somando os alunos Pro ativos
  assert.ok(kpis.mrrCents > 0);
  assert.ok(kpis.netRevenueCents > 0);
  assert.ok(kpis.grossRevenueCents >= kpis.netRevenueCents);

  // Retenção D7
  assert.ok(kpis.activePast7DaysCount > 0);
  assert.ok(kpis.activePast7DaysPercent > 0 && kpis.activePast7DaysPercent <= 100);

  // Radar
  assert.equal(kpis.cardPastDueCount, 1); // Rodrigo Santos está past_due
});

test('filterAdminUsers — filtra por termo de busca, papel e plano', () => {
  // Busca por nome
  const porNome = filterAdminUsers(MOCK_ADMIN_PROFILES, { query: 'marina' });
  assert.equal(porNome.length, 1);
  assert.equal(porNome[0].displayName, 'Marina Silva');

  // Busca insensível a acentuação
  const porAcento = filterAdminUsers(MOCK_ADMIN_PROFILES, { query: 'operacoes' });
  assert.equal(porAcento.length, 1);
  assert.equal(porAcento[0].role, 'admin');

  // Busca por cartão
  const porCartao = filterAdminUsers(MOCK_ADMIN_PROFILES, { query: '4242' });
  assert.equal(porCartao.length, 1);

  // Filtro por papel
  const mentores = filterAdminUsers(MOCK_ADMIN_PROFILES, { role: 'mentor' });
  assert.equal(mentores.length, 1);
  assert.equal(mentores[0].displayName, 'Prof. Lucas Mendes');

  // Filtro por plano
  const frees = filterAdminUsers(MOCK_ADMIN_PROFILES, { planTier: 'free' });
  assert.equal(frees.length, 1);
  assert.equal(frees[0].displayName, 'Ana Carolina Lima');
});

test('detectRetentionRadar — identifica inadimplência de cartão (past_due) e vencimentos PIX em 7 dias', () => {
  const radar = detectRetentionRadar(MOCK_ADMIN_PROFILES);

  // Rodrigo Santos está no past_due
  assert.equal(radar.pastDueCard.length, 1);
  assert.equal(radar.pastDueCard[0].id, 'usr_mock_002');

  // Camila Oliveira tem plano PIX com vencimento nos próximos 4 dias
  assert.equal(radar.expiringSoonPix.length, 1);
  assert.equal(radar.expiringSoonPix[0].id, 'usr_mock_003');
});

test('formatCurrencyBRL e formatDateBR — formatação civil determinística', () => {
  assert.equal(formatCurrencyBRL(0), 'R$\u00A00,00');
  assert.equal(formatCurrencyBRL(1990), 'R$\u00A019,90');
  assert.equal(formatCurrencyBRL(17880), 'R$\u00A0178,80');

  assert.equal(formatDateBR(null), '—');
  assert.equal(formatDateBR(''), '—');
  const formatted = formatDateBR('2026-11-08T15:30:00Z');
  assert.ok(formatted.includes('2026'));
  assert.ok(formatted.includes(':'));
});

test('adminExtendUserSubscription — estende dias Pro e registra log de auditoria obrigatório', async () => {
  resetAdminMockState();

  // Exige motivo
  await assert.rejects(
    async () => {
      await adminExtendUserSubscription('usr_mock_001', 7, '');
    },
    { message: /Motivo da concessão é obrigatório/ }
  );

  // Concessão com sucesso
  const result = await adminExtendUserSubscription('usr_mock_001', 14, 'Extensão de teste de suporte');
  assert.equal(result.success, true);
  assert.ok(result.newEnd);

  // Consulta dashboard para validar mutação e auditoria
  const dash = await fetchAdminDashboard();
  const user = dash.profiles.find(u => u.id === 'usr_mock_001');
  assert.ok(user);
  assert.equal(user.subscriptionPeriodEnd, result.newEnd);

  const log = dash.auditLogs[0];
  assert.equal(log.action, 'subscription_extended');
  assert.equal(log.targetUserId, 'usr_mock_001');
  assert.equal(log.reason, 'Extensão de teste de suporte');
});

test('adminChangeUserRole — altera papel de usuário e grava auditoria', async () => {
  resetAdminMockState();

  const res = await adminChangeUserRole('usr_mock_001', 'mentor', 'Promoção para mentor parceiro');
  assert.equal(res.success, true);

  const dash = await fetchAdminDashboard();
  const user = dash.profiles.find(u => u.id === 'usr_mock_001');
  assert.ok(user);
  assert.equal(user.role, 'mentor');

  const log = dash.auditLogs[0];
  assert.equal(log.action, 'role_changed');
  assert.equal(log.reason, 'Promoção para mentor parceiro');
});

test('adminRefundOrder — estorna pedido integralmente (CDC 7 dias) e revoga plano do aluno', async () => {
  resetAdminMockState();

  const res = await adminRefundOrder('ord_mock_101', 'Direito de arrependimento manifestado no 3º dia');
  assert.equal(res.success, true);

  const dash = await fetchAdminDashboard();
  const order = dash.orders.find(o => o.id === 'ord_mock_101');
  assert.ok(order);
  assert.equal(order.status, 'REFUNDED');

  const user = dash.profiles.find(u => u.id === order.userId);
  assert.ok(user);
  assert.equal(user.planTier, 'free');
  assert.equal(user.subscriptionStatus, 'canceled');
});

test('adminRestoreUserSnapshot — restaura snapshot com registro de justificativa de auditoria', async () => {
  resetAdminMockState();

  const res = await adminRestoreUserSnapshot('snp_mock_01', 'Restauração pós exclusão acidental de disciplina');
  assert.equal(res.success, true);

  const dash = await fetchAdminDashboard();
  const log = dash.auditLogs[0];
  assert.equal(log.action, 'snapshot_restored');
  assert.equal(log.reason, 'Restauração pós exclusão acidental de disciplina');
});

test('AdminDashboardView — renderiza cockpit executivo com Tabler Icons e conformidade estrita de Zero Emojis (WCAG AA)', () => {
  const html = renderToString(
    h(AdminDashboardView, {
      open: true,
      onClose: () => {},
    })
  );

  // Validação de acessibilidade e títulos
  assert.ok(html.includes('Painel de Administração e Backoffice SaaS'));
  assert.ok(html.includes('Cockpit &amp; Receita') || html.includes('Cockpit & Receita'));
  assert.ok(html.includes('MRR Equivalente'));
  assert.ok(html.includes('Radar de Retenção &amp; Cobrança Preventiva') || html.includes('Radar de Retenção & Cobrança Preventiva'));
  assert.ok(html.includes('icon-tabler'));

  // PROIBIÇÃO ESTRITA DE EMOJIS (Zero Emojis Policy)
  const emojiRegex = /\p{Extended_Pictographic}/u;
  const hasEmoji = emojiRegex.test(html);
  assert.equal(hasEmoji, false, `Violação detectada: a UI gerada contém emojis proibidos: ${html.match(emojiRegex)?.[0]}`);
});
