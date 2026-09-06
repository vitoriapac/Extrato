import test from 'node:test';
import assert from 'node:assert/strict';
import {calculatePriorityScore} from '../../src/domain/analytics/priority-score.js';
import {calculateTopicMastery,calculateTopicRetention} from '../../src/domain/analytics/topic-metrics.js';
import {prerequisiteBlockers} from '../../src/domain/study-eligibility.js';
import {buildStudyCandidates} from '../../src/application/build-study-candidates.js';
import {recommendStudy} from '../../src/application/recommend-study.js';
import {buildStudyPlan} from '../../src/application/build-study-plan.js';
import {buildDailyPlanProposal} from '../../src/application/planning/distribute-study-plan.js';
import {calculateReviewHealth} from '../../src/domain/analytics/review-health.js';

const today='2026-09-06';
const topic=(id,extra={})=>({id,name:id,subjectId:'s1',status:'Em andamento',estimatedStudyMinutes:180,prerequisites:[],...extra});
const diagnosis=(score,confidence=1)=>({mastery:{score,confidence},trend:{key:'stable'},lastActivity:'2026-09-01'});
function scenario(topics,diagnoses={},retentions={}){
  return buildStudyCandidates({today,topics,retentions,priorities:topics.map(t=>({topicId:t.id,subjectId:t.subjectId,topicName:t.name,subjectName:'Matemática',tipo:t.status==='Concluído'?'manutenção':'continuar',estimatedMinutes:35,studyType:t.status==='Concluído'?'review':'study',diasSemEstudar:5,diagnosis:diagnoses[t.id]}))});
}

test('recomendação e plano usam a mesma pontuação e ordenação para históricos contrastantes',()=>{
  const topics=[topic('fraco',{examImportance:.9}),topic('forte',{examImportance:.3})];
  const candidates=scenario(topics,{fraco:diagnosis(30),forte:diagnosis(85)},{fraco:{available:true,score:35,confidence:1},forte:{available:true,score:90,confidence:1}});
  const recommendations=recommendStudy(candidates,{availableMinutes:30});
  const plan=buildStudyPlan({topics:candidates.map(item=>({...item,estimatedMinutes:item.remainingMinutes})),weeklyAvailableMinutes:120,weeksUntilExam:4});
  assert.deepEqual(recommendations.map(item=>item.id),['fraco','forte']);
  assert.deepEqual(plan.items.map(item=>item.id),['fraco','forte']);
  for(const item of plan.items)assert.equal(item.score,recommendations.find(r=>r.id===item.id).score);
});

test('tópico de três horas cabe em sessão de trinta minutos sem reduzir a carga do plano',()=>{
  const candidate=scenario([topic('longo')],{longo:diagnosis(40)})[0];
  assert.equal(candidate.remainingMinutes,180);
  assert.equal(recommendStudy([candidate],{availableMinutes:30})[0].estimatedMinutes,30);
  assert.equal(recommendStudy([candidate],{availableMinutes:14}).length,0);
  assert.equal(buildStudyPlan({topics:[candidate],weeklyAvailableMinutes:60,weeksUntilExam:3}).remainingMinutes,180);
});

test('manutenção de tópico concluído frágil é semanal e não reabre teoria',()=>{
  const candidates=scenario([topic('fragil',{status:'Concluído'}),topic('consolidado',{status:'Concluído'})],{fragil:diagnosis(30),consolidado:diagnosis(90)},{fragil:{available:true,score:40,confidence:1},consolidado:{available:true,score:95,confidence:1}});
  const recommendations=recommendStudy(candidates,{availableMinutes:60});
  assert.deepEqual(recommendations.map(item=>item.id),['fragil']);
  const plan=buildStudyPlan({topics:candidates,weeklyAvailableMinutes:60,weeksUntilExam:12});
  assert.equal(plan.items.length,1);assert.equal(plan.items[0].id,'fragil');
  assert.equal(plan.items[0].activityMix.theory,0);assert.equal(plan.weeklyPlannedMinutes,35);assert.equal(plan.remainingMinutes,0);
});

test('ausência de evidência não vira domínio zero nem confiança alta',()=>{
  const candidate=scenario([topic('novo')],{novo:diagnosis(0,0)})[0];
  assert.equal(candidate.mastery,null);assert.equal(candidate.masteryGap,null);
  assert.equal(candidate.evidence.evidenceStrength,0);assert.equal(candidate.evidence.evidenceLabel,'Baixa');
  assert.ok(candidate.missingFactors.includes('masteryGap'));
  const all=calculatePriorityScore({examImpact:90,masteryGap:70,retentionRisk:60,reviewUrgency:50,reviewHealthRisk:45,planAlignment:80,recencyRisk:30,evidenceStrength:.05});
  assert.equal(all.evidence.completeness,1);assert.equal(all.evidence.evidenceLabel,'Baixa');
  assert.equal(calculatePriorityScore({examImpact:NaN,masteryGap:Infinity}).value,null);
});

