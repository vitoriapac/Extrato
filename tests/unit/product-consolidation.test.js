import test from 'node:test';
import assert from 'node:assert/strict';
import {buildNextBestAction,NEXT_BEST_ACTION_STATES} from '../../src/application/diagnostics/build-next-best-action.js';
import {buildReadinessChangeExplanation} from '../../src/application/readiness/build-readiness-change-explanation.js';

const recommendation={id:'rec-1',subjectId:'s',topicId:'t',estimatedMinutes:30,score:83,reasons:['Retenção baixa'],evidence:{evidenceLabel:'Alta'}};
const row={subjectId:'s',topicId:'t',name:'Juros',subjectName:'Matemática',state:'attention',severity:'important',primarySignal:'consolidation-risk',evidence:{label:'Alta'}};
const diagnosis=rows=>({rows,topics:rows,subjects:[]});

test('próxima ação distingue intervenção prioritária e sugestão opcional sem alterar recomendação',()=>{
  const before=structuredClone(recommendation);
  const required=buildNextBestAction({recommendations:[recommendation],diagnosis:diagnosis([row])});
  const optional=buildNextBestAction({recommendations:[recommendation],diagnosis:diagnosis([{...row,state:'progress',severity:'monitor'}])});
  assert.equal(required.state,NEXT_BEST_ACTION_STATES.ACTION_REQUIRED);
  assert.equal(optional.state,NEXT_BEST_ACTION_STATES.ACTION_OPTIONAL);
  assert.equal(required.action.id,'rec-1');assert.deepEqual(recommendation,before);
});

test('próxima ação admite manutenção, falta de evidência e ação indisponível',()=>{
  assert.equal(buildNextBestAction({diagnosis:diagnosis([{...row,state:'controlled'}]),activePlan:{id:'plan-1'}}).state,NEXT_BEST_ACTION_STATES.MAINTAIN_PLAN);
  assert.equal(buildNextBestAction({diagnosis:diagnosis([{...row,state:'insufficient'}])}).state,NEXT_BEST_ACTION_STATES.INSUFFICIENT_EVIDENCE);
  assert.equal(buildNextBestAction({diagnosis:diagnosis([{...row,state:'insufficient'}]),activePlan:{id:'plan-1'}}).state,NEXT_BEST_ACTION_STATES.INSUFFICIENT_EVIDENCE);
  assert.equal(buildNextBestAction({recommendations:[{...recommendation,eligible:false}],diagnosis:diagnosis([row])}).state,NEXT_BEST_ACTION_STATES.NO_ELIGIBLE_ACTION);
});

const factors={coverage:70,mastery:60,retention:55,consistency:75,simulations:65};
const weights={coverage:.3,mastery:.25,retention:.2,consistency:.15,simulations:.1};
const saved=(date,score,values=factors)=>({date,score,algorithmVersion:1,weights,factors:values});

test('explicação da prontidão usa apenas dois retratos comparáveis e valores observados',()=>{
  const previous=saved('2026-09-20',64),current=saved('2026-09-27',66,{...factors,coverage:76,retention:58});
  const model=buildReadinessChangeExplanation({previous,current});
  assert.equal(model.state,'comparable');assert.equal(model.delta,2);
  assert.deepEqual(model.factors.find(item=>item.label==='Cobertura'),{label:'Cobertura',before:70,after:76,direction:'up'});
  assert.deepEqual(previous,saved('2026-09-20',64));
});

test('explicação não decompõe versões ou conjuntos de evidência diferentes',()=>{
  assert.equal(buildReadinessChangeExplanation({previous:saved('2026-09-20',64),current:{...saved('2026-09-27',66),algorithmVersion:2}}).state,'algorithm-change');
  const changed=saved('2026-09-27',66,{...factors,retention:null});
  const result=buildReadinessChangeExplanation({previous:saved('2026-09-20',64),current:changed});
  assert.equal(result.state,'evidence-change');assert.deepEqual(result.factors,[]);
});
