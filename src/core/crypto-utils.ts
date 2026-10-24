/**
 * @fileoverview Utilitários de criptografia ponta-a-ponta (E2EE) usando Web Crypto API padrão.
 * Implementa derivação de chave via PBKDF2 (SHA-256) e criptografia autenticada AES-GCM (256 bits).
 */

const cryptoSubtle = globalThis.crypto?.subtle;

/** Iterações PBKDF2-SHA256 para novos envelopes (recomendação OWASP). */
export const PBKDF2_ITERATIONS = 600000;
// Envelopes v1 foram gravados com 100 mil; o teto impede que um arquivo adulterado trave a aba.
const MIN_ITERATIONS = 100000;
const MAX_ITERATIONS = 2000000;

export interface EncryptedEnvelope {
  version: number;
  algorithm: string;
  kdf: string;
  iterations: number;
  salt: string;
  iv: string;
  ciphertext: string;
  createdAt: string;
}

export function bytesToBase64(bytes: Uint8Array): string {
  const nodeBuffer = (globalThis as Record<string, any>).Buffer;
  if (nodeBuffer) {
    return nodeBuffer.from(bytes).toString('base64');
  }
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return globalThis.btoa(binary);
}

function base64ToBytes(base64: string): Uint8Array<ArrayBuffer> {
  const nodeBuffer = (globalThis as Record<string, any>).Buffer;
  if (nodeBuffer) {
    return new Uint8Array(nodeBuffer.from(base64, 'base64'));
  }
  const binary = globalThis.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Deriva uma CryptoKey AES-GCM a partir de uma senha de texto e de um salt aleatório.
 */
export async function deriveKey(
  passphrase: string,
  salt: Uint8Array,
  { iterations = PBKDF2_ITERATIONS }: { iterations?: number } = {}
): Promise<CryptoKey> {
  if (!cryptoSubtle) {
    throw new Error('Web Crypto API não suportada neste ambiente.');
  }
  if (!passphrase || typeof passphrase !== 'string') {
    throw new TypeError('Senha ou chave de criptografia inválida.');
  }

  const enc = new TextEncoder();
  const keyMaterial = await cryptoSubtle.importKey('raw', enc.encode(passphrase), 'PBKDF2', false, [
    'deriveKey',
  ]);

  return cryptoSubtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Criptografa um texto ou JSON usando AES-GCM 256 bits e PBKDF2 com salt aleatório.
 */
export async function encryptPayload(
  plainText: string,
  passphrase: string
): Promise<EncryptedEnvelope> {
  if (!cryptoSubtle) {
    throw new Error('Web Crypto API não suportada neste ambiente.');
  }
  if (typeof plainText !== 'string') {
    throw new TypeError('O conteúdo a ser criptografado deve ser uma string.');
  }

  const salt = globalThis.crypto.getRandomValues(new Uint8Array(16));
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt);

  const encodedData = new TextEncoder().encode(plainText);
  const ciphertextBuffer = await cryptoSubtle.encrypt({ name: 'AES-GCM', iv }, key, encodedData);

  return {
    version: 1,
    algorithm: 'AES-GCM-256',
    kdf: 'PBKDF2-SHA256',
    iterations: PBKDF2_ITERATIONS,
    salt: bytesToBase64(salt),
    iv: bytesToBase64(iv),
    ciphertext: bytesToBase64(new Uint8Array(ciphertextBuffer)),
    createdAt: new Date().toISOString(),
  };
}

/**
 * Decriptografa um envelope criptografado previamente com encryptPayload.
 */
export async function decryptPayload(
  envelope: EncryptedEnvelope | Record<string, any> | string,
  passphrase: string
): Promise<string> {
  if (!cryptoSubtle) {
    throw new Error('Web Crypto API não suportada neste ambiente.');
  }
  const payload = typeof envelope === 'string' ? JSON.parse(envelope) : envelope;
  if (
    !payload ||
    payload.algorithm !== 'AES-GCM-256' ||
    !payload.salt ||
    !payload.iv ||
    !payload.ciphertext
  ) {
    throw new TypeError('Envelope criptográfico inválido ou não reconhecido.');
  }

  const iterations = payload.iterations === undefined ? MIN_ITERATIONS : payload.iterations;
  if (!Number.isInteger(iterations) || iterations < MIN_ITERATIONS || iterations > MAX_ITERATIONS) {
    throw new TypeError('Envelope com parâmetros de criptografia fora do permitido.');
  }

  const salt = base64ToBytes(payload.salt);
  const iv = base64ToBytes(payload.iv);
  const ciphertext = base64ToBytes(payload.ciphertext);

  const key = await deriveKey(passphrase, salt, { iterations });

  try {
    const decryptedBuffer = await cryptoSubtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
    return new TextDecoder().decode(decryptedBuffer);
  } catch {
    throw new Error(
      'Não foi possível decriptografar. Verifique a chave de criptografia ou integridade dos dados.'
    );
  }
}
