import test from 'node:test';
import assert from 'node:assert/strict';
import {buildDecisionCoherenceReport} from '../../src/application/diagnostics/build-decision-coherence-report.js';
import {decisionCoherenceScenarios} from '../fixtures/decision-coherence/scenarios.js';

for(const [name,scenario] of Object.entries(decisionCoherenceScenarios)){
  test(`coerência entre motores: ${name}`,()=>{
    const {expected,...outputs}=structuredClone(scenario);
    const before=structuredClone(outputs);
    const report=buildDecisionCoherenceReport(outputs);
    assert.equal(report.status,expected);
    assert.equal(report.summary.risks,outputs.trajectory.status==='insufficient_data'?0:outputs.trajectory.topicRisks.length);
    assert.equal(report.summary.explained+report.summary.unexplained,report.divergences.length);
    assert.deepEqual(outputs,before);
  });
}

import {buildProductDecisionProfile,PRODUCT_PROFILE_TODAY} from '../fixtures/decision-coherence/product-profiles.js';
import {renderDailyExecution} from '../../src/ui/renderers/daily-execution-renderer.js';
import {renderNextBestAction} from '../../src/ui/renderers/next-best-action-renderer.js';
import {buildWeeklyDecisionSummary} from '../../src/application/analytics/build-weekly-decision-cycle.js';
import {buildPlanExecution} from '../../src/application/goals/build-plan-execution.js';
import {buildWeeklyCloseAdherence} from '../../src/application/adherence/build-weekly-close-adherence.js';
for(const profile of ['beginner','intermediate','irregular','final_stretch'])test('contratos de produto com motores reais: '+profile,()=>{
 const result=buildProductDecisionProfile(profile),before=JSON.stringify(result.state),{daily,nextBestAction,trajectory,adherence}=result;
 const html=renderDailyExecution(daily,{escapeHtml:String,escapeAttr:String,formatMinutes:value=>value+' min'});
 assert.equal(trajectory.projection.examDayScore,null);assert.equal(trajectory.projection.approvalProbability,null);
 if(daily.priority.nextItem)assert.ok(html.includes('data-daily-start="'+daily.priority.nextItem.id+'"'));
 if(nextBestAction.action){const recommendation=result.recommendations[0];assert.equal(nextBestAction.action.topicId,recommendation.topicId);const actionHtml=renderNextBestAction(nextBestAction,{escapeHtml:String,escapeAttr:String,dailyPriority:daily.priority});if(nextBestAction.state==='ACTION_OPTIONAL')assert.match(actionHtml,/class="btn ghost small"[^>]*data-study-action-source/)}
 if(profile==='beginner'){assert.equal(trajectory.status,'insufficient_data');assert.equal(nextBestAction.state,'INSUFFICIENT_EVIDENCE');assert.equal(result.readiness.state,'insufficient');assert.ok(result.readiness.confidence<.35);assert.equal(result.readiness.factors.retention,null)}
 if(profile==='final_stretch'){assert.equal(trajectory.exam.daysRemaining,10);assert.equal(trajectory.status,'at_risk')}
 if(profile==='intermediate')assert.notEqual(trajectory.status,'insufficient_data');
 if(profile==='irregular')assert.ok(adherence.model.summary.temporalAdherence<80);
 assert.equal(result.coherence.summary.unexplained,0,'Divergência entre motores sem explicação');
 const cycle=result.cycle;
 const summary=buildWeeklyDecisionSummary({cycle,trajectory:result.closeContext,adherence});
 assert.equal(summary.trajectory.delta,result.closeContext.state==='comparable'?result.closeContext.accuracyDelta:null);
 // Compare the same civil week: the profile's rolling six-day window is a different scope.
 const input={today:PRODUCT_PROFILE_TODAY,subjects:result.state.subjects,dailyPlans:result.state.dailyPlans,sessions:result.state.studySessions,activeExamTags:result.state.examBlueprint.activeExamTags};
 const execution=buildPlanExecution({...input,hoursByDay:result.state.metas.horasPorDia});
 const close=buildWeeklyCloseAdherence({...input,start:execution.adherenceModel.period.start,end:execution.adherenceModel.period.end});
 assert.deepEqual(close.model.summary,execution.adherenceModel.summary,'Metas e fechamento divergem no mesmo período');
 assert.equal(close.assessment.status,execution.adherenceModel.assessment.status);
 assert.equal(execution.capacityMinutes,result.weeklyCapacityMinutes);
 const sameWeek=buildWeeklyDecisionSummary({cycle,trajectory:result.closeContext,adherence:close});
 assert.equal(sameWeek.priorities?.percent??null,close.assessment.status==='insufficient_data'?null:execution.adherenceModel.priority.adherence);
 assert.equal(JSON.stringify(result.state),before);
});
