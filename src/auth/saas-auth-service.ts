/**
 * Serviço de Autenticação, Sessão e Checkout SaaS (src/auth/saas-auth-service.ts)
 *
 * Cliente HTTP leve (zero dependências pesadas no bundle) para integração com
 * Supabase Auth (Magic Link e OAuth Google) e criação de cobrança PIX via AbacatePay.
 */

import type { BillingCycle, UserSubscriptionProfile } from '../domain/billing/entitlements.js';

export interface SaaSAuthConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  checkoutEndpoint?: string;
  redirectTo?: string;
}

export interface SaaSUserSession {
  userId: string;
  email: string;
  displayName?: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  profile: UserSubscriptionProfile;
}

export interface MagicLinkResult {
  success: boolean;
  error?: string;
}

export interface AbacatePayCheckoutResult {
  success: boolean;
  checkoutUrl?: string;
  billingId?: string;
  pixQrCodeBase64?: string;
  pixCopyPaste?: string;
  error?: string;
}

export interface SaaSAuthService {
  requestMagicLink: (email: string) => Promise<MagicLinkResult>;
  getGoogleOAuthUrl: () => string;
  fetchSubscriptionProfile: (accessToken: string, userId: string) => Promise<UserSubscriptionProfile>;
  createAbacatePayCheckout: (params: {
    cycle: BillingCycle;
    customerEmail: string;
    customerName?: string;
    taxId?: string;
    cellphone?: string;
    accessToken?: string;
  }) => Promise<AbacatePayCheckoutResult>;
  getSession: () => SaaSUserSession | null;
  setSession: (session: SaaSUserSession | null) => void;
}

export function createSaaSAuthService({
  config,
  fetchImpl = globalThis.fetch,
}: {
  config: SaaSAuthConfig;
  fetchImpl?: any;
}): SaaSAuthService {
  let currentSession: SaaSUserSession | null = null;
  const baseUrl = String(config.supabaseUrl || '').replace(/\/+$/, '');

  function buildSupabaseHeaders(accessToken?: string): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      apikey: config.supabaseAnonKey || '',
    };
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    } else if (config.supabaseAnonKey) {
      headers['Authorization'] = `Bearer ${config.supabaseAnonKey}`;
    }
    return headers;
  }

  async function requestMagicLink(email: string): Promise<MagicLinkResult> {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      return { success: false, error: 'Informe um endereço de e-mail válido.' };
    }
    if (!baseUrl || !config.supabaseAnonKey) {
      return {
        success: false,
        error: 'Serviço de autenticação na nuvem ainda não configurado neste ambiente.',
      };
    }

    try {
      const response = await fetchImpl(`${baseUrl}/auth/v1/otp`, {
        method: 'POST',
        headers: buildSupabaseHeaders(),
        body: JSON.stringify({
          email: normalizedEmail,
          create_user: true,
          options: config.redirectTo ? { emailRedirectTo: config.redirectTo } : undefined,
        }),
      });

      if (!response.ok) {
        return {
          success: false,
          error: `Não foi possível enviar o link de acesso (HTTP ${response.status}).`,
        };
      }

      return { success: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Falha de conexão.';
      return { success: false, error: message };
    }
  }

  function getGoogleOAuthUrl(): string {
    if (!baseUrl) return '#';
    const params = new URLSearchParams({ provider: 'google' });
    if (config.redirectTo) {
      params.set('redirect_to', config.redirectTo);
    }
    return `${baseUrl}/auth/v1/authorize?${params.toString()}`;
  }

  async function fetchSubscriptionProfile(
    accessToken: string,
    userId: string
  ): Promise<UserSubscriptionProfile> {
    const fallback: UserSubscriptionProfile = {
      planTier: 'free',
      subscriptionStatus: 'inactive',
      subscriptionPeriodEnd: null,
    };

    if (!baseUrl || !accessToken || !userId) {
      return fallback;
    }

    try {
      const query = new URLSearchParams({
        select: 'plan_tier,subscription_status,subscription_period_end',
        id: `eq.${userId}`,
      });
      const response = await fetchImpl(`${baseUrl}/rest/v1/profiles?${query.toString()}`, {
        method: 'GET',
        headers: buildSupabaseHeaders(accessToken),
      });

      if (!response.ok) return fallback;
      const rows = (await response.json()) as Array<{
        plan_tier?: 'free' | 'pro' | 'mentor';
        subscription_status?: 'inactive' | 'trialing' | 'active' | 'past_due' | 'canceled';
        subscription_period_end?: string | null;
      }>;
      const row = Array.isArray(rows) ? rows[0] : null;
      if (!row) return fallback;

      return {
        planTier: row.plan_tier || 'free',
        subscriptionStatus: row.subscription_status || 'inactive',
        subscriptionPeriodEnd: row.subscription_period_end || null,
      };
    } catch {
      return fallback;
    }
  }

  async function createAbacatePayCheckout(params: {
    cycle: BillingCycle;
    customerEmail: string;
    customerName?: string;
    taxId?: string;
    cellphone?: string;
    accessToken?: string;
  }): Promise<AbacatePayCheckoutResult> {
    const endpoint =
      config.checkoutEndpoint ||
      (baseUrl ? `${baseUrl}/functions/v1/abacatepay-checkout` : '');

    if (!endpoint) {
      return {
        success: false,
        error: 'Endpoint de checkout PIX não configurado.',
      };
    }

    try {
      const token = params.accessToken || currentSession?.accessToken;
      const response = await fetchImpl(endpoint, {
        method: 'POST',
        headers: buildSupabaseHeaders(token),
        body: JSON.stringify({
          cycle: params.cycle,
          planId: params.cycle === 'annual' ? 'pro_annual' : 'pro_monthly',
          customer: {
            email: params.customerEmail,
            name: params.customerName || '',
            taxId: params.taxId || '',
            cellphone: params.cellphone || '',
          },
        }),
      });

      if (!response.ok) {
        return {
          success: false,
          error: `Erro ao gerar cobrança PIX (HTTP ${response.status}).`,
        };
      }

      const data = (await response.json()) as {
        url?: string;
        checkoutUrl?: string;
        billingId?: string;
        pixQrCodeBase64?: string;
        pixCopyPaste?: string;
      };

      return {
        success: true,
        checkoutUrl: data.checkoutUrl || data.url,
        billingId: data.billingId,
        pixQrCodeBase64: data.pixQrCodeBase64,
        pixCopyPaste: data.pixCopyPaste,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Falha ao conectar com AbacatePay.';
      return { success: false, error: message };
    }
  }

  return Object.freeze({
    requestMagicLink,
    getGoogleOAuthUrl,
    fetchSubscriptionProfile,
    createAbacatePayCheckout,
    getSession: () => (currentSession ? { ...currentSession } : null),
    setSession: (session: SaaSUserSession | null) => {
      currentSession = session ? { ...session } : null;
    },
  });
}
