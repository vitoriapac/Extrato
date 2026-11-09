/**
 * Supabase Edge Function: abacatepay-webhook
 *
 * Recebe eventos de ciclo de vida da AbacatePay (PIX e Cartão de Crédito).
 * - billing.paid: Liquida o pedido atomicamente via RPC settle_billing_order
 * - billing.overdue / invoice.payment_failed: Marca 'past_due' (inicia tolerância de 3 dias)
 * - subscription.canceled: Marca 'canceled'
 * - billing.refunded / charge.disputed: Marca 'REFUNDED' e revoga o tier Pro
 */

import { createClient } from '../_shared/supabase.ts';
import {
  checkOrder,
  MAX_BODY_BYTES,
  parseBillingWebhookEvent,
  safeEqual,
} from '../_shared/webhook-logic.ts';

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
    await supabaseAdmin
      .from('billing_orders')
      .update({
        fee_cents: event.feeCents || 0,
        payment_method: event.paymentMethod,
      })
      .eq('id', order!.id);

    const { error: settleError } = await supabaseAdmin.rpc('settle_billing_order', {
      p_order_id: order!.id,
    });
    if (settleError) {
      console.error('webhook: falha ao liquidar pedido', settleError.message);
      return Response.json({ error: 'Falha interna.' }, { status: 500 });
    }

    // Se pago com cartão, grava marca e últimos 4 dígitos no perfil
    if (event.paymentMethod === 'card' && order?.user_id) {
      await supabaseAdmin
        .from('profiles')
        .update({
          payment_method: 'card',
          auto_renew: true,
          card_brand: event.cardBrand || null,
          card_last4: event.cardLast4 || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', order.user_id);
    }

    return Response.json({ received: true });
  }

  if (event.type === 'past_due' && order?.user_id) {
    await supabaseAdmin
      .from('profiles')
      .update({
        subscription_status: 'past_due',
        updated_at: new Date().toISOString(),
      })
      .eq('id', order.user_id);

    await supabaseAdmin
      .from('billing_orders')
      .update({
        failure_reason: event.failureReason || 'Cobrança não autorizada',
      })
      .eq('id', order.id);

    return Response.json({ received: true, status: 'past_due' });
  }

  if (event.type === 'refunded' && order?.user_id) {
    await supabaseAdmin
      .from('billing_orders')
      .update({ status: 'REFUNDED' })
      .eq('id', order.id);

    await supabaseAdmin
      .from('profiles')
      .update({
        plan_tier: 'free',
        subscription_status: 'canceled',
        auto_renew: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', order.user_id);

    return Response.json({ received: true, status: 'refunded' });
  }

  if (event.type === 'canceled' && order?.user_id) {
    await supabaseAdmin
      .from('profiles')
      .update({
        auto_renew: false,
        cancel_at_period_end: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', order.user_id);

    return Response.json({ received: true, status: 'canceled' });
  }

  return Response.json({ received: true });
});
