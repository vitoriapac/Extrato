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
