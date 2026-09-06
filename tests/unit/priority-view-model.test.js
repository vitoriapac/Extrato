import test from 'node:test';import assert from 'node:assert/strict';
import {buildPriorityViewModel} from '../../src/ui/view-models/priority-view-model.js';

test('ordena contribuições e expõe confiança sem recalcular a prioridade',()=>{
  const model=buildPriorityViewModel({score:82,contributions:{masteryGap:15,examImpact:24},factors:{masteryGap:60,examImpact:95},evidence:{completeness:.8,evidenceStrength:.6,evidenceLabel:'Média'},reasons:['impacto alto']},2);
  assert.equal(model.score,82);assert.equal(model.position,2);assert.equal(model.contributionRows[0].key,'examImpact');assert.equal(model.completeness,80);assert.equal(model.state,'high');
});

test('prioriza estado de bloqueio e preserva score ausente',()=>{
  const model=buildPriorityViewModel({score:null,blockedPrerequisites:['base'],evidence:{}},1);
  assert.equal(model.state,'blocked');assert.equal(model.score,null);
});

