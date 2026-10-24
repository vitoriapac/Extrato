import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createRemoteSyncController,
  readRemoteSyncPreferences,
  writeRemoteSyncPreferences,
  REMOTE_SYNC_CONFIG_KEY,
} from '../../src/ui/controllers/remote-sync-controller.js';

function memoryStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: key => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => {
      data.set(key, String(value));
    },
    removeItem: key => {
      data.delete(key);
    },
    dump: () => Object.fromEntries(data),
  };
}

function fakeElement(value = '') {
  const listeners = {};
  return {
    value,
    hidden: true,
    textContent: '',
    style: {},
    classList: { add() {}, remove() {} },
    focus() {},
    addEventListener(event, handler) {
      listeners[event] = handler;
    },
    click() {
      return listeners.click?.();
    },
    listeners,
  };
}

function fakeDocument(values = {}) {
  const ids = [
    'remoteSyncOverlay',
    'openRemoteSyncBtn',
    'closeRemoteSyncBtn',
    'saveRemoteSyncConfigBtn',
    'testRemoteSyncBtn',
    'reconcileRemoteSyncBtn',
    'pushRemoteSyncBtn',
    'pullRemoteSyncBtn',
    'remoteSyncUrl',
    'remoteSyncUsername',
    'remoteSyncPassword',
    'remoteSyncPassphrase',
    'remoteSyncStatusBox',
    'remoteSyncStatusMsg',
  ];
  const elements = Object.fromEntries(ids.map(id => [id, fakeElement(values[id] || '')]));
  return { elements, activeElement: null, getElementById: id => elements[id] || null };
}

function setup({
  downloadState,
  validate,
  createSnapshot,
  storage = memoryStorage(),
  provider = {},
  onImported,
} = {}) {
  const document = fakeDocument({
    remoteSyncUrl: 'https://dav.exemplo.com/files/',
    remoteSyncUsername: 'estudante',
    remoteSyncPassword: 'senha-webdav',
    remoteSyncPassphrase: 'chave-mestra',
  });
  const calls = { confirm: [], imported: [], notify: [], snapshots: 0 };
  const controller = createRemoteSyncController({
    document: /** @type {any} */ (document),
    window: /** @type {any} */ ({ localStorage: storage }),
    provider: {
      downloadState:
        downloadState ||
        (async () => ({
          ok: true,
          state: { schemaVersion: 28, subjects: [] },
          envelopeAt: '2026-10-20T09:00:00.000Z',
        })),
      ...provider,
    },
    getState: () => ({ subjects: [{ id: 'local' }] }),
    validate:
      validate || (data => ({ valid: true, version: 28, normalized: { ...data, migrated: true } })),
    describe: ({ version }) => `Backup v${version}.`,
    confirm: (message, onConfirm) => calls.confirm.push({ message, onConfirm }),
    createSnapshot:
      createSnapshot ||
      (async () => {
        calls.snapshots++;
        return true;
      }),
    onImported:
      onImported ||
      (state => {
        calls.imported.push(state);
      }),
    notify: message => calls.notify.push(message),
  });
  // Os testes clicam nos botões: sem mount() nenhum listener existe.
  controller.mount();
  return { controller, document, calls, storage };
}

test('remote-sync-controller: exige validação, confirmação e snapshot como dependências', () => {
  assert.throws(
    () => createRemoteSyncController({ document: /** @type {any} */ (fakeDocument()) }),
    /validação, confirmação e snapshot/
  );
});

test('remote-sync-controller: backup remoto inválido é rejeitado sem confirmação nem alteração local', async () => {
  const { controller, document, calls } = setup({
    validate: () => ({ valid: false, message: 'O campo "subjects" deve ser uma lista.' }),
  });

  await controller.pull();

  assert.equal(calls.confirm.length, 0);
  assert.equal(calls.imported.length, 0);
  assert.equal(calls.snapshots, 0);
  assert.match(document.elements.remoteSyncStatusMsg.textContent, /Backup remoto rejeitado/);
  assert.match(document.elements.remoteSyncStatusMsg.textContent, /preservados/);
});

