import test from 'node:test';
import assert from 'node:assert/strict';
import {buildCapacityReviewPreview} from '../../src/application/planning-sustainability/build-capacity-review-preview.js';
import {createSustainabilityController} from '../../src/ui/controllers/sustainability-controller.js';
import {renderSustainability} from '../../src/ui/renderers/sustainability-renderer.js';
import {buildRecurringPriorities} from '../../src/application/adherence/build-recurring-priorities.js';
const fixture=()=>({historyWeeks:4,referenceCapacityMinutes:720,assessment:{action:'review_capacity',label:'Carga acima da execução recente'},
  capacity:{observedRange:{lowMinutes:480,highMinutes:540},averageAvailableMinutes:720,averagePlannedMinutes:600,averageExecutedMinutes:500},
  evidence:{comparableWeeks:4},execution:{priorityAdherence:90,timeAdherence:70},insights:{message:'Descrição',excludedWeeks:[],caveat:'Observado'}});
test('preview is hypothetical, independent and does not rewrite capacity or history',()=>{
  const model=fixture(),before=JSON.stringify(model),preview=buildCapacityReviewPreview(model,720);
  assert.equal(preview.state,'ready');assert.equal(preview.hypotheticalMinutes,540);assert.equal(preview.differenceMinutes,180);
  preview.observedRange.highMinutes=1;assert.equal(JSON.stringify(model),before);
  assert.equal(buildCapacityReviewPreview(model,600).state,'stale_capacity');
  model.assessment.action='review_distribution';assert.equal(buildCapacityReviewPreview(model,720).state,'unavailable');
});
test('controller opens readonly preview and configuration navigation requires an explicit action',()=>{
  const model=fixture(),before=JSON.stringify(model);let callback,navigations=0;
  const controller=createSustainabilityController({getModel:()=>model,getCapacity:()=>720,formatMinutes:String,navigate:()=>navigations++,showPreview:(text,accept)=>{assert.match(text,/Nenhum bloco foi redistribuído/);callback=accept;}});
  controller.review();assert.equal(navigations,0);callback();assert.equal(navigations,1);assert.equal(JSON.stringify(model),before);
});
test('historical rendering preserves explanations and has no capacity or distribution action',()=>{
  const model=fixture();assert.match(renderSustainability(model),/Revisar capacidade/);
  assert.doesNotMatch(renderSustainability(model,{historical:true}),/data-delegated-click/);
  model.assessment.action='review_distribution';assert.match(renderSustainability(model),/Revisar distribuição/);
  assert.doesNotMatch(renderSustainability(model),/Revisar capacidade/);
});
test('recurring priorities distinguish partial credit from absent credit and protect archived destinations',()=>{
  const frame=(start,end,credit)=>({version:1,assessment:{policyVersion:1,status:'priority_gap'},model:{version:1,period:{start,end},ambiguousItemCount:0,
    priority:{policyVersion:1,classifiedCoverage:100},items:[{subjectId:'s',topicId:'t',priority:true,plannedMinutes:60,creditedMinutes:credit}]}});
  const subjects=[{id:'s',name:'Subject',topics:[{id:'t',name:'Topic'}]}];
  const build=credit=>buildRecurringPriorities({subjects,current:frame('2026-09-28','2026-10-04',credit),snapshots:[{id:'saved',period:{start:'2026-09-21',end:'2026-09-27'},activeExamTags:[],weeklyClose:{adherence:frame('2026-09-21','2026-09-27',credit)}}]});
  assert.equal(build(0).items[0].executionPattern,'not_started');assert.equal(build(30).items[0].executionPattern,'partial');
  assert.equal(build(30).items[0].navigable,true);subjects[0].topics[0].archived=true;assert.equal(build(30).items[0].navigable,false);
});
