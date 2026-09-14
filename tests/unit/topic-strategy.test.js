import test from 'node:test';import assert from 'node:assert/strict';
import {resolveTopicExamImpact,wouldCreatePrerequisiteCycle} from '../../src/domain/analytics/topic-strategy.js';

test('explica a origem do impacto respeitando a precedência manual, catálogo e disciplina',()=>{
  const subjectConfig={expectedQuestions:10,questionWeight:1.5};
  assert.deepEqual(resolveTopicExamImpact({topic:{examImportance:.8},subjectConfig}),{value:80,source:'manual',sourceLabel:'Definido manualmente no tópico'});
  const catalog=resolveTopicExamImpact({topic:{examImportanceEstimates:{'bb-escriturario:2026':.65}},subjectConfig,activeExamTags:['bb-escriturario']});
  assert.equal(catalog.value,65);assert.equal(catalog.source,'catalog');
  const inherited=resolveTopicExamImpact({topic:{},subjectConfig});assert.equal(inherited.value,60);assert.equal(inherited.source,'subject');
  assert.equal(resolveTopicExamImpact({topic:{}}).value,null);
});

test('impede autorreferência e ciclos transitivos entre pré-requisitos',()=>{
  const topics=[{id:'base',prerequisites:[]},{id:'middle',prerequisites:['base']},{id:'advanced',prerequisites:['middle']}];
  assert.equal(wouldCreatePrerequisiteCycle('base','advanced',topics),true);
  assert.equal(wouldCreatePrerequisiteCycle('advanced','base',topics),false);
  assert.equal(wouldCreatePrerequisiteCycle('base','base',topics),true);
});
