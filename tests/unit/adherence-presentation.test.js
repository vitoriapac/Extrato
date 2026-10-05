import test from 'node:test';
import assert from 'node:assert/strict';
import {buildPerformanceConsistency} from '../../src/application/performance/build-performance-consistency.js';
import {renderPerformanceConsistency} from '../../src/ui/performance/performance-consistency-renderer.js';
import {createPerformanceViewState,updatePerformanceViewState} from '../../src/application/performance/performance-view-state.js';
import {renderAction,renderActionCard,renderDecisionSummary,renderDisclosure,renderInsightCard,renderTrendIndicator} from '../../src/ui/components/analytical-presentation.js';

const escapeHtml=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const range={start:'2026-08-01',end:'2026-10-03',comparePrevious:false};

test('componentes analíticos preservam marcação compartilhada e escapam texto',()=>{
  assert.match(renderDecisionSummary({title:'<Disciplina>',summary:'& estável',details:['primeiro','segundo','terceiro','oculto']}),/&lt;Disciplina&gt;/);
  assert.doesNotMatch(renderDecisionSummary({title:'Título',summary:'Resumo',details:['a','b','c','d']}),/>d<\/li>/);
  assert.match(renderDisclosure({title:'Por que?',contentHTML:'<p>Texto</p>'}),/<summary>Por que\?<\/summary><div class="performance-details__body"><p>Texto<\/p>/);
  assert.match(renderInsightCard({title:'Tendência',text:'Melhorou',tag:'li'}),/<li><strong>Tendência<\/strong>Melhorou<\/li>/);
  assert.match(renderTrendIndicator({label:'Melhorou',state:'improved',className:'performance-comparison-state'}),/class="performance-comparison-state is-improved"/);
  assert.match(renderAction({label:'Ver planejamento',href:'#metasPlanning'}),/href="#metasPlanning"/);
  assert.match(renderActionCard({contentHTML:'<p>Sem plano</p>',actions:[{label:'Montar plano',href:'#metasPlanning',className:'btn small'}],className:'plan-execution-next-step'}),/plan-execution-next-step/);
  assert.throws(()=>renderAction({label:'Link',href:'javascript:alert(1)'}),/local destination/);
  assert.throws(()=>renderAction({label:'Executar',attributes:{onclick:'evil()'}}),/Unsupported presentation attribute/);
});
function fixture(){
  const subjects=Array.from({length:7},(_,i)=>({id:`s${i}`,name:i===0?'Disciplina <script> longa':'Disciplina '+i,topics:[{id:`t${i}`}]}));
  const dailyPlans=['2026-08-03','2026-08-10','2026-08-17','2026-08-24','2026-08-31','2026-09-07','2026-09-14','2026-09-21','2026-09-28'].map((date,index)=>({id:`p${index}`,date,items:subjects.map((subject,i)=>({id:`i${index}-${i}`,subjectId:subject.id,topicId:`t${i}`,type:'study',plannedMinutes:60,prioritySnapshot:{priority:true}}))}));
  const sessions=dailyPlans.map((plan,index)=>({id:`session${index}`,date:plan.date,subjectId:'s0',topicId:'t0',type:'study',planItemId:plan.items[0].id,durationSeconds:7200}));
  return {range,today:'2026-10-03',subjects,dailyPlans,sessions};
}
test('performance uses reconciled adherence instead of raw hours and exposes bounded history',()=>{
  const input=fixture(),before=structuredClone(input),model=buildPerformanceConsistency(input);
  assert.equal(model.adherenceAnalysis.weekly.history.length,8);
  assert.ok(model.adherenceAnalysis.model.summary.volumeRatio>model.adherenceAnalysis.model.summary.temporalAdherence);
  const html=renderPerformanceConsistency(model,{range,formatDate:value=>value,escapeHtml});
  assert.match(html,/Execução prioritária/);assert.match(html,/Disciplina &lt;script&gt; longa/);assert.doesNotMatch(html,/<script>/);
  assert.equal((html.match(/<li hidden>/g)||[]).length,4);assert.equal((html.match(/<tr hidden>/g)||[]).length,2);
  assert.match(html,/aria-label="Aderência por disciplina"/);assert.match(html,/aria-hidden="true"/);
  assert.deepEqual(input,before);
});
test('adherence history selection is transient and restricted to supported windows',()=>{
  const initial=createPerformanceViewState();assert.equal(initial.adherenceWeeks,8);
  assert.equal(updatePerformanceViewState(initial,{adherenceWeeks:'12'}).adherenceWeeks,12);
  assert.equal(updatePerformanceViewState(initial,{adherenceWeeks:'4'}).adherenceWeeks,4);
  assert.equal(updatePerformanceViewState(initial,{adherenceWeeks:99}).adherenceWeeks,8);
  assert.equal(initial.adherenceWeeks,8);
});
test('empty performance guidance offers the existing planning destination',()=>{
  const model=buildPerformanceConsistency({range,today:'2026-10-03'});
  const html=renderPerformanceConsistency(model,{range,formatDate:value=>value,escapeHtml});
  assert.match(html,/Crie um plano e registre sessões vinculadas/);assert.match(html,/data-performance-open="metas"/);
});
