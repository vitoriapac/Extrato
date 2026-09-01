import test from 'node:test';import assert from 'node:assert/strict';
import {buildReplanProposal,applyReplan,undoReplan} from '../../src/application/replan-study.js';

test('calcula déficit e distribui somente dentro da capacidade futura',()=>{
  const result=buildReplanProposal({periodStart:'2026-09-01',periodEnd:'2026-09-07',plans:[{date:'2026-09-01',items:[{plannedMinutes:60,executedSeconds:1800,status:'partial'}]}],futureDays:[{date:'2026-09-02',availableMinutes:20},{date:'2026-09-03',availableMinutes:20}]});
  assert.equal(result.deficitMinutes,30);assert.equal(result.redistributedMinutes,30);assert.equal(result.discardedMinutes,0);assert.deepEqual(result.allocations.map(item=>item.minutes),[20,10]);
});

test('informa excedente que não cabe na disponibilidade',()=>{
  const result=buildReplanProposal({periodStart:'2026-09-01',periodEnd:'2026-09-07',plans:[{date:'2026-09-01',items:[{plannedMinutes:90,executedSeconds:0,status:'planned'}]}],futureDays:[{date:'2026-09-02',availableMinutes:30}]});
  assert.equal(result.redistributedMinutes,30);assert.equal(result.discardedMinutes,60);
});

test('não cria déficit para itens descartados ou substituídos',()=>{
  const result=buildReplanProposal({periodStart:'2026-09-01',periodEnd:'2026-09-07',plans:[{date:'2026-09-01',items:[{plannedMinutes:90,executedSeconds:0,status:'skipped'}]}],futureDays:[]});
  assert.equal(result.state,'balanced');assert.equal(result.deficitMinutes,0);
});
test('aplica redistribuição com vínculo e permite desfazer sem execução',()=>{const plans=[{id:'p1',date:'2026-09-01',availableMinutes:60,items:[{id:'i1',subjectId:'s1',topicId:'t1',plannedMinutes:60,executedSeconds:0,status:'planned'}]}],proposal=buildReplanProposal({periodStart:'2026-09-01',periodEnd:'2026-09-07',plans,futureDays:[{date:'2026-09-02',availableMinutes:60}]});let id=0;const applied=applyReplan({dailyPlans:plans,proposal,operationId:'op1',now:'2026-09-01T12:00:00Z',idGenerator:prefix=>`${prefix}-${++id}`});assert.equal(applied.createdItems,1);assert.equal(plans[0].items[0].status,'deferred');const undone=undoReplan({dailyPlans:plans,adjustment:{changes:applied.changes}});assert.equal(undone.complete,true);assert.equal(plans[0].items[0].status,'planned')});
test('desfazer protege destino que já possui execução',()=>{const plans=[{id:'p1',date:'2026-09-01',items:[{id:'i1',plannedMinutes:30,executedSeconds:0,status:'deferred'}]},{id:'p2',date:'2026-09-02',items:[{id:'i2',plannedMinutes:30,executedSeconds:60,status:'partial'}]}];const result=undoReplan({dailyPlans:plans,adjustment:{changes:[{sourcePlanId:'p1',sourceItemId:'i1',sourcePreviousStatus:'planned',destinationPlanId:'p2',destinationItemId:'i2'}]}});assert.equal(result.complete,false);assert.deepEqual(result.protectedItems,['i2']);assert.equal(plans[0].items[0].status,'deferred')});
