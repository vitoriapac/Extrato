import test from 'node:test';
import assert from 'node:assert/strict';
import {buildStrategicExecution} from '../../src/application/goals/build-strategic-execution.js';
import {buildDailyExecutionModel} from '../../src/application/daily-execution/build-daily-execution-model.js';

test('daily and strategic execution share activity matching and capped credit',()=>{
  const subjects=[{id:'s',topics:[{id:'t'}]}],dailyPlans=[{id:'p',date:'2026-10-03',items:[{id:'i',subjectId:'s',topicId:'t',type:'questions',plannedMinutes:30,prioritySnapshot:{priority:true}}]}];
  const sessions=[{id:'a',date:'2026-10-03',subjectId:'s',topicId:'t',type:'questions',durationSeconds:2400,planItemId:'i'},{id:'b',date:'2026-10-03',subjectId:'s',topicId:'t',type:'study',durationSeconds:600,planItemId:'i'},{id:'c',date:'2026-10-03',subjectId:'s',topicId:'t',type:'study',durationSeconds:300}];
  const daily=buildDailyExecutionModel({today:'2026-10-03',subjects,dailyPlans,sessions}).progress;
  const weekly=buildStrategicExecution({start:'2026-10-03',end:'2026-10-03',subjects,dailyPlans,sessions});
  assert.equal(daily.creditedMinutes,30);assert.equal(weekly.creditedMinutes,daily.creditedMinutes);
  assert.equal(weekly.excessLinkedMinutes,daily.excessLinkedMinutes);assert.equal(weekly.invalidLinkMinutes,daily.mismatchedMinutes);assert.equal(weekly.additionalMinutes,daily.additionalMinutes);
});
test('ambiguous item identities cannot receive strategic credit',()=>{
  const item={id:'duplicate',plannedMinutes:30};
  const result=buildStrategicExecution({start:'2026-10-03',end:'2026-10-03',dailyPlans:[{date:'2026-10-03',items:[item,{...item}]}],sessions:[{id:'s',date:'2026-10-03',durationSeconds:600,planItemId:item.id}]});
  assert.equal(result.creditedMinutes,0);assert.equal(result.invalidLinkMinutes,10);
});
