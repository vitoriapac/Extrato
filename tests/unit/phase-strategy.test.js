import test from 'node:test';
import assert from 'node:assert/strict';
import {buildPhaseStrategyProposal} from '../../src/domain/planning/phase-strategy.js';
import {createPhaseStrategyController} from '../../src/application/planning/phase-strategy-controller.js';
import {createStudyPlanService} from '../../src/application/planning/study-plan-service.js';

const today='2026-09-28';
function fixture(){return {
  plan:{id:'original',state:'proposal',weeklyPlannedMinutes:201,weeklyAvailableMinutes:300,subjects:[{subjectId:'s',minutes:201}],items:[{id:'i1',topicId:'t1',subjectId:'s',minutes:101,activityMix:{theory:61,questions:25,reviews:15}},{id:'i2',topicId:'t2',subjectId:'s',minutes:100,activityMix:{theory:60,questions:25,reviews:15}}]},
  candidates:[{topicId:'t1',mastery:60,coverage:80,retention:80,examImpact:80,evidenceStrength:.8},{topicId:'t2',mastery:80,coverage:100,retention:80,examImpact:80,evidenceStrength:.8}],today,daysToExam:20
}}
const sum=values=>values.reduce((a,b)=>a+b,0);
for(const [days,phase] of [[120,'construction'],[91,'construction'],[90,'consolidation'],[31,'consolidation'],[30,'final_stretch'],[8,'final_stretch'],[7,'final_review'],[1,'final_review'],[0,'final_review']])test(`estratégia respeita limite de ${days} dias`,()=>{
  const input=fixture(),before=structuredClone(input),result=buildPhaseStrategyProposal({...input,daysToExam:days});
  assert.equal(result.phase.state,phase);assert.ok(['stable','proposal'].includes(result.state));
  if(result.state==='proposal'){assert.equal(sum(result.plan.items.map(item=>item.minutes)),input.plan.weeklyPlannedMinutes);for(const item of result.plan.items)assert.equal(sum(Object.values(item.activityMix)),item.minutes);assert.deepEqual(result.plan.items.map(item=>item.topicId),input.plan.items.map(item=>item.topicId));}
  assert.deepEqual(input,before);
});
test('data passada, não finita ou ausente bloqueia proposta',()=>{for(const daysToExam of [-1,null,undefined,'',NaN,Infinity])assert.equal(buildPhaseStrategyProposal({...fixture(),daysToExam}).state,'insufficient')});
test('cobertura baixa preserva teoria mesmo na revisão final',()=>{const input=fixture();input.candidates[0].coverage=20;const result=buildPhaseStrategyProposal({...input,daysToExam:1});assert.ok(result.plan.items[0].activityMix.theory>=40);assert.match(result.changes[0].reasons.join(' '),/Cobertura baixa/)});
test('conteúdo coberto com baixa retenção recebe mais revisão que manutenção',()=>{const input=fixture();input.plan.items[1].covered=true;const normal=buildPhaseStrategyProposal(input);input.candidates[1].retention=40;const low=buildPhaseStrategyProposal(input);assert.ok(low.plan.items[1].activityMix.reviews>normal.plan.items[1].activityMix.reviews);assert.equal(low.plan.items[1].activityMix.theory,0)});
test('lacuna de alto impacto protege base mesmo quando marcada coberta',()=>{const input=fixture();input.plan.items[0].covered=true;input.candidates[0].mastery=35;const result=buildPhaseStrategyProposal({...input,daysToExam:1});assert.ok(result.plan.items[0].activityMix.theory>=35);assert.match(result.changes[0].reasons.join(' '),/preservar teoria/)});
test('domínio adequado e conteúdo coberto recebem manutenção',()=>{const input=fixture();input.plan.items[1].covered=true;const result=buildPhaseStrategyProposal(input);assert.deepEqual(result.plan.items[1].activityMix,{theory:0,questions:55,reviews:45})});
test('evidência insuficiente, duplicada ou externa ao plano não permite redistribuição',()=>{const input=fixture();for(const candidates of [[],[input.candidates[0]],[input.candidates[0],input.candidates[0]],[input.candidates[0],{...input.candidates[1],topicId:'outside'}],input.candidates.map(item=>({...item,evidenceStrength:.1}))])assert.equal(buildPhaseStrategyProposal({...input,candidates}).state,'insufficient')});
test('tópico adicional sem evidência conserva a divisão original',()=>{const input=fixture();input.plan.items.push({id:'i3',topicId:'t3',minutes:10,activityMix:{theory:7,questions:2,reviews:1}});input.plan.weeklyPlannedMinutes+=10;const result=buildPhaseStrategyProposal(input);assert.deepEqual(result.plan.items.at(-1),input.plan.items.at(-1))});
test('capacidade atual, soma, valores negativos e mix inválido bloqueiam proposta',()=>{const input=fixture();assert.equal(buildPhaseStrategyProposal({...input,weeklyCapacityMinutes:200}).state,'insufficient');for(const mutate of [plan=>plan.items[0].minutes++,plan=>plan.items[0].activityMix.theory=-1,plan=>delete plan.items[0].activityMix,plan=>plan.items[0].activityMix.questions=NaN]){const next=fixture();mutate(next.plan);assert.equal(buildPhaseStrategyProposal(next).state,'insufficient')}});
test('cooldown bloqueia em 13 dias e libera no 14º, inclusive após reversão',()=>{for(const status of ['applied','reverted']){assert.equal(buildPhaseStrategyProposal({...fixture(),history:[{status,createdAt:'2026-09-15T12:00:00-03:00'}]}).state,'cooldown');assert.equal(buildPhaseStrategyProposal({...fixture(),history:[{status,createdAt:'2026-09-14T12:00:00-03:00'}]}).state,'proposal')}});

