import test from 'node:test';
import assert from 'node:assert/strict';
import {buildConsolidatedSignals} from '../../src/application/diagnostics/build-consolidated-signals.js';
import {adaptDiagnosticSignals} from '../../src/application/diagnostics/adapt-diagnostic-signals.js';
import {selectPrimarySignal} from '../../src/domain/diagnostics/signal-precedence.js';
import {buildConsolidatedDiagnosis} from '../../src/application/diagnostics/build-consolidated-diagnosis.js';
import {buildTopicGapInputs} from '../../src/application/analytics/build-topic-gap-inputs.js';
import {buildGapMap} from '../../src/domain/analytics/gap-map.js';
const entity={subjectId:'s',topicId:'t',name:'Juros',examTags:['bb']};
const context={eligibleEntities:[entity,{subjectId:'s',topicId:null,granularity:'subject',name:'Matemática'}],activeExamTags:['bb']};
const signal=(kind,extra={})=>({id:kind,source:'fixture',subjectId:'s',topicId:'t',kind,active:true,availability:'available',severity:'important',evidence:{strength:.5,observationIds:['q1']},activeExamTags:['bb'],...extra});
const build=(signals,extra={})=>buildConsolidatedSignals({...context,signals,...extra});

test('consolidação escolhe principal, mantém fontes e não soma scores ou amostras',()=>{
  const signals=[signal('high-priority',{priority:99,evidence:{strength:.9,observationIds:['q1']}}),signal('critical-gap',{severity:'critical'}),signal('consolidation-risk')],before=structuredClone(signals);
  const row=build(signals,{priorities:[{...entity,score:72,evidenceStrength:.5}]}).topics[0];
  assert.equal(row.primarySignal,'consolidation-risk');assert.equal(row.priority,72);assert.equal(row.evidenceQuality,'moderate');assert.equal(row.evidence.strength,.5);
  assert.deepEqual(row.evidence.observationIds,['q1']);assert.ok(row.supportingSignals.includes('critical-gap'));assert.deepEqual(signals,before);
  assert.equal(row.sources.filter(item=>item.source==='fixture').length,3);
});
test('precedência ignora sinais inativos e não promove incidência isolada',()=>{
  const row=build([signal('consolidation-risk',{active:false}),signal('priority-review'),signal('high-incidence')]).topics[0];
  assert.equal(row.primarySignal,'priority-review');assert.equal(build([signal('high-incidence')]).topics[0].state,'unassessed');
  assert.equal(selectPrimarySignal([]),null);
});
test('platô de disciplina não é copiado para seus tópicos nem duplicado nas contagens',()=>{
  const result=build([signal('plateau',{topicId:null,granularity:'subject'}),signal('critical-gap',{severity:'critical'})]);
  assert.equal(result.subjects[0].primarySignal,'plateau');assert.equal(result.topics[0].primarySignal,'critical-gap');
  assert.equal(result.summary.subjects.attention,1);assert.equal(result.summary.topics.attention,1);
  assert.equal(result.topics[0].supportingSignals.includes('plateau'),false);
});
test('duplicatas não aumentam contagens, razões ou evidência',()=>{
  const input=signal('critical-gap',{reasons:['Baixo domínio']}),result=build([input,input,structuredClone(input)]);
  assert.equal(result.topics[0].signals.length,1);assert.deepEqual(result.topics[0].reasons,['Baixo domínio']);assert.equal(result.summary.topics.attention,1);
});

