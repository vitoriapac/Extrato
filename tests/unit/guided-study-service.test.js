import test from 'node:test';
import assert from 'node:assert/strict';
import {createGuidedStudyService} from '../../src/application/guided-study/guided-study-service.js';

test('serviço guiado leva origem e tipo da recomendação até a sessão',()=>{
  const recommendation={id:'rec1',recommendationId:'snapshot1',subjectId:'sub1',topicId:'topic1',activityType:'study'};
  let completed;
  const service=createGuidedStudyService({recommend:({id}={})=>id===recommendation.id?[recommendation]:[recommendation],sessionService:{complete:session=>(completed=session)},clock:{nowISO:()=> '2026-09-23T10:00:00.000Z'}});
  service.next({id:'rec1',source:'overview',type:'study'});
  service.start();
  const session=service.complete({durationSeconds:120,type:'study'});
  assert.equal(session.recommendationId,'snapshot1');
  assert.equal(session.recommendationSource,'overview');
  assert.equal(session.recommendationType,'study');
  assert.equal(session.source,'recommendation');
  assert.equal(completed,session);
  assert.equal(service.current(),null);
});

test('serviço guiado mantém estado em pausa e só limpa ao concluir ou zerar',()=>{
  const service=createGuidedStudyService({recommend:()=>[{id:'rec1'}],sessionService:{complete:session=>session},clock:{nowISO:()=> '2026-09-23T10:00:00.000Z'}});
  service.next({id:'rec1',source:'today'});
  service.start();
  assert.equal(service.pause().paused,true);
  assert.equal(service.resume().paused,false);
  service.reset();
  assert.equal(service.current(),null);
});
