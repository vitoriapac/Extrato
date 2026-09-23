import test from 'node:test';
import assert from 'node:assert/strict';
import {calculateTopicMastery,classifyTopicMastery,MASTERY_ALGORITHM_VERSION} from '../../src/domain/analytics/topic-metrics.js';

const questions=(resolved,accuracy)=>({resolved,accuracy});
const sessions=count=>Array.from({length:count},()=>({durationSeconds:1800}));

test('tempo de estudo isolado não inventa domínio nem confiança',()=>{
  const result=calculateTopicMastery({recentSessions:sessions(1)});
  assert.equal(result.value,null);assert.equal(result.confidence,0);
  assert.equal(result.state,'empty');assert.ok(result.reasons.some(reason=>reason.includes('não medida de domínio')));
});

test('uma questão produz estimativa de baixa confiança; amostra robusta aumenta confiança',()=>{
  const sparse=calculateTopicMastery({performance:questions(1,100)});
  const robust=calculateTopicMastery({performance:questions(80,90),trend:{key:'stable'},reviews:Array(4).fill({status:'Concluído'}),recentSessions:sessions(4)});
  assert.equal(sparse.state,'insufficient');assert.ok(sparse.value<robust.value);
  assert.equal(sparse.evidence.sampleSize,1);assert.equal(sparse.confidenceLabel,'Baixa');
  assert.equal(robust.state,'estimated');assert.equal(robust.confidenceLabel,'Alta');
  assert.ok(robust.reasons.some(reason=>reason.includes('questões')));
  assert.equal(robust.algorithmVersion,MASTERY_ALGORITHM_VERSION);
});

test('desempenho recente em queda reduz a estimativa sem alterar a amostra',()=>{
  const base={performance:questions(80,70),reviews:Array(4).fill({status:'Concluído'})};
  const rising=calculateTopicMastery({...base,trend:{key:'up',delta:10}});
  const falling=calculateTopicMastery({...base,trend:{key:'down',delta:-10}});
  assert.ok(rising.value>falling.value);assert.equal(rising.evidence.sampleSize,falling.evidence.sampleSize);
});

test('faixas de domínio são configuráveis e ausência permanece sem dados',()=>{
  assert.equal(classifyTopicMastery(null),'Sem dados');
  assert.equal(classifyTopicMastery(91),'Dominado');
  assert.equal(classifyTopicMastery(91,[{min:95,label:'Ótimo'},{min:0,label:'Em estudo'}]),'Em estudo');
});
