/** Lógica pura do webhook AbacatePay (sem Deno/Supabase), testável sob Node. */

export const MAX_BODY_BYTES = 64 * 1024;

export type OrderRow = { id: string; status: string; amount_cents: number };
export type OrderCheck = 'ok' | 'no_order' | 'already_paid' | 'not_pending' | 'amount_mismatch';

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

/** Decide se o pedido pode ser liquidado. O valor do pedido é a fonte da verdade. */
export function checkOrder(order: OrderRow | null, paidCents: number | null): OrderCheck {
  if (!order) return 'no_order';
  if (order.status === 'PAID') return 'already_paid';
  if (order.status !== 'PENDING') return 'not_pending';
  return paidCents === order.amount_cents ? 'ok' : 'amount_mismatch';
}
