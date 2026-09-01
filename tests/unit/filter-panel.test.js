import test from 'node:test';
import assert from 'node:assert/strict';
import {countActiveFilters,filterPanelLabel} from '../../src/ui/filter-panel.js';

test('conta apenas filtros diferentes do estado inicial',()=>{
  assert.equal(countActiveFilters({period:'30',subjectId:'abc',type:''},{period:'30',subjectId:'',type:''}),1);
  assert.equal(filterPanelLabel(1),'Filtros (1 ativo)');
  assert.equal(filterPanelLabel(2),'Filtros (2 ativos)');
});
