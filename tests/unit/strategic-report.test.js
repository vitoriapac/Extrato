import test from 'node:test';
import assert from 'node:assert/strict';
import {buildStrategicReport} from '../../src/reports/report-data.js';
import {renderStrategicReport} from '../../src/reports/report-template.js';

test('consolida relatório estratégico sem depender do DOM',()=>{
  const state={examDate:'2026-12-01',metas:{metaAprovacao:80},subjects:[{id:'s',name:'Direito',topics:[{id:'t',status:'Concluído'}]}],studySessions:[{date:'2026-09-02',subjectId:'s',durationSeconds:3600}],questoes:[{date:'2026-09-02',subjectId:'s',resolved:20,correct:15,errorBreakdown:{esqueci:2}}],simulados:[{date:'2026-09-02',total:100,correct:80}],reviewAgenda:[{date:'2026-09-02',status:'Não iniciado'}],studyPlans:[],dailyPlans:[],planAdjustments:[],recommendationFeedback:[{date:'2026-09-02',accepted:true,completed:true,useful:true,outcome:{}}]};
  const report=buildStrategicReport({state,generatedAt:'2026-09-02T12:00:00.000Z',isDemo:true,readiness:{value:72},diagnosis:{bottlenecks:[],opportunities:[]},forecast:{forecast30:{low:74,high:82,central:78}}});
  assert.equal(report.overview.accuracy,75);assert.equal(report.overview.studySeconds,3600);assert.equal(report.recommendations.useful,1);assert.equal(report.recommendations.measured,1);assert.equal(report.period.start,'2026-08-04');
  const html=renderStrategicReport(report);assert.match(html,/Relatório estratégico de demonstração/);assert.match(html,/74–82%/);assert.doesNotMatch(html,/<script/);
});

test('período personalizado exclui registros externos ao recorte',()=>{const state={subjects:[],studySessions:[{date:'2026-08-01',durationSeconds:3600},{date:'2026-09-01',durationSeconds:1800}],questoes:[],simulados:[],reviewAgenda:[],studyPlans:[],dailyPlans:[],planAdjustments:[],recommendationFeedback:[]};const report=buildStrategicReport({state,generatedAt:'2026-09-02T12:00:00Z',period:{preset:'custom',start:'2026-09-01',end:'2026-09-02'}});assert.equal(report.overview.studySeconds,1800);assert.equal(report.period.label,'2026-09-01 a 2026-09-02')});

test('template escapa nomes vindos do estado',()=>{
  const report=buildStrategicReport({state:{subjects:[],studySessions:[],questoes:[],simulados:[],reviewAgenda:[],studyPlans:[],dailyPlans:[],planAdjustments:[],recommendationFeedback:[]},generatedAt:'2026-09-02T12:00:00.000Z',diagnosis:{bottlenecks:[{subjectName:'<script>',topicName:'X',reason:'Y'}],opportunities:[]}});
  assert.match(renderStrategicReport(report),/&lt;script&gt;/);
});
