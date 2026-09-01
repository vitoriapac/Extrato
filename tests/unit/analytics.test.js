import test from 'node:test';
import assert from 'node:assert/strict';
import {createMetricEvidence,confidenceLabel} from '../../src/domain/analytics/evidence.js';
import {calculateWeightedScore,calculateWeightedConfidence,calculateReadinessScore} from '../../src/domain/analytics/readiness-score.js';
import {calculateTopicCoverage} from '../../src/domain/analytics/coverage.js';
import {calculateActivityStreak,calculateGoalConsistency} from '../../src/domain/analytics/consistency.js';
import {calculateWindowTrend} from '../../src/domain/analytics/trends.js';
import {summarizeStudyRecords} from '../../src/domain/analytics/study-metrics.js';

test('cria evidência normalizada e sem fontes duplicadas',()=>{
  assert.deepEqual(createMetricEvidence({sampleSize:12.8,periodStart:'2026-08-01',periodEnd:'2026-08-31',confidence:0.63,sources:['questions','questions','reviews']}),{
    sampleSize:12,periodStart:'2026-08-01',periodEnd:'2026-08-31',confidence:0.63,confidenceLabel:'Média',sources:['questions','reviews']
  });
  assert.equal(confidenceLabel(0.7),'Alta');
});

test('preserva a composição ponderada atual do índice e da confiança',()=>{
  const metrics={conhecimento:{score:80,confidence:.8},retencao:{score:60,confidence:.6},questoes:{score:70,confidence:.7},simulados:{score:90,confidence:.9},consistencia:{score:40,confidence:.4}};
  const weights={conhecimento:.35,retencao:.25,questoes:.20,simulados:.15,consistencia:.05};
  assert.equal(calculateWeightedScore(metrics,weights),73);
  assert.equal(calculateWeightedConfidence(metrics,weights),.725);
});

test('redistribui pesos quando um fator de prontidão está ausente',()=>{
  const metrics={coverage:{score:80,confidence:.8,available:true},mastery:{score:60,confidence:.6,available:true},retention:{score:70,confidence:.7,available:true},consistency:{score:50,confidence:.5,available:true},simulations:{score:0,confidence:0,available:false}};
  const result=calculateReadinessScore(metrics);
  assert.equal(result.value,67);
  assert.equal(result.state,'estimated');
  assert.deepEqual(result.missingFactors,['simulations']);
  assert.equal(result.factors.simulations,null);
});

test('reduz confiança e marca amostra com um único fator como insuficiente',()=>{
  const result=calculateReadinessScore({coverage:{score:90,confidence:.8,available:true}});
  assert.equal(result.value,90);
  assert.equal(result.state,'insufficient');
  assert.ok(result.confidence<.8);
});

test('não inventa índice quando todos os fatores estão ausentes',()=>{
  const result=calculateReadinessScore({});
  assert.equal(result.value,null);
  assert.equal(result.state,'empty');
  assert.equal(result.missingFactors.length,5);
});

test('calcula cobertura ignorando tópicos arquivados',()=>{
  assert.deepEqual(calculateTopicCoverage([{status:'Concluído'},{status:'Em andamento'},{status:'Concluído',archived:true}]),{value:50,completed:1,total:2,available:true});
  assert.equal(calculateTopicCoverage([]).available,false);
});

test('calcula sequência aceitando hoje ou ontem como ponto inicial',()=>{
  const addDays=(iso,delta)=>{const date=new Date(`${iso}T12:00:00Z`);date.setUTCDate(date.getUTCDate()+delta);return date.toISOString().slice(0,10)};
  assert.equal(calculateActivityStreak(new Set(['2026-08-31','2026-08-30']),{today:'2026-08-31',addDays}),2);
  assert.equal(calculateActivityStreak(new Set(['2026-08-30','2026-08-29']),{today:'2026-08-31',addDays}),2);
});

test('calcula consistência somente nos dias com meta',()=>{
  assert.deepEqual(calculateGoalConsistency([{targetSeconds:3600,studiedSeconds:3600},{targetSeconds:3600,studiedSeconds:1800},{targetSeconds:0,studiedSeconds:600}]),{value:50,achieved:1,applicable:2,studiedDays:3,available:true});
});

test('classifica tendência usando duas janelas equivalentes',()=>{
  const weeks=[{resolved:10,correct:5},{resolved:10,correct:5},{resolved:10,correct:5},{resolved:10,correct:8},{resolved:10,correct:8},{resolved:10,correct:8}];
  const result=calculateWindowTrend(weeks,30);
  assert.equal(result.key,'up');
  assert.equal(result.delta,30);
});

test('resume sessões e questões sem contar registros vinculados duas vezes',()=>{
  assert.deepEqual(summarizeStudyRecords({sessions:[{durationSeconds:1800,questionsResolved:10,correctAnswers:7}],questions:[{resolved:5,correct:4}],simulations:[{}]}),{seconds:1800,questions:15,correct:11,accuracy:73,simulations:1});
});
