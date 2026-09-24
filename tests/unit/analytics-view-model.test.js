import test from 'node:test';
import assert from 'node:assert/strict';
import {buildHeatmapViewModel,buildDiagnosisViewModel,buildApprovalSignals} from '../../src/application/analytics/build-analytics-view-model.js';

test('prepara heatmap sem DOM e preserva ausência de atividade',()=>{
  const model=buildHeatmapViewModel({metric:'questions',selectedDate:'2026-09-02',summaries:[{date:'2026-09-01',questions:0},{date:'2026-09-02',questions:20}]});
  assert.equal(model.hasActivity,true);assert.equal(model.selected.date,'2026-09-02');assert.ok(model.cells[1].level>0);
});

test('limita as seções do diagnóstico no modelo de apresentação',()=>{
  const items=Array.from({length:6},(_,index)=>({id:index}));
  const model=buildDiagnosisViewModel({state:'estimated',bottlenecks:items,opportunities:items,criticalReviews:[],topicsAtRisk:items,weeklyFocus:items},{limit:4});
  assert.equal(model.sections.length,4);assert.ok(model.sections.every(section=>section.items.length===4));
});

test('gera sinais de aprovação explicáveis',()=>{
  const signals=buildApprovalSignals({simulados:{available:false},acertos:{available:true,raw:60,confidence:.2},edital:{available:true,raw:40}},{target:80});
  assert.deepEqual(signals.map(item=>item.level),['warning','warning','info','info']);
});

test('não interpreta pontuação baixa de evidência como risco alto',()=>{
  const model=buildDiagnosisViewModel({state:'estimated',bottlenecks:[{severity:92,risk:{value:92,evidence:{completeness:.2,evidenceLabel:'Baixa'}}}],opportunities:[{opportunityScore:88,confidence:.2}],criticalReviews:[],topicsAtRisk:[],weeklyFocus:[]});
  assert.equal(model.sections[0].items[0].signalLabel,'Evidência limitada');
  assert.equal(model.sections[0].items[0].signalTone,'neutral');
  assert.equal(model.sections[1].items[0].signalLabel,'Evidência limitada');
});

test('diagnóstico sem conteúdo explica o que falta e oferece destino de cadastro',()=>{
  const model=buildDiagnosisViewModel({state:'insufficient'},{hasTopics:false});
  assert.equal(model.state,'insufficient');
  assert.match(model.message,/Cadastre disciplinas e tópicos/);
  assert.deepEqual(model.action,{label:'Cadastrar disciplinas e tópicos',tab:'disciplinas'});
});

test('vazios do diagnóstico distinguem ausência de problema de configuração pendente',()=>{
  const model=buildDiagnosisViewModel({state:'estimated',bottlenecks:[],opportunities:[],criticalReviews:[],topicsAtRisk:[],weeklyFocus:[]});
  assert.match(model.sections[0].empty.message,/não indicam/);
  assert.equal(model.sections[0].empty.action,undefined);
  assert.match(model.sections[1].empty.message,/configure impacto e esforço/);
  assert.deepEqual(model.sections[1].empty.action,{label:'Configurar edital e esforço',tab:'metas'});
  assert.deepEqual(model.sections[3].empty.action,{label:'Revisar planejamento',tab:'metas'});
});

test('diagnóstico expõe apresentação semântica, evidências e ação contextual',()=>{
  const model=buildDiagnosisViewModel({state:'estimated',bottlenecks:[{subjectName:'Matemática',topicName:'Juros compostos',severity:84,reason:'Domínio abaixo do esperado',risk:{value:84,evidence:{completeness:.72,evidenceLabel:'Média'}}}],opportunities:[{subjectName:'Português',topicName:'Interpretação',opportunityScore:76,confidence:.2,estimatedMinutes:null,missingFactors:['examImpact']}],criticalReviews:[{subjectName:'Direito',topicName:'Atos administrativos',reviewUrgency:88,daysSinceContact:null,retention:null}],topicsAtRisk:[],weeklyFocus:[{subjectName:'Informática',percentage:40}]},{weeklyCapacityMinutes:300});
  const [bottleneck]=model.sections[0].items,[opportunity]=model.sections[1].items,[review]=model.sections[2].items,[focus]=model.sections[3].items;
  assert.deepEqual(bottleneck.presentation,{type:'bottleneck',severity:'high',confidence:.72,title:'Matemática — Juros compostos',summary:'Domínio abaixo do esperado',primaryReason:'Domínio abaixo do esperado',secondaryReasons:[],evidence:[{label:'Cobertura dos dados',value:'72%'},{label:'Força da evidência',value:'média'}],recommendedAction:{label:'Abrir Questões',type:'navigate',targetId:'questoes'}});
  assert.equal(opportunity.signalLabel,'Evidência limitada');
  assert.equal(opportunity.presentation.severity,'insufficient');
  assert.equal(opportunity.presentation.evidence.some(row=>row.label==='Esforço estimado'),false);
  assert.equal(review.presentation.recommendedAction.targetId,'agenda');
  assert.equal(review.presentation.evidence.some(row=>row.label==='Tempo sem contato'),false);
  assert.deepEqual(focus.presentation.evidence,[{label:'Parte do foco semanal',value:'40%'},{label:'Tempo estimado',value:'120 min'}]);
  assert.equal(focus.presentation.confidence,null);
});
