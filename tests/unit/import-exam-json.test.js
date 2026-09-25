import test from 'node:test';
import assert from 'node:assert/strict';
import {parseExamImportJson,previewExamImport,mergeExamImport} from '../../src/application/exam-intelligence/import-exam-json.js';

const base={subjects:[{id:'s1',name:'Matemática',archived:false,topics:[{id:'t1',name:'Juros Compostos',archived:false}]}],exams:[],examQuestions:[]};
const source=JSON.stringify({exam:{institution:'Banco do Brasil',examName:'Concurso 2023',role:'Escriturário',board:'Cesgranrio',year:2023,coverage:'complete',examTags:['bb']},questions:[{number:1,subject:'Matemática',topic:'Juros Compostos',weight:1},{number:2,subject:'Matemática',topic:'Análise Combinatória',weight:1}]});

test('valida esquema e rejeita números repetidos',()=>{
  assert.throws(()=>parseExamImportJson('{}'),/exam/);
  assert.throws(()=>parseExamImportJson(source.replace('"number":2','"number":1')),/duplicado/);
});

test('prévia exige decisão e nunca cria tópico silenciosamente',()=>{
  const parsed=parseExamImportJson(source),preview=previewExamImport(parsed,base);
  assert.equal(preview.mappedCount,1);assert.equal(preview.unresolvedCount,1);
  assert.throws(()=>mergeExamImport(parsed,preview,{},base),/resolva o conflito/);
  assert.equal(base.subjects[0].topics.length,1);
  const result=mergeExamImport(parsed,preview,{2:{action:'create',subjectId:'s1'}},base);
  assert.equal(result.subjects[0].topics.length,2);
  assert.equal(result.examQuestions.length,2);
  assert.equal(base.subjects[0].topics.length,1);
});

test('reimportação atualiza a mesma prova e as mesmas questões sem duplicar',()=>{
  const parsed=parseExamImportJson(source),preview=previewExamImport(parsed,base);
  const first=mergeExamImport(parsed,preview,{2:{action:'ignore'}},base);
  const againPreview=previewExamImport(parsed,first);
  const second=mergeExamImport(parsed,againPreview,{2:{action:'ignore'}},first);
  assert.equal(second.exams.length,1);assert.equal(second.examQuestions.length,1);
  assert.equal(second.summary.added,0);assert.equal(second.summary.updated,1);
});

test('associação e erros são atômicos',()=>{
  const parsed=parseExamImportJson(source),preview=previewExamImport(parsed,base);
  assert.throws(()=>mergeExamImport(parsed,preview,{2:{action:'associate',subjectId:'s1',topicId:'missing'}},base),/inválida/);
  assert.equal(base.exams.length,0);
  const result=mergeExamImport(parsed,preview,{2:{action:'associate',subjectId:'s1',topicId:'t1'}},base);
  assert.equal(result.examQuestions.length,2);
});

test('importar setenta questões duas vezes conserva setenta',()=>{
  const payload=JSON.parse(source);
  payload.questions=Array.from({length:70},(_,index)=>({number:index+1,subject:'Matemática',topic:'Juros Compostos'}));
  const parsed=parseExamImportJson(JSON.stringify(payload));
  const first=mergeExamImport(parsed,previewExamImport(parsed,base),{},base);
  const second=mergeExamImport(parsed,previewExamImport(parsed,first),{},first);
  assert.equal(first.examQuestions.length,70);
  assert.equal(second.examQuestions.length,70);
  assert.equal(second.summary.added,0);
  assert.equal(second.summary.updated,70);
});