test('pré-requisito frágil bloqueia recomendação e plano; nova evidência libera',()=>{
  const topics=[topic('base',{status:'Concluído'}),topic('avancado',{prerequisites:['base']})];
  let candidates=scenario(topics,{base:diagnosis(30),avancado:diagnosis(40)});
  assert.deepEqual(candidates[1].blockedPrerequisites,['base']);
  assert.deepEqual(recommendStudy(candidates,{availableMinutes:60}).map(item=>item.id),['base']);
  let plan=buildStudyPlan({topics:candidates,weeklyAvailableMinutes:120,weeksUntilExam:4});
  assert.ok(!plan.items.some(item=>item.id==='avancado'));assert.equal(plan.blockedTopics[0].id,'avancado');
  candidates=scenario(topics,{base:diagnosis(80),avancado:diagnosis(40)});
  assert.deepEqual(candidates[1].blockedPrerequisites,[]);
  assert.ok(recommendStudy(candidates,{availableMinutes:60}).some(item=>item.id==='avancado'));
});

test('bloqueia referências ausentes, arquivadas e ciclos transitivos',()=>{
  assert.deepEqual(prerequisiteBlockers(topic('a',{prerequisites:['missing']}),[]),['missing']);
  const archived=topic('base',{status:'Concluído',archived:true});
  assert.deepEqual(prerequisiteBlockers(topic('a',{prerequisites:['base']}),[archived]),['base']);
  const cycle=[topic('a',{status:'Concluído',prerequisites:['b']}),topic('b',{status:'Concluído',prerequisites:['a']})];
  assert.ok(prerequisiteBlockers(cycle[0],cycle).includes('a'));
  const direct=[{id:'base',estimatedMinutes:30},{id:'next',estimatedMinutes:90,prerequisites:['base'],examImpact:100}];
  assert.ok(!recommendStudy(direct,{availableMinutes:60}).some(item=>item.id==='next'));
});

test('sessões reduzem apenas o esforço de teoria e sessão de hoje não elimina o plano semanal',()=>{
  const topics=[topic('a')],priorities=[{topicId:'a',subjectId:'s1',estimatedMinutes:35,diagnosis:diagnosis(40)}];
  const candidates=buildStudyCandidates({topics,priorities,today,sessions:[{topicId:'a',date:today,type:'study',durationSeconds:1800},{topicId:'a',date:today,type:'questions',durationSeconds:1200},{topicId:'a',date:'2026-10-01',type:'study',durationSeconds:3600}]});
  assert.equal(candidates[0].remainingMinutes,150);assert.equal(recommendStudy(candidates,{availableMinutes:60}).length,0);
  const plan=buildStudyPlan({topics:candidates.map(item=>({...item,completed:false})),weeklyAvailableMinutes:100,weeksUntilExam:3});
  assert.equal(plan.remainingMinutes,150);assert.equal(plan.weeklyPlannedMinutes,50);
});

test('revalida pré-requisitos antes de distribuir um plano já confirmado',()=>{
  const result=buildDailyPlanProposal({studyPlan:{id:'p',items:[{id:'i',topicId:'blocked',minutes:60}]},days:[{date:today,availableMinutes:120}],eligibleTopicIds:[]});
  assert.equal(result.plannedMinutes,0);
});

test('métricas puras distinguem ausência, evidência fraca e histórico consolidado',()=>{
  const empty=calculateTopicMastery();assert.equal(empty.available,false);assert.equal(empty.confidence,0);
  const sparse=calculateTopicMastery({performance:{resolved:1,accuracy:100}});
  const strong=calculateTopicMastery({performance:{resolved:100,accuracy:90},trend:{key:'stable'},reviews:Array(4).fill({status:'Concluído'}),recentSessions:Array(4).fill({durationSeconds:1800})});
  assert.ok(strong.score>sparse.score);assert.ok(strong.evidence.evidenceStrength>sparse.evidence.evidenceStrength);
  assert.equal(calculateTopicRetention().available,false);
  const retention=calculateTopicRetention({due:Array(4).fill({}),onTime:4,resolved:100,correct:90,lastReview:today,daysSince:0});
  assert.ok(retention.score>=90);assert.equal(retention.evidence.completeness,1);
});

test('saúde da revisão alimenta a prioridade com o mesmo contrato dos demais scores',()=>{
  const reviewHealth=calculateReviewHealth({daysSinceReview:20,retention:40,mastery:45,recentPerformance:50,examImpact:90,evidenceStrength:.8});
  const scored=calculatePriorityScore({examImpact:90,retentionRisk:60,masteryGap:55,reviewUrgency:20,reviewHealthRisk:100-reviewHealth.value,planAlignment:50,recencyRisk:70,evidenceStrength:.8});
  for(const key of ['value','state','evidence','confidence','factors','reasons','algorithmVersion'])assert.ok(key in scored);
  assert.equal(scored.algorithmVersion,3);assert.ok(scored.factors.reviewHealthRisk>40);
  assert.ok(scored.reasons.includes('saúde da revisão requer atenção'));
});
