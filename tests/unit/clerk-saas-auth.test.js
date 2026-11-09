import test from 'node:test';
import assert from 'node:assert/strict';
import { h } from 'preact';
import { renderToString } from 'preact-render-to-string';

import {
  createSaaSAuthService,
  loadCachedProfile,
  saveCachedProfile,
  clearCachedProfile,
  CLERK_PROFILE_CACHE_KEY,
} from '../../src/auth/saas-auth-service.js';
import { determineMergeDecision } from '../../src/domain/auth/account-merge.js';
import { ClerkUserAvatarButton } from '../../src/ui/components/ClerkUserAvatarButton.js';
import { AccountMergeConflictModal } from '../../src/ui/components/AccountMergeConflictModal.js';
import { AuthAccountModal } from '../../src/ui/components/AuthAccountModal.js';

class MemoryStorage {
  constructor() {
    this.store = new Map();
  }
  get length() {
    return this.store.size;
  }
  key(index) {
    return Array.from(this.store.keys())[index] || null;
  }
  getItem(key) {
    return this.store.has(key) ? this.store.get(key) : null;
  }
  setItem(key, value) {
    this.store.set(key, String(value));
  }
  removeItem(key) {
    this.store.delete(key);
  }
  clear() {
    this.store.clear();
  }
}

test('Cache de Perfil Offline-First — salva, carrega e recupera com resiliência', () => {
  const storage = /** @type {Storage} */ (new MemoryStorage());

  assert.equal(loadCachedProfile(storage), null);

  /** @type {import('../../src/auth/saas-auth-service.js').CachedUserProfile} */
  const mockProfile = {
    userId: 'user_clerk_123',
    email: 'estudante@concursos.com.br',
    displayName: 'Vitória Pac',
    avatarUrl: 'https://img.clerk.com/avatar123.png',
    role: 'user',
    planTier: 'pro',
    subscriptionStatus: 'active',
    subscriptionPeriodEnd: '2027-01-01T00:00:00Z',
    paymentMethod: 'card',
    cachedAt: new Date().toISOString(),
  };

  saveCachedProfile(mockProfile, storage);
  const loaded = loadCachedProfile(storage);
  assert.ok(loaded);
  assert.equal(loaded.userId, 'user_clerk_123');
  assert.equal(loaded.email, 'estudante@concursos.com.br');
  assert.equal(loaded.displayName, 'Vitória Pac');
  assert.equal(loaded.planTier, 'pro');

  clearCachedProfile(storage);
  assert.equal(loadCachedProfile(storage), null);

  // Tratamento de JSON corrompido
  storage.setItem(CLERK_PROFILE_CACHE_KEY, '{ invalid_json }');
  assert.equal(loadCachedProfile(storage), null);
});

test('createSaaSAuthService com Clerk — login, token, sincronização de perfil e logout', async () => {
  const storage = /** @type {Storage} */ (new MemoryStorage());
  let tokenRequestedTemplate = null;
  let signInOpened = false;
  let userProfileOpened = false;
  let signedOut = false;
  let listenerCallback = null;

  const mockClerkClient = {
    loaded: true,
    user: {
      id: 'user_clerk_456',
      primaryEmailAddress: { emailAddress: 'concurseiro@estudos.com' },
      fullName: 'Carlos Auditor',
      imageUrl: 'https://images.clerk.dev/photo.jpg',
      publicMetadata: { role: 'admin' },
    },
    session: {
      getToken: async (opts) => {
        tokenRequestedTemplate = opts?.template || 'default';
        return 'clerk_jwt_token_sample';
      },
    },
    openSignIn: async () => {
      signInOpened = true;
    },
    openUserProfile: async () => {
      userProfileOpened = true;
    },
    signOut: async () => {
      signedOut = true;
      if (listenerCallback) {
        listenerCallback({ user: null, session: null });
      }
    },
    addListener: (callback) => {
      listenerCallback = callback;
      return () => {
        listenerCallback = null;
      };
    },
  };

  const fakeFetch = async (url) => {
    if (url.includes('/rest/v1/profiles')) {
      return {
        ok: true,
        json: async () => [
          {
            plan_tier: 'pro',
            subscription_status: 'active',
            subscription_period_end: '2027-11-01T00:00:00Z',
            role: 'admin',
          },
        ],
      };
    }
    return { ok: false, status: 404, json: async () => ({}) };
  };

  const authService = createSaaSAuthService({
    config: {
      supabaseUrl: 'https://extrato.supabase.co',
      supabaseAnonKey: 'anon-key-xyz',
      clerkPublishableKey: 'pk_test_sample',
    },
    fetchImpl: fakeFetch,
    storage,
    clerkClient: mockClerkClient,
  });

  assert.equal(authService.isClerkLoaded(), true);

  // Perfil sincronizado no cache via mock do Clerk
  const profile = authService.getCachedProfile();
  assert.ok(profile);
  assert.equal(profile.userId, 'user_clerk_456');
  assert.equal(profile.email, 'concurseiro@estudos.com');
  assert.equal(profile.displayName, 'Carlos Auditor');
  assert.equal(profile.role, 'admin');

  // Token para Supabase
  const token = await authService.getClerkToken('supabase');
  assert.equal(token, 'clerk_jwt_token_sample');
  assert.equal(tokenRequestedTemplate, 'supabase');

  // Consulta e atualização de assinatura
  const subProfile = await authService.fetchSubscriptionProfile(token, 'user_clerk_456');
  assert.equal(subProfile.planTier, 'pro');
  assert.equal(subProfile.subscriptionStatus, 'active');

  const updatedCached = authService.getCachedProfile();
  assert.equal(updatedCached.planTier, 'pro');

  // Abertura de modais nativos do Clerk
  await authService.openClerkSignIn();
  assert.equal(signInOpened, true);

  await authService.openClerkUserProfile();
  assert.equal(userProfileOpened, true);

  // Logout limpa o cache local
  await authService.clerkSignOut();
  assert.equal(signedOut, true);
  assert.equal(authService.getCachedProfile(), null);
  assert.equal(loadCachedProfile(storage), null);
});

