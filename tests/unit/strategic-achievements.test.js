import test from 'node:test';
import assert from 'node:assert/strict';
import {buildStrategicAchievements} from '../../src/application/achievements/build-strategic-achievements.js';

test('Estrategista exige dez tópicos distintos de alto impacto com sessão real',()=>{
  const candidates=Array.from({length:11},(_,index)=>({topicId:`topic-${index}`,subjectId:'s',examImpact:index<10?80:20,mastery:50,evidenceStrength:.8}));
  const sessions=Array.from({length:10},(_,index)=>({topicId:`topic-${index}`,durationSeconds:900}));
  const achieved=buildStrategicAchievements({candidates,sessions:[...sessions,sessions[0]]});
  assert.equal(achieved.strategist.unlocked,true);
  assert.equal(achieved.strategist.progress.current,10);
  assert.equal(buildStrategicAchievements({candidates,sessions:sessions.slice(0,9)}).strategist.unlocked,false);
  assert.equal(buildStrategicAchievements({candidates,sessions:[...sessions.slice(0,9),{topicId:'topic-10',durationSeconds:900}]}).strategist.unlocked,false);
});

test('Cobertura crítica exige todos os tópicos relevantes da disciplina com domínio e evidência',()=>{
  const candidates=[{topicId:'one',subjectId:'s',examImpact:82,mastery:75,evidenceStrength:.8},{topicId:'two',subjectId:'s',examImpact:79,mastery:69,evidenceStrength:.9},{topicId:'low',subjectId:'s',examImpact:20,mastery:10,evidenceStrength:.9}];
  const partial=buildStrategicAchievements({candidates});
  assert.equal(partial.criticalCoverage.unlocked,false);
  assert.deepEqual(partial.criticalCoverage.progress,{current:1,target:2,unit:'tópicos críticos'});
  assert.equal(buildStrategicAchievements({candidates:candidates.map(item=>item.topicId==='two'?{...item,mastery:72,evidenceStrength:.4}:item)}).criticalCoverage.unlocked,false);
  assert.equal(buildStrategicAchievements({candidates:candidates.map(item=>item.topicId==='two'?{...item,mastery:72}:item)}).criticalCoverage.unlocked,true);
  assert.equal(buildStrategicAchievements({candidates:candidates.slice(0,1)}).criticalCoverage.unlocked,false);
});

test('Prova mapeada considera apenas provas completas do concurso ativo',()=>{
  const exams=Array.from({length:5},(_,index)=>({id:`exam-${index}`,coverage:index===4?'partial':'complete',examTags:index<4?['bb-escriturario']:['caixa-tbn']}));
  assert.equal(buildStrategicAchievements({exams,activeExamTags:['bb-escriturario']}).mappedExam.unlocked,true);
  assert.equal(buildStrategicAchievements({exams,activeExamTags:['caixa-tbn']}).mappedExam.unlocked,false);
  assert.equal(buildStrategicAchievements({exams:exams.slice(0,3),activeExamTags:['bb-escriturario']}).mappedExam.progress.current,3);
});
