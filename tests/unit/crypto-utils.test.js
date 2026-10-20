import test from 'node:test';
import assert from 'node:assert/strict';
import {
  deriveKey,
  encryptPayload,
  decryptPayload,
  bytesToBase64,
  PBKDF2_ITERATIONS
} from '../../src/core/crypto-utils.js';

test('crypto-utils: criptografa e decriptografa payload com sucesso usando Web Crypto API', async () => {
  const secretData = JSON.stringify({ message: 'Backup secreto StudyTrack', score: 95.5 });
  const passphrase = 'minha-chave-mestra-super-segura-123';

  const envelope = await encryptPayload(secretData, passphrase);

  assert.equal(envelope.version, 1);
  assert.equal(envelope.algorithm, 'AES-GCM-256');
  assert.equal(envelope.iterations, 600000);
  assert.equal(PBKDF2_ITERATIONS, 600000);
  assert.ok(envelope.salt);
  assert.ok(envelope.iv);
  assert.ok(envelope.ciphertext);
  assert.notEqual(envelope.ciphertext, secretData);

  const decrypted = await decryptPayload(envelope, passphrase);
  assert.equal(decrypted, secretData);
  assert.deepEqual(JSON.parse(decrypted), { message: 'Backup secreto StudyTrack', score: 95.5 });
});

test('crypto-utils: rejeita decriptografia com senha incorreta', async () => {
  const secretData = 'Dados confidenciais de estudo';
  const passphrase = 'senha-correta';
  const wrongPassphrase = 'senha-incorreta';

  const envelope = await encryptPayload(secretData, passphrase);

  await assert.rejects(
    async () => decryptPayload(envelope, wrongPassphrase),
    /Não foi possível decriptografar/
  );
});

test('crypto-utils: rejeita decriptografia se o ciphertext tiver sido adulterado', async () => {
  const secretData = 'Dados autênticos';
  const passphrase = 'senha';

  const envelope = await encryptPayload(secretData, passphrase);
  // Modifica o último caractere do ciphertext
  const tamperedCiphertext = envelope.ciphertext.slice(0, -2) + 'AA';
  const tamperedEnvelope = { ...envelope, ciphertext: tamperedCiphertext };

  await assert.rejects(
    async () => decryptPayload(tamperedEnvelope, passphrase),
    /Não foi possível decriptografar/
  );
});

test('crypto-utils: validação de entradas inválidas', async () => {
  await assert.rejects(async () => encryptPayload(123, 'senha'), /deve ser uma string/);
  await assert.rejects(async () => encryptPayload('texto', ''), /inválida/);
  await assert.rejects(async () => decryptPayload({}, 'senha'), /Envelope criptográfico inválido/);
});

test('crypto-utils: envelope antigo com 100 mil iterações continua decriptografando', async () => {
  const salt = globalThis.crypto.getRandomValues(new Uint8Array(16));
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey('chave-antiga', salt, { iterations: 100000 });
  const ciphertext = new Uint8Array(await globalThis.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode('backup v1')));
  const legacy = { version: 1, algorithm: 'AES-GCM-256', kdf: 'PBKDF2-SHA256', iterations: 100000, salt: bytesToBase64(salt), iv: bytesToBase64(iv), ciphertext: bytesToBase64(ciphertext) };

  assert.equal(await decryptPayload(legacy, 'chave-antiga'), 'backup v1');
  const { iterations, ...withoutIterations } = legacy;
  assert.equal(await decryptPayload(withoutIterations, 'chave-antiga'), 'backup v1', 'sem campo usa o padrão v1');
});

test('crypto-utils: iterações fora de [100 mil, 2 milhões] são recusadas antes de derivar a chave', async () => {
  const envelope = await encryptPayload('dados', 'senha');
  // 1e10 travaria a aba por horas se a derivação rodasse: recusar rápido prova que ela não roda.
  for (const iterations of [10, 99999, 2000001, 1e10, 600000.5, '600000', null]) {
    const started = Date.now();
    await assert.rejects(
      async () => decryptPayload({ ...envelope, iterations }, 'senha'),
      /parâmetros de criptografia fora do permitido/,
      String(iterations)
    );
    assert.ok(Date.now() - started < 500, `${iterations} demorou demais`);
  }
});
