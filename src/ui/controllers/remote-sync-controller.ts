/**
 * @fileoverview Controlador da interface de sincronização remota WebDAV com E2EE.
 *
 * Garantias de segurança:
 * - A chave de criptografia e a senha do WebDAV ficam apenas nos campos do formulário (memória da página);
 *   somente URL, usuário e o marcador da última sincronização são persistidos localmente.
 * - Antes de enviar, a versão do backup remoto é comparada com a última sincronização deste navegador;
 *   se a nuvem mudou, o envio só acontece após confirmação.
 * - O estado baixado passa pela mesma validação/migração da importação de backup e exige confirmação.
 * - Antes de substituir os dados locais, um snapshot verificado do estado atual precisa ser criado.
 */

export const REMOTE_SYNC_CONFIG_KEY = 'studytrack_remote_sync_config';

/** Mesma normalização do provider, para que "pasta" e "pasta/" sejam o mesmo servidor. */
const sameServer = url => {
  const clean = String(url || '').trim();
  return clean.endsWith('/') ? clean : `${clean}/`;
};

/** @param {any} value */
const validLastSync = value =>
  value && typeof value.serverUrl === 'string' && typeof value.envelopeAt === 'string'
    ? { serverUrl: value.serverUrl, envelopeAt: value.envelopeAt }
    : null;

/**
 * Lê as preferências persistidas, descartando qualquer senha gravada por versões anteriores.
 * @param {Storage | undefined | null} storage
 * @returns {{ serverUrl: string, username: string, lastSync?: { serverUrl: string, envelopeAt: string } }}
 */
export function readRemoteSyncPreferences(storage): {
  serverUrl: string;
  username: string;
  lastSync?: any;
} {
  const empty = { serverUrl: '', username: '' };
  if (!storage) return empty;
  let parsed;
  try {
    const raw = storage.getItem(REMOTE_SYNC_CONFIG_KEY);
    if (!raw) return empty;
    parsed = JSON.parse(raw);
  } catch {
    return empty;
  }
  if (!parsed || typeof parsed !== 'object') return empty;
  const preferences: { serverUrl: string; username: string; lastSync?: any } = {
    serverUrl: typeof parsed.serverUrl === 'string' ? parsed.serverUrl : '',
    username: typeof parsed.username === 'string' ? parsed.username : '',
  };
  const lastSync = validLastSync(parsed.lastSync);
  if (lastSync) preferences.lastSync = lastSync;
  if ('password' in parsed || 'passphrase' in parsed) {
    try {
      storage.setItem(REMOTE_SYNC_CONFIG_KEY, JSON.stringify(preferences));
    } catch {
      // Sem acesso ao armazenamento: a senha antiga não é usada de qualquer forma.
    }
  }
  return preferences;
}

/**
 * Persiste somente dados não secretos da conexão.
 * @param {Storage | undefined | null} storage
 * @param {{ serverUrl?: string, username?: string, lastSync?: { serverUrl: string, envelopeAt: string } | null }} config
 */
export function writeRemoteSyncPreferences(
  storage,
  { serverUrl = '', username = '', lastSync = null }: any = {}
) {
  if (!storage) return false;
  const marker = validLastSync(lastSync);
  try {
    storage.setItem(
      REMOTE_SYNC_CONFIG_KEY,
      JSON.stringify(marker ? { serverUrl, username, lastSync: marker } : { serverUrl, username })
    );
    return true;
  } catch {
    return false;
  }
}

/**
 * @param {Object} [options]
 * @param {Document} [options.document]
 * @param {Window} [options.window]
 * @param {any} [options.provider]
 * @param {() => any} [options.getState]
 * @param {(data: any) => { valid: boolean, message?: string, normalized?: any, version?: number }} [options.validate]
 * @param {(validation: any) => string} [options.describe]
 * @param {(message: string, onConfirm: () => void) => void} [options.confirm]
 * @param {() => Promise<boolean>} [options.createSnapshot]
 * @param {(state: any) => (boolean | void)} [options.onImported] retorna false quando não conseguiu aplicar o estado
 * @param {(msg: string) => void} [options.notify]
 * @param {() => boolean} [options.isDisabled]
 */
