import test from 'node:test';
import assert from 'node:assert/strict';
import {generateDemoData} from '../../src/demo/demo-generator.js';
import {buildAdherenceModel} from '../../src/application/adherence/build-adherence-model.js';
import {adherenceStatus} from '../../src/application/adherence/adherence-status.js';
import {adherenceScenarios} from '../fixtures/adherence-scenarios.js';

const today='2026-10-03';
for(const scenario of adherenceScenarios)test(`recorded execution scenario: ${scenario.name}`,()=>{
  const subjects=[{id:'s',topics:[{id:'t'}]}];
  const items=[true,false].map((priority,index)=>({id:`item-${index}`,subjectId:'s',topicId:'t',type:'study',plannedMinutes:60,prioritySnapshot:{priority}}));
  const sessions=scenario.minutes.map((minutes,index)=>({id:`session-${index}`,date:today,subjectId:'s',topicId:'t',type:'study',planItemId:items[index].id,durationSeconds:minutes*60}));
  const model=buildAdherenceModel({start:today,end:today,today,subjects,dailyPlans:[{id:'p',date:today,items}],sessions});
  assert.equal(adherenceStatus(model).status,scenario.expected);
  if(scenario.name.startsWith('high volume'))assert.ok(model.summary.volumeRatio>100);
});
test('dense Demo records scripted priorities and frozen adherence without using current scores',()=>{
  const state=generateDemoData({today});
  assert.deepEqual(state,generateDemoData({today}));
  for(const plan of state.dailyPlans)for(const item of plan.items){
    assert.equal(item.executionSnapshot.prioritySnapshot.source,'demo-scripted');
    assert.equal(typeof item.executionSnapshot.prioritySnapshot.priority,'boolean');
    assert.equal(item.executionSnapshot.date,plan.date);
  }
  assert.ok(state.weeklyCloseSnapshots.some(row=>row.weeklyClose.adherence.model.priority.classifiedCoverage===100));
  const restored=JSON.parse(JSON.stringify(state));
  const frozen=structuredClone(restored.weeklyCloseSnapshots);
  restored.subjects.forEach(subject=>subject.topics.forEach(topic=>{topic.examImportance=0}));
  restored.studySessions=[];
  assert.deepEqual(restored.weeklyCloseSnapshots,frozen);
});
test('dense Demo editing and deleting sessions reconcile credit while frozen closes remain unchanged',()=>{
  const state=generateDemoData({today}),plan=state.dailyPlans.find(plan=>plan.date<today&&plan.items.some(item=>item.sessionIds?.length));
  const input={start:plan.date,end:plan.date,today,subjects:state.subjects,dailyPlans:state.dailyPlans,sessions:state.studySessions};
  const before=buildAdherenceModel(input),frozen=structuredClone(state.weeklyCloseSnapshots);
  const linkedIds=new Set(plan.items.flatMap(item=>item.sessionIds||[]));
  const shorter=state.studySessions.map(session=>linkedIds.has(session.id)?{...session,durationSeconds:0}:session);
  const edited=buildAdherenceModel({...input,sessions:shorter});
  const deleted=buildAdherenceModel({...input,sessions:state.studySessions.filter(session=>!linkedIds.has(session.id))});
  assert.ok(before.summary.matchedMinutes>0);
  assert.equal(edited.summary.matchedMinutes,0);assert.equal(deleted.summary.matchedMinutes,0);
  assert.deepEqual(state.weeklyCloseSnapshots,frozen);
});
