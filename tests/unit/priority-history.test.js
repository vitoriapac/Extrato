import test from 'node:test';import assert from 'node:assert/strict';
import {buildPriorityHistory} from '../../src/application/analytics/build-priority-history.js';
import {compareTopicPriority,captureTopicPriorityProfile,classifyTopicPriority} from '../../src/domain/recommendations/topic-priority-profile.js';
import {ensureRecommendationRecord,reusableRecommendationRecord} from '../../src/application/recommendations/recommendation-history.js';
const tags=['bb-escriturario'],topic={id:'t',subjectId:'s',name:'Juros',subjectName:'Matemática',examTags:tags};
const profile=(score,mastery,retention)=>({score,mastery,retention,examImpact:90,incidence:80,confidence:.8,algorithmVersion:5,activeExamTags:tags,reasons:['Lacuna registrada']});
test('trajetória agrega snapshots e diagnóstico sem recalcular o passado',()=>{
  const records=[{id:'r',topicId:'t',createdAt:'2026-09-01',prioritySnapshot:profile(85,40,45)}],input={topics:[topic],activeExamTags:tags,today:'2026-09-28',recommendationHistory:records,candidates:[{topicId:'t',subjectId:'s',score:30,mastery:80,retention:75,examImpact:90,algorithmVersion:5,evidenceStrength:.8}]};
  const before=structuredClone(records),result=buildPriorityHistory(input);assert.deepEqual(records,before);assert.equal(result.rows[0].history.length,2);assert.equal(result.rows[0].history[0].classification,'Crítica');assert.equal(result.rows[0].state,'Consolidada · manutenção');assert.equal(result.rows[0].history[0].profile.mastery,40);
});
test('perda de impacto não é melhora pessoal e métodos distintos não são comparáveis',()=>{
  const previous=profile(90,40,45),current={...previous,score:50,examImpact:40};assert.equal(compareTopicPriority(previous,current).state,'stable');assert.match(compareTopicPriority(previous,current).reasons[0],/Impacto/);assert.equal(compareTopicPriority(previous,{...current,algorithmVersion:6}).state,'insufficient');assert.equal(classifyTopicPriority({...profile(20,90,90),confidence:null}),'Evidência limitada');
});
test('domínio e retenção em sentidos opostos não recebem interpretação unilateral',()=>{
  assert.equal(compareTopicPriority(profile(90,40,45),profile(80,43,42)).state,'mixed');
});
test('uma observação por dia, concurso congelado e ausência de dados legados',()=>{
  const result=buildPriorityHistory({topics:[topic],activeExamTags:tags,today:'2026-09-28',recommendationHistory:[{id:'r1',topicId:'t',createdAt:'2026-09-01T12:00:00Z',prioritySnapshot:profile(80,45,50)},{id:'r2',topicId:'t',createdAt:'2026-09-01T13:00:00Z',prioritySnapshot:profile(75,46,52)},{id:'r3',topicId:'t',createdAt:'2026-09-02',prioritySnapshot:{...profile(90,20,20),activeExamTags:['caixa-tbn']}},{id:'old',topicId:'t',createdAt:'2026-09-03',priority:60,algorithmVersions:{priority:5}}]});assert.equal(result.rows[0].history.length,2);assert.equal(result.rows[0].history[0].profile.score,75);assert.equal(result.rows[0].history[1].profile.mastery,null);assert.equal(result.rows[0].history[1].change.state,'insufficient');
});
test('recomendação congela perfil e não o reescreve em nova apresentação',()=>{
  const history=[],candidate={id:'t',topicId:'t',recommendationId:'r',score:80,mastery:40,retention:45,evidence:{evidenceStrength:.8},examIntelligence:{presencePercent:75},reasons:['Lacuna'],algorithmVersion:5};
  const record=ensureRecommendationRecord(history,candidate,{now:'2026-09-28T12:00:00Z',activeExamTags:tags,idGenerator:()=> 'r'});candidate.mastery=90;candidate.examIntelligence.presencePercent=5;
  ensureRecommendationRecord(history,candidate,{now:'2026-09-28T13:00:00Z',activeExamTags:['caixa-tbn']});assert.equal(record.prioritySnapshot.mastery,40);assert.equal(record.prioritySnapshot.incidence,75);assert.deepEqual(record.prioritySnapshot.activeExamTags,tags);assert.equal(captureTopicPriorityProfile({}).score,null);
});
test('recomendação pendente de tópico compartilhado não é reutilizada em outro concurso',()=>{
  const history=[],candidate={id:'t',recommendationId:'r',score:60,reasons:[],algorithmVersion:5};
  ensureRecommendationRecord(history,candidate,{now:'2026-09-28T12:00:00Z',activeExamTags:tags,idGenerator:()=> 'r'});
  assert.equal(reusableRecommendationRecord(history,candidate,'2026-09-28',tags).id,'r');
  assert.equal(reusableRecommendationRecord(history,candidate,'2026-09-28',['caixa-tbn']),null);
});
test('fechamentos fornecem trajetória mesmo sem recomendação ou plano no tópico',()=>{
  const snapshots=[{activeExamTags:tags,period:{end:'2026-09-07'},topicPriorities:[{...profile(90,40,45),topicId:'t'}]},{activeExamTags:tags,period:{end:'2026-09-14'},topicPriorities:[{...profile(70,50,55),topicId:'t'}]}],before=structuredClone(snapshots);
  const result=buildPriorityHistory({topics:[topic],activeExamTags:tags,today:'2026-09-28',weeklyCloseSnapshots:snapshots});assert.equal(result.rows[0].state,'Melhorando');assert.equal(result.rows[0].history.length,2);assert.deepEqual(snapshots,before);
});
