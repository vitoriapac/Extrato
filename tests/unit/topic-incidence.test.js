import test from 'node:test';
import assert from 'node:assert/strict';
import {calculateTopicIncidence} from '../../src/domain/exam-intelligence/topic-incidence.js';
import {buildExamIntelligence} from '../../src/application/exam-intelligence/build-exam-intelligence.js';

const exams=[2018,2019,2021,2023,2025].map((year,index)=>({id:`bb-${year}`,year,date:null,coverage:'complete',examTags:['bb-escriturario'],institution:'BB'}));
const questions=[
  {id:'q1',examId:'bb-2018',topicId:'juros',classification:{confidence:1}},
  {id:'q2',examId:'bb-2019',topicId:'juros',classification:{confidence:1}},
  {id:'q3',examId:'bb-2021',topicId:'juros',classification:{confidence:.8}},
  {id:'q4',examId:'bb-2023',topicId:'juros',classification:{confidence:1}},
  {id:'q5',examId:'bb-2023',topicId:'juros',classification:{confidence:1}},
  {id:'q6',examId:'bb-2025',topicId:'outro',classification:{confidence:1}}
];

test('separa frequência de presença, participação e recência',()=>{
  const result=calculateTopicIncidence({topicId:'juros',exams,questions,activeExamTags:['bb-escriturario']});
  assert.equal(result.presencePercent,80);
  assert.equal(result.presentExamCount,4);
  assert.equal(result.analyzedExamCount,5);
  assert.equal(result.questionCount,5);
  assert.equal(result.participationPercent,83);
  assert.equal(result.recentPresentCount,2);
  assert.deepEqual(result.recentYears,[2025,2023,2021]);
  assert.equal(result.confidence,'moderate');
});

test('prova parcial informa questões observadas sem virar ausência no denominador',()=>{
  const partial={id:'bb-partial',year:2026,coverage:'partial',examTags:['bb-escriturario']};
  const result=calculateTopicIncidence({topicId:'juros',exams:[...exams,partial],questions:[...questions,{id:'q7',examId:partial.id,topicId:'juros',classification:{confidence:1}}],activeExamTags:['bb-escriturario']});
  assert.equal(result.scopedExamCount,6);
  assert.equal(result.analyzedExamCount,5);
  assert.equal(result.presencePercent,80);
  assert.equal(result.questionCount,5);
  assert.equal(result.observedQuestionCount,6);
});

test('amostra única permanece limitada e filtro exclui outro concurso',()=>{
  const caixa={id:'caixa-2024',year:2024,coverage:'complete',examTags:['caixa-tbn']};
  const result=calculateTopicIncidence({topicId:'juros',exams:[exams[0],caixa],questions:[questions[0],{id:'caixa-q',examId:caixa.id,topicId:'juros',classification:{confidence:1}}],activeExamTags:['bb-escriturario']});
  assert.equal(result.presencePercent,100);
  assert.equal(result.presentExamCount,1);
  assert.equal(result.analyzedExamCount,1);
  assert.equal(result.confidence,'insufficient');
  const empty=calculateTopicIncidence({topicId:'juros',exams:[{...exams[0],coverage:'unknown'}],questions:[questions[0]]});
  assert.equal(empty.presencePercent,null);
  assert.equal(empty.participationPercent,null);
});

test('classificação fraca reduz confiança e aplicação mantém perfil por tópico',()=>{
  const weak=questions.map(question=>({...question,classification:{confidence:.2}}));
  const profiles=buildExamIntelligence({topics:[{id:'juros'},{id:'outro'}],exams,examQuestions:weak});
  assert.equal(profiles[0].confidence,'low');
  assert.equal(profiles[1].questionCount,1);
  assert.equal(profiles[1].presencePercent,20);
});
