import test from 'node:test';
import assert from 'node:assert/strict';
import {renderTopicStrategyEditor} from '../../src/features/topic-strategy/topic-strategy-renderer.js';

test('renderer apresenta impacto, campos e pré-requisitos elegíveis',()=>{
  const subject={id:'s1',name:'Direito'};
  const topic={id:'t1',name:'Constituição',examImportance:.7,estimatedStudyMinutes:90,prerequisites:['t2']};
  const topics=[{...topic,subjectName:'Direito',subjectId:'s1'},{id:'t2',name:'Português',subjectName:'Português',subjectId:'s2',prerequisites:[]}];
  const html=renderTopicStrategyEditor({subject,topic,topics});
  assert.match(html,/Impacto usado na prioridade: 70%/);
  assert.match(html,/value="90"/);
  assert.match(html,/Português — Português/);
  assert.match(html,/checked/);
});

test('renderer escapa conteúdo e omite tópicos arquivados',()=>{
  const html=renderTopicStrategyEditor({subject:{id:'s1',name:'A'},topic:{id:'t1',name:'A'},topics:[{id:'t2',name:'<script>',subjectName:'B',topicArchived:true}]});
  assert.doesNotMatch(html,/<script>/);
  assert.match(html,/Não há outros tópicos disponíveis/);
});
