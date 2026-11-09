/**
 * Serviço de Autenticação, Sessão, Clerk e Checkout SaaS (src/auth/saas-auth-service.ts)
 *
 * Integração híbrida e offline-first:
 * 1. Suporte a Clerk Auth (@clerk/clerk-js) com autenticação Third-Party no Supabase
 *    via JWT (claim 'sub'), cache local de perfil em localStorage e gerenciamento de perfil/avatar.
 * 2. Fallback de autenticação leve via Magic Link e Google OAuth.
 * 3. Integração com AbacatePay para checkout PIX.
 */

import type {
  BillingCycle,
  PlanTier,
  SubscriptionStatus,
  UserSubscriptionProfile,
} from '../domain/billing/entitlements.js';

export type UserRole = 'user' | 'admin';

export interface CachedUserProfile {
  userId: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
  role: UserRole;
  planTier: PlanTier;
  subscriptionStatus: SubscriptionStatus;
  subscriptionPeriodEnd?: string | null;
  paymentMethod?: 'pix' | 'card' | null;
  cachedAt: string;
}

export interface ClerkUser {
  id: string;
  primaryEmailAddress?: { emailAddress: string } | null;
  emailAddresses?: Array<{ emailAddress: string }>;
  fullName?: string | null;
  firstName?: string | null;
  imageUrl?: string | null;
  publicMetadata?: Record<string, unknown>;
}

export interface ClerkClient {
  loaded?: boolean;
  load?: (opts?: { publishableKey?: string }) => Promise<void>;
  user?: ClerkUser | null;
  session?: {
    getToken: (options?: { template?: string }) => Promise<string | null>;
  } | null;
  openSignIn?: (options?: any) => Promise<void> | void;
  openSignUp?: (options?: any) => Promise<void> | void;
  openUserProfile?: (options?: any) => Promise<void> | void;
  signOut?: () => Promise<void>;
  addListener?: (listener: (emission: { user: ClerkUser | null; session: any }) => void) => () => void;
}

export interface SaaSAuthConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  checkoutEndpoint?: string;
  redirectTo?: string;
  clerkPublishableKey?: string;
  clerkJwtTemplate?: string;
}

