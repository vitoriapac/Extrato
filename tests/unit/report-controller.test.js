import test from 'node:test';
import assert from 'node:assert/strict';
import {createReportController} from '../../src/ui/controllers/report-controller.js';

test('controlador do relatório lê período, monta dados e imprime sem lógica no app',()=>{
  const elements=Object.fromEntries(['exportReportBtn','reportPeriodSelect','reportPeriodStart','reportPeriodEnd'].map(id=>[id,{value:'',hidden:true,listeners:{},addEventListener(type,listener){this.listeners[type]=listener}}]));
  elements.reportPeriodSelect.value='custom';
  elements.reportPeriodStart.value='2026-09-01';
  elements.reportPeriodEnd.value='2026-09-07';
  const document={getElementById:id=>elements[id]};
  const calls=[];
  createReportController({document,window:{},getState:()=>({id:'state'}),nowISO:()=> '2026-09-07T12:00:00Z',isDemo:false,getCandidates:()=>[{topicId:'t'}],getDiagnosis:candidates=>({count:candidates.length}),getReadiness:()=>({value:50}),getForecast:()=>({value:60}),buildReport:input=>{calls.push(input);return{id:'report'}},renderReport:()=>'<p>Relatório</p>',printReport:input=>{calls.push(input);return input.report}});
  elements.reportPeriodSelect.listeners.change();
  assert.equal(elements.reportPeriodStart.hidden,false);
  assert.equal(elements.reportPeriodEnd.hidden,false);
  elements.exportReportBtn.listeners.click();
  assert.deepEqual(calls[0].period,{preset:'custom',start:'2026-09-01',end:'2026-09-07'});
  assert.deepEqual(calls[0].diagnosis,{count:1});
  assert.equal(calls[1].report.id,'report');
  elements.reportPeriodSelect.value='30';
  elements.reportPeriodSelect.listeners.change();
  assert.equal(elements.reportPeriodStart.hidden,true);
});
