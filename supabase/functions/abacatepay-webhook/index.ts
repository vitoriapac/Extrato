/**
 * Supabase Edge Function: abacatepay-webhook
 *
 * Recebe eventos de ciclo de vida da AbacatePay (PIX e Cartão de Crédito).
 * - billing.paid: Liquida o pedido atomicamente via RPC settle_billing_order
 * - billing.overdue / invoice.payment_failed: Marca 'past_due' só se o período já pago terminou
 *   (cobrança de renovação falha não corta um Pro que ainda tem dias pagos)
 * - subscription.canceled: Marca 'canceled'
 * - billing.refunded: Marca REFUNDED e revoga o Pro se o pedido estava pago, salvo se houver outro pedido pago
 * - charge.dispute.created: só registra aviso (não revoga)
 */

import { createClient } from '../_shared/supabase.ts';
import {
  checkOrder,
  MAX_BODY_BYTES,
  parseBillingWebhookEvent,
  safeEqual,
} from '../_shared/webhook-logic.ts';

const internalError = () => Response.json({ error: 'Falha interna.' }, { status: 500 });

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Método não permitido.' }, { status: 405 });
  }

  const expectedSecret = Deno.env.get('ABACATEPAY_WEBHOOK_SECRET');
  if (!expectedSecret || !(await safeEqual(req.headers.get('x-webhook-secret'), expectedSecret))) {
    return Response.json({ error: 'Assinatura de webhook inválida.' }, { status: 401 });
  }

  const tooBig = () => Response.json({ error: 'Corpo grande demais.' }, { status: 413 });
  if (Number(req.headers.get('content-length') ?? 0) > MAX_BODY_BYTES) return tooBig();
  const raw = await req.text();
  if (raw.length > MAX_BODY_BYTES) return tooBig();

  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return Response.json({ error: 'JSON inválido.' }, { status: 400 });
  }

  const event = parseBillingWebhookEvent(payload);
  if (!event) return Response.json({ received: true, ignored: true });

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  const { data: order, error: orderError } = await supabaseAdmin
    .from('billing_orders')
    .select('id, user_id, status, amount_cents, plan_id')
    .eq('provider_billing_id', event.billingId)
    .maybeSingle();

  if (orderError) {
    console.error('webhook: falha ao buscar pedido', orderError.message);
    return Response.json({ error: 'Falha interna.' }, { status: 500 });
  }

  if (event.type === 'paid') {
    const check = checkOrder(order, event.paidCents);
    if (check !== 'ok') {
      if (check !== 'already_paid') console.warn('webhook ignorado:', check, event.billingId);
      return Response.json({ received: true, ignored: true });
    }

    // Atualiza metadados do pagamento em billing_orders
    const { error: metaError } = await supabaseAdmin
      .from('billing_orders')
      .update({
        fee_cents: event.feeCents || 0,
        payment_method: event.paymentMethod,
      })
      .eq('id', order!.id);
    if (metaError) {
      console.error('webhook: falha ao gravar metadados do pagamento', metaError.message);
      return internalError();
    }

    const { error: settleError } = await supabaseAdmin.rpc('settle_billing_order', {
      p_order_id: order!.id,
    });
    if (settleError) {
      console.error('webhook: falha ao liquidar pedido', settleError.message);
      return Response.json({ error: 'Falha interna.' }, { status: 500 });
    }

    // Se pago com cartão, grava marca e últimos 4 dígitos no perfil
    if (event.paymentMethod === 'card' && order?.user_id) {
      const { error: cardError } = await supabaseAdmin
        .from('profiles')
        .update({
          payment_method: 'card',
          auto_renew: true,
          card_brand: event.cardBrand || null,
          card_last4: event.cardLast4 || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', order.user_id);
      if (cardError) {
        // O pedido já foi liquidado (idempotente): só os dados do cartão ficaram de fora.
        console.error('webhook: falha ao gravar cartão no perfil', cardError.message);
      }
    }

    return Response.json({ received: true });
  }

  if (event.type === 'past_due' && order?.user_id) {
    const now = new Date().toISOString();
    // Só vira past_due quando não há mais período pago: antes disso o Pro segue valendo até o vencimento.
    const { error: statusError } = await supabaseAdmin
      .from('profiles')
      .update({ subscription_status: 'past_due', updated_at: now })
      .eq('id', order.user_id)
      .or(`subscription_period_end.is.null,subscription_period_end.lt.${now}`);
    if (statusError) {
      console.error('webhook: falha ao marcar past_due', statusError.message);
      return internalError();
    }

    const { error: reasonError } = await supabaseAdmin
      .from('billing_orders')
      .update({
        failure_reason: event.failureReason || 'Cobrança não autorizada',
      })
      .eq('id', order.id);
    if (reasonError) {
      console.error('webhook: falha ao gravar motivo da falha', reasonError.message);
      return internalError();
    }

    return Response.json({ received: true, status: 'past_due' });
  }

  if (event.type === 'disputed') {
    console.warn('webhook: disputa aberta, nenhuma ação automática', event.billingId);
    return Response.json({ received: true, status: 'disputed' });
  }

  if (event.type === 'refunded' && order?.user_id) {
    const wasPaid = order.status === 'PAID';
    const { error: refundError } = await supabaseAdmin
      .from('billing_orders')
      .update({ status: 'REFUNDED' })
      .eq('id', order.id);
    if (refundError) {
      console.error('webhook: falha ao marcar reembolso', refundError.message);
      return internalError();
    }

    // Pedido que nunca foi pago não revoga nada (p.ex. Pro concedido pelo admin).
    if (!wasPaid) return Response.json({ received: true, status: 'refunded_unpaid' });

    // Outro pedido pago ainda cobre o período: reembolsar o antigo não tira o Pro atual.
    const { data: otherPaid, error: otherError } = await supabaseAdmin
      .from('billing_orders')
      .select('id')
      .eq('user_id', order.user_id)
      .eq('status', 'PAID')
      .neq('id', order.id)
      .limit(1);
    if (otherError) {
      console.error('webhook: falha ao consultar outros pedidos', otherError.message);
      return Response.json({ error: 'Falha interna.' }, { status: 500 });
    }
    if (otherPaid && otherPaid.length > 0) {
      return Response.json({ received: true, status: 'refunded_kept_pro' });
    }

    const { error: revokeError } = await supabaseAdmin
      .from('profiles')
      .update({
        plan_tier: 'free',
        subscription_status: 'canceled',
        auto_renew: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', order.user_id);
    if (revokeError) {
      console.error('webhook: falha ao revogar o Pro', revokeError.message);
      return internalError();
    }

    return Response.json({ received: true, status: 'refunded' });
  }

  if (event.type === 'canceled' && order?.user_id) {
    const { error: cancelError } = await supabaseAdmin
      .from('profiles')
      .update({
        auto_renew: false,
        cancel_at_period_end: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', order.user_id);
    if (cancelError) {
      console.error('webhook: falha ao registrar cancelamento', cancelError.message);
      return internalError();
    }

    return Response.json({ received: true, status: 'canceled' });
  }

  return Response.json({ received: true });
});
