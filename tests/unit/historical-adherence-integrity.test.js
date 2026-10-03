import test from 'node:test';
import assert from 'node:assert/strict';
import {freezePlanExecution} from '../../src/domain/planning/plan-execution-snapshot.js';
import {recordPlanningCapacity,capacityForPeriod,validCapacityRecord} from '../../src/domain/planning/capacity-history.js';
import {buildWeeklyCloseAdherence} from '../../src/application/adherence/build-weekly-close-adherence.js';
import {applyReplan} from '../../src/application/replan-study.js';
import {pickPersistentState} from '../../src/state/state-boundaries.js';

const hours=value=>Object.fromEntries(Array.from({length:7},(_,day)=>[String(day),value]));
const record=(history,date,value,id)=>recordPlanningCapacity(history,{hoursByDay:hours(value),today:date,capturedAt:`${date}T12:00:00Z`,id,source:'edited'});
const subjects=[{id:'s',topics:[{id:'t'}]}];
test('V1 through V4 keep daily versions, topics, activity and historical priority across midweek recovery',()=>{
  const dates=['2026-09-28','2026-09-29','2026-10-01','2026-10-03'];
  const dailyPlans=dates.map((date,index)=>{
    const item={id:`i${index}`,subjectId:'s',topicId:'t',type:'study',status:'planned',plannedMinutes:60,studyPlanId:`v${index+1}`,prioritySnapshot:{priority:index<3,tier:index<3?'critical':'normal',score:90-index,reasons:['Recorded reason']}};
    freezePlanExecution(item,{date});return {id:`p${index}`,date,items:[item]};
  });
  const sessions=dates.map((date,index)=>({id:`session${index}`,date,subjectId:'s',topicId:'t',type:'study',planItemId:`i${index}`,durationSeconds:[60,30,0,20][index]*60}));
  sessions.push({id:'additional',date:dates[3],subjectId:'s',topicId:'t',type:'study',durationSeconds:3000});
  const capacityHistory=[];record(capacityHistory,dates[0],1,'old');record(capacityHistory,dates[2],2,'new');
  for(const plan of dailyPlans){plan.items[0].studyPlanId='v8';plan.items[0].prioritySnapshot.tier='normal';plan.items[0].prioritySnapshot.priority=false;plan.items[0].type='questions'}
  const frame=buildWeeklyCloseAdherence({start:dates[0],end:'2026-10-04',today:'2026-10-05',dailyPlans,sessions,subjects,capacityHistory});
  assert.equal(frame.model.summary.plannedMinutes,240);assert.equal(frame.model.summary.matchedMinutes,110);assert.equal(frame.model.summary.additionalMinutes,50);
  assert.deepEqual(frame.model.items.map(item=>item.studyPlanId),['v1','v2','v3','v4']);
  assert.equal(frame.model.planningContext.items[0].prioritySnapshot.tier,'critical');
  assert.equal(frame.model.planningContext.capacity.availableMinutes,660);
  const saved=JSON.parse(JSON.stringify(frame));sessions[0].durationSeconds=0;dailyPlans[0].items[0].status='replaced';capacityHistory[0].hoursByDay['1']=20;
  assert.equal(saved.model.planningContext.items[0].prioritySnapshot.tier,'critical');assert.equal(saved.model.summary.matchedMinutes,110);
});
test('multiple reschedules preserve root allocation and copied priority rather than mutable current state',()=>{
  const item={id:'root',subjectId:'s',topicId:'t',type:'study',plannedMinutes:60,status:'planned',studyPlanId:'v1',prioritySnapshot:{priority:true,tier:'critical'}};
  freezePlanExecution(item,{date:'2026-09-28'});item.prioritySnapshot={priority:false,tier:'normal'};item.studyPlanId='v9';
  const dailyPlans=[{id:'p',date:'2026-09-28',items:[item]}];let sequence=0;
  const move=(sourcePlanId,sourceItemId,date,minutes,operationId)=>applyReplan({dailyPlans,proposal:{state:'proposal',allocations:[{sourcePlanId,sourceItemId,date,minutes}]},operationId,now:`${date}T12:00:00Z`,idGenerator:prefix=>`${prefix}-${++sequence}`});
  const first=move('p','root','2026-09-29',60,'one').changes[0];
  move(first.destinationPlanId,first.destinationItemId,'2026-10-01',60,'two');
  const frame=buildWeeklyCloseAdherence({start:'2026-09-28',end:'2026-10-04',today:'2026-10-05',dailyPlans,sessions:[],subjects});
  assert.equal(frame.model.summary.plannedMinutes,60);assert.equal(frame.model.planningContext.originalRootMinutes,60);
  assert.equal(frame.model.planningContext.deferredItems,2);
  assert.ok(frame.model.planningContext.items.every(item=>item.prioritySnapshot.tier==='critical'&&item.planVersion==='v1'));
});
test('capacity is observed prospectively, deduplicated and persisted without inventing legacy history',()=>{
  const history=[];record(history,'2026-10-01',2,'one');
  assert.equal(record(history,'2026-10-02',2,'two'),false);
  assert.equal(capacityForPeriod(history,{start:'2026-09-28',end:'2026-10-04'}).availableMinutes,null);
  assert.equal(capacityForPeriod(history,{start:'2026-10-05',end:'2026-10-11'}).availableMinutes,840);
  assert.deepEqual(JSON.parse(JSON.stringify(pickPersistentState({planningCapacityHistory:history}))).planningCapacityHistory,history);
  assert.equal(validCapacityRecord({...history[0],totalMinutes:1}),false);
  assert.equal(capacityForPeriod([],{start:'2026-09-28',end:'2026-10-04'}).state,'unknown');
});
test('legacy rescheduling does not fabricate original context',()=>{
  const dailyPlans=[{id:'p',date:'2026-09-28',items:[{id:'old',subjectId:'s',topicId:'t',plannedMinutes:30,type:'study',status:'planned'}]}];let id=0;
  applyReplan({dailyPlans,proposal:{state:'proposal',allocations:[{sourcePlanId:'p',sourceItemId:'old',date:'2026-10-01',minutes:30}]},operationId:'op',now:'2026-10-01T12:00:00Z',idGenerator:prefix=>`${prefix}-${++id}`});
  const frame=buildWeeklyCloseAdherence({start:'2026-09-28',end:'2026-10-04',today:'2026-10-05',dailyPlans,subjects});
  assert.equal(frame.model.planningContext.legacyItems,2);assert.equal(frame.model.planningContext.originalRootMinutes,null);
});
