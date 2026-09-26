import test from 'node:test';
import assert from 'node:assert/strict';
import {buildExamIntelligenceStressFixture,STRESS_TAGS,STRESS_TOPICS} from '../fixtures/exam-intelligence-stress.js';
import {buildExamMatrix} from '../../src/application/exam-intelligence/build-exam-matrix.js';
import {buildExamDataQuality} from '../../src/application/exam-intelligence/build-exam-data-quality.js';
import {buildExamConfigurationAudit} from '../../src/application/exam-intelligence/build-exam-configuration-audit.js';
import {buildStudyCandidates} from '../../src/application/build-study-candidates.js';
import {buildAdaptivePlanningAdvice,applyAdaptivePlanningAdvice} from '../../src/domain/planning/adaptive-planning.js';

const fixture=buildExamIntelligenceStressFixture();
const {state,topics}=fixture;
const byId=id=>topics.find(topic=>topic.id===id);
const scope=tag=>({topics,exams:state.exams,examQuestions:state.examQuestions,activeExamTags:[tag]});

function candidatesFor(tag){
  const ids=[STRESS_TOPICS.strong,STRESS_TOPICS.weak,STRESS_TOPICS.rare];
  const mastery={[STRESS_TOPICS.strong]:91,[STRESS_TOPICS.weak]:42,[STRESS_TOPICS.rare]:42};
  const priorities=ids.map(id=>({topicId:id,subjectId:byId(id).subjectId,subjectName:byId(id).subjectName,topicName:byId(id).name,tipo:'continuar',estimatedMinutes:30,diasSemEstudar:2,diagnosis:{mastery:{score:mastery[id],confidence:.9},trend:{direction:'stable'},lastActivity:'2026-09-20'}}));
  const retentions=Object.fromEntries(ids.map(id=>[id,{available:true,score:id===STRESS_TOPICS.strong?88:48,confidence:.9}]));
  return buildStudyCandidates({...scope(tag),priorities,retentions,blueprint:state.examBlueprint.subjects,sessions:[],today:'2026-09-25'});
}

test('massa determinística reúne 130 dias pessoais e 16 provas históricas sem misturar questões',()=>{
  assert.equal(state.progressHistory.length,130);
  assert.equal(state.studySessions.length,170);
  assert.equal(state.exams.length,16);
  assert.deepEqual([STRESS_TAGS.bb,STRESS_TAGS.caixa,STRESS_TAGS.ti].map(tag=>state.exams.filter(exam=>exam.examTags.includes(tag)).length),[6,6,4]);
  assert.equal(state.exams.filter(exam=>exam.coverage==='partial').length,3);
  assert.ok(state.exams.some(exam=>exam.unresolvedQuestions.length));
  assert.ok(state.examQuestions.some(question=>question.classification.confidence<.5));
  assert.ok(new Set(state.examQuestions.map(question=>question.weight)).size>1);
  assert.equal(state.questoes.length,102);
  assert.deepEqual(buildExamIntelligenceStressFixture(),fixture);
});

test('troca de concurso refaz matriz, qualidade e impacto sem reaproveitar denominador anterior',()=>{
  const bb=buildExamMatrix({...scope(STRESS_TAGS.bb),filters:{scope:'active'}});
  const caixa=buildExamMatrix({...scope(STRESS_TAGS.caixa),filters:{scope:'active'}});
  const ti=buildExamMatrix({...scope(STRESS_TAGS.ti),filters:{scope:'active'}});
  assert.deepEqual([bb.exams.length,caixa.exams.length,ti.exams.length],[5,5,3]);
  assert.equal(bb.rows.find(row=>row.topicId===STRESS_TOPICS.rare).presencePercent,20);
  assert.equal(caixa.rows.find(row=>row.topicId===STRESS_TOPICS.rare).presencePercent,0);
  assert.equal(buildExamDataQuality({exams:state.exams,examQuestions:state.examQuestions,topics,blueprint:{activeExamTags:[STRESS_TAGS.bb]}}).examCount,6);
  assert.equal(buildExamDataQuality({exams:state.exams,examQuestions:state.examQuestions,topics,blueprint:{activeExamTags:[STRESS_TAGS.ti]}}).confidence,'low');
  assert.notEqual(candidatesFor(STRESS_TAGS.bb).find(row=>row.topicId===STRESS_TOPICS.weak).examImpact,candidatesFor(STRESS_TAGS.caixa).find(row=>row.topicId===STRESS_TOPICS.weak).examImpact);
});

