import test from 'node:test';
import assert from 'node:assert/strict';
import {recoveryScenario} from '../fixtures/recovery-scenarios/scenarios.js';
import {buildRecoveryPlan} from '../../src/application/recovery/build-recovery-plan.js';
import {generateDemoData} from '../../src/demo/demo-generator.js';

test('plano da Demo de 130+ dias admite recuperação e preserva registros densos',()=>{
  const demo=generateDemoData({today:'2026-10-02'}),before=structuredClone(demo),plan=demo.studyPlans.at(-1);
  const source=plan.subjects.find(subject=>subject.minutes>=60),target=plan.subjects.find(subject=>subject.subjectId!==source.subjectId&&plan.items.some(item=>item.subjectId===subject.subjectId&&item.capacityMinutes-item.minutes>=15));
  assert.ok(source&&target);
  const priorities=plan.items.map(item=>({...item,mastery:item.subjectId===target.subjectId?40:90,examImpact:item.subjectId===target.subjectId?90:40,evidenceStrength:.8,trend:{direction:'stable'}}));
  const input={trajectory:{status:'attention',exam:{phase:'consolidation'},topicRisks:priorities.filter(item=>item.subjectId===target.subjectId)},currentPlan:plan,priorities,weeklyCapacityMinutes:plan.weeklyAvailableMinutes,activeExamTags:demo.examBlueprint.activeExamTags,today:'2026-10-02'};
  const result=buildRecoveryPlan(input);assert.equal(result.status,'recoverable');assert.equal(result.to.subjectId,target.subjectId);assert.equal(result.totalMinutes.current,result.totalMinutes.proposed);
  assert.equal(buildRecoveryPlan({...input,trajectory:{...input.trajectory,status:'on_track'}}).status,'not_needed');
  assert.equal(buildRecoveryPlan({...input,trajectory:{...input.trajectory,exam:{phase:'final_review'}}}).status,'limited');
  assert.equal(buildRecoveryPlan({...input,priorities:priorities.map(item=>({...item,mastery:40,examImpact:90}))}).reasonCode,'no_safe_pair');
  assert.deepEqual(demo,before);
});

for(const [profile,status,reason] of [['healthy','not_needed','on_track'],['critical','recoverable','transfer_proposed'],['final','limited','exam_phase'],['all-critical','unavailable','no_safe_pair'],['low-evidence','unavailable','insufficient_evidence'],['optimized','limited','capacity_constraint']]){
  test(`recuperação densa: ${profile}`,()=>{
    const input=recoveryScenario(profile),before=structuredClone(input),result=buildRecoveryPlan(input);
    assert.equal(result.status,status);assert.equal(result.reasonCode,reason);assert.deepEqual(input,before);
    if(result.available){assert.equal(result.totalMinutes.current,result.totalMinutes.proposed);assert.equal(result.increased[0].subjectId,'target-a');assert.equal(result.reduced[0].subjectId,'source-a');}
  });
}
test('empates e alocações são determinísticos independentemente da ordem de entrada',()=>{
  const input=recoveryScenario(),first=buildRecoveryPlan(input);
  input.currentPlan.subjects.reverse();input.currentPlan.items.reverse();input.priorities.reverse();input.trajectory.topicRisks.reverse();
  const second=buildRecoveryPlan(input);
  assert.equal(first.signature,second.signature);
  assert.deepEqual(first.proposedPlan.items.toSorted((a,b)=>a.id.localeCompare(b.id)),second.proposedPlan.items.toSorted((a,b)=>a.id.localeCompare(b.id)));
});
test('reversão e oscilação de origem/destino mantêm o cooldown',()=>{
  const input=recoveryScenario();input.history=[{status:'reverted',sourceSubjectId:'target-a',targetSubjectId:'source-a',decidedAt:'2026-09-01T12:00:00Z',revertedAt:'2026-10-01T12:00:00Z'}];
  assert.equal(buildRecoveryPlan(input).reasonCode,'cooldown');
  input.today='2026-10-15';assert.equal(buildRecoveryPlan(input).status,'recoverable');
});
test('somente deterioração nova e mensurável pode abrir exceção ao cooldown',()=>{
  const input=recoveryScenario();input.priorities.filter(item=>item.subjectId==='target-a').forEach(item=>{item.trend={direction:'down',state:'strong_down',delta:-15};});
  input.history=[{status:'applied',sourceSubjectId:'source-a',targetSubjectId:'target-a',decidedAt:'2026-10-01T12:00:00Z',explanationSnapshot:{action:{to:{subjectId:'target-a',mastery:40}}}}];
  assert.equal(buildRecoveryPlan(input).reasonCode,'cooldown');
  input.history[0].explanationSnapshot.action.to.mastery=55;assert.equal(buildRecoveryPlan(input).status,'recoverable');
  delete input.history[0].explanationSnapshot;assert.equal(buildRecoveryPlan(input).reasonCode,'cooldown');
});
