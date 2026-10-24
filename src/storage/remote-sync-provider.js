/**
 * @fileoverview Provedor de sincronização remota via WebDAV com criptografia de ponta-a-ponta (E2EE).
 * Os dados são sempre criptografados localmente com AES-GCM 256 bits antes de qualquer envio ao servidor.
 */

import { encryptPayload, decryptPayload, bytesToBase64 } from '../core/crypto-utils.js';

const DEFAULT_FILE_NAME = 'studytrack-backup-encrypted.json';
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

function basicAuthHeader(username, password) {
  // btoa só aceita Latin-1; os bytes UTF-8 permitem senhas com qualquer caractere.
  return `Basic ${bytesToBase64(new TextEncoder().encode(`${username}:${password}`))}`;
}

/** Envelope gerado por encryptPayload; o createdAt fica fora da parte cifrada e serve de marcador de versão. */
function parseEnvelope(text) {
  try {
    const envelope = JSON.parse(text);
    return envelope &&
      envelope.algorithm === 'AES-GCM-256' &&
      envelope.ciphertext &&
      typeof envelope.createdAt === 'string'
      ? envelope
      : null;
  } catch {
    return null;
  }
}

/**
 * @param {Object} [options]
 * @param {typeof globalThis.fetch} [options.fetch]
 * @param {string} [options.origin] origem do app, citada na mensagem de CORS
 */
export function createRemoteSyncProvider({
  fetch = globalThis.fetch,
  origin = globalThis.location?.origin || '',
} = {}) {
  const normalizeUrl = (/** @type {string} */ url) => {
    let clean = String(url || '').trim();
    if (!clean.endsWith('/')) clean += '/';
    return clean;
  };

  /**
   * Valida a URL antes de qualquer requisição e monta os cabeçalhos.
   * @param {{ serverUrl?: string, username?: string, password?: string }} config
   * @param {string | null} fileName null aponta para a própria pasta
   */
  const prepare = (
    { serverUrl = '', username = '', password = '' } = {},
    fileName = DEFAULT_FILE_NAME
  ) => {
    if (!serverUrl) throw new TypeError('URL do servidor WebDAV não informada.');
    const folderUrl = normalizeUrl(serverUrl);
    let parsed;
    try {
      parsed = new URL(folderUrl);
    } catch {
      throw new TypeError('URL do servidor WebDAV inválida.');
    }
    /** @type {Record<string, string>} */
    const headers = {};
    if (username || password) {
      const localHttp = parsed.protocol === 'http:' && LOCAL_HOSTS.has(parsed.hostname);
      if (parsed.protocol !== 'https:' && !localHttp) {
        throw new TypeError('Use uma URL https:// — a senha do WebDAV seria enviada sem proteção.');
      }
      headers['Authorization'] = basicAuthHeader(username, password);
    }
    return { url: fileName === null ? folderUrl : `${folderUrl}${fileName}`, headers };
  };

  // O navegador só expõe um TypeError genérico quando CORS, CSP, DNS ou o servidor falham.
  const request = async (/** @type {string} */ url, /** @type {RequestInit} */ options) => {
    try {
      return await fetch(url, options);
    } catch (error) {
      if (error instanceof TypeError) {
        throw new Error(
          `Não foi possível falar com o servidor. Verifique a URL, se ele permite acesso (CORS) a partir de ${origin || 'este endereço'} e se o navegador não bloqueou a conexão.`
        );
      }
      throw error;
    }
  };

  return Object.freeze({
    /**
     * Testa conectividade com o servidor WebDAV.
     * @param {{ serverUrl?: string, username?: string, password?: string }} [config]
     */
    async testConnection(config = {}) {
      const { url, headers } = prepare(config, null);
      try {
        const response = await request(url, {
          method: 'PROPFIND',
          headers: {
            ...headers,
            Depth: '0',
          },
        });

        if (response.ok || response.status === 207 || response.status === 405) {
          return { ok: true, status: response.status };
        }
        return {
          ok: false,
          status: response.status,
          message: `O servidor retornou status HTTP ${response.status}.`,
        };
      } catch (error) {
        return {
          ok: false,
          message: /** @type {any} */ (error)?.message || 'Falha de conexão com o servidor WebDAV.',
        };
      }
    },

    /**
     * Lê só o marcador de versão (createdAt) do envelope remoto, sem decriptografar.
     * @param {{ serverUrl?: string, username?: string, password?: string, fileName?: string }} [config]
     * @returns {Promise<{ exists: false } | { exists: true, valid: false } | { exists: true, valid: true, createdAt: string }>}
     */
    async checkRemoteVersion(config = {}) {
      const { url, headers } = prepare(config, config.fileName);
      const response = await request(url, { method: 'GET', headers });
      if (response.status === 404) return { exists: false };
      if (!response.ok)
        throw new Error(`Falha ao consultar backup remoto (HTTP ${response.status}).`);
      const envelope = parseEnvelope(await response.text());
      return envelope
        ? { exists: true, valid: true, createdAt: envelope.createdAt }
        : { exists: true, valid: false };
    },

    /**
     * Criptografa e envia o estado local para o servidor remoto.
     * @param {Object} state
     * @param {{ serverUrl?: string, username?: string, password?: string, passphrase?: string, fileName?: string }} [config]
     */
    async uploadState(state, config = {}) {
      if (!config.passphrase) throw new TypeError('Chave de criptografia mestre obrigatória.');
      const { url, headers } = prepare(config, config.fileName);

      const envelope = await encryptPayload(JSON.stringify(state), config.passphrase);
      const envelopeString = JSON.stringify(envelope, null, 2);

      const response = await request(url, {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: envelopeString,
      });

      if (!response.ok && response.status !== 201 && response.status !== 204) {
        throw new Error(`Falha no upload para o servidor (HTTP ${response.status}).`);
      }

      return {
        ok: true,
        envelopeAt: envelope.createdAt,
        sizeBytes: envelopeString.length,
      };
    },

    /**
     * Baixa o arquivo do servidor remoto e decriptografa com a chave informada.
     * @param {{ serverUrl?: string, username?: string, password?: string, passphrase?: string, fileName?: string }} [config]
     */
    async downloadState(config = {}) {
      if (!config.passphrase) throw new TypeError('Chave de criptografia mestre obrigatória.');
      const { url, headers } = prepare(config, config.fileName);

      const response = await request(url, { method: 'GET', headers });

      if (response.status === 404) {
        return {
          ok: false,
          notFound: true,
          message: 'Nenhum backup encontrado no endereço remoto especificado.',
        };
      }

      if (!response.ok) {
        throw new Error(`Falha ao baixar backup remoto (HTTP ${response.status}).`);
      }

      const envelope = parseEnvelope(await response.text());
      if (!envelope) throw new Error('O arquivo remoto não é um backup reconhecido.');
      const state = JSON.parse(await decryptPayload(envelope, config.passphrase));

      return {
        ok: true,
        state,
        envelopeAt: envelope.createdAt,
      };
    },
  });
}
