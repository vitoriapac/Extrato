import test from 'node:test';
import assert from 'node:assert/strict';
import {
  checkOrder,
  parseBillingPaid,
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