test('remote-sync-controller: backup válido aplica somente o estado normalizado após confirmação e snapshot', async () => {
  const order = [];
  const { controller, calls } = setup({
    createSnapshot: async () => {
      order.push('snapshot');
      return true;
    },
  });

  await controller.pull();

  assert.equal(calls.confirm.length, 1);
  assert.match(calls.confirm[0].message, /Backup v28/);
  assert.match(calls.confirm[0].message, /snapshot de segurança/);
  assert.equal(calls.imported.length, 0, 'nada é aplicado antes da confirmação');

  await calls.confirm[0].onConfirm();
  await new Promise(resolve => setImmediate(resolve));

  assert.deepEqual(order, ['snapshot']);
  assert.equal(calls.imported.length, 1);
  assert.equal(calls.imported[0].migrated, true, 'aplica o estado validado/migrado, não o bruto');
});

test('remote-sync-controller: falha do snapshot de segurança impede a substituição', async () => {
  const { controller, calls } = setup({ createSnapshot: async () => false });

  await controller.pull();
  const applied = await controller.applyConfirmed({ subjects: [] });

  assert.equal(applied, false);
  assert.equal(calls.imported.length, 0);
  assert.ok(calls.notify.some(message => /snapshot de segurança/.test(message)));
});

test('remote-sync-controller: exceção no snapshot também preserva os dados locais', async () => {
  const { controller, calls } = setup({
    createSnapshot: async () => {
      throw new Error('quota');
    },
  });
  const applied = await controller.applyConfirmed({ subjects: [] });
  assert.equal(applied, false);
  assert.equal(calls.imported.length, 0);
});

test('remote-sync-controller: erro de download ou backup ausente não abre confirmação', async () => {
  const missing = setup({
    downloadState: async () => ({
      ok: false,
      notFound: true,
      message: 'Nenhum backup encontrado.',
    }),
  });
  await missing.controller.pull();
  assert.equal(missing.calls.confirm.length, 0);

  const broken = setup({
    downloadState: async () => {
      throw new Error('Não foi possível decriptografar.');
    },
  });
  await broken.controller.pull();
  assert.equal(broken.calls.confirm.length, 0);
  assert.match(broken.document.elements.remoteSyncStatusMsg.textContent, /decriptografar/);
});

test('preferências: salva apenas URL e usuário, nunca senha ou chave', () => {
  const storage = memoryStorage();
  const { document } = setup({ storage });

  document.elements.saveRemoteSyncConfigBtn.click();

  const saved = JSON.parse(storage.getItem(REMOTE_SYNC_CONFIG_KEY));
  assert.deepEqual(saved, { serverUrl: 'https://dav.exemplo.com/files/', username: 'estudante' });
  assert.ok(!JSON.stringify(storage.dump()).includes('senha-webdav'));
  assert.ok(!JSON.stringify(storage.dump()).includes('chave-mestra'));
});

test('preferências: senha gravada por versão anterior é descartada e removida do armazenamento', () => {
  const storage = memoryStorage({
    [REMOTE_SYNC_CONFIG_KEY]: JSON.stringify({
      serverUrl: 'https://dav.exemplo.com/',
      username: 'u',
      password: 'antiga',
    }),
  });

  const preferences = readRemoteSyncPreferences(/** @type {any} */ (storage));

  assert.deepEqual(preferences, { serverUrl: 'https://dav.exemplo.com/', username: 'u' });
  assert.ok(!storage.getItem(REMOTE_SYNC_CONFIG_KEY).includes('antiga'));
});

test('preferências: conteúdo corrompido ou armazenamento ausente retorna valores vazios', () => {
  assert.deepEqual(
    readRemoteSyncPreferences(
      /** @type {any} */ (memoryStorage({ [REMOTE_SYNC_CONFIG_KEY]: '{quebrado' }))
    ),
    { serverUrl: '', username: '' }
  );
  assert.deepEqual(readRemoteSyncPreferences(null), { serverUrl: '', username: '' });
  assert.equal(writeRemoteSyncPreferences(null, { serverUrl: 'x' }), false);
});

const SERVER = 'https://dav.exemplo.com/files/';
const settle = () => new Promise(resolve => setImmediate(resolve));
const withLastSync = envelopeAt =>
  memoryStorage({
    [REMOTE_SYNC_CONFIG_KEY]: JSON.stringify({
      serverUrl: SERVER,
      username: 'estudante',
      lastSync: { serverUrl: SERVER, envelopeAt },
    }),
  });

