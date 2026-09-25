import test from 'node:test';
import assert from 'node:assert/strict';
import {buildTopicExamProfile} from '../../src/application/exam-intelligence/build-topic-exam-profile.js';
import {buildExamIntelligenceViewModel} from '../../src/application/exam-intelligence/build-exam-intelligence-view-model.js';
import {renderExamIntelligence} from '../../src/ui/renderers/exam-intelligence-renderer.js';

const exams=[1,2,3,4,5].map(year=>({id:`exam-${year}`,year,coverage:'complete',examTags:['bb-escriturario']}));
const examQuestions=[1,2,3,4].map(year=>({id:`q-${year}`,examId:`exam-${year}`,topicId:'topic-1',weight:1.5,classification:{confidence:1}}));
const topic={id:'topic-1',subjectId:'subject-1',name:'Juros Compostos',subjectName:'Matemática Financeira',examImportance:.82};

test('perfil explica prova histórica sem alterar o impacto manual usado pela prioridade',()=>{
  const profile=buildTopicExamProfile({topic,exams,examQuestions,activeExamTags:['bb-escriturario']});
  assert.equal(profile.impactValue,82);
  assert.equal(profile.impactSourceType,'manual');
  assert.equal(profile.presencePercent,80);
  assert.equal(profile.historicalWeight,1.5);
  assert.equal(profile.confidence,'moderate');
  assert.equal(profile.recentPresentCount,2);
  assert.equal(profile.analyzedExamCount,5);
});

test('peso oficial exige origem oficial; estimativa de catálogo continua identificada',()=>{
  const withoutManual={...topic,examImportance:null};
  const official=buildTopicExamProfile({topic:withoutManual,subjectConfig:{expectedQuestions:10,questionWeight:1.5,official:true,sourceRef:'bb-edital'},exams,examQuestions});
  assert.equal(official.impactSourceType,'official');
  assert.equal(official.officialWeight,1.5);
  const configured=buildTopicExamProfile({topic:withoutManual,subjectConfig:{expectedQuestions:10,questionWeight:1.5,official:false}});
  assert.equal(configured.impactSourceType,'manual');
  assert.equal(configured.officialWeight,null);
  const catalog=buildTopicExamProfile({topic:{...withoutManual,examImportanceEstimates:{'bb-escriturario:2023':.7}},activeExamTags:['bb-escriturario']});
  assert.equal(catalog.impactSourceType,'estimated');
  const catalogWithOfficialWeight=buildTopicExamProfile({topic:{...withoutManual,examImportanceEstimates:{'bb-escriturario:2023':.7}},subjectConfig:{expectedQuestions:10,questionWeight:1.5,official:true,sourceRef:'bb-edital'},activeExamTags:['bb-escriturario']});
  assert.equal(catalogWithOfficialWeight.impactSourceType,'estimated');
  assert.equal(catalogWithOfficialWeight.officialWeight,1.5);
});

test('visão estratégica respeita concurso ativo e escapa títulos externos',()=>{
  const view=buildExamIntelligenceViewModel({topics:[{...topic,name:'<Juros>'}],blueprint:{subjects:[],activeExamTags:['bb-escriturario']},exams:[...exams,{id:'caixa',year:2024,coverage:'complete',examTags:['caixa-tbn']}],examQuestions});
  assert.equal(view.completeExamCount,5);
  assert.equal(view.rows[0].presencePercent,80);
  const html=renderExamIntelligence(view);
  assert.match(html,/&lt;Juros&gt;/);
  assert.doesNotMatch(html,/<Juros>/);
  assert.match(renderExamIntelligence({state:'empty'}),/Nenhuma prova histórica completa/);
});
