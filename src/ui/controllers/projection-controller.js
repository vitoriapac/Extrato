import {buildProjectionPageModel} from '../../application/projection/index.js';
import {simulateProjectionScenario} from '../../application/projection/simulate-projection-scenario.js';

// The app supplies scoped data; the projection module owns assembly and modelling.
export function createProjectionController({getContext,buildRecent,getSimulations,countStudyDays,getCandidates,getPlan,getCapacity}) {
  return {
    current(metrics,readiness,candidates) {
      const context=getContext(metrics,readiness);
      const recent=buildRecent(context.scope,context.today);
      return {...buildProjectionPageModel({today:context.today,examDate:context.examDate,targetScore:context.targetScore,
        simulations:getSimulations(),readiness:context.readiness,
        coverage:context.metrics.edital.available?context.metrics.edital.raw:null,
        adherence:recent.current.adherence,
        consistency:{days:countStudyDays(context.scope.sessions.included,context.today),target:context.consistencyTarget},
        candidates:candidates||getCandidates(),snapshots:context.snapshots,activeExamTags:context.activeExamTags}),
        weeklyCapacityMinutes:getCapacity()};
    },
    simulate(scenario) {
      const context=getContext();
      const current=this.current(context.metrics,context.readiness);
      return simulateProjectionScenario({baseline:{today:context.today,model:current.model,
        inputs:{today:context.today,examDate:context.examDate,targetScore:context.targetScore,
          simulations:current.simulations,readiness:context.readiness,...current.inputs},
        weeklyCapacityMinutes:getCapacity(),plannedMinutes:getPlan()?.weeklyPlannedMinutes??null},scenario});
    }
  };
}
