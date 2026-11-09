/** Lógica pura do webhook AbacatePay e Cartão (sem Deno/Supabase), testável sob Node. */

export const MAX_BODY_BYTES = 64 * 1024;

export type OrderRow = { id: string; status: string; amount_cents: number };
export type OrderCheck = 'ok' | 'no_order' | 'already_paid' | 'not_pending' | 'amount_mismatch';

export type WebhookLifecycleEvent =
  | {
      type: 'paid';
      billingId: string;
      paidCents: number | null;
      feeCents: number;
      paymentMethod: 'pix' | 'card';
      cardBrand?: string;
      cardLast4?: string;
    }
  | {
      type: 'past_due';
      billingId: string;
      failureReason?: string;
    }
  | {
      type: 'canceled';
      billingId: string;
    }
  | {
      type: 'refunded';
      billingId: string;
    };

/** Comparação em tempo constante: compara digests SHA-256 (tamanho fixo, sem vazar o comprimento). */
export async function safeEqual(a: string | null, b: string | null): Promise<boolean> {
  if (!a || !b) return false;
  const enc = new TextEncoder();
  const [da, db] = await Promise.all([
    crypto.subtle.digest('SHA-256', enc.encode(a)),
    crypto.subtle.digest('SHA-256', enc.encode(b)),
  ]);
  const x = new Uint8Array(da);
  const y = new Uint8Array(db);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}

/** Extrai id da cobrança e valor pago (centavos) de um evento `billing.paid`; null se não for. */
export function parseBillingPaid(payload: unknown): { billingId: string; paidCents: number | null } | null {
  const p = payload as { event?: unknown; data?: Record<string, unknown> } | null;
  if (p?.event !== 'billing.paid') return null;
  const b = (p.data?.billing ?? p.data) as Record<string, unknown> | undefined;
  if (typeof b?.id !== 'string' || !b.id) return null;
  const paid = b.paidAmount ?? b.amount;
  return { billingId: b.id, paidCents: Number.isInteger(paid) ? (paid as number) : null };
}

/**
 * Interpreta todos os eventos do ciclo de vida da assinatura (PIX & Cartão de Crédito).
 */
export function parseBillingWebhookEvent(payload: unknown): WebhookLifecycleEvent | null {
  const p = payload as { event?: unknown; data?: Record<string, unknown> } | null;
  if (!p || typeof p !== 'object' || typeof p.event !== 'string') return null;

  const b = (p.data?.billing ?? p.data) as Record<string, unknown> | undefined;
  const billingId = typeof b?.id === 'string' ? b.id : '';
  if (!billingId) return null;

  if (p.event === 'billing.paid' || p.event === 'invoice.paid') {
    const rawPaid = b?.paidAmount ?? b?.amount;
    const paidCents = Number.isInteger(rawPaid) ? (rawPaid as number) : null;
    const feeCents = Number.isInteger(b?.fee) ? (b?.fee as number) : 0;
    const methodStr = String(b?.method || b?.paymentMethod || 'pix').toLowerCase();
    const paymentMethod: 'pix' | 'card' = methodStr.includes('card') ? 'card' : 'pix';

    const cardInfo = (b?.card || b?.creditCard) as Record<string, unknown> | undefined;
    const cardBrand = typeof cardInfo?.brand === 'string' ? cardInfo.brand.toLowerCase() : undefined;
    const cardLast4 = typeof cardInfo?.last4 === 'string' ? cardInfo.last4 : undefined;

    return {
      type: 'paid',
      billingId,
      paidCents,
      feeCents,
      paymentMethod,
      cardBrand,
      cardLast4,
    };
  }

  if (p.event === 'billing.overdue' || p.event === 'invoice.payment_failed') {
    const reason = typeof b?.failureReason === 'string' ? b.failureReason : 'Falha na cobrança do cartão';
    return {
      type: 'past_due',
      billingId,
      failureReason: reason,
    };
  }

  if (p.event === 'subscription.canceled' || p.event === 'customer.subscription.deleted') {
    return {
      type: 'canceled',
      billingId,
    };
  }

  if (p.event === 'billing.refunded' || p.event === 'charge.dispute.created') {
    return {
      type: 'refunded',
      billingId,
    };
  }

  return null;
}

/** Decide se o pedido pode ser liquidado. O valor do pedido é a fonte da verdade. */
export function checkOrder(order: OrderRow | null, paidCents: number | null): OrderCheck {
  if (!order) return 'no_order';
  if (order.status === 'PAID') return 'already_paid';
  if (order.status !== 'PENDING') return 'not_pending';
  return paidCents === order.amount_cents ? 'ok' : 'amount_mismatch';
}