export function createRemoteSyncController({
  document = globalThis.document,
  window = globalThis.window,
  provider,
  getState = () => null,
  validate,
  describe = () => 'Backup remoto válido.',
  confirm,
  createSnapshot,
  onImported = _state => {},
  notify = _msg => {},
  isDisabled = () => false,
}: any = {}) {
  if (
    typeof validate !== 'function' ||
    typeof confirm !== 'function' ||
    typeof createSnapshot !== 'function'
  ) {
    throw new TypeError(
      'Sincronização remota requer validação, confirmação e snapshot de segurança.'
    );
  }

  const overlay = document?.getElementById('remoteSyncOverlay');
  const openBtn = document?.getElementById('openRemoteSyncBtn');
  const closeBtn = document?.getElementById('closeRemoteSyncBtn');
  const saveBtn = document?.getElementById('saveRemoteSyncConfigBtn');
  const testBtn = document?.getElementById('testRemoteSyncBtn');
  const reconcileBtn = document?.getElementById('reconcileRemoteSyncBtn');
  const pushBtn = document?.getElementById('pushRemoteSyncBtn');
  const pullBtn = document?.getElementById('pullRemoteSyncBtn');

  const urlInput = /** @type {HTMLInputElement | null} */ document?.getElementById('remoteSyncUrl');
  const userInput =
    /** @type {HTMLInputElement | null} */ document?.getElementById('remoteSyncUsername');
  const passInput =
    /** @type {HTMLInputElement | null} */ document?.getElementById('remoteSyncPassword');
  const phraseInput =
    /** @type {HTMLInputElement | null} */ document?.getElementById('remoteSyncPassphrase');

  const statusBox = document?.getElementById('remoteSyncStatusBox');
  const statusMsg = document?.getElementById('remoteSyncStatusMsg');

  const storage = (() => {
    try {
      return window?.localStorage;
    } catch {
      return null;
    }
  })();

  let previousFocus = null;

  const showStatus = (text, isError = false) => {
    if (!statusBox || !statusMsg) return;
    statusBox.hidden = false;
    statusBox.style.color = isError ? 'var(--critical, #e63946)' : 'var(--text-primary)';
    statusMsg.textContent = text;
  };

  const getConfig = () => ({
    serverUrl: urlInput?.value?.trim() || '',
    username: userInput?.value?.trim() || '',
    password: passInput?.value || '',
    passphrase: phraseInput?.value || '',
  });

  const loadSavedConfig = () => {
    const preferences = readRemoteSyncPreferences(storage);
    if (urlInput && preferences.serverUrl) urlInput.value = preferences.serverUrl;
    if (userInput && preferences.username) userInput.value = preferences.username;
  };

  const saveConfig = () => {
    const { serverUrl, username } = getConfig();
    const { lastSync } = readRemoteSyncPreferences(storage);
    if (writeRemoteSyncPreferences(storage, { serverUrl, username, lastSync })) {
      notify('URL e usuário salvos neste navegador. Senha e chave não são armazenadas.');
    } else {
      notify('Não foi possível salvar as preferências.');
    }
  };

  const open = () => {
    if (isDisabled()) {
      notify('A sincronização remota fica indisponível durante o modo de demonstração.');
      return;
    }
    previousFocus = document?.activeElement;
    loadSavedConfig();
    if (statusBox) statusBox.hidden = true;
    overlay?.classList.add('show');
    phraseInput?.focus();
  };

  const close = ({ restoreFocus = true } = {}) => {
    overlay?.classList.remove('show');
    if (restoreFocus && previousFocus && typeof previousFocus['focus'] === 'function') {
      previousFocus['focus']();
    }
    previousFocus = null;
  };

  const lastSyncedEnvelopeAt = serverUrl => {
    const { lastSync } = readRemoteSyncPreferences(storage);
    return lastSync && sameServer(lastSync.serverUrl) === sameServer(serverUrl)
      ? lastSync.envelopeAt
      : null;
  };

  const recordSync = (serverUrl, envelopeAt) => {
    if (!envelopeAt) return;
    const preferences = readRemoteSyncPreferences(storage);
    writeRemoteSyncPreferences(storage, {
      ...preferences,
      lastSync: { serverUrl: sameServer(serverUrl), envelopeAt },
    });
  };

  const formatEnvelopeAt = iso => {
    const date = new Date(iso);
    return Number.isNaN(date.getTime())
      ? iso
      : date.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
  };

  /** A nuvem só mudou "por fora" se o envelope remoto não for o da última sincronização deste navegador. */
  const remoteChangedSinceLastSync = (version, serverUrl) =>
    version.exists && !(version.valid && version.createdAt === lastSyncedEnvelopeAt(serverUrl));

  const requireCredentials = config => {
    if (!config.serverUrl || !config.passphrase) {
      showStatus('Informe a URL WebDAV e a Chave de Criptografia Mestre.', true);
      return false;
    }
    return true;
  };

  const testConnection = async () => {
    const config = getConfig();
    if (!config.serverUrl) {
      showStatus('Por favor, informe a URL da pasta WebDAV.', true);
      return;
    }
    showStatus('Testando conexão com o servidor WebDAV...');
    try {
      const result = await provider.testConnection(config);
      if (result.ok) showStatus('Conexão estabelecida com sucesso! Servidor acessível.');
      else showStatus(`Falha de conexão: ${result.message}`, true);
    } catch (error) {
      showStatus(`Erro ao conectar: ${/** @type {any} */ error?.message}`, true);
    }
  };

  const reconcile = async () => {
    const config = getConfig();
    if (!config.serverUrl) {
      showStatus('Por favor, informe a URL da pasta WebDAV.', true);
      return;
    }
    showStatus('Consultando estado remoto...');
    try {
      const version = await provider.checkRemoteVersion(config);
      if (!version.exists)
        showStatus('Nenhum backup na nuvem ainda. Envie o estado local para criar o primeiro.');
      else if (!version.valid) showStatus('O arquivo remoto não é um backup reconhecido.', true);
      else if (remoteChangedSinceLastSync(version, config.serverUrl))
        showStatus(
          `A nuvem tem um backup de ${formatEnvelopeAt(version.createdAt)} que este navegador ainda não baixou.`
        );
      else
        showStatus(
          'A nuvem está igual à última sincronização deste navegador. Envie se você fez mudanças aqui.'
        );
    } catch (error) {
      showStatus(`Falha ao verificar: ${/** @type {any} */ error?.message}`, true);
    }
  };

  const push = async () => {
    if (isDisabled()) {
      notify('Ação indisponível na demonstração.');
      return;
    }
    const config = getConfig();
    if (!requireCredentials(config)) return;
    showStatus('Verificando o backup na nuvem...');
    let version;
    try {
      version = await provider.checkRemoteVersion(config);
    } catch (error) {
      showStatus(
        `Erro ao consultar a nuvem: ${/** @type {any} */ error?.message} Nada foi enviado.`,
        true
      );
      return;
    }
    if (!remoteChangedSinceLastSync(version, config.serverUrl)) {
      await upload(config);
      return;
    }
    const warning = version.valid
      ? `A nuvem tem um backup de ${formatEnvelopeAt(version.createdAt)} que este navegador ainda não baixou. Enviar vai substituí-lo. Continuar?`
      : 'O arquivo remoto não é um backup reconhecido. Enviar vai substituí-lo. Continuar?';
    close({ restoreFocus: false });
    confirm(warning, () => {
      upload(config);
    });
  };

  /** Pode rodar depois da confirmação, com o modal fechado: por isso também avisa por notify. */
  const upload = async config => {
    showStatus('Criptografando com AES-GCM e enviando para a nuvem...');
    try {
      const result = await provider.uploadState(getState(), config);
      recordSync(config.serverUrl, result.envelopeAt);
      showStatus(`Upload concluído com sucesso (${result.sizeBytes} bytes criptografados).`);
      notify('Backup criptografado enviado para a nuvem.');
    } catch (error) {
      const message = `Erro no envio: ${/** @type {any} */ error?.message}`;
      showStatus(message, true);
      notify(message);
    }
  };

  /** Executado somente após a confirmação explícita do usuário. */
  const applyConfirmed = async (normalized, syncMarker = null) => {
    let snapshotCreated = false;
    try {
      snapshotCreated = await createSnapshot();
    } catch {
      snapshotCreated = false;
    }
    if (!snapshotCreated) {
      notify('Não foi possível criar o snapshot de segurança dos dados atuais. Nada foi alterado.');
      return false;
    }
    if (onImported(normalized) === false) return false;
    if (syncMarker) recordSync(syncMarker.serverUrl, syncMarker.envelopeAt);
    return true;
  };

  const pull = async () => {
    if (isDisabled()) {
      notify('Ação indisponível na demonstração.');
      return;
    }
    const config = getConfig();
    if (!requireCredentials(config)) return;
    showStatus('Baixando e decriptografando dados remotos...');
    let result;
    try {
      result = await provider.downloadState(config);
    } catch (error) {
      showStatus(`Erro na decriptografia/download: ${/** @type {any} */ error?.message}`, true);
      return;
    }
    if (!result?.ok || !result.state) {
      showStatus(result?.message || 'Nenhum dado encontrado.', true);
      return;
    }

    let validation;
    try {
      validation = validate(result.state);
    } catch {
      validation = { valid: false, message: 'O backup remoto não pôde ser validado.' };
    }
    if (!validation?.valid || !validation.normalized) {
      showStatus(
        `Backup remoto rejeitado: ${validation?.message || 'estrutura inválida.'} Seus dados locais foram preservados.`,
        true
      );
      return;
    }

    close({ restoreFocus: false });
    confirm(
      `${describe(validation)} Baixar da nuvem vai substituir todos os dados atuais. Um snapshot de segurança do estado atual será criado antes. Continuar?`,
      () => {
        applyConfirmed(validation.normalized, {
          serverUrl: config.serverUrl,
          envelopeAt: result.envelopeAt,
        });
      }
    );
  };

  const mount = () => {
    openBtn?.addEventListener('click', open);
    closeBtn?.addEventListener('click', () => close());
    saveBtn?.addEventListener('click', saveConfig);
    testBtn?.addEventListener('click', testConnection);
    reconcileBtn?.addEventListener('click', reconcile);
    pushBtn?.addEventListener('click', push);
    pullBtn?.addEventListener('click', pull);

    overlay?.addEventListener('keydown', event => {
      if (/** @type {KeyboardEvent} */ event.key === 'Escape') {
        event.preventDefault();
        close();
      }
    });

    return api;
  };

  const api = Object.freeze({
    open,
    close,
    mount,
    testConnection,
    reconcile,
    push,
    pull,
    applyConfirmed,
  });
  return api;
}
