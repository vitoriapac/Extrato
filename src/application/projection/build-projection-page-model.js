import {buildAchievementProjection} from './build-achievement-projection.js';
import {buildProjectionTopicRisks} from './build-projection-topic-risks.js';
import {achievementProjectionHistory} from './achievement-projection-history.js';
import {buildProjectionCloseContext} from './build-projection-close-context.js';

export function buildProjectionPageModel({today,examDate,targetScore,simulations=[],readiness=null,
  coverage=null,adherence=null,consistency=null,candidates=[],snapshots=[],activeExamTags=[],periodStart=null}={}) {
  const topicRisks=buildProjectionTopicRisks(candidates);
  const inputs={coverage,adherence,consistency,openHighImpactPriorities:topicRisks.length,topicRisks};
  const model=buildAchievementProjection({today,examDate,targetScore,simulations,readiness,...inputs});
  const history=achievementProjectionHistory(snapshots,activeExamTags,today);
  const closeContext=periodStart?buildProjectionCloseContext({current:model,snapshots,activeExamTags,periodStart,today}):null;
  return {model,inputs,simulations,history,closeContext};
}
