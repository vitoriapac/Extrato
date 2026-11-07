/** Validações puras de entrada das Edge Functions state-sync e abacatepay-checkout. */

export const MAX_STATE_BYTES = 5 * 1024 * 1024; // mesmo teto do CHECK em user_study_states
export const MAX_REQUEST_BYTES = MAX_STATE_BYTES + 16 * 1024; // estado + envelope JSON
export const MAX_CHECKOUT_BODY_BYTES = 8 * 1024;

const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
const MAX_DEPTH = 64;

function hasForbiddenKey(value: unknown, depth = 0): boolean {
  if (depth > MAX_DEPTH) return true; // profundidade absurda é tratada como inválida
  if (Array.isArray(value)) return value.some(v => hasForbiddenKey(v, depth + 1));
  if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      if (FORBIDDEN_KEYS.has(k) || hasForbiddenKey(v, depth + 1)) return true;
    }
  }
  return false;
}

export type PushInput = { stateJson: Record<string, unknown>; schemaVersion: number; clientUpdatedAt: string };

/** Valida o corpo do POST /push. Retorna os campos normalizados ou a mensagem de erro. */
export function parsePushBody(body: unknown, now = new Date()): PushInput | { error: string } {
  const b = body as Record<string, unknown> | null;
  const state = b?.stateJson;
  if (!state || typeof state !== 'object' || Array.isArray(state)) return { error: 'Payload inválido.' };
  if (hasForbiddenKey(state)) return { error: 'Payload inválido.' };

  const schemaVersion = b!.schemaVersion ?? (state as Record<string, unknown>).schemaVersion ?? 1;
  if (!Number.isInteger(schemaVersion) || (schemaVersion as number) < 1 || (schemaVersion as number) > 1000) {
    return { error: 'Payload inválido.' };
  }

  let clientUpdatedAt = now.toISOString();
  if (b!.clientUpdatedAt != null) {
    const raw = b!.clientUpdatedAt;
    const iso = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?(Z|[+-]\d{2}:\d{2})$/;
    if (typeof raw !== 'string' || !iso.test(raw) || Number.isNaN(Date.parse(raw))) {
      return { error: 'Payload inválido.' };
    }
    clientUpdatedAt = new Date(raw).toISOString();
  }
  return { stateJson: state as Record<string, unknown>, schemaVersion: schemaVersion as number, clientUpdatedAt };
}

export type Customer = { email?: string; name?: string; taxId?: string; cellphone?: string };

/** Valida `customer` do checkout; campos opcionais ausentes ficam de fora. */
export function parseCustomer(raw: unknown): Customer | { error: string } {
  if (raw == null) return {};
  if (typeof raw !== 'object' || Array.isArray(raw)) return { error: 'Dados do cliente inválidos.' };
  const c = raw as Record<string, unknown>;
  const out: Customer = {};
  const str = (v: unknown) => (typeof v === 'string' ? v.trim() : null);

  if (c.email != null && c.email !== '') {
    const v = str(c.email);
    if (!v || v.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return { error: 'E-mail inválido.' };
    out.email = v;
  }
  if (c.name != null && c.name !== '') {
    const v = str(c.name);
    if (!v || v.length > 120) return { error: 'Nome inválido.' };
    out.name = v;
  }
  if (c.taxId != null && c.taxId !== '') {
    const v = str(c.taxId)?.replace(/[.\-/]/g, '');
    if (!v || !/^(\d{11}|\d{14})$/.test(v)) return { error: 'CPF/CNPJ inválido.' };
    out.taxId = v;
  }
  if (c.cellphone != null && c.cellphone !== '') {
    const v = str(c.cellphone)?.replace(/[\s()+\-]/g, '');
    if (!v || !/^\d{10,13}$/.test(v)) return { error: 'Telefone inválido.' };
    out.cellphone = v;
  }
  return out;
}
