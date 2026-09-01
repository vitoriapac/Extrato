import test from 'node:test';import assert from 'node:assert/strict';
import {calculateRiskScore} from '../../src/domain/diagnostics/risk-score.js';

test('calcula risco e expõe contribuições auditáveis',()=>{
  const result=calculateRiskScore({masteryRisk:80,retentionRisk:60,trendRisk:40,recencyRisk:20,examImpact:100,examProximity:50});
  assert.equal(result.value,62);assert.equal(result.level,'medium');assert.equal(result.confidence,1);assert.ok(result.contributions.examImpact>0);
});

test('redistribui pesos quando um fator está ausente',()=>{
  const result=calculateRiskScore({masteryRisk:80,retentionRisk:60,trendRisk:null,recencyRisk:20,examImpact:null,examProximity:50});
  assert.equal(result.missingFactors.length,2);assert.equal(result.confidence,.7);assert.notEqual(result.value,null);
});

test('não transforma ausência total em risco zero',()=>{
  const result=calculateRiskScore({});assert.equal(result.value,null);assert.equal(result.level,'insufficient');
});