function pushSetup({ version, storage, checkError } = {}) {
  const uploads = [];
  const ctx = setup({
    storage,
    provider: {
      checkRemoteVersion: async () => {
        if (checkError) throw checkError;
        return version;
      },
      uploadState: async (state, config) => {
        uploads.push({ state, config });
        return { ok: true, sizeBytes: 10, envelopeAt: '2026-10-20T12:00:00.000Z' };
      },
    },
  });
  return { ...ctx, uploads };
}

const savedLastSync = storage =>
  JSON.parse(storage.getItem(REMOTE_SYNC_CONFIG_KEY) || '{}').lastSync;

test('push: sem backup na nuvem envia direto e grava o marcador', async () => {
  const { controller, calls, uploads, storage } = pushSetup({ version: { exists: false } });
  await controller.push();
  assert.equal(calls.confirm.length, 0);
  assert.equal(uploads.length, 1);
  assert.deepEqual(savedLastSync(storage), {
    serverUrl: SERVER,
    envelopeAt: '2026-10-20T12:00:00.000Z',
  });
});

test('push: nuvem igual à última sincronização envia direto', async () => {
  const { controller, calls, uploads } = pushSetup({
    version: { exists: true, valid: true, createdAt: '2026-10-19T08:00:00.000Z' },
    storage: withLastSync('2026-10-19T08:00:00.000Z'),
  });
  await controller.push();
  assert.equal(calls.confirm.length, 0);
  assert.equal(uploads.length, 1);
});

test('push: nuvem mudou desde a última sincronização pede confirmação e só envia após confirmar', async () => {
  const { controller, calls, uploads, storage } = pushSetup({
    version: { exists: true, valid: true, createdAt: '2026-10-20T11:00:00.000Z' },
    storage: withLastSync('2026-10-19T08:00:00.000Z'),
  });
  await controller.push();
  assert.equal(calls.confirm.length, 1);
  assert.match(
    calls.confirm[0].message,
    /ainda não baixou\. Enviar vai substituí-lo\. Continuar\?/
  );
  assert.equal(uploads.length, 0, 'cancelar = nunca chamar onConfirm = nada enviado');
  assert.equal(savedLastSync(storage).envelopeAt, '2026-10-19T08:00:00.000Z');

  calls.confirm[0].onConfirm();
  await settle();
  assert.equal(uploads.length, 1);
  assert.equal(savedLastSync(storage).envelopeAt, '2026-10-20T12:00:00.000Z');
  assert.ok(calls.notify.includes('Backup criptografado enviado para a nuvem.'));
});

test('push: sem marcador local, ou marcador de outro servidor, pede confirmação', async () => {
  const version = { exists: true, valid: true, createdAt: '2026-10-19T08:00:00.000Z' };
  const semMarcador = pushSetup({ version });
  await semMarcador.controller.push();
  assert.equal(semMarcador.calls.confirm.length, 1);

  const outroServidor = pushSetup({
    version,
    storage: memoryStorage({
      [REMOTE_SYNC_CONFIG_KEY]: JSON.stringify({
        serverUrl: SERVER,
        username: 'u',
        lastSync: { serverUrl: 'https://outro.exemplo/', envelopeAt: version.createdAt },
      }),
    }),
  });
  await outroServidor.controller.push();
  assert.equal(outroServidor.calls.confirm.length, 1);
});

test('push: "pasta" e "pasta/" são o mesmo servidor para o marcador', async () => {
  const { controller, calls, uploads } = pushSetup({
    version: { exists: true, valid: true, createdAt: '2026-10-19T08:00:00.000Z' },
    storage: memoryStorage({
      [REMOTE_SYNC_CONFIG_KEY]: JSON.stringify({
        lastSync: { serverUrl: SERVER.slice(0, -1), envelopeAt: '2026-10-19T08:00:00.000Z' },
      }),
    }),
  });
  await controller.push();
  assert.equal(calls.confirm.length, 0);
  assert.equal(uploads.length, 1);
});

