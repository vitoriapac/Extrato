import test from 'node:test';import assert from 'node:assert/strict';
import {generateDiagnosis} from '../../src/application/generate-diagnosis.js';

test('separa gargalo de oportunidade e ignora arquivados',()=>{
  const result=generateDiagnosis([
    {id:'a',subjectName:'Português',mastery:30,retention:80,coverage:70,frequency:90,trendRisk:10,examImpact:90,improvementPotential:70,effortEfficiency:80},
    {id:'b',subjectName:'Matemática',archived:true,mastery:0,examImpact:100,improvementPotential:100,effortEfficiency:100}
  ]);
  assert.equal(result.bottlenecks[0].id,'a');assert.equal(result.bottlenecks[0].factor,'Domínio');assert.equal(result.opportunities[0].id,'a');
});

test('distribui o foco semanal proporcionalmente às oportunidades',()=>{
  const result=generateDiagnosis([{id:'a',subjectName:'A',examImpact:100,improvementPotential:100,effortEfficiency:100},{id:'b',subjectName:'B',examImpact:50,improvementPotential:50,effortEfficiency:50}]);
  assert.equal(result.weeklyFocus[0].subjectName,'A');assert.ok(result.weeklyFocus[0].percentage>result.weeklyFocus[1].percentage);
});
