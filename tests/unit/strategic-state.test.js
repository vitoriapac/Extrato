import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeTopicStrategy,normalizeExamBlueprint,normalizeAlgorithmVersions} from '../../src/state/strategic.js';

test('mantém dados estratégicos ausentes em estado neutro',()=>{
  const topic=normalizeTopicStrategy({id:'topic-1'});
  assert.equal(topic.examImportance,null);
  assert.equal(topic.estimatedStudyMinutes,null);
  assert.deepEqual(topic.prerequisites,[]);
});

test('limita importância e normaliza esforço e pré-requisitos',()=>{
  const topic=normalizeTopicStrategy({id:'topic-1',examImportance:2,estimatedStudyMinutes:89.6,prerequisites:['topic-2','topic-2','topic-1',null]});
  assert.deepEqual(topic,{id:'topic-1',examImportance:1,estimatedStudyMinutes:90,prerequisites:['topic-2']});
});

test('migra a data legada para a configuração da prova',()=>{
  assert.deepEqual(normalizeExamBlueprint({},'2026-12-15'),{examDate:'2026-12-15',targetScore:80,masteryTarget:80,configuredAt:null,subjects:[]});
});

test('normaliza pesos e versões de algoritmos',()=>{
  const blueprint=normalizeExamBlueprint({targetScore:120,subjects:[{subjectId:'subject-1',expectedQuestions:19.6,questionWeight:2,priority:'high'}]});
  assert.equal(blueprint.targetScore,100);
  assert.deepEqual(blueprint.subjects[0],{subjectId:'subject-1',expectedQuestions:20,questionWeight:2,priority:'high',masteryTarget:null});
  assert.deepEqual(normalizeAlgorithmVersions({readiness:2,retention:0}),{readiness:2,retention:1,reviewHealth:1,recommendations:3,recommendationOutcomes:1,adaptiveReview:1,forecasts:1});
});

test('preserva meta disciplinar nula como herança da meta geral',()=>{
  const blueprint=normalizeExamBlueprint({masteryTarget:80,subjects:[{subjectId:'subject-1',masteryTarget:null},{subjectId:'subject-2',masteryTarget:0}]});
  assert.equal(blueprint.subjects[0].masteryTarget,null);
  assert.equal(blueprint.subjects[1].masteryTarget,0);
});
