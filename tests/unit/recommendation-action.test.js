import test from 'node:test';
import assert from 'node:assert/strict';
import {buildStudyAction,recommendationActionKind,recommendationActionLabel,STUDY_ACTION_SOURCES} from '../../src/application/recommendations/recommendation-action.js';
test('mapeia recomendação para ação especializada',()=>{assert.equal(recommendationActionKind({studyType:'questions'}),'questions');assert.equal(recommendationActionLabel({studyType:'review'}),'Iniciar revisão');assert.equal(recommendationActionKind({blockedPrerequisites:['t1'],studyType:'study'}),'prerequisite')});
test('cria contrato de ação comum com origem, atividade, prioridade, motivos e evidência',()=>{
  const recommendation={id:'candidate-1',recommendationId:'rec-1',subjectId:'s1',topicId:'t1',studyType:'questions',estimatedMinutes:35,score:82,reasons:['Domínio frágil','Revisão atrasada'],mastery:54,retention:61,evidence:{evidenceStrength:.8,completeness:.75,evidenceLabel:'Alta confiança'},factors:{masteryGap:20},algorithmVersion:3};
  const action=buildStudyAction(recommendation,{source:'today'});
  assert.deepEqual({id:action.id,recommendationId:action.recommendationId,source:action.source,subjectId:action.subjectId,topicId:action.topicId,activityType:action.activityType,suggestedMinutes:action.suggestedMinutes,priority:action.priority},{id:'rec-1',recommendationId:'rec-1',source:'today',subjectId:'s1',topicId:'t1',activityType:'questions',suggestedMinutes:35,priority:82});
  assert.deepEqual(action.reasons,recommendation.reasons);assert.equal(action.evidence.mastery,54);assert.equal(action.evidence.strength,.8);assert.equal(action.evidence.factors.masteryGap,20);assert.equal(recommendation.reasons.length,2);assert.ok(Object.isFrozen(action));
});
test('preserva dados ausentes e usa origem segura para ações históricas',()=>{
  const action=buildStudyAction({id:'legacy',studyType:'review',estimatedMinutes:null,score:null},{source:'invalid'});
  assert.equal(action.id,'legacy');assert.equal(action.source,'overview');assert.equal(action.suggestedMinutes,null);assert.equal(action.priority,null);assert.equal(action.activityType,'review');assert.deepEqual(action.reasons,[]);assert.deepEqual(STUDY_ACTION_SOURCES,['overview','today','diagnosis','planning','review']);assert.equal(buildStudyAction(null),null);
});
