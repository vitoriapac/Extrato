import test from 'node:test';
import assert from 'node:assert/strict';
import { renderCollectionFooter, renderGroupHeader } from '../../src/ui/list-components.js';

test('rodapé informa quantidade e oferece expansão quando há mais itens', () => {
  const html = renderCollectionFooter({
    total: 18,
    visible: 5,
    showMoreAction: 'more()',
    showLessAction: '',
    colspan: 8,
    label: 'revisões',
  });
  assert.match(html, /Exibindo 5 de 18 revisões/);
  assert.match(html, /data-delegated-click="more\(\)"/);
  assert.doesNotMatch(html, /Mostrar menos/);
});

test('rodapé oferece recolhimento após expandir', () => {
  const html = renderCollectionFooter({
    total: 18,
    visible: 18,
    showMoreAction: 'more()',
    showLessAction: 'less()',
    colspan: 8,
    label: 'revisões',
  });
  assert.doesNotMatch(html, /Mostrar mais/);
  assert.match(html, /Mostrar menos/);
});

test('rodapé de bloco oferece expansão total e passo restante', () => {
  const html = renderCollectionFooter({
    total: 23,
    visible: 8,
    step: 8,
    showMoreAction: 'more()',
    showAllAction: 'all()',
    showLessAction: 'less()',
    label: 'tópicos',
    variant: 'block',
  });
  assert.match(html, /list-summary-footer/);
  assert.match(html, /Mostrar mais · \+15/);
  assert.doesNotMatch(html, /Ver todos/);
  assert.match(html, /Exibindo 8 de 23 tópicos/);
});

test('rodapé de bloco é omitido quando a coleção cabe no limite inicial', () => {
  const html = renderCollectionFooter({
    total: 4,
    visible: 4,
    step: 5,
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

test('rodapé em páginas mostra intervalo, página e navegação', () => {
  const html = renderCollectionFooter({
    mode: 'pages',
    total: 63,
    visible: 10,
    page: 2,
    pageSize: 10,
    prevAction: 'prev()',
    nextAction: 'next()',
    label: 'sessões',
    colspan: 4,
  });
  assert.match(
    html,
    /<nav class="list-view-controls list-pagination" aria-label="Paginação de sessões">/
  );
  assert.match(html, /Exibindo 11–20 de 63 sessões/);
  assert.match(html, /Página 2 de 7/);
  assert.match(html, /data-delegated-click="prev\(\)"/);
  assert.match(html, /data-delegated-click="next\(\)"/);
  assert.doesNotMatch(html, /aria-disabled/);
  assert.match(html, /<tr class="list-view-footer"><td colspan="4">/);
});

test('rodapé em páginas desabilita as pontas sem ação', () => {
  const base = {
    mode: /** @type {const} */ ('pages'),
    total: 25,
    pageSize: 10,
    prevAction: 'p()',
    nextAction: 'n()',
    visible: 10,
  };
  const first = renderCollectionFooter({ ...base, page: 1 });
  assert.match(first, /aria-disabled="true">‹ Anterior/);
  assert.doesNotMatch(first, /data-delegated-click="p\(\)"/);
  const last = renderCollectionFooter({ ...base, page: 3, variant: 'block' });
  assert.match(last, /Exibindo 21–25 de 25 itens/);
  assert.match(last, /aria-disabled="true">Próxima ›/);
  assert.match(last, /list-summary-footer/);
});

test('rodapé em páginas some com uma página só ou sem itens', () => {
  assert.equal(renderCollectionFooter({ mode: 'pages', total: 10, visible: 10, pageSize: 10 }), '');
  assert.equal(renderCollectionFooter({ mode: 'pages', total: 0, visible: 0, pageSize: 10 }), '');
});