test('determineMergeDecision — resolve cenários de fusão de dados no login', () => {
  // 1. Ambos vazios
  const emptyBoth = determineMergeDecision({
    hasLocalData: false,
    hasRemoteData: false,
  });
  assert.equal(emptyBoth.type, 'noop');
  assert.equal(emptyBoth.reason, 'empty_both');

  // 2. Apenas local (primeiro login de usuário anônimo)
  const localOnly = determineMergeDecision({
    hasLocalData: true,
    localUpdatedAt: '2026-11-08T10:00:00Z',
    localChecksum: 'chk_111',
    hasRemoteData: false,
  });
  assert.equal(localOnly.type, 'initial_push');
  assert.equal(localOnly.reason, 'local_only');

  // 3. Apenas remoto (novo dispositivo/navegador)
  const remoteOnly = determineMergeDecision({
    hasLocalData: false,
    hasRemoteData: true,
    remoteUpdatedAt: '2026-11-08T09:00:00Z',
    remoteChecksum: 'chk_222',
  });
  assert.equal(remoteOnly.type, 'initial_pull');
  assert.equal(remoteOnly.reason, 'remote_only');

  // 4. Estados idênticos
  const identical = determineMergeDecision({
    hasLocalData: true,
    localChecksum: 'chk_abc',
    hasRemoteData: true,
    remoteChecksum: 'chk_abc',
  });
  assert.equal(identical.type, 'noop');
  assert.equal(identical.reason, 'identical_checksum');

  // 5. Conflito com divergência de estados
  const conflict = determineMergeDecision({
    hasLocalData: true,
    localUpdatedAt: '2026-11-08T12:00:00Z',
    localChecksum: 'chk_local_aaa',
    localItemCount: 42,
    hasRemoteData: true,
    remoteUpdatedAt: '2026-11-08T11:00:00Z',
    remoteChecksum: 'chk_remote_bbb',
  });
  assert.equal(conflict.type, 'conflict');
  assert.equal(conflict.reason, 'divergent_states');
  if (conflict.type === 'conflict') {
    assert.equal(conflict.localSummary.itemCount, 42);
    assert.equal(conflict.localSummary.checksum, 'chk_local_aaa');
    assert.equal(conflict.remoteSummary.checksum, 'chk_remote_bbb');
  }
});

test('ClerkUserAvatarButton — renderiza estado anônimo e estado autenticado sem emojis', () => {
  // Estado deslogado
  let signInClicked = false;
  const anonHtml = renderToString(
    h(ClerkUserAvatarButton, {
      profile: null,
      onOpenSignIn: () => {
        signInClicked = true;
      },
    })
  );

  assert.ok(anonHtml.includes('Entrar'));
  assert.ok(anonHtml.includes('user-circle'));
  assert.ok(!/\p{Extended_Pictographic}/u.test(anonHtml));

  // Estado logado com plano Pro e role Admin
  let adminClicked = false;
  const loggedHtml = renderToString(
    h(ClerkUserAvatarButton, {
      profile: {
        userId: 'user_123',
        email: 'admin@extratodeestudos.com.br',
        displayName: 'Vitória Pac',
        avatarUrl: 'https://images.clerk.dev/vitoria.jpg',
        role: 'admin',
        planTier: 'pro',
        subscriptionStatus: 'active',
        cachedAt: new Date().toISOString(),
      },
      onOpenAdminPanel: () => {
        adminClicked = true;
      },
    })
  );

  assert.ok(loggedHtml.includes('Vitória Pac'));
  assert.ok(loggedHtml.includes('ADMIN'));
  assert.ok(loggedHtml.includes('https://images.clerk.dev/vitoria.jpg'));
  assert.ok(!/\p{Extended_Pictographic}/u.test(loggedHtml));
});

test('AccountMergeConflictModal e AuthAccountModal — renderizam sem emojis e acessíveis', () => {
  const conflictHtml = renderToString(
    h(AccountMergeConflictModal, {
      open: true,
      onClose: () => {},
      localUpdatedAt: '2026-11-08 14:00',
      remoteUpdatedAt: '2026-11-08 12:00',
      onChooseLocal: () => {},
      onChooseRemote: () => {},
      onDownloadBackup: () => {},
    })
  );

  assert.ok(conflictHtml.includes('Conflito de Sincronização Encontrado'));
  assert.ok(conflictHtml.includes('Substituir nuvem por este dispositivo'));
  assert.ok(conflictHtml.includes('Manter dados da nuvem'));
  assert.ok(conflictHtml.includes('Baixar backup JSON'));
  assert.ok(!/\p{Extended_Pictographic}/u.test(conflictHtml));

  const authModalHtml = renderToString(
    h(AuthAccountModal, {
      open: true,
      onClose: () => {},
      onClerkSignIn: () => {},
      onRequestMagicLink: async () => ({ success: true }),
    })
  );

  assert.ok(authModalHtml.includes('Entrar com Clerk'));
  assert.ok(authModalHtml.includes('Receber link de acesso'));
  assert.ok(!/\p{Extended_Pictographic}/u.test(authModalHtml));
});
