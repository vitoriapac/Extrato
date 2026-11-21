import test from 'node:test';
import assert from 'node:assert/strict';
import { h } from 'preact';
import { render } from 'preact-render-to-string';
import { HelpTopicCard } from '../../src/ui/help/HelpTopicCard.js';

test('tópico no padrão (Iniciante, 1 min) não repete o selo de nível e tempo (T18)', () => {
  const html = render(h(HelpTopicCard, { entry: { id: 'primeiros-passos', title: 'Primeiros passos', summary: 'Comece.', paragraphs: ['Curto.'] } }));
  assert.doesNotMatch(html, /Iniciante|min de leitura/);
  assert.match(html, /data-help-copy-link="primeiros-passos"/);
  assert.match(html, /aria-label="Copiar atalho direto para Primeiros passos"/);
});

test('tópico avançado mostra nível e tempo de leitura', () => {
  const html = render(h(HelpTopicCard, { entry: { id: 'evidence-quality', title: 'Evidência', summary: 'x', paragraphs: ['palavra '.repeat(400)] } }));
  assert.match(html, /Avançado|Estratégico/);
  assert.match(html, /min de leitura/);
});
