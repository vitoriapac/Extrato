import test from 'node:test';
import assert from 'node:assert/strict';
import {addLocalDays} from '../../src/core/date-utils.js';
import {buildSustainabilityModel} from '../../src/application/planning-sustainability/build-sustainability-model.js';

export function pattern(times,priorities=times,volumes=times){
  const history=times.map((time,index)=>{const start=addLocalDays('2026-09-07',index*7),end=addLocalDays(start,6);
    return {version:1,activeExamTags:[],period:{start,end,evaluatedEnd:end,complete:true},assessment:{policyVersion:1},ambiguousItemCount:0,
      summary:{plannedMinutes:600,executedMinutes:volumes[index]*6,matchedMinutes:time*6,temporalAdherence:time},
      priority:{policyVersion:1,classifiedCoverage:100,plannedMinutes:120,executedMinutes:priorities[index]*1.2,adherence:priorities[index]},
      planningContext:{version:1,legacyItems:0,capacity:{state:'recorded',availableMinutes:720,changedWithinPeriod:false}}};});
  return buildSustainabilityModel({today:'2026-10-05',weeklyAdherence:{history}});
}
test('stable time and preserved priorities yield sustainable planning',()=>{
  assert.equal(pattern([93,92,95,91],[91,90,92,91]).assessment.status,'sustainable');
});
test('four recurring low-volume weeks with priorities preserved suggest capacity review',()=>{
  const model=pattern([70,68,72,69],[88,91,85,90]);
  assert.equal(model.assessment.status,'capacity_mismatch');assert.equal(model.assessment.action,'review_capacity');
  assert.match(model.insights.message,/não comprova a causa/);assert.equal(model.assessment.policyVersion,1);
});
test('adequate volume and low priority credit suggest distribution review even with additional study',()=>{
  const model=pattern([60,60,60,60],[51,48,55,50],[96,95,97,96]);
  assert.equal(model.assessment.status,'priority_mismatch');assert.equal(model.assessment.action,'review_distribution');
});
test('irregular execution is not converted into a capacity recommendation',()=>{
  const model=pattern([100,40,100,50],[90,85,90,85],[110,40,100,50]);
  assert.equal(model.assessment.status,'unstable_execution');assert.equal(model.assessment.action,null);
});
test('single bad week is an anomaly with three or four comparable weeks',()=>{
  for(const times of [[95,91,38],[95,91,38,93]]){
    const model=pattern(times,[90,90,90,90]);
    assert.equal(model.assessment.status,'isolated_anomaly');assert.equal(model.assessment.action,null);
  }
});
test('preliminary low-volume evidence cannot recommend a structural change',()=>{
  const model=pattern([70,68,72],[88,91,85]);
  assert.equal(model.assessment.status,'monitor');assert.equal(model.insights.preliminary,true);assert.equal(model.assessment.action,null);
  assert.equal(pattern([70],[90]).assessment.status,'insufficient_data');
});
test('one exception to an otherwise repeated capacity pattern remains defensible',()=>{
  assert.equal(pattern([70,68,72,85],[88,91,85,90]).assessment.status,'capacity_mismatch');
  assert.equal(pattern([74,74,75,75],[80,80,80,80]).assessment.action,null);
});
