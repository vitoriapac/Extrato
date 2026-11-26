import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  buildReminderDigest,
  countDue,
  reminderText,
} from '../../src/domain/reviews/review-reminder.js';

test('resumo do lembrete guarda só datas e conta o que venceu no dia', () => {
  const digest = buildReminderDigest({
    reviews: [
      { id: 'a', topicId: 't', date: '2026-11-20', status: 'Pendente' },
      { id: 'b', topicId: 't', date: '2026-11-28', status: 'Pendente' },
      { id: 'c', topicId: 't', date: '2026-11-01', status: 'Concluído' },
    ],
    flashcards: [
      { id: 'f1', status: 'pending' },
      { id: 'f2', status: 'reviewing', nextReviewDate: '2026-11-27' },
    ],
  });
  assert.deepEqual(Object.keys(digest).sort(), ['flashcardDates', 'reviewDates']);
  assert.ok(!JSON.stringify(digest).includes('"t"'), 'sem ids nem nomes de tópico');
  assert.deepEqual(countDue(digest, '2026-11-26'), { reviews: 1, flashcards: 1 });
  assert.deepEqual(countDue(digest, '2026-11-28'), { reviews: 2, flashcards: 2 });
});

test('texto do lembrete some quando não há nada e concorda número', () => {
  assert.equal(reminderText({ reviews: 0, flashcards: 0 }), null);
  assert.equal(
    reminderText({ reviews: 1, flashcards: 3 }),
    '1 revisão de tópico e 3 flashcards para hoje. Abra a Revisão de hoje no Extrato.'
  );
});

test('o service worker espelha a contagem e o texto do domínio', () => {
  const sw = readFileSync(new URL('../../service-worker.template.js', import.meta.url), 'utf8');
  assert.match(sw, /periodicsync/);
  assert.match(sw, /'extrato-review-reminder'/);
  assert.match(sw, /Abra a Revisão de hoje no Extrato\./);
});

test('service worker: periodicsync notifica o que venceu, uma vez por dia, e nada sem resumo', async () => {
  const { runInNewContext } = await import('node:vm');
  const store = new Map();
  const listeners = {};
  const shown = [];
  const cache = {
    match: async key => (store.has(key) ? new Response(store.get(key)) : undefined),
    put: async (key, response) => store.set(key, await response.text()),
  };
  const self = {
    addEventListener: (type, fn) => (listeners[type] = fn),
    registration: {
      scope: 'https://exemplo.test/',
      showNotification: async (title, options) => shown.push({ title, ...options }),
    },
    location: { href: 'https://exemplo.test/service-worker.js' },
    clients: {},
  };
  const source = readFileSync(new URL('../../service-worker.template.js', import.meta.url), 'utf8');
  runInNewContext(source, {
    self,
    caches: { open: async () => cache },
    URL,
    Response,
    Date,
    Promise,
    String,
  });
  const fire = async () => {
    let pending;
    listeners.periodicsync({ tag: 'extrato-review-reminder', waitUntil: p => (pending = p) });
    await pending;
  };
  await fire();
  assert.equal(shown.length, 0, 'sem resumo salvo, não notifica');
  const today = new Date();
  const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  store.set(
    'https://exemplo.test/__reminder-digest',
    JSON.stringify({ reviewDates: ['2000-01-01', '9999-12-31'], flashcardDates: ['0000-00-00'] })
  );
  await fire();
  await fire();
  assert.equal(shown.length, 1, 'uma notificação por dia');
  assert.equal(
    shown[0].body,
    '1 revisão de tópico e 1 flashcard para hoje. Abra a Revisão de hoje no Extrato.'
  );
  assert.equal(store.get('https://exemplo.test/__reminder-last'), iso);
});
