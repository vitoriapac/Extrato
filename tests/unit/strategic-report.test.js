import test from 'node:test';
import assert from 'node:assert/strict';
import {buildStrategicReport} from '../../src/reports/report-data.js';
import {renderStrategicReport} from '../../src/reports/report-template.js';

test('consolida relatório estratégico sem depender do DOM',()=>{
  const state={subjects:[{id:'s',name:'Direito',topics:[{id:'t',status:'Concluído'}]}],studySessions:[{durationSeconds:3600}],questoes:[{resolved:20,correct:15,errorBreakdown:{esqueci:2}}],simulados:[{total:100,correct:80}],reviewAgenda:[{status:'Não iniciado'}],studyPlans:[],dailyPlans:[],planAdjustments:[],recommendationFeedback:[{accepted:true,completed:true,useful:true}]};
  const report=buildStrategicReport({state,generatedAt:'2026-09-02T12:00:00.000Z',isDemo:true,readiness:{value:72},diagnosis:{bottlenecks:[],opportunities:[]},forecast:{forecast30:{low:74,high:82,central:78}}});
  assert.equal(report.overview.accuracy,75);assert.equal(report.overview.studySeconds,3600);assert.equal(report.recommendations.useful,1);
  const html=renderStrategicReport(report);assert.match(html,/Relatório estratégico de demonstração/);assert.match(html,/74–82%/);assert.doesNotMatch(html,/<script/);
});

test('template escapa nomes vindos do estado',()=>{
  const report=buildStrategicReport({state:{subjects:[],studySessions:[],questoes:[],simulados:[],reviewAgenda:[],studyPlans:[],dailyPlans:[],planAdjustments:[],recommendationFeedback:[]},generatedAt:'2026-09-02T12:00:00.000Z',diagnosis:{bottlenecks:[{subjectName:'<script>',topicName:'X',reason:'Y'}],opportunities:[]}});
  assert.match(renderStrategicReport(report),/&lt;script&gt;/);
});
