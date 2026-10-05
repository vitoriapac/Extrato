import {buildWeeklyDecisionCycle} from '../../../src/application/analytics/build-weekly-decision-cycle.js';
import {buildHistoricalReadinessMetrics} from '../../../src/application/analytics/readiness-history.js';
import {calculateReadinessScore} from '../../../src/domain/analytics/readiness-score.js';
import {generateDemoData} from '../../../src/demo/demo-generator.js';
import {buildDemoPreparationScenario} from '../../../src/demo/demo-preparation-profiles.js';
import {buildDemoStrategyCandidates} from '../../../src/demo/demo-builders/strategy-evidence.js';
import {recommendStudy} from '../../../src/application/recommend-study.js';
import {buildNextBestAction} from '../../../src/application/diagnostics/build-next-best-action.js';
import {buildDailyExecutionModel} from '../../../src/application/daily-execution/build-daily-execution-model.js';
import {buildWeeklyCloseAdherence} from '../../../src/application/adherence/build-weekly-close-adherence.js';
import {buildAchievementProjection} from '../../../src/application/projection/build-achievement-projection.js';
import {buildProjectionTopicRisks} from '../../../src/application/projection/build-projection-topic-risks.js';
import {buildProjectionCloseContext} from '../../../src/application/projection/build-projection-close-context.js';
import {buildDecisionCoherenceReport} from '../../../src/application/diagnostics/build-decision-coherence-report.js';
import {createDefaultState} from '../../../src/state/defaults.js';
import {addLocalDays} from '../../../src/core/date-utils.js';

export const PRODUCT_PROFILE_TODAY='2026-10-03';
export function buildProductDecisionProfile(profile){
 if(!['beginner','intermediate','irregular','final_stretch'].includes(profile))throw new TypeError('Unknown product profile');
 const preparationProfile=profile==='final_stretch'?'final_stretch':profile==='intermediate'?'recovery':'standard';
 const today=PRODUCT_PROFILE_TODAY,state=profile==='beginner'?createDefaultState():generateDemoData({today,preparationProfile});
 const start=addLocalDays(today,-6),activeExamTags=state.examBlueprint.activeExamTags||[],weeklyCapacityMinutes=Object.values(state.metas.horasPorDia||{}).reduce((sum,h)=>sum+Number(h)*60,0);
 // Irregular uses the Demo's existing low-credit execution graph. No outcomes are invented.
 const candidates=profile==='beginner'?[]:buildDemoStrategyCandidates(buildDemoPreparationScenario(preparationProfile),{today,subjects:state.subjects,sessions:state.studySessions,questions:state.questoes,exams:state.exams,examQuestions:state.examQuestions,blueprint:state.examBlueprint});
 const recommendations=recommendStudy(candidates,{availableMinutes:120});
 const adherence=buildWeeklyCloseAdherence({start,end:today,today,subjects:state.subjects,dailyPlans:state.dailyPlans,sessions:state.studySessions,activeExamTags});
 const readiness=calculateReadinessScore(buildHistoricalReadinessMetrics({subjects:state.subjects,sessions:state.studySessions,questions:state.questoes,reviews:state.reviewAgenda,simulations:state.simulados,dailyHours:state.metas.horasPorDia,date:today,activeExamTags}));
 const topicRisks=buildProjectionTopicRisks(candidates),trajectory=buildAchievementProjection({today,examDate:state.examDate,targetScore:80,simulations:state.simulados,adherence:adherence.model.summary.temporalAdherence,topicRisks,openHighImpactPriorities:topicRisks.length});
 const activePlan=state.studyPlans.at(-1)||null,nextBestAction=buildNextBestAction({recommendations,projection:trajectory,activePlan,weeklyCapacityMinutes});
 const daily=buildDailyExecutionModel({today,subjects:state.subjects,dailyPlans:state.dailyPlans,sessions:state.studySessions,activeExamTags,nextBestAction,activePlan});
 const closeContext=buildProjectionCloseContext({current:trajectory,snapshots:state.projectionSnapshots,activeExamTags,periodStart:start,today});
 const cycle=buildWeeklyDecisionCycle({close:{adherence,comparison:{accuracy:{delta:null}},mainRisk:null},start,end:today,previousStart:addLocalDays(start,-7),previousEnd:addLocalDays(start,-1),sessions:state.studySessions,dailyPlans:state.dailyPlans,recommendations:state.recommendationFeedback,simulations:state.simulados,subjects:state.subjects,snapshots:state.readinessSnapshots,activeExamTags,readiness});
 const coherence=buildDecisionCoherenceReport({trajectory,nextBestAction,examIntelligence:candidates.map(item=>({subjectId:item.subjectId,topicId:item.topicId,impact:item.examImpact})),adaptivePlan:activePlan});
 return {profile,state,candidates,recommendations,adherence,trajectory,nextBestAction,daily,closeContext,coherence,weeklyCapacityMinutes,readiness,cycle};
}
