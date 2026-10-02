import test from 'node:test';
import assert from 'node:assert/strict';
import {buildRecoveryPlan} from '../../src/application/recovery/build-recovery-plan.js';
import {applyRecoveryPlan} from '../../src/application/recovery/apply-recovery-plan.js';
import {validateRecoveryAllocation} from '../../src/application/recovery/recovery-invariants.js';
import {createRecoveryStateCommitter} from '../../src/application/recovery/recovery-state-committer.js';
import {revertRecoveryPlan} from '../../src/application/recovery/revert-recovery-plan.js';
import {createRecoveryController} from '../../src/ui/controllers/recovery-controller.js';

function setup(overrides={}){
  const plan={id:'original',state:'proposal',weeklyPlannedMinutes:180,weeklyAvailableMinutes:180,examDate:'2026-12-01',activeExamTags:['bb'],
    subjects:[{subjectId:'source',minutes:90},{subjectId:'target',minutes:90}],
    items:[{id:'source-item',topicId:'source-topic',subjectId:'source',minutes:90,capacityMinutes:120,activityMix:{theory:30,questions:30,reviews:30}},
      {id:'target-item',topicId:'target-topic',subjectId:'target',minutes:90,capacityMinutes:180,activityMix:{theory:30,questions:30,reviews:30}}]};
  let live={studyPlans:[plan],adaptivePlanningHistory:[{id:'old-decision'}],readinessSnapshots:[{id:'old-snapshot'}],
    studySessions:[{id:'session',durationSeconds:3600}],dailyPlans:[{id:'day',items:[{status:'completed'}]}],
    examBlueprint:{activeExamTags:['bb'],targetScore:80},examDate:'2026-12-01',metas:{metaAprovacao:80},algorithmVersions:{recommendations:3}};
  const trajectory={status:'attention',exam:{date:'2026-12-01',phase:'consolidation'},current:{targetScore:80},
    topicRisks:[{subjectId:'target',topicId:'target-topic',examImpact:85}]};
  const preview=buildRecoveryPlan({currentPlan:plan,trajectory,weeklyCapacityMinutes:180,activeExamTags:['bb'],today:'2026-10-02',priorities:[
    {subjectId:'source',topicId:'source-topic',mastery:90,evidenceStrength:.8,examImpact:40,trend:{direction:'stable'}},
    {subjectId:'target',topicId:'target-topic',mastery:48,evidenceStrength:.8,examImpact:85,trend:{direction:'down'}}]});
  let counter=0;const saved=[],clock={nowISO:()=> '2026-10-02T12:00:00Z'},idGenerator=prefix=>`${prefix}-${++counter}`;
  const commit=createRecoveryStateCommitter({getState:()=>live,publish:value=>{live=value},clock,
    persist:async value=>{saved.push(JSON.parse(value));return true},...overrides.committer});
  const services={clock,idGenerator,buildReadinessSnapshot:()=>({id:idGenerator('snapshot'),date:'2026-10-02'}),commitState:commit,...overrides.services};
  return {plan,preview,services,saved,getState:()=>live,setState:value=>{live=value},
    apply:patch=>applyRecoveryPlan({state:live,currentPlan:plan,currentPreview:preview,displayedSignature:preview.signature,activeExamTags:['bb'],services,...patch})};
}

test('Recovery publica plano, decisão e snapshot juntos após gravação, preservando o passado',async()=>{
  const f=setup(),before=structuredClone(f.getState()),result=await f.apply();
  assert.equal(result.status,'applied');assert.equal(f.saved.length,1);
  assert.equal(f.saved[0].adaptivePlanningHistory.at(-1).planId,f.saved[0].studyPlans.at(-1).id);
  assert.deepEqual(f.getState().studySessions,before.studySessions);assert.deepEqual(f.getState().dailyPlans,before.dailyPlans);
  assert.deepEqual(f.getState().studyPlans[0],before.studyPlans[0]);assert.deepEqual(f.getState().adaptivePlanningHistory[0],before.adaptivePlanningHistory[0]);
});

test('assinatura antiga é recusada sem tentar gravação',async()=>{
  const f=setup(),before=structuredClone(f.getState());
  assert.equal((await f.apply({displayedSignature:'old'})).reasonCode,'stale_preview');
  assert.equal(f.saved.length,0);assert.deepEqual(f.getState(),before);
});

