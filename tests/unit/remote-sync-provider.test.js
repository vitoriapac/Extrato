import test from 'node:test';
import assert from 'node:assert/strict';
import { createRemoteSyncProvider } from '../../src/storage/remote-sync-provider.js';

test('remote-sync-provider: testa conexão WebDAV com sucesso', async () => {
  const mockFetch = async (url, options) => {
    assert.equal(options.method, 'PROPFIND');
    assert.ok(options.headers['Authorization'].startsWith('Basic '));
    return { ok: true, status: 207 };
  };

  const provider = createRemoteSyncProvider({ fetch: mockFetch });
  const result = await provider.testConnection({
    serverUrl: 'https://dav.exemplo.com/remote.php/dav/files/user/',
    username: 'estudante',
    password: 'app-password',
  });

  assert.equal(result.ok, true);
  assert.equal(result.status, 207);
});

test('remote-sync-provider: faz upload criptografado e download decriptografado com integridade', async () => {
  const remoteStore = new Map();
  const mockFetch = async (url, options) => {
    if (options.method === 'PUT') {
      remoteStore.set(url, options.body);
      return { ok: true, status: 201 };
    }
    if (options.method === 'GET') {
      if (!remoteStore.has(url)) return { ok: false, status: 404 };
      return {
        ok: true,
        status: 200,
        text: async () => remoteStore.get(url),
      };
    }
    return { ok: false, status: 400 };
  };

  const provider = createRemoteSyncProvider({ fetch: mockFetch });
  const config = {
    serverUrl: 'https://dav.exemplo.com/files/',
    username: 'user',
    password: 'pass',
    passphrase: 'chave-mestra-segura',
  };

  const originalState = {
    schemaVersion: 28,
    updatedAt: '2026-10-20T10:00:00.000Z',
    subjects: [{ id: 's1', name: 'Português', topics: [] }],
  };

  // 1. Upload
  const uploadResult = await provider.uploadState(originalState, config);
  assert.equal(uploadResult.ok, true);
  assert.ok(uploadResult.sizeBytes > 0);

  // O dado remoto deve estar cifrado (não pode conter o JSON aberto)
  const storedCiphertext = Array.from(remoteStore.values())[0];
  assert.ok(!storedCiphertext.includes('Português'));
  assert.ok(storedCiphertext.includes('AES-GCM-256'));

  // 2. Download e decriptografia
  const downloadResult = await provider.downloadState(config);
  assert.equal(downloadResult.ok, true);
  assert.deepEqual(downloadResult.state, originalState);
});

test('remote-sync-provider: checkRemoteVersion lê só o createdAt do envelope, sem decriptografar', async () => {
  const { encryptPayload } = await import('../../src/core/crypto-utils.js');
  const envelope = await encryptPayload('{"subjects":[]}', 'chave-que-o-provider-nao-recebe');
  let body = null;
  let status = 404;
  const provider = createRemoteSyncProvider({
    fetch: async (url, options) => {
      assert.equal(options.method, 'GET');
      return { ok: status < 400, status, text: async () => body };
    },
  });
  const config = { serverUrl: 'https://dav.exemplo.com/files/' };

  assert.deepEqual(await provider.checkRemoteVersion(config), { exists: false });

  status = 200;
  body = JSON.stringify(envelope);
  // Sem passphrase no config: se tentasse decriptografar, falharia.
  assert.deepEqual(await provider.checkRemoteVersion(config), {
    exists: true,
    valid: true,
    createdAt: envelope.createdAt,
  });

  body = '<html>não é um backup</html>';
  assert.deepEqual(await provider.checkRemoteVersion(config), { exists: true, valid: false });
  body = JSON.stringify({ algorithm: 'outro', createdAt: 'x' });
  assert.deepEqual(await provider.checkRemoteVersion(config), { exists: true, valid: false });

  status = 500;
  await assert.rejects(() => provider.checkRemoteVersion(config), /HTTP 500/);
});