test('push: arquivo remoto que não é backup pede confirmação específica', async () => {
  const { controller, calls, uploads } = pushSetup({ version: { exists: true, valid: false } });
  await controller.push();
  assert.equal(calls.confirm.length, 1);
  assert.match(calls.confirm[0].message, /não é um backup reconhecido/);
  assert.equal(uploads.length, 0);
});

test('push: erro ao consultar a nuvem não envia nada', async () => {
  const { controller, calls, uploads, document } = pushSetup({
    checkError: new Error('Falha ao consultar backup remoto (HTTP 500).'),
  });
  await controller.push();
  assert.equal(calls.confirm.length, 0);
  assert.equal(uploads.length, 0);
  assert.match(document.elements.remoteSyncStatusMsg.textContent, /HTTP 500.*Nada foi enviado/);
});

test('push: erro no envio após a confirmação também avisa por notify', async () => {
  const ctx = setup({
    provider: {
      checkRemoteVersion: async () => ({ exists: true, valid: false }),
      uploadState: async () => {
        throw new Error('Falha no upload para o servidor (HTTP 507).');
      },
    },
  });
  await ctx.controller.push();
  ctx.calls.confirm[0].onConfirm();
  await settle();
  assert.ok(ctx.calls.notify.some(message => /HTTP 507/.test(message)));
  assert.equal(savedLastSync(ctx.storage), undefined);
});

test('pull: marcador só é gravado depois que o estado foi aplicado', async () => {
  const ok = setup();
  await ok.controller.pull();
  assert.equal(savedLastSync(ok.storage), undefined, 'antes da confirmação');
  await ok.calls.confirm[0].onConfirm();
  await settle();
  assert.deepEqual(savedLastSync(ok.storage), {
    serverUrl: SERVER,
    envelopeAt: '2026-10-20T09:00:00.000Z',
  });

  const falhou = setup({ onImported: () => false });
  await falhou.controller.pull();
  await falhou.calls.confirm[0].onConfirm();
  await settle();
  assert.equal(savedLastSync(falhou.storage), undefined, 'aplicação falhou: sem marcador');
});

test('preferências: salvar URL e usuário preserva o marcador; senha antiga é limpa sem perdê-lo', () => {
  const storage = withLastSync('2026-10-19T08:00:00.000Z');
  const { document } = setup({ storage });
  document.elements.saveRemoteSyncConfigBtn.click();
  assert.equal(savedLastSync(storage).envelopeAt, '2026-10-19T08:00:00.000Z');

  const legacy = memoryStorage({
    [REMOTE_SYNC_CONFIG_KEY]: JSON.stringify({
      serverUrl: SERVER,
      username: 'u',
      password: 'antiga',
      lastSync: { serverUrl: SERVER, envelopeAt: 'x' },
    }),
  });
  assert.deepEqual(readRemoteSyncPreferences(/** @type {any} */ (legacy)).lastSync, {
    serverUrl: SERVER,
    envelopeAt: 'x',
  });
  assert.ok(!legacy.getItem(REMOTE_SYNC_CONFIG_KEY).includes('antiga'));
  assert.ok(legacy.getItem(REMOTE_SYNC_CONFIG_KEY).includes('lastSync'));
});

test('verificar status: usa a mesma regra de versão e não exige a chave', async () => {
  const status = async (version, storage) => {
    const ctx = setup({ storage, provider: { checkRemoteVersion: async () => version } });
    ctx.document.elements.remoteSyncPassphrase.value = '';
    await ctx.controller.reconcile();
    return ctx.document.elements.remoteSyncStatusMsg.textContent;
  };
  assert.match(await status({ exists: false }), /Nenhum backup na nuvem/);
  assert.match(await status({ exists: true, valid: false }), /não é um backup reconhecido/);
  assert.match(
    await status(
      { exists: true, valid: true, createdAt: '2026-10-20T11:00:00.000Z' },
      withLastSync('2026-10-19T08:00:00.000Z')
    ),
    /ainda não baixou/
  );
  assert.match(
    await status(
      { exists: true, valid: true, createdAt: '2026-10-19T08:00:00.000Z' },
      withLastSync('2026-10-19T08:00:00.000Z')
    ),
    /igual à última sincronização/
  );
});
