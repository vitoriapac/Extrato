import test from 'node:test';
import assert from 'node:assert/strict';
import { h } from 'preact';
import { renderToString } from 'preact-render-to-string';
import { createCloudSaaSProvider } from '../../src/storage/cloud-saas-provider.js';
import { CloudSyncBadge } from '../../src/ui/components/CloudSyncBadge.js';

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

test('createCloudSaaSProvider — pushState envia payload com autenticação e headers corretos', async () => {
  let capturedUrl = '';
  let capturedHeaders = {};
  let capturedBody = '';

  /** @type {any} */
  const mockFetch = async (url, options) => {
    capturedUrl = url;
    capturedHeaders = options.headers;
    capturedBody = options.body;
    return {
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        serverUpdatedAt: '2026-10-27T12:00:00Z',
        checksum: 'sha256_mock_hash',
      }),
    };
  };

  const provider = createCloudSaaSProvider({
    config: {
      apiUrl: 'https://api.studytrack.app',
      authToken: 'jwt_mock_token',
      deviceId: 'dev_browser_1',
    },
    fetch: mockFetch,
  });

  /** @type {any} */
  const stateMock = {
    schemaVersion: 28,
    updatedAt: '2026-10-27T11:50:00Z',
    subjects: [],
  };

  const result = await provider.pushState(stateMock);

  assert.equal(result.success, true);
  assert.equal(result.serverUpdatedAt, '2026-10-27T12:00:00Z');
  assert.equal(result.checksum, 'sha256_mock_hash');

  assert.equal(capturedUrl, 'https://api.studytrack.app/v1/state/push');
  assert.equal(capturedHeaders['Authorization'], 'Bearer jwt_mock_token');
  assert.equal(capturedHeaders['X-Device-Id'], 'dev_browser_1');

  const parsedBody = JSON.parse(capturedBody);
  assert.equal(parsedBody.schemaVersion, 28);
  assert.equal(parsedBody.clientUpdatedAt, '2026-10-27T11:50:00Z');
});

test('createCloudSaaSProvider — pullState recupera estado da nuvem com tratamento de erro', async () => {
  /** @type {any} */
  const mockFetchSuccess = async () => ({
    ok: true,
    status: 200,
    json: async () => ({
      stateJson: { schemaVersion: 28, subjects: [{ id: 's1', name: 'Direito' }] },
      serverUpdatedAt: '2026-10-27T12:00:00Z',
    }),
  });

  const provider = createCloudSaaSProvider({
    config: { apiUrl: 'https://api.studytrack.app' },
    fetch: mockFetchSuccess,
  });

  const successResult = await provider.pullState();
  assert.equal(successResult.success, true);
  assert.equal(successResult.state.schemaVersion, 28);
  assert.equal(successResult.state.subjects[0].name, 'Direito');

  // Simula erro 401
  /** @type {any} */
  const mockFetchError = async () => ({
    ok: false,
    status: 401,
    statusText: 'Unauthorized',
  });

  const errorProvider = createCloudSaaSProvider({
    config: { apiUrl: 'https://api.studytrack.app' },
    fetch: mockFetchError,
  });

  const errorResult = await errorProvider.pullState();
  assert.equal(errorResult.success, false);
  assert.match(errorResult.error, /401/);
});

test('createCloudSaaSProvider — checkRemoteVersion compara timestamp local e remoto', async () => {
  /** @type {any} */
  const mockFetch = async () => ({
    ok: true,
    json: async () => ({ serverUpdatedAt: '2026-10-27T15:00:00Z' }),
  });

  const provider = createCloudSaaSProvider({
    config: { apiUrl: 'https://api.studytrack.app' },
    fetch: mockFetch,
  });

  // Local mais antigo que servidor -> hasUpdate: true
  const checkOlder = await provider.checkRemoteVersion('2026-10-27T14:00:00Z');
  assert.equal(checkOlder.hasUpdate, true);

  // Local mais recente que servidor -> hasUpdate: false
  const checkNewer = await provider.checkRemoteVersion('2026-10-27T16:00:00Z');
  assert.equal(checkNewer.hasUpdate, false);
});

test('createCloudSaaSProvider — fila offline e debounce retém alterações para push posterior', async () => {
  const storage = /** @type {Storage} */ (new MemoryStorage());
  let isOnlineFlag = false;
  let pushCalls = 0;

  /** @type {any} */
  const mockFetch = async () => {
    pushCalls++;
    return {
      ok: true,
      json: async () => ({
        success: true,
        serverUpdatedAt: '2026-11-08T15:00:00Z',
        checksum: 'hash_offline_sync',
      }),
    };
  };

  const provider = createCloudSaaSProvider({
    config: {
      apiUrl: 'https://api.extratodeestudos.com.br',
      storage,
      isOnline: () => isOnlineFlag,
      debounceMs: 50,
    },
    fetch: mockFetch,
  });

  // Em modo offline, agendar push marca pendência sem disparar rede
  const stateSample = { schemaVersion: 28, subjects: [{ id: 'sub-1' }] };
  provider.schedulePush(stateSample, 10);

  assert.equal(provider.hasPendingSync(), true);
  assert.equal(provider.getSyncStatus(), 'offline');
  assert.equal(pushCalls, 0);

  // Quando volta a conexão, flushPendingSync descarrega a fila
  isOnlineFlag = true;
  const flushResult = await provider.flushPendingSync(stateSample);
  assert.ok(flushResult);
  assert.equal(flushResult.success, true);
  assert.equal(provider.hasPendingSync(), false);
  assert.equal(provider.getSyncStatus(), 'synced');
  assert.equal(pushCalls, 1);
});