for(const [name,services,reason] of [
  ['auditoria inválida',{buildDecisionRecord:()=>null},'invalid_audit_record'],
  ['snapshot inválido',{buildReadinessSnapshot:()=>null},'invalid_snapshot'],
  ['confirmação recusada',{confirmPlan:()=>null},'confirmation_failed'],
  ['confirmação falha depois de modificar a cópia',{confirmPlan:(_plan,draft)=>{draft.studyPlans.push({id:'partial'});throw Error('failure')}},'application_failed'],
  ['confirmação altera sessão concluída',{confirmPlan:(plan,draft)=>{draft.studySessions[0].durationSeconds=0;draft.studyPlans.push(plan);return plan}},'protected_state_changed']
])test(`${name} preserva estado e não grava Recovery`,async()=>{
  const f=setup({services}),before=structuredClone(f.getState());assert.equal((await f.apply()).reasonCode,reason);
  assert.equal(f.saved.length,0);assert.deepEqual(f.getState(),before);
});

test('falha de persistência não publica plano, decisão ou snapshot',async()=>{
  for(const persist of [async()=>false,async()=>{throw Error('quota')}]){
    const f=setup({committer:{persist}}),before=structuredClone(f.getState());
    assert.ok(['storage_failure','storage_restore_failure'].includes((await f.apply()).reasonCode));assert.deepEqual(f.getState(),before);
  }
});

test('backend que grava antes de lançar erro é restaurado sem publicar Recovery',async()=>{
  const writes=[];const f=setup({committer:{persist:async value=>{writes.push(JSON.parse(value));if(writes.length===1)throw Error('after write');return true}}});
  const before=structuredClone(f.getState());assert.equal((await f.apply()).reasonCode,'storage_failure');
  assert.deepEqual(f.getState(),before);assert.equal(writes.at(-1).studyPlans.length,1);assert.equal(writes.at(-1).adaptivePlanningHistory.length,1);
});

test('gravação pendente não altera memória; edição concorrente cancela e restaura dados atuais',async()=>{
  let resolveWrite,started;const startedPromise=new Promise(resolve=>{started=resolve}),writes=[];
  const f=setup({committer:{persist:async value=>{writes.push(JSON.parse(value));if(writes.length===1){started();return new Promise(resolve=>{resolveWrite=resolve})}return true}}});
  const before=structuredClone(f.getState()),operation=f.apply();await startedPromise;
  assert.deepEqual(f.getState(),before);
  f.getState().studySessions.push({id:'new-session',durationSeconds:600});resolveWrite(true);
  assert.equal((await operation).reasonCode,'state_changed');assert.equal(f.getState().studyPlans.length,1);
  assert.deepEqual(writes.at(-1).studySessions,f.getState().studySessions);assert.equal(writes.at(-1).studyPlans.length,1);
});

test('invariantes rejeitam alterações reais que a lista de apresentação não revela',()=>{
  const f=setup(),before=structuredClone(f.plan),after=structuredClone(f.preview.proposedPlan);
  after.items[0].capacityMinutes+=1;
  assert.equal(validateRecoveryAllocation({before,after,fromSubjectId:'source',toSubjectId:'target',minutes:f.preview.transferMinutes,activeExamTags:['bb']}).valid,false);
  after.items[0].capacityMinutes=before.items[0].capacityMinutes;after.examDate='2026-11-01';
  assert.equal(validateRecoveryAllocation({before,after,fromSubjectId:'source',toSubjectId:'target',minutes:f.preview.transferMinutes,activeExamTags:['bb']}).reasonCode,'scope_changed');
});

test('reversão restaura alocações em nova versão e preserva execução posterior e auditoria original',async()=>{
  const f=setup(),applied=await f.apply();
  f.getState().studySessions.push({id:'executed-after-recovery',durationSeconds:3600,subjectId:'target',topicId:'target-topic'});
  f.getState().dailyPlans[0].items.push({id:'executed-item',status:'completed',executedSeconds:3600});
  const before=structuredClone(f.getState());
  const result=await revertRecoveryPlan({state:f.getState(),currentPlan:applied.plan,decisionId:applied.decisionRecord.id,
    activeExamTags:['bb'],services:f.services});
  assert.equal(result.status,'reverted');assert.deepEqual(result.plan.subjects,f.plan.subjects);
  assert.deepEqual(result.plan.items.map(({topicId,minutes,activityMix})=>({topicId,minutes,activityMix})),f.plan.items.map(({topicId,minutes,activityMix})=>({topicId,minutes,activityMix})));
  assert.equal(result.plan.weeklyAvailableMinutes,f.plan.weeklyAvailableMinutes);
  assert.deepEqual(f.getState().studySessions,before.studySessions);assert.deepEqual(f.getState().dailyPlans,before.dailyPlans);
  assert.deepEqual(f.getState().studyPlans.slice(0,-1),before.studyPlans);
  assert.equal(result.decisionRecord.originalDecisionId,applied.decisionRecord.id);assert.ok(result.decisionRecord.revertReason);
  assert.deepEqual(result.decisionRecord.explanationSnapshot,applied.decisionRecord.explanationSnapshot);
});

