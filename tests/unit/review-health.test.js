import test from 'node:test';
import assert from 'node:assert/strict';
import {calculateReviewHealth} from '../../src/domain/analytics/review-health.js';

test('não inventa saúde da revisão sem evidências',()=>{
  const result=calculateReviewHealth();
  assert.equal(result.value,null);assert.equal(result.state,'empty');assert.equal(result.level,'unknown');
  assert.equal(result.algorithmVersion,1);assert.deepEqual(result.factors,{});
});

test('classifica revisão saudável com contrato explicável',()=>{
  const result=calculateReviewHealth({daysSinceReview:2,retention:82,mastery:78,recentPerformance:80,examImpact:90,evidenceStrength:.8});
  assert.equal(result.state,'estimated');assert.equal(result.level,'healthy');assert.ok(result.value>=70);
  assert.equal(result.evidence.evidenceLabel,'Alta');assert.ok(result.factors.examResilience>=0);assert.ok(result.reasons.length);
});

test('marca como crítica a combinação de esquecimento e desempenho baixo',()=>{
  const result=calculateReviewHealth({daysSinceReview:25,retention:35,mastery:40,recentPerformance:42,examImpact:100,evidenceStrength:.9});
  assert.equal(result.level,'critical');assert.ok(result.value<45);
  assert.ok(result.reasons.includes('muito tempo desde a última revisão'));
  assert.ok(result.reasons.includes('fragilidade relevante para a prova'));
});

test('penaliza tópico estudado que nunca recebeu revisão',()=>{
  const result=calculateReviewHealth({hasPriorStudy:true,retention:75,mastery:70,recentPerformance:72,examImpact:80,evidenceStrength:.7});
  assert.equal(result.factors.recency,0);assert.ok(result.reasons.includes('nenhuma revisão registrada'));
  assert.ok(result.value<70);
});