test('createCloudSaaSProvider — reconcileWithRemote aciona backup e aplica estado mais novo', async () => {
  let backupTriggered = false;
  let remoteStateReceived = null;

  const localState = { schemaVersion: 28, updatedAt: '2026-11-08T10:00:00Z', subjects: [] };
  const remoteState = { schemaVersion: 28, updatedAt: '2026-11-08T12:00:00Z', subjects: [{ id: 's2' }] };

  /** @type {any} */
  const mockFetch = async (url) => {
    if (url.includes('/version')) {
      return {
        ok: true,
        json: async () => ({ serverUpdatedAt: '2026-11-08T12:00:00Z' }),
      };
    }
    if (url.includes('/pull')) {
      return {
        ok: true,
        json: async () => ({
          stateJson: remoteState,
          serverUpdatedAt: '2026-11-08T12:00:00Z',
        }),
      };
    }
    return { ok: false, status: 404 };
  };

  const provider = createCloudSaaSProvider({
    config: { apiUrl: 'https://api.extratodeestudos.com.br' },
    fetch: mockFetch,
  });

  const applied = await provider.reconcileWithRemote({
    localState,
    onBackupBeforeApply: async (state) => {
      backupTriggered = true;
      assert.equal(state.updatedAt, '2026-11-08T10:00:00Z');
    },
    onRemoteStateApplied: async (state) => {
      remoteStateReceived = state;
    },
  });

  assert.equal(applied, true);
  assert.equal(backupTriggered, true);
  assert.ok(remoteStateReceived);
  assert.equal(remoteStateReceived.subjects[0].id, 's2');
  assert.equal(provider.getSyncStatus(), 'synced');
});

test('createCloudSaaSProvider — criptografia ponta a ponta (E2EE) cifra no push e decifra no pull', async () => {
  let serverStoredPayload = null;

  /** @type {any} */
  const mockFetch = async (url, options) => {
    if (url.includes('/push')) {
      const parsed = JSON.parse(options.body);
      serverStoredPayload = parsed.stateJson;
      return {
        ok: true,
        json: async () => ({ serverUpdatedAt: '2026-11-08T14:00:00Z' }),
      };
    }
    if (url.includes('/pull')) {
      return {
        ok: true,
        json: async () => ({
          stateJson: serverStoredPayload,
          serverUpdatedAt: '2026-11-08T14:00:00Z',
        }),
      };
    }
    return { ok: false, status: 404 };
  };

  const passphrase = 'chave-ultra-secreta-estudante-2026';
  const provider = createCloudSaaSProvider({
    config: {
      apiUrl: 'https://api.extratodeestudos.com.br',
      encryptionPassphrase: passphrase,
    },
    fetch: mockFetch,
  });

  const originalState = {
    schemaVersion: 28,
    studyPlans: [{ id: 'plano_e2ee_1' }],
    subjects: [{ id: 's1', name: 'Direito Penal' }],
  };

  const pushRes = await provider.pushState(originalState);
  assert.equal(pushRes.success, true);

  // Garante que o payload enviado para o servidor está criptografado e não contém o texto plano
  assert.ok(serverStoredPayload);
  assert.equal(serverStoredPayload.encrypted, true);
  assert.ok(serverStoredPayload.envelope);
  assert.ok(!JSON.stringify(serverStoredPayload).includes('Direito Penal'));

  // Pull com a mesma senha recupera os dados legíveis
  const pullRes = await provider.pullState();
  assert.equal(pullRes.success, true);
  assert.equal(pullRes.state.studyPlans[0].id, 'plano_e2ee_1');
  assert.equal(pullRes.state.subjects[0].name, 'Direito Penal');
});

test('CloudSyncBadge — renderiza todos os status de sincronização sem emojis', () => {
  let syncNowClicked = false;

  // Status synced
  const syncedHtml = renderToString(
    h(CloudSyncBadge, {
      status: 'synced',
      lastSyncedAt: new Date().toISOString(),
      onSyncNow: () => {
        syncNowClicked = true;
      },
    })
  );
  assert.ok(syncedHtml.includes('cloud-check'));
  assert.ok(syncedHtml.includes('Nuvem em dia'));
  assert.ok(!/\p{Extended_Pictographic}/u.test(syncedHtml));

  // Status syncing
  const syncingHtml = renderToString(
    h(CloudSyncBadge, {
      status: 'syncing',
    })
  );
  assert.ok(syncingHtml.includes('refresh'));
  assert.ok(syncingHtml.includes('Sincronizando...'));
  assert.ok(!/\p{Extended_Pictographic}/u.test(syncingHtml));

  // Status offline
  const offlineHtml = renderToString(
    h(CloudSyncBadge, {
      status: 'offline',
    })
  );
  assert.ok(offlineHtml.includes('cloud-off'));
  assert.ok(offlineHtml.includes('Offline'));
  assert.ok(!/\p{Extended_Pictographic}/u.test(offlineHtml));

  // Status error
  const errorHtml = renderToString(
    h(CloudSyncBadge, {
      status: 'error',
      errorMessage: 'Falha 500 no servidor',
    })
  );
  assert.ok(errorHtml.includes('alert-circle'));
  assert.ok(errorHtml.includes('Erro de sincronização'));
  assert.ok(!/\p{Extended_Pictographic}/u.test(errorHtml));
});