test('tópico comum mantém identidade e progresso únicos com evidência separável',()=>{
  const bb=buildExamMatrix({...scope(STRESS_TAGS.bb),filters:{scope:'active'}});
  const caixa=buildExamMatrix({...scope(STRESS_TAGS.caixa),filters:{scope:'active'}});
  const both=buildExamMatrix({...scope(STRESS_TAGS.bb),activeExamTags:[STRESS_TAGS.bb,STRESS_TAGS.caixa],filters:{scope:'active'}});
  assert.equal(both.rows.filter(row=>row.topicId===STRESS_TOPICS.common).length,1);
  assert.equal(both.rows.find(row=>row.topicId===STRESS_TOPICS.common).examCount,bb.exams.length+caixa.exams.length);
  assert.equal(state.subjects.flatMap(subject=>subject.topics).filter(topic=>topic.id===STRESS_TOPICS.common).length,1);
  assert.equal(state.studySessions.filter(session=>session.topicId===STRESS_TOPICS.common).length>0,true);
});

test('estudantes extremos distinguem importância de necessidade pessoal',()=>{
  const candidates=candidatesFor(STRESS_TAGS.bb),get=id=>candidates.find(row=>row.topicId===id);
  assert.ok(get(STRESS_TOPICS.weak).examImpact>get(STRESS_TOPICS.rare).examImpact);
  assert.ok(get(STRESS_TOPICS.weak).score>get(STRESS_TOPICS.strong).score);
  assert.ok(get(STRESS_TOPICS.weak).score>get(STRESS_TOPICS.rare).score);
});

test('histórico escasso preserva configuração; divergência manual e peso oficial permanecem intactos',()=>{
  const one={...state.exams.find(exam=>exam.examTags.includes(STRESS_TAGS.bb))};
  const small=buildStudyCandidates({...scope(STRESS_TAGS.bb),exams:[one],priorities:[{topicId:STRESS_TOPICS.weak,subjectId:byId(STRESS_TOPICS.weak).subjectId,diagnosis:{mastery:{score:42,confidence:.9}}}],today:'2026-09-25'});
  assert.ok(Math.abs(small[0].examImpact-55)<.001);
  assert.equal(small[0].examIntelligence.usedHistory,false);
  const audit=buildExamConfigurationAudit({topics,blueprint:state.examBlueprint,exams:state.exams,examQuestions:state.examQuestions});
  const manual=audit.rows.find(row=>row.topicId===STRESS_TOPICS.manual),official=audit.rows.find(row=>row.topicId===STRESS_TOPICS.official);
  assert.equal(manual.status,'divergent');
  assert.equal(manual.validatedImpact,25);
  assert.equal(official.configuredSource,'official');
  assert.equal(official.usedHistory,false);
});

test('planejamento BB transfere somente com necessidade, preserva capacidade e respeita cooldown',()=>{
  const candidates=candidatesFor(STRESS_TAGS.bb).map(row=>row.topicId===STRESS_TOPICS.rare?{...row,mastery:90}:row);
  const plan={weeklyPlannedMinutes:180,subjects:[{subjectId:byId(STRESS_TOPICS.rare).subjectId,subjectName:'Direito Constitucional',minutes:90},{subjectId:byId(STRESS_TOPICS.weak).subjectId,subjectName:'Matemática',minutes:90}],items:[{id:'rare',subjectId:byId(STRESS_TOPICS.rare).subjectId,minutes:90,capacityMinutes:120,activityMix:{theory:30,questions:30,reviews:30}},{id:'weak',subjectId:byId(STRESS_TOPICS.weak).subjectId,minutes:90,capacityMinutes:150,activityMix:{theory:30,questions:30,reviews:30}}]};
  const advice=buildAdaptivePlanningAdvice({plan,candidates,today:'2026-09-25'});
  assert.equal(advice.state,'proposal',advice.reason);
  assert.equal(advice.to.subjectId,byId(STRESS_TOPICS.weak).subjectId);
  const adjusted=applyAdaptivePlanningAdvice(plan,advice);
  assert.equal(adjusted.weeklyPlannedMinutes,180);
  assert.equal(plan.subjects[0].minutes,90);
  const blocked=buildAdaptivePlanningAdvice({plan,candidates,history:[{status:'applied',sourceSubjectId:advice.from.subjectId,targetSubjectId:advice.to.subjectId,decidedAt:'2026-09-23T12:00:00Z'}],today:'2026-09-25'});
  assert.equal(blocked.state,'stable');
});