test('mesmo sinal em períodos diferentes preserva proveniência e usa o período mais recente',()=>{
  const older=signal('plateau',{id:'same',period:{start:'2026-08-01',end:'2026-08-28'},evidence:{strength:.8}}),current=signal('plateau',{id:'same',period:{start:'2026-09-01',end:'2026-09-28'},evidence:{strength:.4}});
  const result=build([older,current]).topics[0],reverse=build([current,older]).topics[0];
  assert.equal(result.signals.length,2);assert.equal(result.evidence.strength,.4);assert.equal(result.primarySource.period.end,'2026-09-28');
  assert.equal(reverse.evidence.strength,result.evidence.strength);assert.equal(reverse.primarySource.period.end,result.primarySource.period.end);
});
test('escopo exclui outro concurso, agregados de escopo diferente e entidades arquivadas',()=>{
  assert.equal(build([signal('plateau',{topicId:null,granularity:'subject',activeExamTags:['caixa']})]).subjects[0].primarySignal,null);
  assert.equal(build([signal('critical-gap',{activeExamTags:['bb','caixa']})]).topics[0].primarySignal,null);
  assert.equal(build([signal('critical-gap')],{eligibleEntities:[{...entity,archived:true}]}).rows.length,0);
  assert.equal(build([signal('critical-gap')],{eligibleEntities:[{...entity,examTags:['caixa']}]}).rows.length,0);
  assert.equal(build([signal('critical-gap',{subjectId:'wrong'})]).topics[0].primarySignal,null);
});
test('agregado legado de disciplina sem escopo exige contexto verificado',()=>{
  const legacy=signal('plateau',{topicId:null,granularity:'subject',activeExamTags:null});
  assert.equal(build([legacy]).subjects[0].state,'unassessed');assert.equal(build([legacy],{inputsAlreadyScoped:true}).subjects[0].primarySignal,'plateau');
});
test('completude da lacuna não é convertida em força da evidência',()=>{
  const result=buildConsolidatedSignals({...context,inputsAlreadyScoped:true,gapSignals:{items:[{...entity,id:'g',severity:'critical',mastery:20,examImpact:90,confidence:1}]}});
  assert.equal(result.topics[0].primarySignal,'critical-gap');assert.equal(result.topics[0].evidence.strength,null);assert.equal(result.topics[0].evidence.completeness,1);assert.equal(result.topics[0].evidenceQuality,'unassessed');
});
test('lacuna e cobertura críticas usam condições existentes e não tratam null como zero',()=>{
  const gap={...entity,severity:'critical',examImpact:90,mastery:null,coverage:null,confidence:.8};
  assert.equal(adaptDiagnosticSignals({gapSignals:[gap]}).length,0);
  assert.equal(adaptDiagnosticSignals({gapSignals:[{...gap,mastery:20}]}).find(item=>item.kind==='critical-gap').severity,'critical');
  assert.equal(adaptDiagnosticSignals({gapSignals:[{...gap,coverage:0}]}).find(item=>item.kind==='critical-coverage').severity,'important');
  assert.equal(adaptDiagnosticSignals({gapSignals:[{...gap,mastery:20,examImpact:30}]}).length,0);
});
test('review e incidência são contexto e não um segundo ranking',()=>{
  const result=buildConsolidatedSignals({...context,inputsAlreadyScoped:true,reviewSignals:[{...entity,reviewUrgency:80,examImpact:90}],examIntelligence:[{...entity,presencePercent:100,confidenceLabel:'Alta'}]});
  assert.equal(result.topics[0].primarySignal,'priority-review');assert.equal(result.topics[0].evidenceQuality,'unassessed');assert.ok(result.topics[0].supportingSignals.includes('high-incidence'));
  assert.equal(adaptDiagnosticSignals({reviewSignals:[{...entity,reviewUrgency:90,examImpact:20}]}).length,0);
});
test('sem alerta ou sem registros não significa sob controle',()=>{
  const result=build([]);assert.equal(result.summary.topics.controlled,0);assert.equal(result.summary.topics.insufficient,1);
  assert.equal(buildConsolidatedSignals({}).state,'insufficient');
  const row=buildConsolidatedSignals({...context,priorities:[{...entity,score:20,mastery:90,retention:85,evidenceStrength:.8}]}).topics[0];
  assert.equal(row.state,'controlled');assert.equal(row.primarySignal,'maintenance');
});
test('evidência limitada conserva sua prioridade registrada sem concluir manutenção',()=>{
  const row=buildConsolidatedSignals({...context,priorities:[{...entity,score:20,mastery:90,retention:85,evidenceStrength:.2}]}).topics[0];
  assert.equal(row.primarySignal,'collect-evidence');assert.equal(row.state,'insufficient');assert.equal(row.priority,20);
  const urgent=buildConsolidatedSignals({...context,priorities:[{...entity,score:90,evidenceStrength:.1}]}).topics[0];
  assert.equal(urgent.primarySignal,'collect-evidence');assert.equal(urgent.priority,90);
});
test('ordem entre tópicos reutiliza scores do motor e desempate estável',()=>{
  const other={subjectId:'s',topicId:'z',examTags:['bb']},priorities=[{...entity,score:70,evidenceStrength:.5},{...other,score:90,evidenceStrength:.5}];
  const input={...context,eligibleEntities:[entity,other],priorities};
  assert.deepEqual(buildConsolidatedSignals(input).topics.map(item=>item.topicId),['z','t']);
  const equal={...input,priorities:priorities.map(item=>({...item,score:70}))};
  assert.deepEqual(buildConsolidatedSignals(equal),buildConsolidatedSignals({...equal,priorities:[...equal.priorities].reverse(),eligibleEntities:[...equal.eligibleEntities].reverse()}));
});
test('ação usa somente identidade existente, elegível, pendente e do mesmo tópico',()=>{
  const action={...entity,id:'candidate',recommendationId:'existing',estimatedMinutes:30};
  assert.equal(build([],{recommendations:[action]}).topics[0].recommendedActionId,'existing');
  for(const invalid of [{...action,status:'dismissed'},{...action,status:'expired'},{...action,status:'executed'},{...action,completed:true},{...action,archived:true},{...action,estimatedMinutes:0},{...action,activeExamTags:['caixa']},{...action,blockedPrerequisites:['base']},{...action,topicId:'other'}])assert.equal(build([],{recommendations:[invalid]}).topics[0].recommendedActionId,null);
});
test('redistribuição guarda papéis e apenas transferências reais, sem inventar ação de estudo',()=>{
  const cost={id:'cost',state:'proposal',transferMinutes:30,weeklyBudgetMinutes:240,from:{subjectId:'s',beforeMinutes:120,afterMinutes:90},to:{subjectId:'other',beforeMinutes:120,afterMinutes:150}};
  const result=buildConsolidatedSignals({...context,inputsAlreadyScoped:true,eligibleEntities:[{subjectId:'s'},{subjectId:'other'}],opportunityCosts:[cost]});
  const donor=result.subjects.find(item=>item.subjectId==='s'),recipient=result.subjects.find(item=>item.subjectId==='other');
  assert.ok(donor.supportingSignals.includes('redistribution-source'));assert.ok(recipient.supportingSignals.includes('redistribution-target'));assert.equal(donor.primarySignal,null);assert.equal(recipient.recommendedActionId,null);
  assert.equal(adaptDiagnosticSignals({opportunityCosts:[{...cost,to:{...cost.to,afterMinutes:180}}]}).length,0);
});

