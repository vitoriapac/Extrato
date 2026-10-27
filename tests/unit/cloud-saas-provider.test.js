import test from 'node:test';
import assert from 'node:assert/strict';
import { createCloudSaaSProvider } from '../../src/storage/cloud-saas-provider.js';

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
