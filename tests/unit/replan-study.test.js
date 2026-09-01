import test from 'node:test';import assert from 'node:assert/strict';
import {buildReplanProposal} from '../../src/application/replan-study.js';

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