test('montagem do diagnóstico reutiliza produtores e preserva as entradas e suas prioridades',()=>{
  const candidate={...entity,score:85,mastery:30,retention:40,examImpact:90,coverage:0,evidenceStrength:.8};
  const input={candidates:[candidate,{...candidate,subjectId:'outside',topicId:'unscoped'}],subjects:[{id:'s',name:'Matemática'},{id:'outside',name:'Fora'}],eligibleTopics:[{...entity,id:'t'}],activeExamTags:['bb']},before=structuredClone(input);
  const result=buildConsolidatedDiagnosis(input);assert.equal(result.topics.length,1);assert.equal(result.topics[0].priority,85);
  assert.equal(result.topics[0].primarySignal,'critical-gap');assert.equal(result.subjects.length,1);assert.deepEqual(input,before);
});

test('mapeamento compartilhado preserva exatamente fatores e score do mapa de lacunas existente',()=>{
  const candidate={...entity,mastery:20,examImpact:90,retention:40,coverage:0,trendRisk:null,risk:{value:70},accuracyTarget:75,evidenceStrength:.8};
  const inputs=buildTopicGapInputs([candidate]),reference=buildGapMap([{mastery:20,examImpact:90,retention:40,coverage:0,trendRisk:70}]).items[0],actual=buildGapMap(inputs).items[0];
  assert.deepEqual(actual.factors,reference.factors);assert.equal(actual.priority,reference.priority);assert.equal(actual.confidence,reference.confidence);
  assert.equal(inputs[0].subjectId,'s');assert.equal(inputs[0].accuracyTarget,75);assert.equal(inputs[0].evidenceStrength,.8);
  assert.equal(buildTopicGapInputs([{...candidate,trendRisk:0}])[0].trendRisk,0);
});
