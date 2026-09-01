import test from 'node:test';
import assert from 'node:assert/strict';
import {calculateSubjectRadar,interpretRadar} from '../../src/domain/analytics/multidimensional-radar.js';

test('normaliza os cinco eixos do radar entre zero e cem',()=>{
  const result=calculateSubjectRadar({coverage:120,mastery:70,retention:40,daysSinceContact:4,activeDays:8});
  assert.deepEqual(result.axes,{coverage:100,mastery:70,retention:40,frequency:80,consistency:50});
  assert.equal(result.availableAxes,5);
  assert.equal(result.confidenceLabel,'Alta');
});

test('preserva eixo indisponível como nulo',()=>{
  const result=calculateSubjectRadar({coverage:50});
  assert.equal(result.axes.mastery,null);
  assert.equal(result.availableAxes,1);
  assert.match(result.interpretation,/Aguardando mais dados/);
});

test('interpreta cobertura alta com retenção baixa',()=>{
  assert.match(interpretRadar({coverage:80,mastery:70,retention:40,frequency:80,consistency:70}),/reforce as revisões/);
});