test('reversão recusa plano posterior, escopo diferente e não reaplica decisão revertida',async()=>{
  const f=setup(),applied=await f.apply(),before=structuredClone(f.getState());
  const args={state:f.getState(),currentPlan:applied.plan,decisionId:applied.decisionRecord.id,activeExamTags:['bb'],services:f.services};
  assert.equal((await revertRecoveryPlan({...args,currentPlan:{...applied.plan,id:'newer'}})).reasonCode,'stale_plan');
  assert.equal((await revertRecoveryPlan({...args,activeExamTags:['caixa']})).reasonCode,'scope_changed');
  assert.deepEqual(f.getState(),before);
  assert.equal((await revertRecoveryPlan(args)).status,'reverted');
  assert.equal((await revertRecoveryPlan({...args,state:f.getState(),currentPlan:f.getState().studyPlans.at(-1)})).reasonCode,'stale_plan');
});

test('falha de gravação durante reversão preserva plano aplicado e decisão',async()=>{
  const f=setup(),applied=await f.apply(),before=structuredClone(f.getState());
  const commitState=createRecoveryStateCommitter({getState:f.getState,publish:f.setState,clock:f.services.clock,persist:async()=>false});
  const result=await revertRecoveryPlan({state:f.getState(),currentPlan:applied.plan,decisionId:applied.decisionRecord.id,
    activeExamTags:['bb'],services:{...f.services,commitState}});
  assert.equal(result.reasonCode,'storage_failure');assert.deepEqual(f.getState(),before);
});

test('controller bloqueia Demo e duplo envio durante gravação, liberando nova tentativa',async()=>{
  let release;const f=setup({committer:{persist:()=>new Promise(resolve=>{release=resolve})}});
  let disabled=true;
  const controller=createRecoveryController({getState:f.getState,getPlan:()=>f.plan,getActiveExamTags:()=>['bb'],
    getPreview:()=>f.preview,services:f.services,isDisabled:()=>disabled});
  assert.equal(controller.preview().canApply,false);assert.equal((await controller.apply(f.preview.signature)).reasonCode,'demo_mode');
  disabled=false;const signature=controller.preview().signature,first=controller.apply(signature);
  await Promise.resolve();assert.equal((await controller.apply(signature)).reasonCode,'operation_pending');
  release(false);assert.equal((await first).reasonCode,'storage_failure');
  assert.equal((await controller.apply('stale')).reasonCode,'stale_preview');
});

test('controller invalida prévia quando meta muda mesmo que a alocação permaneça equivalente',async()=>{
  const f=setup(),controller=createRecoveryController({getState:f.getState,getPlan:()=>f.plan,getActiveExamTags:()=>['bb'],getPreview:()=>f.preview,services:f.services});
  const signature=controller.preview().signature;f.getState().metas.metaAprovacao=85;
  assert.equal((await controller.apply(signature)).reasonCode,'stale_preview');assert.equal(f.saved.length,0);
});

test('confirmação que modifica alocação preparada é rejeitada antes da gravação',async()=>{
  const f=setup({services:{confirmPlan:(proposal,draft)=>{const plan=structuredClone(proposal);plan.id='changed';plan.items[0].minutes-=1;plan.items[1].minutes+=1;draft.studyPlans.push(plan);return plan}}}),before=structuredClone(f.getState());
  assert.equal((await f.apply()).reasonCode,'confirmation_changed_allocation');assert.deepEqual(f.getState(),before);assert.equal(f.saved.length,0);
});

test('mudança enquanto aguarda a fila cancela Recovery antes de persistir a proposta',async()=>{
  let start;const f=setup({committer:{runExclusive:task=>new Promise(resolve=>{start=()=>resolve(task())})}});
  const operation=f.apply();f.getState().examDate='2026-11-01';start();
  assert.equal((await operation).reasonCode,'state_changed');assert.equal(f.saved.length,0);assert.equal(f.getState().studyPlans.length,1);
});

test('reversão da adaptação convencional continua disponível no armazenamento isolado da Demo',async()=>{
  const f=setup(),applied=await f.apply();delete f.getState().adaptivePlanningHistory.at(-1).decisionType;
  const controller=createRecoveryController({getState:f.getState,getPlan:()=>f.getState().studyPlans.at(-1),getActiveExamTags:()=>['bb'],getPreview:()=>f.preview,services:f.services,isDisabled:()=>true});
  assert.equal((await controller.revert(applied.decisionRecord.id)).status,'reverted');
  assert.deepEqual(f.getState().studyPlans.at(-1).subjects,f.plan.subjects);
});
