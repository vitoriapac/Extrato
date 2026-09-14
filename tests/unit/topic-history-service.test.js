import test from 'node:test';
import assert from 'node:assert/strict';
import {createTopicHistoryService,historyEventLocalDate} from '../../src/application/history/topic-history-service.js';

function fixture(){const state={topicHistory:[]};let id=0;const service=createTopicHistoryService({getState:()=>state,clock:{nowISO:()=> '2026-09-14T12:00:00.000Z',today:()=> '2026-09-14'},idGenerator:()=>`history-${++id}`,toLocalDate:value=>String(value).slice(0,10)});return{state,service}}

test('evento com a mesma referência externa é idempotente',()=>{const{state,service}=fixture();service.add('study_session','s1','t1',{sessionId:'session-1'});service.add('study_session','s1','t1',{sessionId:'session-1'});assert.equal(state.topicHistory.length,1)});
test('consulta preserva período e ignora eventos de ciclo de vida',()=>{const{service}=fixture();service.add('topic_archived','s1','t1',{}, {localDate:'2026-09-10'});service.add('topic_completed','s1','t1',{}, {localDate:'2026-09-11'});service.add('review_completed','s1','t1',{reviewId:'r1'}, {localDate:'2026-09-13'});assert.deepEqual(service.list({topicId:'t1',start:'2026-09-11',end:'2026-09-12',includeLifecycle:false}).map(item=>item.type),['topic_completed']);assert.equal(service.lastActivity({topicId:'t1'}),'2026-09-13')});
test('data civil persistida prevalece sobre conversão de timestamp',()=>{assert.equal(historyEventLocalDate({localDate:'2026-09-13',occurredAt:'2026-09-14T01:00:00.000Z'},()=> '2026-09-14'),'2026-09-13')});
