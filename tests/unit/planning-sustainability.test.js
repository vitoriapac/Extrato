import test from 'node:test';
import assert from 'node:assert/strict';
import {addLocalDays} from '../../src/core/date-utils.js';
import {freezePlanExecution} from '../../src/domain/planning/plan-execution-snapshot.js';
import {recordPlanningCapacity} from '../../src/domain/planning/capacity-history.js';
import {buildWeeklyAdherence} from '../../src/application/adherence/build-weekly-adherence.js';
import {buildSustainabilityModel} from '../../src/application/planning-sustainability/build-sustainability-model.js';

function fixture(){
  const capacityHistory=[];
  recordPlanningCapacity(capacityHistory,{id:'capacity',today:'2026-08-01',capturedAt:'2026-08-01T12:00:00Z',hoursByDay:Object.fromEntries(Array.from({length:7},(_,i)=>[i,2]))});
  const dailyPlans=[],sessions=[];
  for(let index=0;index<4;index++){
    const date=addLocalDays('2026-09-07',index*7),minutes=[100,200,300,400][index];
    const item={id:`item${index}`,subjectId:'s',topicId:'t',type:'study',status:'planned',plannedMinutes:minutes,studyPlanId:'v1',prioritySnapshot:{priority:true,tier:'critical'}};
    freezePlanExecution(item,{date});dailyPlans.push({id:`plan${index}`,date,items:[item]});
    sessions.push({id:`session${index}`,date,subjectId:'s',topicId:'t',type:'study',planItemId:item.id,durationSeconds:minutes*60*(index===0?0:1)});
  }
  const weeklyAdherence=buildWeeklyAdherence({today:'2026-10-05',historyWeeks:4,dailyPlans,sessions,capacityHistory,subjects:[{id:'s',topics:[{id:'t'}]}]});
  return {today:'2026-10-05',weeklyAdherence};
}
test('closed reconciled weeks use allocated-minute weights and preserve inputs',()=>{
  const input=fixture(),before=JSON.stringify(input),model=buildSustainabilityModel(input);
  assert.equal(model.state,'ready');assert.equal(model.evidence.level,'confirmed');
  assert.equal(model.execution.timeAdherence,90);assert.equal(model.execution.priorityAdherence,90);
  assert.equal(model.capacity.averageAvailableMinutes,840);assert.equal(model.capacity.averageExecutedMinutes,225);
  model.weeks[0].model.summary.plannedMinutes=999;
  assert.equal(JSON.stringify(input),before);
});
test('latest frozen revision wins over live data without falling back to older valid evidence',()=>{
  const input=fixture(),live=input.weeklyAdherence.history[0];
  const saved={id:'saved',revision:1,period:live.period,activeExamTags:[],weeklyClose:{adherence:{version:1,model:structuredClone(live),assessment:live.assessment}}};
  saved.weeklyClose.adherence.model.summary.temporalAdherence=50;
  input.snapshots=[saved];assert.equal(buildSustainabilityModel(input).execution.timeAdherence,95);
  input.snapshots.push({...saved,id:'new',revision:2,weeklyClose:{}});
  const model=buildSustainabilityModel(input);
  assert.equal(model.evidence.comparableWeeks,3);assert.equal(model.evidence.level,'preliminary');
  assert.ok(model.weeks[0].reasonCodes.includes('incompatible_policy'));
});
test('rolling periods, active weeks and other exam scopes cannot enter the cohort',()=>{
  const input=fixture(),first=input.weeklyAdherence.history[0];
  first.period.start=addLocalDays(first.period.start,1);
  input.weeklyAdherence.history[1].activeExamTags=['bb'];
  input.weeklyAdherence.history.push({...first,period:{start:'2026-10-05',end:'2026-10-11'}});
  const model=buildSustainabilityModel(input);
  assert.equal(model.evidence.comparableWeeks,2);assert.equal(model.capacity.observedRange,null);
  assert.equal(model.state,'insufficient_data');
  assert.equal(buildSustainabilityModel({...input,historyWeeks:12}).weeks.length,12);
  assert.equal(buildSustainabilityModel({...input,historyWeeks:8}).weeks.length,8);
  assert.equal(buildSustainabilityModel({...input,historyWeeks:7}).weeks.length,4);
  assert.equal(buildSustainabilityModel({today:'invalid'}).state,'invalid_period');
});
test('capacity changes and unknown historical context are explicit exclusions',()=>{
  const input=fixture(),weeks=input.weeklyAdherence.history;
  weeks[0].planningContext.capacity.availableMinutes=420;
  weeks[1].planningContext.capacity.changedWithinPeriod=true;
  weeks[2].planningContext.legacyItems=1;
  const model=buildSustainabilityModel(input);
  assert.equal(model.evidence.comparableWeeks,1);
  assert.deepEqual(model.weeks.slice(0,3).map(row=>row.reasonCodes),[['different_capacity'],['capacity_changed_within_week'],['historical_context_missing']]);
  weeks[3].planningContext.capacity.state='unknown';
  assert.ok(buildSustainabilityModel(input).weeks[3].reasonCodes.includes('capacity_unknown'));
});
test('additional study stays distinct from credited adherence and observed range is rounded',()=>{
  const input=fixture();
  input.weeklyAdherence.history.forEach((week,index)=>{week.summary.executedMinutes=[480,520,490,510][index];week.summary.additionalMinutes=100;});
  const model=buildSustainabilityModel(input);
  assert.equal(model.execution.timeAdherence,90);assert.equal(model.execution.priorityAdherence,90);
  assert.equal(model.execution.additionalMinutes,400);
  assert.equal(model.capacity.observedRange.lowMinutes,480);assert.equal(model.capacity.observedRange.highMinutes,540);
  assert.equal(model.capacity.observedRange.minimumMinutes,480);
});
test('invalid percentages and credit beyond allocations are rejected',()=>{
  const input=fixture();
  input.weeklyAdherence.history[0].priority.classifiedCoverage=undefined;
  input.weeklyAdherence.history[1].summary.matchedMinutes=999;
  input.weeklyAdherence.history[2].priority.executedMinutes=999;
  assert.equal(buildSustainabilityModel(input).evidence.comparableWeeks,1);
});
