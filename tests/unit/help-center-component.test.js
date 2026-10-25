import test from 'node:test';
import assert from 'node:assert/strict';
import { h } from 'preact';
import { render } from 'preact-render-to-string';
import {
  HelpCenter,
  HelpTopicCard,
  HelpGroupSection,
  HelpReferenceSection,
} from '../../src/ui/help/help-center.js';

test('HelpCenter Preact Component — renderiza Hero, Busca e Categorias', () => {
  const html = render(h(HelpCenter, {}));
  assert.ok(html.includes('Instruções · Central de Ajuda'));
  assert.ok(html.includes('id="helpSearch"'));
  assert.ok(html.includes('data-help-category="guide-start"'));
  assert.ok(html.includes('id="guide-glossary"'));
  assert.ok(html.includes('id="guide-faq"'));
});

test('HelpTopicCard Preact Component — renderiza card com atributos semânticos', () => {
  const sampleEntry = {
    id: 'test-topic',
    title: 'Tópico de Teste',
    summary: 'Resumo do tópico',
    kind: 'feature',
    keywords: ['teste', 'estudo'],
    paragraphs: ['Primeiro parágrafo'],
    steps: [{ title: 'Passo 1', detail: 'Detalhe do passo 1' }],
    action: { target: 'today', label: 'Ver Hoje' },
  };

  const html = render(h(HelpTopicCard, { entry: sampleEntry }));
  assert.ok(html.includes('id="test-topic"'));
  assert.ok(html.includes('Tópico de Teste'));
  assert.ok(html.includes('Resumo do tópico'));
  assert.ok(html.includes('Passo 1'));
  assert.ok(html.includes('Detalhe do passo 1'));
  assert.ok(html.includes('data-help-action="today"'));
});
