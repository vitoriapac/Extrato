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

test('cabeçalho recolhível expõe estado acessível e contagem',()=>{
  const html=renderGroupHeader({title:'Concluídas',count:27,tone:'completed',expanded:false,toggleAction:'toggle()',colspan:8});
  assert.match(html,/aria-expanded="false"/);
  assert.match(html,/Concluídas/);
  assert.match(html,/>27</);
});