export interface SaaSUserSession {
  userId: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
  role?: UserRole;
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

export const CLERK_PROFILE_CACHE_KEY = 'extrato_saas_clerk_profile_v1';

export function loadCachedProfile(storage?: Storage): CachedUserProfile | null {
  try {
    const s = storage ?? (typeof globalThis !== 'undefined' ? globalThis.localStorage : null);
    if (!s) return null;
    const raw = s.getItem(CLERK_PROFILE_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedUserProfile;
    if (parsed && typeof parsed === 'object' && parsed.userId && parsed.email) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function saveCachedProfile(profile: CachedUserProfile, storage?: Storage): void {
  try {
    const s = storage ?? (typeof globalThis !== 'undefined' ? globalThis.localStorage : null);
    if (!s) return;
    s.setItem(CLERK_PROFILE_CACHE_KEY, JSON.stringify(profile));
  } catch {
    // Falha silenciosa no armazenamento local
  }
}

export function clearCachedProfile(storage?: Storage): void {
  try {
    const s = storage ?? (typeof globalThis !== 'undefined' ? globalThis.localStorage : null);
    if (!s) return;
    s.removeItem(CLERK_PROFILE_CACHE_KEY);
  } catch {
    // Falha silenciosa
  }
}

export interface SaaSAuthService {
  // Métodos Clerk & Sessão Offline-First
  initializeClerk: (opts?: { publishableKey?: string }) => Promise<boolean>;
  isClerkLoaded: () => boolean;
  getClerkToken: (template?: string) => Promise<string | null>;
  openClerkSignIn: (options?: { redirectUrl?: string }) => Promise<void>;
  openClerkSignUp: (options?: { redirectUrl?: string }) => Promise<void>;
  openClerkUserProfile: () => Promise<void>;
  clerkSignOut: () => Promise<void>;
  getCachedProfile: () => CachedUserProfile | null;
  setCachedProfile: (profile: CachedUserProfile | null) => void;
  onAuthStateChanged: (listener: (profile: CachedUserProfile | null) => void) => () => void;

  // Métodos de autenticação Supabase & Fallback
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
    paymentMethod?: 'pix' | 'card';
    installments?: number;
  }) => Promise<AbacatePayCheckoutResult>;
  getSession: () => SaaSUserSession | null;
  setSession: (session: SaaSUserSession | null) => void;
}

export function createSaaSAuthService({
  config,
  fetchImpl = globalThis.fetch,
  storage,
  clerkClient,
}: {
  config: SaaSAuthConfig;
  fetchImpl?: any;
  storage?: Storage;
  clerkClient?: ClerkClient;
}): SaaSAuthService {
  const baseUrl = String(config.supabaseUrl || '').replace(/\/+$/, '');
  const activeStorage =
    storage ?? (typeof globalThis !== 'undefined' ? globalThis.localStorage : undefined);

  let currentSession: SaaSUserSession | null = null;
  let cachedProfile: CachedUserProfile | null = loadCachedProfile(activeStorage);
  let activeClerk: ClerkClient | null = clerkClient ?? null;
  const listeners: Set<(profile: CachedUserProfile | null) => void> = new Set();

  function notifyListeners() {
    listeners.forEach(fn => {
      try {
        fn(cachedProfile);
      } catch {
        // Ignora erros no listener
      }
    });
  }

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

  function resolveClerkUserRole(clerkUser?: ClerkUser | null): UserRole {
    if (!clerkUser?.publicMetadata) return 'user';
    const metaRole = clerkUser.publicMetadata.role;
    return metaRole === 'admin' ? 'admin' : 'user';
  }

  function syncClerkUserToCache(clerkUser?: ClerkUser | null): CachedUserProfile | null {
    if (!clerkUser) {
      cachedProfile = null;
      clearCachedProfile(activeStorage);
      notifyListeners();
      return null;
    }

    const email =
      clerkUser.primaryEmailAddress?.emailAddress ||
      (clerkUser.emailAddresses && clerkUser.emailAddresses[0]?.emailAddress) ||
      '';

    const displayName =
      clerkUser.fullName ||
      clerkUser.firstName ||
      (email ? email.split('@')[0] : 'Estudante');

    const role = resolveClerkUserRole(clerkUser);
    const existingTier = cachedProfile?.planTier || 'free';
    const existingStatus = cachedProfile?.subscriptionStatus || 'inactive';

    const newProfile: CachedUserProfile = {
      userId: clerkUser.id,
      email,
      displayName,
      avatarUrl: clerkUser.imageUrl || undefined,
      role,
      planTier: existingTier,
      subscriptionStatus: existingStatus,
      subscriptionPeriodEnd: cachedProfile?.subscriptionPeriodEnd || null,
      paymentMethod: cachedProfile?.paymentMethod || null,
      cachedAt: new Date().toISOString(),
    };

    cachedProfile = newProfile;
    saveCachedProfile(newProfile, activeStorage);
    notifyListeners();
    return newProfile;
  }

  // Se já tivermos o cliente Clerk injetado, registramos o listener de estado
  if (activeClerk && typeof activeClerk.addListener === 'function') {
    activeClerk.addListener(emission => {
      syncClerkUserToCache(emission?.user);
    });
    if (activeClerk.user) {
      syncClerkUserToCache(activeClerk.user);
    }
  }

  async function initializeClerk(opts?: { publishableKey?: string }): Promise<boolean> {
    const key = opts?.publishableKey || config.clerkPublishableKey;
    if (!key && !activeClerk) {
      return false;
    }

    // Se window.Clerk existir no navegador
    if (!activeClerk && typeof window !== 'undefined' && (window as any).Clerk) {
      activeClerk = (window as any).Clerk as ClerkClient;
    }

    if (activeClerk && typeof activeClerk.load === 'function' && !activeClerk.loaded) {
      try {
        await activeClerk.load({ publishableKey: key });
        if (typeof activeClerk.addListener === 'function') {
          activeClerk.addListener(emission => {
            syncClerkUserToCache(emission?.user);
          });
        }
        if (activeClerk.user) {
          syncClerkUserToCache(activeClerk.user);
        }
        return true;
      } catch {
        return false;
      }
    }

    return Boolean(activeClerk?.loaded || activeClerk?.user);
  }

  function isClerkLoaded(): boolean {
    return Boolean(activeClerk && (activeClerk.loaded || activeClerk.user));
  }

  async function getClerkToken(template = config.clerkJwtTemplate || 'supabase'): Promise<string | null> {
    if (!activeClerk?.session) return null;
    try {
      return await activeClerk.session.getToken({ template });
    } catch {
      return null;
    }
  }

  async function openClerkSignIn(options?: { redirectUrl?: string }): Promise<void> {
    if (activeClerk && typeof activeClerk.openSignIn === 'function') {
      await activeClerk.openSignIn(options);
    }
  }

  async function openClerkSignUp(options?: { redirectUrl?: string }): Promise<void> {
    if (activeClerk && typeof activeClerk.openSignUp === 'function') {
      await activeClerk.openSignUp(options);
    }
  }

  async function openClerkUserProfile(): Promise<void> {
    if (activeClerk && typeof activeClerk.openUserProfile === 'function') {
      await activeClerk.openUserProfile();
    }
  }

  async function clerkSignOut(): Promise<void> {
    if (activeClerk && typeof activeClerk.signOut === 'function') {
      try {
        await activeClerk.signOut();
      } catch {
        // Ignora erro em offline
      }
    }
    cachedProfile = null;
    currentSession = null;
    clearCachedProfile(activeStorage);
    notifyListeners();
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
      planTier: cachedProfile?.planTier || 'free',
      subscriptionStatus: cachedProfile?.subscriptionStatus || 'inactive',
      subscriptionPeriodEnd: cachedProfile?.subscriptionPeriodEnd || null,
    };

    if (!baseUrl || !accessToken || !userId) {
      return fallback;
    }

    try {
      const query = new URLSearchParams({
        select: 'plan_tier,subscription_status,subscription_period_end,payment_method,role',
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
        payment_method?: 'pix' | 'card' | null;
        role?: 'user' | 'admin';
      }>;
      const row = Array.isArray(rows) ? rows[0] : null;
      if (!row) return fallback;

      const updatedTier = row.plan_tier || 'free';
      const updatedStatus = row.subscription_status || 'inactive';
      const updatedEnd = row.subscription_period_end || null;

      if (cachedProfile && cachedProfile.userId === userId) {
        cachedProfile = {
          ...cachedProfile,
          planTier: updatedTier,
          subscriptionStatus: updatedStatus,
          subscriptionPeriodEnd: updatedEnd,
          paymentMethod: row.payment_method || null,
          role: row.role || cachedProfile.role || 'user',
          cachedAt: new Date().toISOString(),
        };
        saveCachedProfile(cachedProfile, activeStorage);
        notifyListeners();
      }

      return {
        planTier: updatedTier,
        subscriptionStatus: updatedStatus,
        subscriptionPeriodEnd: updatedEnd,
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
    paymentMethod?: 'pix' | 'card';
    installments?: number;
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
          paymentMethod: params.paymentMethod || 'pix',
          installments: params.installments || 1,
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
    initializeClerk,
    isClerkLoaded,
    getClerkToken,
    openClerkSignIn,
    openClerkSignUp,
    openClerkUserProfile,
    clerkSignOut,
    getCachedProfile: () => (cachedProfile ? { ...cachedProfile } : null),
    setCachedProfile: (profile: CachedUserProfile | null) => {
      cachedProfile = profile ? { ...profile } : null;
      if (profile) {
        saveCachedProfile(profile, activeStorage);
      } else {
        clearCachedProfile(activeStorage);
      }
      notifyListeners();
    },
    onAuthStateChanged: (listener: (profile: CachedUserProfile | null) => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
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
