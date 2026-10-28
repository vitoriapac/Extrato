import test from 'node:test';
import assert from 'node:assert/strict';
import { computeTopicMetadata } from '../../src/domain/help/topic-metadata.js';

test('computeTopicMetadata — calcula tempo mínimo de 1 minuto para tópicos curtos', () => {
  const meta = computeTopicMetadata({
    id: 'first-steps',
    paragraphs: ['Pouco texto explicativo.'],
  });
  assert.equal(meta.readingTimeMinutes, 1);
  assert.equal(meta.readingTimeLabel, '1 min de leitura');
  assert.equal(meta.level, 'Iniciante');
});

test('computeTopicMetadata — atribui nível Avançado para tópicos de evidência, projeções e adaptativo', () => {
  const meta = computeTopicMetadata({
    id: 'evidence-guide',
    paragraphs: ['Texto sobre confiabilidade estatística e amostragem.'],
  });
  assert.equal(meta.level, 'Avançado');
  assert.match(meta.levelBadgeClass, /text-text/);
});

test('computeTopicMetadata — atribui nível Estratégico para conceitos e prontidão', () => {
  const meta = computeTopicMetadata({
    id: 'readiness',
    kind: 'concept',
    paragraphs: ['Explicação sobre a métrica de prontidão.'],
  });
  assert.equal(meta.level, 'Estratégico');
  assert.match(meta.levelBadgeClass, /text-text/);
});

test('computeTopicMetadata — calcula tempo proporcional ao volume de palavras e visual', () => {
  const longParagraph = Array(250).fill('palavra').join(' ');
  const meta = computeTopicMetadata({
    id: 'test-topic',
    paragraphs: [longParagraph],
    visual: { type: 'flow' },
  });
  assert.ok(meta.readingTimeMinutes >= 2, `Esperado >= 2 min, obtido ${meta.readingTimeMinutes}`);
});
