import test from 'node:test';
import assert from 'node:assert/strict';
import {buildCognitiveProfile,cognitiveConfidence} from '../../src/domain/diagnostics/cognitive-profile.js';

const keys=['naoSabia','esqueci','interpretacao','calculo','desatencao','chute'];

test('mantém todas as categorias e limita a soma ao total de erros',()=>{
  const profile=buildCognitiveProfile([{date:'2026-08-01',resolved:10,correct:6,errorBreakdown:{naoSabia:3,esqueci:3}}],keys);
  assert.equal(profile.totalErrors,4);
  assert.equal(profile.categorizedErrors,4);
  assert.equal(profile.categories.naoSabia,3);
  assert.equal(profile.categories.esqueci,1);
  assert.equal(profile.categories.chute,0);
});

test('informa amostra, período, cobertura e confiança',()=>{
  const records=Array.from({length:20},(_,index)=>({date:`2026-08-${String(index+1).padStart(2,'0')}`,resolved:2,correct:1,errorBreakdown:{desatencao:1}}));
  const profile=buildCognitiveProfile(records,keys);
  assert.equal(profile.sampleSize,20);
  assert.equal(profile.coverage,100);
  assert.equal(profile.confidence.label,'Baixa');
  assert.equal(profile.periodStart,'2026-08-01');
  assert.equal(profile.periodEnd,'2026-08-20');
  assert.equal(cognitiveConfidence(80).label,'Alta');
});
