import test from 'node:test';
import assert from 'node:assert/strict';
import {buildExamMatrix} from '../../src/application/exam-intelligence/build-exam-matrix.js';
import {renderExamMatrix} from '../../src/ui/renderers/exam-matrix-renderer.js';

const topics=[{id:'juros',subjectId:'mat',name:'Juros Compostos',subjectName:'Matemática',examTags:['bb-escriturario','caixa-tbn']},{id:'pix',subjectId:'mat',name:'PIX',subjectName:'Matemática',examTags:['bb-escriturario']}];
const exams=[{id:'bb18',examName:'BB 2018',year:2018,board:'Cesgranrio',role:'Escriturário',coverage:'complete',examTags:['bb-escriturario']},{id:'bb23',examName:'BB 2023',year:2023,board:'Cesgranrio',role:'Escriturário',coverage:'complete',examTags:['bb-escriturario']},{id:'partial',examName:'BB parcial',year:2025,board:'Cesgranrio',role:'Escriturário',coverage:'partial',examTags:['bb-escriturario']},{id:'caixa',examName:'Caixa 2024',year:2024,board:'Cesgranrio',role:'TBN',coverage:'complete',examTags:['caixa-tbn']}];
const examQuestions=[{examId:'bb18',topicId:'juros',weight:1,classification:{confidence:1}},{examId:'bb18',topicId:'juros',weight:1,classification:{confidence:1}},{examId:'bb23',topicId:'juros',weight:1,classification:{confidence:1}},{examId:'bb23',topicId:'pix',weight:1,classification:{confidence:1}},{examId:'partial',topicId:'pix',weight:1,classification:{confidence:1}},{examId:'caixa',topicId:'juros',weight:1,classification:{confidence:1}}];

test('matriz usa somente provas completas e mantém contagem por prova',()=>{
  const model=buildExamMatrix({topics,exams,examQuestions,activeExamTags:['bb-escriturario']});
  assert.equal(model.exams.length,2);assert.equal(model.partialExamCount,1);
  assert.deepEqual(model.rows.find(row=>row.topicId==='juros').cells.map(cell=>cell.count),[2,1]);
  assert.equal(model.rows.find(row=>row.topicId==='pix').presencePercent,50);
  assert.equal(model.rows.find(row=>row.topicId==='pix').questionCount,1);
});

test('filtros mudam concurso, banca, ano e cargo sem contaminar denominador',()=>{
  const caixa=buildExamMatrix({topics,exams,examQuestions,activeExamTags:['bb-escriturario'],filters:{scope:'caixa-tbn'}});
  assert.equal(caixa.exams.length,1);assert.equal(caixa.rows.length,1);
  const year=buildExamMatrix({topics,exams,examQuestions,activeExamTags:['bb-escriturario'],filters:{year:'2023'}});
  assert.equal(year.exams.length,1);assert.equal(year.rows.find(row=>row.topicId==='juros').presencePercent,100);
  const role=buildExamMatrix({topics,exams,examQuestions,filters:{scope:'all',role:'TBN'}});
  assert.equal(role.exams.length,1);assert.equal(role.exams[0].id,'caixa');
});

test('renderer mostra quantidades em texto, detalhe pessoal e escapa nomes',()=>{
  const model=buildExamMatrix({topics:[{...topics[0],name:'<Juros>'},topics[1]],exams,examQuestions,activeExamTags:['bb-escriturario'],metricsByTopic:{juros:{mastery:54,retention:61,priority:82}}});
  const html=renderExamMatrix(model,{selectedTopicId:'juros'});
  assert.match(html,/2 questões/);assert.match(html,/0 questões/);
  assert.match(html,/domínio 54\/100/);assert.match(html,/&lt;Juros&gt;/);
  assert.doesNotMatch(html,/<Juros>/);
});
