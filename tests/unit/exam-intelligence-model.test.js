import test from 'node:test';
import assert from 'node:assert/strict';
import {createExam,validateExam} from '../../src/domain/exam-intelligence/exam.js';
import {createExamQuestion,validateExamQuestion} from '../../src/domain/exam-intelligence/exam-question.js';
import {createExamRegistry} from '../../src/application/exam-intelligence/exam-registry.js';
import {createDefaultState} from '../../src/state/defaults.js';
import {pickPersistentState} from '../../src/state/state-boundaries.js';

const input={id:'exam-bb-2023',institution:'Banco do Brasil',examName:'Escriturário 2023',role:'Escriturário',board:'Cesgranrio',year:2023,date:'2023-04-23',source:'manual',sourceReference:'Edital 2023',coverage:'complete',examTags:['bb-escriturario']};

test('modelo aceita várias provas da mesma instituição e persiste separado das respostas pessoais',()=>{
  const state=createDefaultState(),subject=state.subjects[0],topic=subject.topics[0];
  let next=0;const registry=createExamRegistry({state,idGenerator:prefix=>`${prefix}-${++next}`});
  const first=registry.addExam(input),second=registry.addExam({...input,id:'exam-bb-2025',year:2025,date:null,coverage:'partial'});
  const question=registry.addQuestion({examId:first.id,subjectId:subject.id,topicId:topic.id,questionNumber:1,weight:1.5,source:'Prova oficial',classification:{method:'manual',confidence:1}});
  assert.equal(second.institution,first.institution);
  assert.equal(question.examId,first.id);
  assert.equal(state.questoes.length,0);
  assert.deepEqual(pickPersistentState(state).examQuestions,[question]);
  assert.deepEqual(pickPersistentState(state).exams,[first,second]);
  assert.throws(()=>registry.addQuestion({...question,id:'another'}),/já está cadastrada/);
  assert.throws(()=>registry.addQuestion({...question,id:'other',questionNumber:2,topicId:'missing'}),/tópico existentes/);
});

test('modelo rejeita datas, pesos, classificações e coberturas inválidas',()=>{
  assert.match(validateExam({...input,date:'2023-02-30'}),/data/);
  assert.match(validateExam({...input,coverage:'complete',examTags:'bb'}),/escopo/);
  assert.throws(()=>createExam({...input,year:2024}),/data/);
  const question=createExamQuestion({id:'q-1',examId:input.id,subjectId:'subject-1',topicId:'topic-1',questionNumber:1});
  assert.equal(question.classification.method,'manual');
  assert.match(validateExamQuestion({...question,weight:-1}),/peso/);
  assert.match(validateExamQuestion({...question,classification:{method:'assisted',confidence:2}}),/classificação/);
});
