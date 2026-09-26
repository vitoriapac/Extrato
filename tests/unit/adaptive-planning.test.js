import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveExamPhase,buildAdaptivePlanningAdvice,applyAdaptivePlanningAdvice} from '../../src/domain/planning/adaptive-planning.js';

const plan={weeklyPlannedMinutes:180,subjects:[{subjectId:'strong',subjectName:'Informática',minutes:90},{subjectId:'weak',subjectName:'Matemática',minutes:90}],items:[
  {id:'a',subjectId:'strong',minutes:90,capacityMinutes:120,activityMix:{theory:30,questions:30,reviews:30}},
  {id:'b',subjectId:'weak',minutes:90,capacityMinutes:180,activityMix:{theory:30,questions:30,reviews:30}}
]};
const candidates=[
  {subjectId:'strong',mastery:90,evidenceStrength:.8,examImpact:40,trend:{direction:'stable'}},
  {subjectId:'weak',mastery:48,evidenceStrength:.7,examImpact:85,trend:{direction:'down'}}
];

test('fases da prova distinguem ausência de data e limites configurados',()=>{
  assert.equal(resolveExamPhase(null).state,'undated');
  assert.equal(resolveExamPhase(91).state,'construction');
  assert.equal(resolveExamPhase(90).state,'consolidation');
  assert.equal(resolveExamPhase(30).state,'final_stretch');
  assert.equal(resolveExamPhase(7).state,'final_review');
});

test('adaptação depende de evidência e preserva carga semanal antes da confirmação',()=>{
  assert.equal(buildAdaptivePlanningAdvice({plan,candidates:[{...candidates[0],evidenceStrength:.1},candidates[1]]}).state,'insufficient');
  const advice=buildAdaptivePlanningAdvice({plan,candidates});
  assert.equal(advice.state,'proposal');assert.equal(advice.weeklyBudgetMinutes,180);
  assert.equal(advice.rationale.length,4);assert.match(advice.rationale.join(' '),/Impacto.*85\/100/);
  assert.equal(plan.subjects[0].minutes,90);
  const adjusted=applyAdaptivePlanningAdvice(plan,advice);
  assert.ok(adjusted);assert.equal(adjusted.weeklyPlannedMinutes,180);
  assert.equal(adjusted.subjects[0].minutes+adjusted.subjects[1].minutes,180);
  assert.equal(adjusted.items.reduce((sum,item)=>sum+item.minutes,0),180);
  assert.ok(adjusted.items.every(item=>Object.values(item.activityMix).reduce((sum,value)=>sum+value,0)===item.minutes));
  assert.equal(plan.subjects[0].minutes,90);
  assert.equal(applyAdaptivePlanningAdvice(adjusted,adjusted.adaptiveAdvice),null);
});

test('não aplica sugestão quando tópico de destino não comporta o bloco mínimo',()=>{
  const advice=buildAdaptivePlanningAdvice({plan,candidates});
  const constrained={...plan,items:plan.items.map(item=>item.id==='b'?{...item,capacityMinutes:95}:item)};
  assert.equal(applyAdaptivePlanningAdvice(constrained,advice),null);
});

test('histórico confiável orienta a lacuna e aparece na explicação sem mudar capacidade',()=>{
  const baseline=[candidates[0],{...candidates[1],examImpact:45,trend:{direction:'stable'}}];
  assert.equal(buildAdaptivePlanningAdvice({plan,candidates:baseline}).state,'stable');
  const historical={...baseline[1],topicName:'Juros Compostos',examImpact:70,examIntelligence:{usedHistory:true,presentExamCount:4,analyzedExamCount:5,confidenceLabel:'Moderada'}};
  const advice=buildAdaptivePlanningAdvice({plan,candidates:[baseline[0],historical]});
  assert.equal(advice.state,'proposal');
  assert.match(advice.rationale.join(' '),/4 de 5 provas/);
  const adjusted=applyAdaptivePlanningAdvice(plan,advice);
  assert.equal(adjusted.weeklyPlannedMinutes,plan.weeklyPlannedMinutes);
  assert.equal(adjusted.subjects.reduce((sum,item)=>sum+item.minutes,0),180);
});

test('nova importação não repete ajuste do mesmo par durante cooldown',()=>{
  const history=[{status:'applied',sourceSubjectId:'strong',targetSubjectId:'weak',decidedAt:'2026-09-20T12:00:00Z'}];
  const blocked=buildAdaptivePlanningAdvice({plan,candidates,history,today:'2026-09-25'});
  assert.equal(blocked.state,'stable');assert.match(blocked.reason,/menos de duas semanas/);
  const after=buildAdaptivePlanningAdvice({plan,candidates,history,today:'2026-10-05'});
  assert.equal(after.state,'proposal');
});

test('origem consolidada mantém prioridade se impacto supera o destino',()=>{
  const highImpactSource={...candidates[0],examImpact:95};
  assert.equal(buildAdaptivePlanningAdvice({plan,candidates:[highImpactSource,candidates[1]]}).state,'stable');
});

test('alta incidência com domínio alto não vence lacuna pessoal relevante',()=>{
  const three={weeklyPlannedMinutes:180,subjects:[{subjectId:'strong',subjectName:'Base',minutes:90},{subjectId:'frequent',subjectName:'Frequente',minutes:45},{subjectId:'needed',subjectName:'Lacuna',minutes:45}],items:[{id:'a',subjectId:'strong',minutes:90,capacityMinutes:120,activityMix:{theory:30,questions:30,reviews:30}},{id:'b',subjectId:'frequent',minutes:45,capacityMinutes:90,activityMix:{theory:15,questions:15,reviews:15}},{id:'c',subjectId:'needed',minutes:45,capacityMinutes:90,activityMix:{theory:15,questions:15,reviews:15}}]};
  const rows=[candidates[0],{subjectId:'frequent',mastery:91,evidenceStrength:.9,examImpact:95,trend:{direction:'stable'}},{subjectId:'needed',mastery:42,evidenceStrength:.9,examImpact:70,trend:{direction:'stable'}}];
  const advice=buildAdaptivePlanningAdvice({plan:three,candidates:rows});
  assert.equal(advice.state,'proposal');assert.equal(advice.to.subjectId,'needed');
});
