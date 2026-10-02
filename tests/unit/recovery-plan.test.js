import test from 'node:test';
import assert from 'node:assert/strict';
import {buildRecoveryPlan} from '../../src/application/recovery/build-recovery-plan.js';
import {generateDemoData} from '../../src/demo/demo-generator.js';

const plan={id:'plan-1',weeklyPlannedMinutes:180,weeklyAvailableMinutes:180,activeExamTags:['bb'],
  subjects:[{subjectId:'strong',subjectName:'Informática',minutes:90},{subjectId:'weak',subjectName:'Matemática',minutes:90}],
  items:[{id:'a',subjectId:'strong',minutes:90,capacityMinutes:120,activityMix:{theory:30,questions:30,reviews:30}},
    {id:'b',subjectId:'weak',minutes:90,capacityMinutes:180,activityMix:{theory:30,questions:30,reviews:30}}]};
const priorities=[{subjectId:'strong',topicId:'security',mastery:90,evidenceStrength:.8,examImpact:40,trend:{direction:'stable'}},
  {subjectId:'weak',topicId:'interest',mastery:48,evidenceStrength:.7,examImpact:85,trend:{direction:'down'}}];
const trajectory={status:'attention',exam:{phase:'consolidation',date:'2026-12-01'},current:{targetScore:80},
  topicRisks:[{subjectId:'weak',topicId:'interest',examImpact:85}]};
const input={trajectory,currentPlan:plan,weeklyCapacityMinutes:180,priorities,activeExamTags:['bb'],today:'2026-10-02'};
const run=overrides=>buildRecoveryPlan({...structuredClone(input),...overrides});

test('prévia de recuperação redistribui um bloco sem alterar plano ou capacidade',()=>{
  const before=structuredClone(input),result=buildRecoveryPlan(input);
  assert.equal(result.status,'recoverable');
  assert.equal(result.available,true);
  assert.deepEqual(result.capacity,{current:180,proposed:180});
  assert.deepEqual(result.totalMinutes,{current:180,proposed:180});
  assert.equal(result.increased[0].subjectId,'weak');
  assert.equal(result.reduced[0].subjectId,'strong');
  assert.equal(result.increased[0].deltaMinutes,-result.reduced[0].deltaMinutes);
  assert.deepEqual(input,before);
});

test('trajetória saudável dispensa recuperação e dados insuficientes não fabricam proposta',()=>{
  assert.equal(run({trajectory:{...trajectory,status:'on_track'}}).status,'not_needed');
  assert.equal(run({trajectory:{...trajectory,status:'insufficient_data'}}).status,'unavailable');
});

test('cooldown e capacidade limitada bloqueiam transferência',()=>{
  const history=[{status:'applied',sourceSubjectId:'strong',targetSubjectId:'weak',decidedAt:'2026-09-28T12:00:00Z'}];
  const cooldown=run({history});
  assert.equal(cooldown.status,'limited');
  assert.equal(cooldown.reasonCode,'cooldown');
  const constrained=structuredClone(plan);constrained.items[1].capacityMinutes=100;
  assert.equal(run({currentPlan:constrained}).reasonCode,'capacity_constraint');
});

test('não move tempo de disciplina de maior impacto ou sem evidência',()=>{
  const protectedSource=priorities.map(item=>item.subjectId==='strong'?{...item,examImpact:95}:item);
  assert.equal(run({priorities:protectedSource}).reasonCode,'no_safe_pair');
  const lowEvidence=priorities.map(item=>({...item,evidenceStrength:.1}));
  assert.equal(run({priorities:lowEvidence}).reasonCode,'insufficient_evidence');
});

test('conteúdo arquivado, escopo e base alterada invalidam a prévia',()=>{
  assert.equal(run({priorities:priorities.map(item=>item.topicId==='interest'?{...item,topicArchived:true}:item)}).reasonCode,'no_scoped_risk');
  assert.equal(run({constraints:{archivedSubjectIds:['strong']}}).reasonCode,'archived_content');
  assert.equal(run({activeExamTags:['caixa']}).reasonCode,'scope_changed');
  assert.equal(run({weeklyCapacityMinutes:240}).reasonCode,'capacity_changed');
});

test('reta final e destino diferente da lacuna não produzem ajuste',()=>{
  assert.equal(run({trajectory:{...trajectory,exam:{phase:'final_review'}}}).status,'limited');
  const otherRisk={...trajectory,topicRisks:[{subjectId:'strong',topicId:'security',examImpact:85}]};
  assert.equal(run({trajectory:otherRisk}).reasonCode,'destination_mismatch');
});

test('Demo densa pode ser inspecionada sem alterar planos ou histórico',()=>{
  const demo=generateDemoData({today:'2026-10-02'});
  const plansBefore=structuredClone(demo.studyPlans),historyBefore=structuredClone(demo.adaptivePlanningHistory);
  const selected=demo.studyPlans.at(-1);
  const result=buildRecoveryPlan({trajectory,topicRisks:trajectory.topicRisks,currentPlan:selected,
    weeklyCapacityMinutes:selected.weeklyAvailableMinutes,priorities,
    history:demo.adaptivePlanningHistory,today:'2026-10-02',activeExamTags:demo.examBlueprint.activeExamTags});
  assert.ok(['recoverable','limited','unavailable'].includes(result.status));
  assert.deepEqual(demo.studyPlans,plansBefore);
  assert.deepEqual(demo.adaptivePlanningHistory,historyBefore);
});