function controllerFixture(){
  const input=fixture(),plans=[input.plan],snapshots=[{id:'old',score:50}],sessions=[{id:'completed',durationSeconds:1200}],dailyPlans=[{id:'daily',items:[{id:'done',status:'completed',sessionIds:['completed']}]}];
  let capacity=300,sequence=0;
  const service=createStudyPlanService({repository:{saveStudyPlan:plan=>{plans.push(plan);return plan},getActiveStudyPlan:()=>plans.at(-1),getStudyPlans:()=>plans},clock:{nowISO:()=>today+'T12:00:00-03:00'},idGenerator:prefix=>prefix+'-'+ ++sequence});
  const getProposal=()=>buildPhaseStrategyProposal({...input,plan:plans.at(-1),weeklyCapacityMinutes:capacity});
  const controller=createPhaseStrategyController({getProposal,getLatestPlan:()=>plans.at(-1),getPlans:()=>plans,confirmPlan:service.confirm,getCapacity:()=>capacity,getExamDate:()=> '2026-10-18',clock:{nowISO:()=>today+'T12:00:00-03:00'},onBeforeChange:()=>snapshots.push({id:'new-'+snapshots.length})});
  return {controller,input,plans,snapshots,sessions,dailyPlans,setCapacity:value=>{capacity=value}};
}
test('prévia não aplica; confirmação e reversão criam versões sem alterar história',()=>{
  const data=controllerFixture(),before=structuredClone({plan:data.plans[0],snapshot:data.snapshots[0],sessions:data.sessions,dailyPlans:data.dailyPlans});
  assert.equal(data.controller.confirm().state,'changed');assert.equal(data.plans.length,1);
  data.controller.preview();assert.equal(data.plans.length,1);
  assert.equal(data.controller.confirm().state,'applied');assert.equal(data.plans.length,2);
  assert.equal(buildPhaseStrategyProposal({...data.input,plan:data.plans.at(-1)}).state,'cooldown');
  assert.equal(data.controller.revert().state,'reverted');assert.equal(data.plans.length,3);
  assert.deepEqual(data.plans.at(-1).items.map(item=>item.activityMix),before.plan.items.map(item=>item.activityMix));
  assert.equal(buildPhaseStrategyProposal({...data.input,plan:data.plans.at(-1)}).state,'cooldown');
  assert.deepEqual({plan:data.plans[0],snapshot:data.snapshots[0],sessions:data.sessions,dailyPlans:data.dailyPlans},before);
  assert.equal(data.controller.revert().state,'blocked');
});
test('capacidade ou evidências alteradas exigem revisão; reversão respeita capacidade',()=>{
  const data=controllerFixture();data.controller.preview();data.setCapacity(250);assert.equal(data.controller.confirm().state,'changed');assert.equal(data.plans.length,1);assert.equal(data.controller.confirm().state,'applied');data.setCapacity(100);assert.equal(data.controller.revert().state,'blocked');assert.equal(data.plans.length,2);
  const next=controllerFixture();next.controller.preview();next.input.candidates[0].mastery=61;assert.equal(next.controller.confirm().state,'changed');assert.equal(next.plans.length,1);
});

import {PHASE_ACTIVITY_RATIOS,PHASE_ACTIVITY_KEYS} from '../../src/domain/planning/phase-strategy-policy.js';
test('política por fase é centralizada, imutável e conserva as proporções existentes',()=>{assert.deepEqual(PHASE_ACTIVITY_KEYS,['theory','questions','reviews']);for(const weights of Object.values(PHASE_ACTIVITY_RATIOS)){assert.ok(Object.isFrozen(weights));assert.ok(Math.abs(sum(weights)-1)<.00001)}assert.ok(PHASE_ACTIVITY_RATIOS.final_review[2]>PHASE_ACTIVITY_RATIOS.construction[2]);assert.ok(PHASE_ACTIVITY_RATIOS.final_stretch[0]<PHASE_ACTIVITY_RATIOS.construction[0]);});
test('estratégia mantém horas por disciplina e não transfere minutos para conteúdo de menor impacto',()=>{const input=fixture();const original=structuredClone(input.plan);for(const days of [120,60,20,5]){const result=buildPhaseStrategyProposal({...input,daysToExam:days});if(result.state==='stable')continue;assert.equal(result.plan.weeklyPlannedMinutes,original.weeklyPlannedMinutes);assert.equal(result.plan.weeklyAvailableMinutes,original.weeklyAvailableMinutes);assert.deepEqual(result.plan.subjects,original.subjects);assert.deepEqual(result.plan.items.map(item=>item.minutes),original.items.map(item=>item.minutes));}assert.deepEqual(input.plan,original)});
