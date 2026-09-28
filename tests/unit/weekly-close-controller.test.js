import test from 'node:test';import assert from 'node:assert/strict';import {createWeeklyCloseController} from '../../src/application/analytics/weekly-close-controller.js';
test('só aplica prioridades após prévia e preserva o snapshot',()=>{const state={weeklyCloseSnapshots:[],dailyPlans:[]},model={period:{start:'2026-09-08',end:'2026-09-14'},weeklyClose:{priorities:[{priorityId:'p1',topicId:'t1',subjectId:'s1'}]}};let sequence=0;const controller=createWeeklyCloseController({getModel:()=>model,getState:()=>state,buildProposal:()=>({allocations:[{priorityId:'p1',topicId:'t1',subjectId:'s1',date:'2026-09-15',minutes:30,reason:'Risco',action:'Revisar'}]}),createSnapshot:(_model,options)=>({id:options.id}),upsertSnapshot:(list,item)=>list.push(item),clock:{today:()=> '2026-09-14',nowISO:()=> '2026-09-14T12:00:00.000Z',addDays:()=> '2026-09-15'},idGenerator:prefix=>`${prefix}-${++sequence}`,getDailyCapacity:()=>60});assert.equal(controller.apply(),null);controller.toggle('p1',true);controller.preview();const result=controller.apply();assert.equal(state.dailyPlans[0].items[0].weeklyCloseSnapshotId,result.snapshot.id);assert.deepEqual(result.snapshot.priorityDecisions,[{priorityId:'p1',accepted:true}]);assert.deepEqual(controller.view().selectedIds,[])});
import {buildWeeklyCloseActionProposal} from '../../src/application/analytics/weekly-close-actions.js';
import {addLocalDays} from '../../src/core/date-utils.js';
function setup({period=true}={}){
  const state={weeklyCloseSnapshots:[{id:'legacy'}],dailyPlans:[{id:'existing',date:'2026-09-15',items:[{id:'old',plannedMinutes:45,status:'planned'}]}]};
  const model={weeklyClose:{period:period?{start:'2026-09-08',end:'2026-09-14'}:undefined,priorities:[{priorityId:'p1',topicId:'t1',subjectId:'s1',estimatedMinutes:30}]}};
  let sequence=0;
  const controller=createWeeklyCloseController({getModel:()=>model,getState:()=>state,buildProposal:buildWeeklyCloseActionProposal,createSnapshot:(_model,options)=>({id:options.id,period:{...model.weeklyClose.period}}),upsertSnapshot:(list,item)=>list.push(item),clock:{today:()=> '2026-09-14',nowISO:()=> '2026-09-14T12:00:00.000Z',addDays:addLocalDays},idGenerator:prefix=>`${prefix}-${++sequence}`,getDailyCapacity:date=>date==='2026-09-15'?60:0});
  controller.toggle('p1',true);
  return {controller,state};
}
test('desconta planos existentes e não duplica a prioridade no mesmo período',()=>{
  const {controller,state}=setup();
  const preview=controller.preview();
  assert.equal(preview.allocations[0].minutes,15);
  assert.equal(preview.unallocatedMinutes,15);
  assert.ok(controller.apply());
  assert.equal(state.dailyPlans[0].plannedMinutes,60);
  controller.toggle('p1',true);
  assert.equal(controller.preview().allocations.length,0);
  assert.equal(controller.apply(),null);
  assert.equal(state.dailyPlans[0].items.length,2);
});
test('mudança de capacidade ocupada exige nova confirmação',()=>{
  const {controller,state}=setup();
  controller.preview();
  state.dailyPlans[0].items[0].plannedMinutes=55;
  assert.equal(controller.apply(),null);
  assert.equal(controller.view().proposal.allocations[0].minutes,5);
  assert.equal(state.dailyPlans[0].items.length,1);
  assert.ok(controller.apply());
  assert.equal(state.dailyPlans[0].plannedMinutes,60);
});
test('modelo sem período não gera prévia nem altera planos',()=>{
  const {controller,state}=setup({period:false});
  assert.equal(controller.preview(),null);
  assert.equal(controller.apply(),null);
  assert.equal(state.dailyPlans[0].items.length,1);
});