test('remote-sync-provider: upload e download devolvem o createdAt do envelope como marcador', async () => {
  let stored = null;
  const provider = createRemoteSyncProvider({
    fetch: async (url, options) => {
      if (options.method === 'PUT') {
        stored = options.body;
        return { ok: true, status: 201 };
      }
      return { ok: true, status: 200, text: async () => stored };
    },
  });
  const config = { serverUrl: 'https://dav.exemplo.com/files/', passphrase: 'chave' };

  const upload = await provider.uploadState({ subjects: [] }, config);
  assert.equal(upload.envelopeAt, JSON.parse(stored).createdAt);
  const download = await provider.downloadState(config);
  assert.equal(download.envelopeAt, upload.envelopeAt);
  assert.equal((await provider.checkRemoteVersion(config)).createdAt, upload.envelopeAt);

  stored = 'lixo';
  await assert.rejects(() => provider.downloadState(config), /não é um backup reconhecido/);
});

test('remote-sync-provider: http:// com credenciais é recusado antes de qualquer requisição', async () => {
  let calls = 0;
  const provider = createRemoteSyncProvider({
    fetch: async () => {
      calls++;
      return { ok: true, status: 207 };
    },
  });
  const insecure = {
    serverUrl: 'http://dav.exemplo.com/files/',
    username: 'u',
    password: 'p',
    passphrase: 'chave',
  };

  await assert.rejects(() => provider.testConnection(insecure), /Use uma URL https:\/\//);
  await assert.rejects(() => provider.checkRemoteVersion(insecure), /Use uma URL https:\/\//);
  await assert.rejects(() => provider.uploadState({}, insecure), /Use uma URL https:\/\//);
  await assert.rejects(() => provider.downloadState(insecure), /Use uma URL https:\/\//);
  await assert.rejects(
    () => provider.testConnection({ serverUrl: 'http://dav.exemplo.com/', password: 'só-senha' }),
    /https/
  );
  assert.equal(calls, 0);

  for (const serverUrl of [
    'http://localhost:8080/dav/',
    'http://127.0.0.1/dav/',
    'http://[::1]:8080/',
  ]) {
    assert.equal(
      (await provider.testConnection({ serverUrl, username: 'u', password: 'p' })).ok,
      true,
      serverUrl
    );
  }
  assert.equal(
    (await provider.testConnection({ serverUrl: 'http://dav.exemplo.com/files/' })).ok,
    true,
    'sem credenciais é aceito'
  );
  await assert.rejects(
    () => provider.testConnection({ serverUrl: 'não é url', username: 'u' }),
    /URL do servidor WebDAV inválida/
  );
});

test('remote-sync-provider: cabeçalho Basic usa os bytes UTF-8 de usuário:senha', async () => {
  let header = null;
  const provider = createRemoteSyncProvider({
    fetch: async (url, options) => {
      header = options.headers.Authorization;
      return { ok: true, status: 207 };
    },
  });
  await provider.testConnection({
    serverUrl: 'https://dav.exemplo.com/',
    username: 'joão',
    password: 'ção€',
  });
  assert.equal(header, `Basic ${Buffer.from('joão:ção€', 'utf8').toString('base64')}`);
});

test('remote-sync-provider: falha de rede/CORS vira mensagem clara com a origem do app', async () => {
  const provider = createRemoteSyncProvider({
    origin: 'https://app.studytrack.exemplo',
    fetch: async () => {
      throw new TypeError('Failed to fetch');
    },
  });
  const config = { serverUrl: 'https://dav.exemplo.com/', passphrase: 'chave' };
  const expected =
    /permite acesso \(CORS\) a partir de https:\/\/app\.studytrack\.exemplo e se o navegador não bloqueou a conexão/;

  assert.match((await provider.testConnection(config)).message, expected);
  await assert.rejects(() => provider.checkRemoteVersion(config), expected);
  await assert.rejects(() => provider.uploadState({}, config), expected);
  await assert.rejects(() => provider.downloadState(config), expected);
});

test('index.html: CSP permite conectar ao WebDAV em https e ao servidor local, e nada além disso', async () => {
  const { readFile } = await import('node:fs/promises');
  const html = await readFile(new URL('../../index.html', import.meta.url), 'utf8');
  const policy = html.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/)?.[1];
  assert.ok(policy, 'CSP não encontrada no index.html');
  const connectSrc = policy
    .split(';')
    .map(part => part.trim())
    .find(part => part.startsWith('connect-src '));
  // Sem https: a sincronização WebDAV não alcança nenhum servidor; com http: ou * a senha poderia vazar em texto aberto.
  assert.deepEqual(connectSrc.split(/\s+/).slice(1).sort(), [
    "'self'",
    'http://127.0.0.1:*',
    'http://localhost:*',
    'https:',
  ]);
});
