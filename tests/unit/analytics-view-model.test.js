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
  assert.equal(model.sections[1].items[0].signalLabel,'Dados limitados');
});
