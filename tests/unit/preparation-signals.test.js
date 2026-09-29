import test from 'node:test';
import assert from 'node:assert/strict';
import {buildPreparationSignals} from '../../src/application/analytics/build-preparation-signals.js';
import {buildOpportunityCost} from '../../src/domain/planning/opportunity-cost.js';
import {buildAdaptivePlanningAdvice} from '../../src/domain/planning/adaptive-planning.js';
import {renderAdaptiveAllocationAdvice} from '../../src/ui/renderers/adaptive-planning-renderer.js';
import {buildRecommendationExplanation} from '../../src/application/recommendations/build-recommendation-explanation.js';
import {ensureRecommendationRecord,reusableRecommendationRecord} from '../../src/application/recommendations/recommendation-history.js';
const today='2026-09-29',subjects=[{id:'s',name:'Estatística'}];
const questions=[['2026-09-01',50,31],['2026-09-08',50,32],['2026-09-15',50,31],['2026-09-22',50,32]].map(([date,resolved,correct],index)=>({id:'q'+index,date,subjectId:'s',topicId:'t',resolved,correct}));
const sessions=questions.map((item,index)=>({id:'session'+index,date:item.date,subjectId:'s',durationSeconds:3600}));
test('platô exige quatro semanas e execução suficiente sem alterar dados',()=>{
 const before=JSON.stringify({questions,sessions}),model=buildPreparationSignals({today,subjects,questions,sessions});assert.equal(model.rows[0].type,'plateau');assert.equal(model.rows[0].questionCount,200);assert.equal(JSON.stringify({questions,sessions}),before);
 assert.equal(model.rows[0].subjectId,'s');assert.equal(model.rows[0].topicId,null);assert.equal(model.rows[0].granularity,'subject');
 assert.deepEqual(model.rows[0].period,{start:'2026-09-01',end:'2026-09-28'});assert.deepEqual(model.rows[0].observationIds,['q0','q1','q2','q3']);
 assert.equal(buildPreparationSignals({today,subjects,questions:questions.slice(1),sessions}).rows.length,0);
 assert.equal(buildPreparationSignals({today,subjects,questions,sessions:[]}).rows.length,0);
 assert.equal(buildPreparationSignals({today,subjects,questions,sessions,globalTarget:60}).rows.length,0);
});
test('custo acompanha a proposta real e a explicação preservada',()=>{
 const plan={weeklyPlannedMinutes:180,subjects:[{subjectId:'a',subjectName:'Português',minutes:90},{subjectId:'b',subjectName:'Matemática',minutes:90}],items:[{id:'i1',subjectId:'a',minutes:90,capacityMinutes:120,activityMix:{theory:30,questions:30,reviews:30}},{id:'i2',subjectId:'b',minutes:90,capacityMinutes:180,activityMix:{theory:30,questions:30,reviews:30}}]},original=JSON.stringify(plan);
 const advice=buildAdaptivePlanningAdvice({plan,today,candidates:[{subjectId:'a',mastery:90,evidenceStrength:.8,examImpact:40},{subjectId:'b',mastery:48,evidenceStrength:.8,examImpact:85}]});
 const explanation=buildRecommendationExplanation(advice,{weeklyPlannedMinutes:180});assert.equal(explanation.opportunityCost.budget,180);assert.equal(explanation.opportunityCost.from.impact,40);assert.match(renderAdaptiveAllocationAdvice(advice),/Custo de oportunidade/);assert.equal(JSON.stringify(plan),original);
});
test('alterar meta exige nova recomendação, sem reescrever a anterior',()=>{
 const history=[],item={id:'t',recommendationId:'r',subjectId:'s',topicId:'t',score:70,accuracyTarget:80};
 ensureRecommendationRecord(history,item,{now:'2026-09-29T12:00:00Z',idGenerator:()=> 'unused'});
 assert.equal(reusableRecommendationRecord(history,{...item,accuracyTarget:85},'2026-09-29'),null);assert.equal(history[0].prioritySnapshot.accuracyTarget,80);
});
test('risco de consolidação compara evidência recente e não interpreta ausência como falha',()=>{
 const candidates=[{topicId:'t',subjectId:'s',topicName:'Probabilidade',mastery:86,retention:58,evidenceStrength:.8}],recent=[{id:'recent',date:'2026-09-28',subjectId:'s',topicId:'t',resolved:50,correct:27}];
 assert.equal(buildPreparationSignals({today,subjects,candidates,questions:recent}).rows[0].type,'consolidation');
 const row=buildPreparationSignals({today,subjects,candidates,questions:recent}).rows[0];
 assert.equal(row.subjectId,'s');assert.equal(row.topicId,'t');assert.equal(row.granularity,'topic');
 assert.deepEqual(row.period,{start:'2026-09-16',end:today});assert.deepEqual(row.observationIds,['recent']);
 assert.equal(buildPreparationSignals({today,subjects,candidates:[{...candidates[0],retention:null}],questions:recent}).rows.length,0);
 assert.equal(buildPreparationSignals({today,subjects,candidates,questions:recent,blueprint:{subjects:[{subjectId:'s',accuracyTarget:60}]}}).rows.length,0);
});
test('custo de oportunidade exige uma transferência equilibrada',()=>{
 const advice={state:'proposal',transferMinutes:30,weeklyBudgetMinutes:720,from:{subjectId:'a',beforeMinutes:120,afterMinutes:90,mastery:88},to:{subjectId:'b',beforeMinutes:90,afterMinutes:120,mastery:56}};
 assert.equal(buildOpportunityCost(advice).budget,720);assert.equal(buildOpportunityCost({...advice,to:{...advice.to,afterMinutes:150}}),null);assert.equal(buildOpportunityCost({...advice,state:'stable'}),null);
});
