import test from 'node:test';
import assert from 'node:assert/strict';
import {
  checkOrder,
  parseBillingPaid,
  parseBillingWebhookEvent,
  safeEqual,
} from '../../supabase/functions/_shared/webhook-logic.ts';

test('safeEqual: iguais, diferentes, tamanhos distintos e vazios', async () => {
  assert.equal(await safeEqual('segredo', 'segredo'), true);
  assert.equal(await safeEqual('segredo', 'segredO'), false);
  assert.equal(await safeEqual('seg', 'segredo'), false);
  assert.equal(await safeEqual(null, 'segredo'), false);
  assert.equal(await safeEqual('', ''), false);
});

test('parseBillingPaid: evento válido, formatos e inválidos', () => {
  assert.deepEqual(
    parseBillingPaid({ event: 'billing.paid', data: { billing: { id: 'b1', amount: 1990 } } }),
    { billingId: 'b1', paidCents: 1990 }
  );
  assert.deepEqual(parseBillingPaid({ event: 'billing.paid', data: { id: 'b2' } }), {
    billingId: 'b2',
    paidCents: null,
  });
  assert.equal(parseBillingPaid({ event: 'billing.created', data: { id: 'b' } }), null);
  assert.equal(parseBillingPaid({ event: 'billing.paid', data: {} }), null);
  assert.equal(parseBillingPaid(null), null);
});

test('checkOrder: sem pedido, replay, valor divergente e caso feliz', () => {
  const o = status => ({ id: '1', status, amount_cents: 1990 });
  assert.equal(checkOrder(null, 1990), 'no_order');
  assert.equal(checkOrder(o('PAID'), 1990), 'already_paid');
  assert.equal(checkOrder(o('EXPIRED'), 1990), 'not_pending');
  assert.equal(checkOrder(o('PENDING'), 100), 'amount_mismatch');
  assert.equal(checkOrder(o('PENDING'), null), 'amount_mismatch');
  assert.equal(checkOrder(o('PENDING'), 1990), 'ok');
});

test('parseBillingWebhookEvent: eventos do ciclo de vida de cartão e PIX', () => {
  // 1. Pagamento via Cartão com metadados e taxa
  const cardPaid = parseBillingWebhookEvent({
    event: 'billing.paid',
    data: {
      billing: {
        id: 'bill_card_1',
        amount: 17880,
        fee: 536,
        paymentMethod: 'card',
        card: {
          brand: 'visa',
          last4: '1234',
        },
      },
    },
  });
  assert.deepEqual(cardPaid, {
    type: 'paid',
    billingId: 'bill_card_1',
    paidCents: 17880,
    feeCents: 536,
    paymentMethod: 'card',
    cardBrand: 'visa',
    cardLast4: '1234',
  });

  // 2. Falha de renovação do cartão (past_due)
  const pastDue = parseBillingWebhookEvent({
    event: 'billing.overdue',
    data: {
      id: 'bill_fail_2',
      failureReason: 'Cartão sem limite disponível',
    },
  });
  assert.deepEqual(pastDue, {
    type: 'past_due',
    billingId: 'bill_fail_2',
    failureReason: 'Cartão sem limite disponível',
  });

  // 3. Cancelamento da recorrência
  const canceled = parseBillingWebhookEvent({
    event: 'subscription.canceled',
    data: { id: 'bill_sub_3' },
  });
  assert.deepEqual(canceled, {
    type: 'canceled',
    billingId: 'bill_sub_3',
  });

  // 4. Estorno / Chargeback
  const refunded = parseBillingWebhookEvent({
    event: 'billing.refunded',
    data: { id: 'bill_ref_4' },
  });
  assert.deepEqual(refunded, {
    type: 'refunded',
    billingId: 'bill_ref_4',
  });
});
