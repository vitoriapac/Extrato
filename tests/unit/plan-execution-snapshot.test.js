import test from 'node:test';
import assert from 'node:assert/strict';
import {freezePlanExecution,historicalExecutionItem} from '../../src/domain/planning/plan-execution-snapshot.js';
import {applyReplan,undoReplan} from '../../src/application/replan-study.js';
import {buildStrategicExecution} from '../../src/application/goals/build-strategic-execution.js';

test('creation snapshot preserves original duration, activity, scope and priority',()=>{
  const item={id:'i',subjectId:'s',topicId:'t',type:'questions',plannedMinutes:60,studyPlanId:'v1',prioritySnapshot:{priority:true}};
  freezePlanExecution(item,{date:'2026-10-01',activeExamTags:['bb'],capturedAt:'2026-10-01T12:00:00Z'});
  const frozen=structuredClone(item.executionSnapshot);
  item.type='study';item.plannedMinutes=120;item.prioritySnapshot.priority=false;item.studyPlanId='v2';
  freezePlanExecution(item,{date:'2026-10-02',activeExamTags:['caixa']});
  assert.deepEqual(item.executionSnapshot,frozen);assert.equal(historicalExecutionItem(item).plannedMinutes,60);
  assert.equal(historicalExecutionItem(item).type,'questions');assert.equal(historicalExecutionItem(item).prioritySnapshot.priority,true);
});
test('rescheduling preserves source credit without duplicating the transferred time',()=>{
  const item={id:'i',subjectId:'s',topicId:'t',type:'study',plannedMinutes:60,executedSeconds:1200,status:'partial',sessionIds:['session'],prioritySnapshot:{priority:true}};
  freezePlanExecution(item,{date:'2026-10-01'});
  const dailyPlans=[{id:'p',date:'2026-10-01',items:[item]}];let seq=0;
  const applied=applyReplan({dailyPlans,proposal:{state:'proposal',allocations:[{sourcePlanId:'p',sourceItemId:'i',date:'2026-10-02',minutes:40}]},operationId:'op',now:'2026-10-01T12:00:00Z',idGenerator:prefix=>`${prefix}-${++seq}`});
  const result=buildStrategicExecution({start:'2026-10-01',end:'2026-10-02',dailyPlans,sessions:[{id:'session',date:'2026-10-01',subjectId:'s',topicId:'t',type:'study',planItemId:'i',durationSeconds:1200}]});
  assert.equal(result.priorityPlannedMinutes,60);assert.equal(result.creditedMinutes,20);
  assert.equal(dailyPlans[1].items[0].executionSnapshot.originItemId,'i');assert.equal(item.executionSnapshot.plannedMinutes,60);
  undoReplan({dailyPlans,adjustment:{changes:applied.changes}});assert.equal(item.transferredMinutes,0);assert.equal(item.status,'partial');
});
test('legacy activities remain unclassified and retain their original representation',()=>{
  const item={id:'legacy',plannedMinutes:30};assert.equal(historicalExecutionItem(item),item);assert.equal(item.executionSnapshot,undefined);
});
