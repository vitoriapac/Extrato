import {buildPreparationSignals} from '../analytics/build-preparation-signals.js';
import {buildDiagnosisViewModel} from '../analytics/build-analytics-view-model.js';
import {generateDiagnosis} from '../generate-diagnosis.js';
import {buildConsolidatedDiagnosis} from './build-consolidated-diagnosis.js';
import {buildNextBestAction} from './build-next-best-action.js';
import {buildReviewDebt} from './build-review-debt.js';

export function buildDiagnosisPageModel({candidates=[],subjects=[],scope,blueprint={},globalTarget=80,today,activeExamTags=[],recommendations=[],opportunityCosts=[],activePlan=null,weeklyCapacityMinutes=0,hoursByDay={},projection=null}={}){
  const preparationSignals=buildPreparationSignals({subjects,candidates,questions:scope.questions.included,sessions:scope.sessions.included,blueprint,globalTarget,today});
  const consolidated=buildConsolidatedDiagnosis({candidates,subjects,eligibleTopics:scope.content.eligibleTopics,preparationSignals,recommendations,opportunityCosts,activeExamTags});
  const rawCapacityMinutes=Object.values(hoursByDay).reduce((sum,hours)=>sum+(Number(hours)||0)*60,0);
  const diagnosis=buildDiagnosisViewModel(generateDiagnosis(candidates),{limit:Number.MAX_SAFE_INTEGER,hasTopics:candidates.length>0,weeklyCapacityMinutes:rawCapacityMinutes});
  diagnosis.consolidated=consolidated;
  const nextAction=buildNextBestAction({recommendations,diagnosis:consolidated,activePlan,weeklyCapacityMinutes,projection});
  const riskTopicIds=preparationSignals.rows.filter(item=>item.type==='consolidation').map(item=>item.topicId);
  const debt=buildReviewDebt({reviews:scope.reviews.included,candidates,today,riskTopicIds});
  return {diagnosis,consolidated,preparationSignals,nextAction,debt};
}
