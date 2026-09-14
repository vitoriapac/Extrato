import test from 'node:test';
import assert from 'node:assert/strict';
import {snapshotEvidenceScopes} from '../../src/application/exams/evidence-scope-migration.js';

test('migração congela o escopo do tópico na evidência histórica',()=>{
  const data={subjects:[{id:'subject',topics:[{id:'shared',examTags:['caixa','bb']},{id:'personal',examTags:[]}]}],studySessions:[{id:'session',topicId:'shared'}],questoes:[{id:'question',topicId:'personal'}],reviewAgenda:[],calendar:[],topicHistory:[],simulados:[]};
  snapshotEvidenceScopes(data);
  assert.deepEqual(data.studySessions[0].examScope,['bb','caixa']);
  assert.deepEqual(data.questoes[0].examScope,[]);
});

test('migração preserva ausência quando não há tópico atribuível',()=>{
  const data={subjects:[],studySessions:[{id:'session',subjectId:'subject'}],questoes:[],reviewAgenda:[],calendar:[],topicHistory:[],simulados:[{id:'simulation',examTag:'bb'}]};
  snapshotEvidenceScopes(data);
  assert.equal(data.studySessions[0].examScope,null);
  assert.deepEqual(data.simulados[0].examScope,['bb']);
});
