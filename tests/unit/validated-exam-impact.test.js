import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveValidatedExamImpact} from '../../src/domain/exam-intelligence/validated-impact.js';
import {calculatePriorityScore,PRIORITY_WEIGHTS} from '../../src/domain/analytics/priority-score.js';
import {buildPriorityViewModel} from '../../src/ui/view-models/priority-view-model.js';
import {buildStudyCandidates} from '../../src/application/build-study-candidates.js';

const profile={impactValue:50,impactSourceType:'estimated',confidence:'moderate',analyzedExamCount:5,presentExamCount:4,presencePercent:80,participationPercent:20,confidenceLabel:'Moderada'};

test('histórico confiável ajusta apenas o impacto existente, com limite de variação',()=>{
  const result=resolveValidatedExamImpact(profile);
  assert.deepEqual(result,{value:56,usedHistory:true,historical:68});
  assert.equal(PRIORITY_WEIGHTS.examImpact,.225);
});

test('amostra fraca e escolhas manual ou oficial não são substituídas',()=>{
  for(const variant of [{confidence:'low'},{analyzedExamCount:1},{impactSourceType:'manual'},{impactSourceType:'official'}]){
    assert.deepEqual(resolveValidatedExamImpact({...profile,...variant}),{value:50,usedHistory:false});
  }
});

test('domínio pessoal alto impede que só a incidência vença a prioridade',()=>{
  const common={retentionRisk:30,trendRisk:20,reviewUrgency:0,reviewHealthRisk:20,planAlignment:60,recencyRisk:20};
  const mastered=calculatePriorityScore({...common,examImpact:95,masteryGap:9});
  const needed=calculatePriorityScore({...common,examImpact:78,masteryGap:58,retentionRisk:52});
  assert.ok(needed.score>mastered.score);
});

test('explicação distingue prova, pessoa e origem da evidência',()=>{
  const model=buildPriorityViewModel({mastery:54,retention:61,examIntelligence:{...profile,usedHistory:true},evidence:{}},1);
  assert.match(model.examExplanation,/4 de 5 provas/);
  assert.match(model.examExplanation,/histórico considerado/);
  assert.match(model.personalExplanation,/Domínio 54\/100/);
});

test('candidato usa histórico validado no fator de impacto existente',()=>{
  const topic={id:'t1',subjectId:'s1',name:'Juros Compostos',status:'Em andamento',estimatedStudyMinutes:90,prerequisites:[],examImportanceEstimates:{bb:.5}};
  const exams=[2020,2021,2022,2023,2024].map(year=>({id:`e${year}`,year,coverage:'complete',examTags:['bb']}));
  const examQuestions=exams.slice(0,4).map((exam,index)=>({id:`q${index}`,examId:exam.id,topicId:'t1',classification:{confidence:1}}));
  const input={topics:[topic],priorities:[{topicId:'t1',subjectId:'s1',tipo:'continuar',diagnosis:{mastery:{score:45,confidence:.8}},estimatedMinutes:30}],today:'2026-09-25',activeExamTags:['bb']};
  const without=buildStudyCandidates(input)[0],withHistory=buildStudyCandidates({...input,exams,examQuestions})[0];
  assert.equal(without.examImpact,50);
  assert.equal(withHistory.examIntelligence.usedHistory,true);
  assert.ok(withHistory.examImpact>without.examImpact);
  assert.ok(withHistory.score>without.score);
});
