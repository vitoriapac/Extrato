import test from 'node:test';
import assert from 'node:assert/strict';
import { renderCollectionFooter, renderGroupHeader } from '../../src/ui/list-components.js';

test('rodapé de bloco é omitido quando a coleção cabe no limite inicial', () => {
  const html = renderCollectionFooter({
    total: 4,
    label: 'revisões',
    variant: 'block',
  });
  assert.equal(html, '');
});

test('cabeçalho recolhível expõe estado acessível e contagem', () => {
  const html = renderGroupHeader({
    title: 'Concluídas',
    count: 27,
    tone: 'completed',
    expanded: false,
    toggleAction: 'toggle()',
    colspan: 8,
  });
  assert.match(html, /aria-expanded="false"/);
  assert.match(html, /Concluídas/);
  assert.match(html, />27</);
});

const footer = (page, total = 63, extra = {}) =>
  renderCollectionFooter({
    total,
    page,
    pageSize: 10,
    pageAction: n => `go(${n})`,
    label: 'sessões',
    colspan: 4,
    ...extra,
  });
// Rótulos dos botões na ordem: setas nas pontas, números no meio.
const labels = html =>
  [...html.matchAll(/<button[^>]*>([^<]*)<\/button>|list-page-gap[^>]*>(…)</g)].map(
    m => m[1] || m[2]
  );

test('rodapé em páginas mostra contagem, setas, números e a página atual', () => {
  const html = footer(2);
  assert.match(html, /<nav class="list-pagination" aria-label="Paginação de sessões">/);
  assert.match(html, /Exibindo 11–20 de 63 sessões/);
  assert.match(html, /Página 2 de 7/);
  assert.match(html, /aria-label="Página 2" aria-current="page"/);
  assert.match(
    html,
    /aria-label="Página anterior" data-page-dir="prev" data-delegated-click="go\(1\)"/
  );
  assert.match(
    html,
    /aria-label="Próxima página" data-page-dir="next" data-delegated-click="go\(3\)"/
  );
  assert.match(html, /data-delegated-click="go\(5\)"/);
  assert.deepEqual(labels(html), ['‹', '1', '2', '3', '4', '5', '6', '7', '›']);
  assert.match(html, /<tr class="list-view-footer"><td colspan="4">/);
});

test('rodapé em páginas desabilita as setas das pontas sem ação', () => {
  const first = footer(1, 25);
  assert.match(first, /data-page-dir="prev" aria-disabled="true">‹/);
  assert.doesNotMatch(first, /go\(0\)/);
  const last = footer(3, 25, { variant: 'block' });
  assert.match(last, /Exibindo 21–25 de 25 sessões/);
  assert.match(last, /data-page-dir="next" aria-disabled="true">›/);
  assert.doesNotMatch(last, /go\(4\)/);
  assert.match(last, /list-summary-footer/);
});

test('rodapé em páginas usa reticências acima de 7 páginas', () => {
  assert.deepEqual(labels(footer(1, 80)), ['‹', '1', '2', '…', '8', '›']);
  assert.deepEqual(labels(footer(3, 80)), ['‹', '1', '2', '3', '4', '…', '8', '›']);
  assert.deepEqual(labels(footer(4, 80)), ['‹', '1', '2', '3', '4', '5', '…', '8', '›']);
  assert.deepEqual(labels(footer(8, 80)), ['‹', '1', '…', '7', '8', '›']);
  assert.deepEqual(labels(footer(5, 200)), ['‹', '1', '…', '4', '5', '6', '…', '20', '›']);
});

test('no celular só a primeira, a atual e a última ficam quando há mais de 5 páginas', () => {
  const html = footer(3, 80);
  assert.equal((html.match(/data-hide-sm/g) || []).length, 2);
  assert.doesNotMatch(footer(3, 40), /data-hide-sm/);
});

test('rodapé em páginas some com uma página só ou sem itens', () => {
  assert.equal(renderCollectionFooter({ total: 10, pageSize: 10 }), '');
  assert.equal(renderCollectionFooter({ total: 0, pageSize: 10 }), '');
});
