import test from 'node:test';import assert from 'node:assert/strict';
import {parseStructuredStudyContent,createStructuredContentImportService} from '../../src/application/subjects/structured-content-import.js';

test('interpreta JSON e CSV com estratégia de tópico',()=>{
  const json=parseStructuredStudyContent(JSON.stringify({subjects:[{name:'Português',topics:[{name:'Crase',difficulty:'Difícil',examImportance:75,estimatedStudyMinutes:90,tags:['edital']}]}]}),{fileName:'edital.json'});
  assert.equal(json[0].topics[0].examImportance,.75);assert.equal(json[0].topics[0].estimatedStudyMinutes,90);
  const csv=parseStructuredStudyContent('disciplina;topico;dificuldade;importancia;esforco;tags\nMatemática;Porcentagem;Médio;60;120;edital|base',{fileName:'edital.csv'});
  assert.deepEqual(csv[0].topics[0].tags,['edital','base']);assert.equal(csv[0].topics[0].examImportance,.6);
});

test('rejeita estrutura inválida e importância fora do intervalo',()=>{
  assert.throws(()=>parseStructuredStudyContent('{}',{fileName:'x.json'}),/não contém disciplinas/);
  assert.throws(()=>parseStructuredStudyContent('disciplina,topico,importancia\nA,B,120',{fileName:'x.csv'}),/entre 0 e 100/);
});

test('mescla por nome sem duplicar e preserva progresso existente',()=>{
  const state={subjects:[{id:'s1',name:'Português',topics:[{id:'t1',name:'Crase',status:'Concluído',tags:['antiga']}]}]},subjectService={create(name){const item={id:'s'+(state.subjects.length+1),name,topics:[]};state.subjects.push(item);return item},addTopic(subjectId,input){const item={id:'t'+Date.now(),status:'Não iniciado',...input};state.subjects.find(subject=>subject.id===subjectId).topics.push(item);return item},updateTopic(subjectId,topicId,patch){Object.assign(state.subjects.find(subject=>subject.id===subjectId).topics.find(topic=>topic.id===topicId),patch)}},service=createStructuredContentImportService({subjectService,getSubjects:()=>state.subjects}),data=parseStructuredStudyContent('disciplina,topico,importancia,tags\nportugues,Crase,80,nova\nPortuguês,Regência,50,edital',{fileName:'x.csv'});
  const preview=service.preview(data);assert.equal(preview.updatedTopics,1);assert.equal(preview.addedTopics,1);service.import(data);service.import(data);
  assert.equal(state.subjects.length,1);assert.equal(state.subjects[0].topics.length,2);assert.equal(state.subjects[0].topics[0].status,'Concluído');assert.deepEqual(state.subjects[0].topics[0].tags,['antiga','nova']);
});
