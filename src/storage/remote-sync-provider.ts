/**
 * @fileoverview Provedor de sincronização remota via WebDAV com criptografia de ponta-a-ponta (E2EE).
 * Os dados são sempre criptografados localmente com AES-GCM 256 bits antes de qualquer envio ao servidor.
 */

import {
  encryptPayload,
  decryptPayload,
  bytesToBase64,
  type EncryptedEnvelope,
} from '../core/crypto-utils.ts';

const DEFAULT_FILE_NAME = 'studytrack-backup-encrypted.json';
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

function basicAuthHeader(username: string, password: string): string {
  // btoa só aceita Latin-1; os bytes UTF-8 permitem senhas com qualquer caractere.
  return `Basic ${bytesToBase64(new TextEncoder().encode(`${username}:${password}`))}`;
}

/**
 * Envelope gerado por encryptPayload. v1: createdAt só fora da parte cifrada (adulterável pelo servidor).
 * v2: o texto cifrado é {createdAt, state} e o createdAt externo deve coincidir com o interno (dica de versão).
 */
function parseEnvelope(text: string): EncryptedEnvelope | null {
  try {
    const envelope = JSON.parse(text);
    return envelope &&
      envelope.algorithm === 'AES-GCM-256' &&
      envelope.ciphertext &&
      typeof envelope.createdAt === 'string'
      ? (envelope as EncryptedEnvelope)
      : null;
  } catch {
    return null;
  }
}

export interface RemoteSyncConfig {
  serverUrl?: string;
  username?: string;
  password?: string;
  passphrase?: string;
  fileName?: string;
  /** envelopeAt da última sincronização deste navegador; base para recusar versão mais antiga. */
  lastEnvelopeAt?: string | null;
  /** Confirmação explícita do usuário para aceitar uma versão mais antiga que lastEnvelopeAt. */
  allowOlder?: boolean;
}

export type RemoteVersionCheckResult =
  | { exists: false }
  | { exists: true; valid: false }
  | { exists: true; valid: true; createdAt: string };

export function createRemoteSyncProvider({
  fetch = globalThis.fetch,
  origin = globalThis.location?.origin || '',
}: {
  fetch?: typeof globalThis.fetch;
  origin?: string;
} = {}) {
  const normalizeUrl = (url: string): string => {
    let clean = String(url || '').trim();
    if (!clean.endsWith('/')) clean += '/';
    return clean;
  };

  /**
   * Valida a URL antes de qualquer requisição e monta os cabeçalhos.
   */
  const prepare = (
    { serverUrl = '', username = '', password = '' }: RemoteSyncConfig = {},
    fileName: string | null = DEFAULT_FILE_NAME
  ): { url: string; headers: Record<string, string> } => {
    if (!serverUrl) throw new TypeError('URL do servidor WebDAV não informada.');
    const folderUrl = normalizeUrl(serverUrl);
    let parsed: URL;
    try {
      parsed = new URL(folderUrl);
    } catch {
      throw new TypeError('URL do servidor WebDAV inválida.');
    }
    const headers: Record<string, string> = {};
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
  const request = async (url: string, options: RequestInit): Promise<Response> => {
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
    async testConnection(config: RemoteSyncConfig = {}) {
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
      } catch (error: any) {
        return {
          ok: false,
          message: error?.message || 'Falha de conexão com o servidor WebDAV.',
        };
      }
    },

    async checkRemoteVersion(config: RemoteSyncConfig = {}): Promise<RemoteVersionCheckResult> {
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

    async uploadState(state: unknown, config: RemoteSyncConfig = {}) {
      if (!config.passphrase) throw new TypeError('Chave de criptografia mestre obrigatória.');
      const { url, headers } = prepare(config, config.fileName);

      const createdAt = new Date().toISOString();
      const envelope = await encryptPayload(
        JSON.stringify({ createdAt, state }),
        config.passphrase
      );
      envelope.version = 2;
      envelope.createdAt = createdAt;
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

    async downloadState(config: RemoteSyncConfig = {}) {
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
      const plain = JSON.parse(await decryptPayload(envelope, config.passphrase));
      let state = plain;
      let envelopeAt = envelope.createdAt;
      if (envelope.version === 2) {
        if (!plain || typeof plain.createdAt !== 'string' || plain.createdAt !== envelope.createdAt)
          throw new Error('O backup remoto foi adulterado ou está inconsistente.');
        state = plain.state;
        envelopeAt = plain.createdAt;
      }

      // ISO-8601 em UTC ordena lexicograficamente; só compara quando o marcador local é confiável.
      if (!config.allowOlder && config.lastEnvelopeAt && envelopeAt < config.lastEnvelopeAt) {
        return {
          ok: false,
          rollback: true,
          envelopeAt,
          message: 'O backup remoto é mais antigo que a última sincronização deste navegador.',
        };
      }

      return {
        ok: true,
        state,
        envelopeAt,
      };
    },
  });
}
