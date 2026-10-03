import test from 'node:test';
import assert from 'node:assert/strict';
import {buildAdherenceTarget,normalizeAdherenceTarget,validAdherenceTarget} from '../../src/application/adherence/adherence-target.js';
import {createGoalService} from '../../src/application/goals/goal-service.js';
import {buildProjectionPageModel} from '../../src/application/projection/build-projection-page-model.js';
import {buildWeeklyCloseAdherence} from '../../src/application/adherence/build-weekly-close-adherence.js';
import {renderAdherenceTarget} from '../../src/ui/renderers/adherence-target-renderer.js';

test('optional adherence target defaults for legacy, validates boundaries and preserves disabling',()=>{
  assert.equal(normalizeAdherenceTarget(undefined),80);assert.equal(normalizeAdherenceTarget(null),null);
  for(const value of [50,80,100,null])assert.equal(validAdherenceTarget(value),true);
  for(const value of [49,101,NaN,Infinity,'80',false,{}])assert.equal(validAdherenceTarget(value),false);
  const goals={};const service=createGoalService({repository:{getGoals:()=>goals,updateGoal:(key,value)=>{goals[key]=value}}});
  assert.equal(service.update('aderenciaSemanal','70'),true);assert.equal(goals.aderenciaSemanal,70);
  for(const invalid of ['',49,101,'oops'])assert.equal(service.update('aderenciaSemanal',invalid),false);
  assert.equal(goals.aderenciaSemanal,70);service.update('aderenciaSemanal',null);assert.equal(goals.aderenciaSemanal,null);
});
test('target distinguishes unmet, achieved and unavailable without fabricating execution',()=>{
  assert.equal(buildAdherenceTarget(null,80).state,'insufficient_data');
  assert.equal(buildAdherenceTarget({summary:{temporalAdherence:75}},70).state,'achieved');
  assert.equal(buildAdherenceTarget({summary:{temporalAdherence:75}},80).difference,-5);
  assert.equal(renderAdherenceTarget(buildAdherenceTarget(null,null),{escapeHtml:String}),'');
});
test('personal target is separate from projection calculations and real history',()=>{
  const base={today:'2026-10-03',examDate:'2026-12-20',targetScore:80,adherence:70};
  const executionContext={dailyPlans:[],sessions:[],subjects:[],adherenceTarget:50};
  const first=buildProjectionPageModel({...base,executionContext});
  const second=buildProjectionPageModel({...base,executionContext:{...executionContext,adherenceTarget:100}});
  const disabled=buildProjectionPageModel({...base,executionContext:{...executionContext,adherenceTarget:null}});
  assert.deepEqual(first.model,second.model);assert.deepEqual(first.model,disabled.model);
  assert.deepEqual(first.inputs,second.inputs);assert.deepEqual(first.history,second.history);
  assert.equal(disabled.adherenceContext.enabled,false);
});
test('frozen weekly target remains unchanged when the current target changes',()=>{
  const input={start:'2026-09-27',end:'2026-10-03',today:'2026-10-03',subjects:[],dailyPlans:[],sessions:[]};
  const frame=buildWeeklyCloseAdherence({...input,adherenceTarget:70}),saved=JSON.parse(JSON.stringify(frame));
  const changed=buildWeeklyCloseAdherence({...input,adherenceTarget:null});
  assert.equal(saved.personalTarget.target,70);assert.equal(changed.personalTarget.enabled,false);
  assert.deepEqual(saved.assessment,changed.assessment);
});
