import test from 'node:test';
import assert from 'node:assert/strict';
import {EXAM_TAGS} from '../../src/domain/exams/exam-catalog.js';
import {isTopicInExamScope,isCommonTopic,topicExamScopeLabel} from '../../src/domain/exams/exam-scope.js';

test('escopo distingue BB, Caixa, Caixa TI e conteúdo pessoal',()=>{const bb={examTags:[EXAM_TAGS.BB]},caixa={examTags:[EXAM_TAGS.CAIXA]},ti={examTags:[EXAM_TAGS.CAIXA_TI]},manual={examTags:[]};assert.equal(isTopicInExamScope(bb,[EXAM_TAGS.BB]),true);assert.equal(isTopicInExamScope(caixa,[EXAM_TAGS.BB]),false);assert.equal(isTopicInExamScope(ti,[EXAM_TAGS.CAIXA]),false);assert.equal(isTopicInExamScope(manual,[EXAM_TAGS.BB]),true)});
test('comum exige as tags específicas e não confunde Caixa TI',()=>{const common={examTags:[EXAM_TAGS.BB,EXAM_TAGS.CAIXA]},falseCommon={examTags:[EXAM_TAGS.BB,EXAM_TAGS.CAIXA_TI]};assert.equal(isCommonTopic(common,[EXAM_TAGS.BB,EXAM_TAGS.CAIXA]),true);assert.equal(isCommonTopic(falseCommon,[EXAM_TAGS.BB,EXAM_TAGS.CAIXA]),false);assert.equal(topicExamScopeLabel(common),'BB · CAIXA')});
