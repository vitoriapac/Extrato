import test from 'node:test';
import assert from 'node:assert/strict';
import {buildNextBestAction,NEXT_BEST_ACTION_STATES} from '../../src/application/diagnostics/build-next-best-action.js';
import {buildReadinessChangeExplanation} from '../../src/application/readiness/build-readiness-change-explanation.js';
import {renderPerformanceOverview} from '../../src/ui/performance/performance-overview-renderer.js';
import {createPerformanceController} from '../../src/ui/controllers/performance-controller.js';
import {renderReadinessOverview} from '../../src/ui/renderers/readiness-overview-renderer.js';
import {renderWeeklyCloseSummary} from '../../src/ui/renderers/overview-renderer.js';

test('resumos de Prontidão e fechamento preservam valores, insuficiência e detalhe acessível',()=>{
  const input={m:{retencao:{available:false}},score:0,level:{},confidence:{nivel:'Baixa',value:.2},projection:{available:false,calibration:{available:false}},projectionHistory:{total:0},factors:[],approvalState:'empty',approvalLabel:'Aguardando dados',diagnostics:[],candidates:[]};
  const before=structuredClone(input);
  const html=renderReadinessOverview(input,{escapeHtml:String,escapeAttr:String,getMetricDataState:()=>{},metricStateLabel:()=>{}});
  assert.match(html,/Dados insuficientes para estimar/);assert.match(html,/data-performance-jump="overview"/);
  assert.doesNotMatch(html,/<details[^>]* open/);
  assert.match(html,/readiness-investigation/);assert.deepEqual(input,before);
  const summary=renderWeeklyCloseSummary({state:'ready',questions:{resolved:31,accuracy:68},mainRisk:{message:'risco completo'},adherence:{model:{summary:{temporalAdherence:75}}}},{escapeHtml:String});
  assert.match(summary,/75%/);assert.match(summary,/68%/);assert.doesNotMatch(summary,/risco completo/);
});

test('atalho de investigação mantém período, disciplina e comparação no controller',()=>{
  const handlers={};let state={section:'overview',period:'90',comparePrevious:true,subjectId:'math',topicId:'interest'};let rendered=0;
  const surface={addEventListener:(type,handler)=>{handlers[type]=handler}};
  const document={addEventListener:()=>{},getElementById:id=>id==='performancePage'?surface:null};
  createPerformanceController({document,getViewState:()=>state,setViewState:value=>{state=value},render:()=>{rendered++},activateTab:()=>{throw Error('Must keep performance context')}}).register();
  handlers.click({target:{closest:selector=>selector.includes('[data-performance-investigate]')?{dataset:{performanceInvestigate:'subjects'}}:null}});
  assert.deepEqual(state,{section:'subjects',period:'90',comparePrevious:true,subjectId:'math',topicId:'interest'});
  assert.equal(rendered,1);
});

test('visão geral de desempenho orienta investigação antes do histórico sem modificar o modelo',()=>{
  const model={current:{},weekly:[],changes:[],history:[],readiness:null};
  const before=structuredClone(model);
  const html=renderPerformanceOverview(model,{range:{comparePrevious:false},today:'2026-10-05',activeExamTags:[],formatDate:value=>value,escapeHtml:value=>String(value)});
  assert.ok(html.indexOf('Resumo interpretativo')<html.indexOf('Investigar o resultado'));
  assert.ok(html.indexOf('Investigar o resultado')<html.indexOf('Prontidão ao longo do tempo'));
  for(const section of ['subjects','questions','simulations','consistency'])assert.match(html,new RegExp(`data-performance-investigate="${section}"`));
  assert.match(html,/não é uma probabilidade de aprovação/);
  assert.match(html,/Sem plano no período/);
  assert.deepEqual(model,before);
});

const recommendation={id:'rec-1',subjectId:'s',topicId:'t',estimatedMinutes:30,score:83,reasons:['Retenção baixa'],evidence:{evidenceLabel:'Alta'}};
const row={subjectId:'s',topicId:'t',name:'Juros',subjectName:'Matemática',state:'attention',severity:'important',primarySignal:'consolidation-risk',evidence:{label:'Alta'}};
const diagnosis=rows=>({rows,topics:rows,subjects:[]});

test('próxima ação distingue intervenção prioritária e sugestão opcional sem alterar recomendação',()=>{
  const before=structuredClone(recommendation);
  const required=buildNextBestAction({recommendations:[recommendation],diagnosis:diagnosis([row])});
  const optional=buildNextBestAction({recommendations:[recommendation],diagnosis:diagnosis([{...row,state:'progress',severity:'monitor'}])});
  assert.equal(required.state,NEXT_BEST_ACTION_STATES.ACTION_REQUIRED);
  assert.equal(optional.state,NEXT_BEST_ACTION_STATES.ACTION_OPTIONAL);
  assert.equal(required.action.id,'rec-1');assert.deepEqual(recommendation,before);
});

test('próxima ação admite manutenção, falta de evidência e ação indisponível',()=>{
  assert.equal(buildNextBestAction({diagnosis:diagnosis([{...row,state:'controlled'}]),activePlan:{id:'plan-1'}}).state,NEXT_BEST_ACTION_STATES.MAINTAIN_PLAN);
  assert.equal(buildNextBestAction({diagnosis:diagnosis([{...row,state:'insufficient'}])}).state,NEXT_BEST_ACTION_STATES.INSUFFICIENT_EVIDENCE);
  assert.equal(buildNextBestAction({diagnosis:diagnosis([{...row,state:'insufficient'}]),activePlan:{id:'plan-1'}}).state,NEXT_BEST_ACTION_STATES.INSUFFICIENT_EVIDENCE);
  assert.equal(buildNextBestAction({recommendations:[{...recommendation,eligible:false}],diagnosis:diagnosis([row])}).state,NEXT_BEST_ACTION_STATES.NO_ELIGIBLE_ACTION);
});

const factors={coverage:70,mastery:60,retention:55,consistency:75,simulations:65};
const weights={coverage:.3,mastery:.25,retention:.2,consistency:.15,simulations:.1};
const saved=(date,score,values=factors)=>({date,score,algorithmVersion:1,weights,factors:values});

test('explicação da prontidão usa apenas dois retratos comparáveis e valores observados',()=>{
  const previous=saved('2026-09-20',64),current=saved('2026-09-27',66,{...factors,coverage:76,retention:58});
  const model=buildReadinessChangeExplanation({previous,current});
  assert.equal(model.state,'comparable');assert.equal(model.delta,2);
  assert.deepEqual(model.factors.find(item=>item.label==='Cobertura'),{label:'Cobertura',before:70,after:76,direction:'up'});
  assert.deepEqual(previous,saved('2026-09-20',64));
});

test('explicação não decompõe versões ou conjuntos de evidência diferentes',()=>{
  assert.equal(buildReadinessChangeExplanation({previous:saved('2026-09-20',64),current:{...saved('2026-09-27',66),algorithmVersion:2}}).state,'algorithm-change');
  const changed=saved('2026-09-27',66,{...factors,retention:null});
  const result=buildReadinessChangeExplanation({previous:saved('2026-09-20',64),current:changed});
  assert.equal(result.state,'evidence-change');assert.deepEqual(result.factors,[]);
});
