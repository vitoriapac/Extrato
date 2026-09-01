import test from 'node:test';import assert from 'node:assert/strict';
import {dismissAlert,reconcileAlerts} from '../../src/application/alert-lifecycle.js';
const addDays=(iso,n)=>{const d=new Date(iso+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10)};
test('limita alertas e ordena por gravidade',()=>{const alerts=Array.from({length:7},(_,i)=>({id:'a'+i,severity:i<2?'high':'low'}));const result=reconcileAlerts(alerts,[],'2026-09-01',addDays);assert.equal(result.visible.length,5);assert.equal(result.visible[0].severity,'high')});
test('dispensa temporariamente e volta a exibir após o prazo',()=>{const states=dismissAlert([],'a','2026-09-01',addDays);assert.equal(reconcileAlerts([{id:'a',severity:'high'}],states,'2026-09-02',addDays).visible.length,0);assert.equal(reconcileAlerts([{id:'a',severity:'high'}],states,'2026-09-09',addDays).visible.length,1)});
test('marca como resolvido quando deixa de existir',()=>{const result=reconcileAlerts([],[{alertId:'a',dismissedUntil:null,resolvedAt:null}],'2026-09-03',addDays);assert.equal(result.states[0].resolvedAt,'2026-09-03')});
