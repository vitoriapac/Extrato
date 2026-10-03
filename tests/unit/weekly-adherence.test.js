import test from 'node:test';
import assert from 'node:assert/strict';
import {buildWeeklyAdherence} from '../../src/application/adherence/build-weekly-adherence.js';
import {buildAdherenceModel} from '../../src/application/adherence/build-adherence-model.js';
import {adherenceStatus} from '../../src/application/adherence/adherence-status.js';
import {buildPlanExecution} from '../../src/application/goals/build-plan-execution.js';
import {freezePlanExecution} from '../../src/domain/planning/plan-execution-snapshot.js';

const subjects=[{id:'s',topics:[{id:'t'}]}];
const activity=(id,priority=true,plannedMinutes=60)=>({id,subjectId:'s',topicId:'t',type:'study',plannedMinutes,prioritySnapshot:priority===null?null:{priority}});
const plan=(date,items)=>({id:`p-${date}`,date,items});
const session=(id,planItemId,date,minutes)=>({id,planItemId,date,subjectId:'s',topicId:'t',type:'study',durationSeconds:minutes*60});
const assess=(items,sessions)=>adherenceStatus(buildAdherenceModel({start:'2026-09-28',end:'2026-10-04',today:'2026-10-03',subjects,dailyPlans:[plan('2026-10-01',items)],sessions}));

test('weekly classifications separate matched load from priority execution',()=>{
  assert.equal(assess([activity('a'),activity('b',false)],[session('one','a','2026-10-01',48),session('two','b','2026-10-01',48)]).status,'aligned');
  assert.equal(assess([activity('a'),activity('b',false)],[session('one','a','2026-10-01',60)]).status,'time_gap');
  assert.equal(assess([activity('a',true,20),activity('b',false,80)],[session('one','b','2026-10-01',100)]).status,'priority_gap');
  assert.equal(assess([activity('a')],[]).status,'mixed');
});
test('unclassified and absent priority allocation remain insufficient, not negative judgments',()=>{
  assert.deepEqual(assess([activity('a'),activity('b',null)],[]).reasonCodes,['limited_historical_classification']);
  assert.deepEqual(assess([activity('a',false)],[]).reasonCodes,['no_recorded_priority_allocation']);
  assert.equal(assess([],[]).status,'insufficient_data');
  assert.equal(assess([activity('a'),activity('duplicate'),activity('duplicate')],[]).status,'insufficient_data');
});
test('the current week excludes future days and compares the same elapsed days',()=>{
  const dailyPlans=[plan('2026-09-21',[activity('prior-mon')]),plan('2026-09-24',[activity('prior-thu')]),plan('2026-09-28',[activity('mon')]),plan('2026-10-01',[activity('thu')])];
  const sessions=[session('old','prior-mon','2026-09-21',60),session('new','mon','2026-09-28',60)];
  const input={today:'2026-09-30',dailyPlans,sessions,subjects};const before=structuredClone(input);
  const result=buildWeeklyAdherence(input);
  assert.equal(result.current.evaluatedDays,3);assert.equal(result.current.summary.plannedMinutes,60);
  assert.equal(result.current.assessment.status,'aligned');assert.equal(result.comparison.mode,'equal_elapsed');
  assert.equal(result.comparison.previous.summary.plannedMinutes,60);assert.equal(result.comparison.priorityDelta,0);
  assert.equal(result.history.at(-1).summary.plannedMinutes,120);assert.equal(result.history.at(-1).assessment.status,'mixed');
  assert.deepEqual(input,before);
});
test('complete weeks are compared in full and missing evidence blocks comparisons',()=>{
  const input={today:'2026-10-05',start:'2026-09-28',subjects,dailyPlans:[plan('2026-09-21',[activity('old')]),plan('2026-09-28',[activity('new')])],sessions:[session('one','old','2026-09-21',60),session('two','new','2026-09-28',30)]};
  const result=buildWeeklyAdherence(input);assert.equal(result.current.evaluatedDays,7);assert.equal(result.current.period.complete,true);
  assert.equal(result.comparison.mode,'complete_weeks');assert.equal(result.comparison.priorityDelta,-50);
  const insufficient=buildWeeklyAdherence({...input,dailyPlans:input.dailyPlans.slice(1)});
  assert.equal(insufficient.comparison.state,'insufficient_data');assert.equal(insufficient.comparison.priorityDelta,null);
});
test('week boundaries use local calendar days and history windows are bounded',()=>{
  for(const historyWeeks of [4,8,12]){
    const result=buildWeeklyAdherence({today:'2026-10-04',subjects,historyWeeks});
    assert.equal(result.current.period.start,'2026-09-28');assert.equal(result.history.length,historyWeeks);
    assert.equal(result.current.period.complete,false);
  }
  assert.equal(buildWeeklyAdherence({today:'2026-10-05'}).current.period.start,'2026-10-05');
  assert.equal(buildWeeklyAdherence({today:'2026-02-30'}).state,'invalid_period');
  assert.equal(buildWeeklyAdherence({today:'2026-10-05',start:'2026-10-02'}).state,'invalid_period');
  assert.equal(buildWeeklyAdherence({today:'2026-10-05',historyWeeks:999}).history.length,8);
});
test('planning exposes the analysis without changing capacity or legacy totals',()=>{
  const result=buildPlanExecution({today:'2026-09-30',dailyPlans:[plan('2026-09-28',[activity('mon')]),plan('2026-10-01',[activity('thu')])],sessions:[session('one','mon','2026-09-28',60)],subjects,hoursByDay:{mon:2}});
  assert.equal(result.plannedMinutes,120);assert.equal(result.capacityMinutes,120);
  assert.equal(result.weeklyAdherence.current.summary.plannedMinutes,60);assert.equal(result.adherenceModel.priority.adherence,100);
});

test('a midweek plan version preserves each activities frozen priority and survives serialization',()=>{
  const old=activity('v1');old.studyPlanId='weekly-v1';freezePlanExecution(old,{date:'2026-09-28'});
  const fresh=activity('v2',false);fresh.studyPlanId='weekly-v2';freezePlanExecution(fresh,{date:'2026-10-01'});
  old.prioritySnapshot.priority=false;
  const input={today:'2026-10-03',subjects,dailyPlans:[plan('2026-09-28',[old]),plan('2026-10-01',[fresh])],sessions:[session('one','v1','2026-09-28',60)]};
  const result=buildWeeklyAdherence(JSON.parse(JSON.stringify(input)));
  assert.equal(result.current.priority.plannedMinutes,60);assert.equal(result.current.priority.adherence,100);
  assert.deepEqual(result.current.items.map(item=>item.studyPlanId),['weekly-v1','weekly-v2']);
  assert.equal(result.current.summary.temporalAdherence,50);assert.equal(result.current.assessment.status,'time_gap');
});

test('timestamp-only sessions use the local calendar without changing the week boundaries',()=>{
  const result=buildWeeklyAdherence({today:'2026-10-03',subjects,dailyPlans:[plan('2026-10-01',[activity('a')])],sessions:[{
    id:'local',subjectId:'s',topicId:'t',type:'study',planItemId:'a',endedAt:new Date(2026,9,1,0,30).toISOString(),durationSeconds:3600
  }]});
  assert.equal(result.current.summary.matchedMinutes,60);assert.equal(result.current.assessment.status,'aligned');
});
