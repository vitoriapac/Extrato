import test from 'node:test';
import assert from 'node:assert/strict';
import {createSessionService} from '../../src/application/sessions/session-service.js';
import {createSessionsRepository} from '../../src/repositories/sessions-repository.js';
import {createCollectionRepository} from '../../src/repositories/collection-repository.js';
import {createPlanningRepository} from '../../src/repositories/planning-repository.js';
test('sessões incompatíveis ficam no histórico; edição e exclusão recalculam a tarefa',()=>{
  const state={studySessions:[],questoes:[],dailyPlans:[{id:'p',date:'2026-10-02',items:[{id:'i',subjectId:'s',topicId:'t',type:'questions',plannedMinutes:30,status:'planned'}]}],studyPlans:[],planAdjustments:[]};let seq=0;
  const service=createSessionService({repository:createSessionsRepository({getState:()=>state}),questionsRepository:createCollectionRepository({getState:()=>state,field:'questoes'}),planningRepository:createPlanningRepository({getState:()=>state}),clock:{today:()=> '2026-10-02',nowISO:()=> '2026-10-02T12:00:00Z'},idGenerator:prefix=>`${prefix}-${++seq}`});
  const session=service.complete({subjectId:'s',topicId:'t',type:'study',planItemId:'i',durationSeconds:1800}),item=state.dailyPlans[0].items[0];
  assert.equal(state.studySessions.length,1);assert.equal(item.executedSeconds,0);assert.equal(item.status,'planned');
  service.edit(session.id,{type:'questions'});assert.equal(item.executedSeconds,1800);assert.equal(item.status,'completed');
  service.remove(session.id);assert.equal(item.executedSeconds,0);assert.equal(item.status,'planned');
  item.status='deferred';service.complete({subjectId:'s',topicId:'t',type:'questions',planItemId:'i',durationSeconds:1800});assert.equal(item.status,'deferred');
});
