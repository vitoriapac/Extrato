import test from 'node:test';
import assert from 'node:assert/strict';
import {buildExamIntelligenceStressFixture,STRESS_TAGS,STRESS_TOPICS} from '../fixtures/exam-intelligence-stress.js';
import {buildStudyCandidates} from '../../src/application/build-study-candidates.js';
import {buildExamMatrix} from '../../src/application/exam-intelligence/build-exam-matrix.js';
import {buildExamDataQuality} from '../../src/application/exam-intelligence/build-exam-data-quality.js';
import {buildExamConfigurationAudit} from '../../src/application/exam-intelligence/build-exam-configuration-audit.js';
import {buildExamReportSummary} from '../../src/reports/exam-report-summary.js';
import {buildWeeklyStrategicFocus} from '../../src/application/analytics/build-weekly-strategic-focus.js';
import {buildAdaptivePlanningAdvice} from '../../src/domain/planning/adaptive-planning.js';
import {renderExamMatrix} from '../../src/ui/renderers/exam-matrix-renderer.js';
import {renderExamConfigurationAudit} from '../../src/ui/renderers/exam-configuration-audit-renderer.js';

const {state,topics}=buildExamIntelligenceStressFixture();
const byId=id=>topics.find(topic=>topic.id===id);
const priorities=[STRESS_TOPICS.strong,STRESS_TOPICS.weak,STRESS_TOPICS.manual].map(id=>({
  topicId:id,subjectId:byId(id).subjectId,subjectName:byId(id).subjectName,topicName:byId(id).name,
  tipo:'continuar',estimatedMinutes:30,diasSemEstudar:2,
  diagnosis:{mastery:{score:id===STRESS_TOPICS.strong?91:42,confidence:.9},trend:{direction:'stable'},lastActivity:'2026-09-20'}
}));
const retentions=Object.fromEntries(priorities.map(item=>[item.topicId,{available:true,score:item.topicId===STRESS_TOPICS.strong?88:48,confidence:.9}]));
const buildFor=(tags,exams=state.exams)=>buildStudyCandidates({topics,priorities,retentions,blueprint:state.examBlueprint.subjects,exams,examQuestions:state.examQuestions,activeExamTags:tags,today:'2026-09-25'});

test('escopos BB, Caixa TBN, Caixa TI e conjunto mantêm os denominadores em matriz, qualidade e PDF',()=>{
  for(const [tags,expectedComplete] of [[STRESS_TAGS.bb,5],[STRESS_TAGS.caixa,5],[STRESS_TAGS.ti,3],[[STRESS_TAGS.bb,STRESS_TAGS.caixa],10]]){
    const activeExamTags=Array.isArray(tags)?tags:[tags];
    const blueprint={...state.examBlueprint,activeExamTags};
    const matrix=buildExamMatrix({topics,exams:state.exams,examQuestions:state.examQuestions,activeExamTags,filters:{scope:'active'}});
    const quality=buildExamDataQuality({exams:state.exams,examQuestions:state.examQuestions,topics,blueprint});
    const report=buildExamReportSummary({state:{...state,examBlueprint:blueprint},topics,candidates:buildFor(activeExamTags)});
    assert.equal(matrix.exams.length,expectedComplete);
    assert.equal(quality.completeExamCount,expectedComplete);
    assert.equal(report.completeExamCount,expectedComplete);
    assert.equal(report.questionCount,matrix.analyzedQuestionCount);
    assert.equal(report.confidence,quality.confidence);
  }
});

test('histórico insuficiente conserva estimativa e a mesma evidência explica impacto, matriz, foco e PDF',()=>{
  const activeExamTags=[STRESS_TAGS.bb];
  const sparse=buildFor(activeExamTags,state.exams.filter(exam=>exam.examTags.includes(STRESS_TAGS.bb)).slice(0,1));
  const sparseWeak=sparse.find(item=>item.topicId===STRESS_TOPICS.weak);
  assert.ok(Math.abs(sparseWeak.examImpact-55)<.001);
  assert.equal(sparseWeak.examIntelligence.usedHistory,false);

  const candidates=buildFor(activeExamTags),weak=candidates.find(item=>item.topicId===STRESS_TOPICS.weak);
  const audit=buildExamConfigurationAudit({topics,blueprint:state.examBlueprint,exams:state.exams,examQuestions:state.examQuestions});
  const auditByTopic=Object.fromEntries(audit.rows.map(row=>[row.topicId,row]));
  const matrix=buildExamMatrix({topics,exams:state.exams,examQuestions:state.examQuestions,activeExamTags,filters:{scope:'active'},auditByTopic});
  const matrixWeak=matrix.rows.find(item=>item.topicId===weak.topicId);
  const report=buildExamReportSummary({state,topics,candidates});
  const focus=buildWeeklyStrategicFocus({sessions:[{date:'2026-09-25',topicId:weak.topicId,durationSeconds:3600}],candidates,recommendations:[],start:'2026-09-19',end:'2026-09-25'});
  assert.equal(weak.examIntelligence.usedHistory,true);
  assert.equal(auditByTopic[weak.topicId].validatedImpact,weak.examImpact);
  assert.equal(matrixWeak.impact,weak.examImpact);
  assert.equal(matrixWeak.examCount,5);
  assert.equal(matrixWeak.presentExamCount,weak.examIntelligence.presentExamCount);
  assert.equal(report.gaps.some(item=>item.topicId===weak.topicId),weak.examImpact>=70);
  assert.equal(focus.highImpactPercent,weak.examImpact>=70?100:0);
  assert.equal(focus.workedGaps,weak.examImpact>=70?1:0);
  assert.match(renderExamMatrix(matrix,{selectedTopicId:weak.topicId}),/Prova × Você|Histórico|histórico/i);
});

test('configuração manual divergente prevalece na auditoria e na prioridade sem redistribuição automática',()=>{
  const candidates=buildFor([STRESS_TAGS.bb]),manual=candidates.find(item=>item.topicId===STRESS_TOPICS.manual);
  const audit=buildExamConfigurationAudit({topics,blueprint:state.examBlueprint,exams:state.exams,examQuestions:state.examQuestions});
  const row=audit.rows.find(item=>item.topicId===STRESS_TOPICS.manual);
  assert.equal(row.status,'divergent');
  assert.equal(row.configuredImpact,25);
  assert.equal(row.validatedImpact,25);
  assert.equal(manual.examImpact,25);
  assert.equal(manual.examIntelligence.usedHistory,false);
  assert.match(renderExamConfigurationAudit(audit),/Configurado 25 · Histórico \d+ · Usado 25 \(Impacto manual\)/);
  const plan={weeklyPlannedMinutes:180,subjects:[
    {subjectId:byId(STRESS_TOPICS.strong).subjectId,subjectName:'Origem',minutes:90},
    {subjectId:byId(STRESS_TOPICS.manual).subjectId,subjectName:'Destino',minutes:90}
  ],items:[
    {id:'source',subjectId:byId(STRESS_TOPICS.strong).subjectId,minutes:90,capacityMinutes:120,activityMix:{theory:30,questions:30,reviews:30}},
    {id:'target',subjectId:byId(STRESS_TOPICS.manual).subjectId,minutes:90,capacityMinutes:150,activityMix:{theory:30,questions:30,reviews:30}}
  ]};
  const advice=buildAdaptivePlanningAdvice({plan,candidates,today:'2026-09-25'});
  assert.equal(advice.state,'stable');
  assert.equal(plan.weeklyPlannedMinutes,180);
});
