import test from 'node:test';
import assert from 'node:assert/strict';
import {buildAdherenceModel} from '../../src/application/adherence/build-adherence-model.js';
import {freezePlanExecution} from '../../src/domain/planning/plan-execution-snapshot.js';

const subjects=[{id:'s',topics:[{id:'t'}]},{id:'other',topics:[{id:'u'}]}];
const item=(id,priority,minutes=60)=>({id,subjectId:'s',topicId:'t',type:'study',plannedMinutes:minutes,prioritySnapshot:priority===null?null:{priority}});
const session=(id,planItemId,minutes,type='study')=>({id,planItemId,date:'2026-10-01',subjectId:'s',topicId:'t',type,durationSeconds:minutes*60});
const model=(items,sessions,extra={})=>buildAdherenceModel({start:'2026-09-28',end:'2026-10-04',today:'2026-10-03',subjects,dailyPlans:[{id:'p',date:'2026-10-01',items}],sessions,...extra});

test('high volume does not manufacture priority execution',()=>{
  const result=model([item('priority',true),item('normal',false)],[session('one','normal',120)]);
  assert.equal(result.summary.volumeRatio,100);assert.equal(result.summary.temporalAdherence,50);
  assert.equal(result.summary.excessLinkedMinutes,60);assert.equal(result.priority.adherence,0);
});
test('lower volume can execute the entire priority allocation',()=>{
  const result=model([item('priority',true),item('normal',false)],[session('one','priority',60)]);
  assert.equal(result.summary.volumeRatio,50);assert.equal(result.priority.adherence,100);
  assert.equal(result.priority.completedActivities,1);
});
test('partial activities contribute fractionally and exact time is not rounded prematurely',()=>{
  const result=model([item('a',true,3),item('b',true,3)],[session('one','a',1),session('two','b',3)]);
  assert.equal(result.summary.matchedMinutes,4);assert.ok(Math.abs(result.priority.adherence-200/3)<1e-10);
  assert.equal(result.priority.partiallyExecutedActivities,1);assert.equal(result.priority.completedActivities,1);
  assert.equal(result.priority.equivalentExecutedActivities,1+1/3);
});
test('unlinked and incompatible study remain real volume without credit',()=>{
  const result=model([item('a',true)],[session('one',null,60),session('two','a',30,'questions')]);
  assert.equal(result.summary.executedMinutes,90);assert.equal(result.summary.volumeRatio,150);
  assert.equal(result.summary.temporalAdherence,0);assert.equal(result.summary.additionalMinutes,60);assert.equal(result.summary.incompatibleMinutes,30);
});
test('legacy classification is explicit and inputs stay immutable',()=>{
  const items=[item('a',true),item('unknown',null)],sessions=[session('one','unknown',60)],before=structuredClone({items,sessions});
  const result=model(items,sessions);assert.equal(result.priority.classifiedCoverage,50);assert.equal(result.priority.unknownPlannedMinutes,60);
  assert.deepEqual({items,sessions},before);assert.equal(model([item('legacy',null)],[]).priority.adherence,null);
});
test('archiving and current priority changes do not erase frozen execution',()=>{
  const activity=item('a',true);freezePlanExecution(activity,{date:'2026-10-01',activeExamTags:['bb']});activity.prioritySnapshot.priority=false;
  const result=model([activity],[{...session('one','a',60),examScope:['bb']}],{subjects:[{id:'s',archived:true,topics:[{id:'t',archived:true,examTags:['bb']}]}],activeExamTags:['bb']});
  assert.equal(result.priority.adherence,100);assert.equal(result.subjects[0].priorityAdherence,100);
});
test('another exam and future days cannot inflate the evaluated denominator',()=>{
  const bb=item('bb',true),caixa=item('caixa',true);freezePlanExecution(bb,{activeExamTags:['bb']});freezePlanExecution(caixa,{activeExamTags:['caixa']});
  const result=model([],[],{activeExamTags:['bb'],dailyPlans:[{id:'a',date:'2026-10-01',items:[bb,caixa]},{id:'future',date:'2026-10-04',items:[bb]}]});
  // Distinct identities are mandatory even across dates.
  assert.equal(result.summary.plannedMinutes,0);
  const future={...bb,id:'future-id'};
  const scoped=model([],[],{activeExamTags:['bb'],dailyPlans:[{id:'a',date:'2026-10-01',items:[bb,caixa]},{id:'future',date:'2026-10-04',items:[future]}]});
  assert.equal(scoped.summary.plannedMinutes,60);assert.equal(scoped.period.evaluatedEnd,'2026-10-03');
});
test('edit/delete and invalid periods do not retain stale execution totals',()=>{
  assert.equal(model([item('a',true)],[session('one','a',20)]).summary.matchedMinutes,20);
  assert.equal(model([item('a',true)],[]).summary.matchedMinutes,0);
  assert.equal(buildAdherenceModel({start:'2026-02-30',end:'2026-10-03'}).state,'invalid_period');
  assert.equal(model([],[]).state,'unplanned');
});

import {renderExecutionBreakdown} from '../../src/ui/renderers/execution-breakdown-renderer.js';
test('60 previstos, 40 vinculados e 30 adicionais explicam 70 estudados sem crédito indevido',()=>{
 const result=model([item('a',true,60)],[session('linked','a',40),session('additional',null,30)]);
 const s=result.summary;
 assert.equal(s.executedMinutes,70);assert.equal(s.matchedMinutes,40);assert.equal(s.additionalMinutes,30);assert.equal(s.remainingMinutes,20);
 assert.equal(s.executedMinutes,s.matchedMinutes+s.additionalMinutes+s.excessLinkedMinutes+s.incompatibleMinutes+s.otherPeriodMinutes);
 const before=JSON.stringify(result),html=renderExecutionBreakdown(result);
 assert.match(html,/Tempo registrado: 70 min/);assert.match(html,/crédito ao plano: 40 min/);assert.match(html,/pendente: 20 min/);assert.match(html,/Estudo sem vínculo ao plano: 30 min/);
 assert.equal(JSON.stringify(result),before);
});
