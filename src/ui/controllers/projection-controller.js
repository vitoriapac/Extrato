import {buildProjectionPageModel} from '../../application/projection/index.js';

// The app supplies scoped data; the projection module owns assembly and modelling.
export function createProjectionController({getContext,buildRecent,getSimulations,countStudyDays,getCandidates}) {
  return {
    current(metrics,readiness,candidates) {
      const context=getContext(metrics,readiness);
      const recent=buildRecent(context.scope,context.today);
      return buildProjectionPageModel({today:context.today,examDate:context.examDate,targetScore:context.targetScore,
        simulations:getSimulations(),readiness:context.readiness,
        coverage:context.metrics.edital.available?context.metrics.edital.raw:null,
        adherence:recent.current.adherence,
        consistency:{days:countStudyDays(context.scope.sessions.included,context.today),target:context.consistencyTarget},
        candidates:candidates||getCandidates(),snapshots:context.snapshots,activeExamTags:context.activeExamTags});
    }
  };
}
