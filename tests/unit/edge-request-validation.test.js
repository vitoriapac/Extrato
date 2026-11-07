import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCorsHeaders, parseAllowedOrigins } from '../../supabase/functions/_shared/cors.ts';
import { parseCustomer, parsePushBody } from '../../supabase/functions/_shared/request-validation.ts';

const NOW = new Date('2026-11-07T12:00:00.000Z');

test('CORS: só ecoa origem da lista, sempre com Vary', () => {
  const allowed = parseAllowedOrigins(' https://a.com/ , https://b.com ,');
  assert.deepEqual(allowed, ['https://a.com', 'https://b.com']);
  const ok = buildCorsHeaders('https://a.com', allowed, 'POST', 'content-type');
  assert.equal(ok['Access-Control-Allow-Origin'], 'https://a.com');
  assert.equal(ok.Vary, 'Origin');
  for (const origin of ['https://evil.com', null]) {
    const h = buildCorsHeaders(origin, allowed, 'POST', 'content-type');
    assert.equal('Access-Control-Allow-Origin' in h, false);
    assert.equal(h.Vary, 'Origin');
  }
  assert.equal('Access-Control-Allow-Origin' in buildCorsHeaders('https://a.com', parseAllowedOrigins(undefined), 'POST', 'x'), false);
});

test('push: caso feliz e defaults', () => {
  const r = parsePushBody({ stateJson: { schemaVersion: 3, a: [1] } }, NOW);
  assert.equal(r.schemaVersion, 3);
  assert.equal(r.clientUpdatedAt, NOW.toISOString());
  const r2 = parsePushBody({ stateJson: { a: 1 }, schemaVersion: 2, clientUpdatedAt: '2026-11-07T10:00:00Z' }, NOW);
  assert.equal(r2.clientUpdatedAt, '2026-11-07T10:00:00.000Z');
  assert.equal(parsePushBody({ stateJson: {} }, NOW).schemaVersion, 1);
});

test('push: rejeita forma inválida', () => {
  const bad = [
    null, {}, { stateJson: 'x' }, { stateJson: [] },
    { stateJson: {}, schemaVersion: 0 }, { stateJson: {}, schemaVersion: 1001 },
    { stateJson: {}, schemaVersion: 1.5 }, { stateJson: {}, schemaVersion: '2' },
    { stateJson: {}, clientUpdatedAt: 'ontem' }, { stateJson: {}, clientUpdatedAt: 123 },
    { stateJson: {}, clientUpdatedAt: '2026-13-45T00:00:00Z' },
    JSON.parse('{"stateJson":{"__proto__":{"x":1}}}'),
    JSON.parse('{"stateJson":{"a":[{"constructor":1}]}}'),
  ];
  for (const b of bad) assert.ok('error' in parsePushBody(b, NOW), JSON.stringify(b));
  let deep = {};
  for (let i = 0; i < 100; i++) deep = { d: deep };
  assert.ok('error' in parsePushBody({ stateJson: deep }, NOW));
});

test('customer: normaliza válidos e rejeita inválidos', () => {
  assert.deepEqual(parseCustomer(undefined), {});
  assert.deepEqual(
    parseCustomer({ email: 'a@b.co', name: ' Ana ', taxId: '123.456.789-09', cellphone: '(11) 99999-8888' }),
    { email: 'a@b.co', name: 'Ana', taxId: '12345678909', cellphone: '11999998888' }
  );
  for (const c of [
    'x', { email: 'sem-arroba' }, { name: 'a'.repeat(121) }, { taxId: '123' },
    { taxId: 'abc45678909' }, { cellphone: '12ab' }, { email: 5 },
  ]) assert.ok('error' in parseCustomer(c), JSON.stringify(c));
});
