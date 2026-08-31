import test from 'node:test';
import assert from 'node:assert/strict';
import { renderCollectionFooter, renderGroupHeader } from '../../src/ui/list-components.js';

test('rodapé informa quantidade e oferece expansão quando há mais itens',()=>{
  const html=renderCollectionFooter({total:18,visible:5,showMoreAction:"more()",showLessAction:'',colspan:8,label:'revisões'});
  assert.match(html,/Exibindo 5 de 18 revisões/);
  assert.match(html,/data-delegated-click="more\(\)"/);
  assert.doesNotMatch(html,/Mostrar menos/);
});

test('rodapé oferece recolhimento após expandir',()=>{
  const html=renderCollectionFooter({total:18,visible:10,showMoreAction:"more()",showLessAction:"less()",colspan:8,label:'revisões'});
  assert.match(html,/Mostrar mais/);
  assert.match(html,/Mostrar menos/);
});

test('rodapé de bloco oferece expansão total e passo restante',()=>{
  const html=renderCollectionFooter({total:23,visible:8,step:8,showMoreAction:'more()',showAllAction:'all()',showLessAction:'less()',label:'tópicos',variant:'block'});
  assert.match(html,/list-summary-footer/);
  assert.match(html,/Mostrar mais 8/);
  assert.match(html,/Ver todos/);
  assert.match(html,/Exibindo 8 de 23 tópicos/);
});

test('rodapé de bloco é omitido quando a coleção cabe no limite inicial',()=>{
  const html=renderCollectionFooter({total:4,visible:4,step:5,label:'revisões',variant:'block'});
  assert.equal(html,'');
});

test('cabeçalho recolhível expõe estado acessível e contagem',()=>{
  const html=renderGroupHeader({title:'Concluídas',count:27,tone:'completed',expanded:false,toggleAction:'toggle()',colspan:8});
  assert.match(html,/aria-expanded="false"/);
  assert.match(html,/Concluídas/);
  assert.match(html,/>27</);
});
