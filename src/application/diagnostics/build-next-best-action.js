import {buildStudyAction,recommendationActionLabel} from '../recommendations/recommendation-action.js';
import {diagnosticSignalLabel} from '../../domain/diagnostics/diagnostic-vocabulary.js';

// The recommendation producer owns ordering and eligibility. This adapter only adds context.
export function buildNextBestAction({recommendations=[],diagnosis=null,activePlan=null,weeklyCapacityMinutes=0}={}){
  for(const recommendation of recommendations){
    const action=buildStudyAction(recommendation,{source:'diagnosis'});
    if(!action||!action.topicId||recommendation.available===false||recommendation.eligible===false||recommendation.canStudy===false||recommendation.status&&recommendation.status!=='pending')continue;
    const row=diagnosis?.topics?.find(item=>item.subjectId===action.subjectId&&item.topicId===action.topicId)||null;
    const allocation=activePlan?.items?.find(item=>item.topicId===action.topicId);
    return {state:'available',action,label:recommendationActionLabel(action),subjectName:recommendation.subjectName||row?.subjectName||'Disciplina',topicName:recommendation.topicName||row?.name||'Tópico',
      diagnosis:row?diagnosticSignalLabel(row.primarySignal):null,evidence:row?.evidence?.label||action.evidence.label||'Não avaliada',
      reasons:[...(action.reasons||[])].slice(0,3),weeklyCapacityMinutes,weeklyPlannedMinutes:activePlan?.weeklyPlannedMinutes??null,
      currentAllocationMinutes:allocation?.minutes??null,activePlanId:activePlan?.id||null};
  }
  return {state:'insufficient',reason:'Não há recomendação elegível agora. Revise a disponibilidade, os pré-requisitos e os registros recentes.'};
}
