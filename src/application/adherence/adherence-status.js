export const ADHERENCE_STATUS_POLICY=Object.freeze({version:1,target:80,minimumClassifiedCoverage:80});

const labels=Object.freeze({aligned:'Execução alinhada',time_gap:'Carga parcialmente executada',priority_gap:'Prioridades pouco executadas',mixed:'Carga e prioridades pendentes',insufficient_data:'Dados insuficientes'});

export function adherenceStatus(model){
  const result=(status,reasonCodes)=>({status,label:labels[status],reasonCodes,policyVersion:ADHERENCE_STATUS_POLICY.version});
  if(!model?.period?.evaluatedEnd||!model.summary?.plannedMinutes)return result('insufficient_data',['no_evaluated_plan']);
  if(model.ambiguousItemCount)return result('insufficient_data',['ambiguous_plan_identity']);
  if(model.priority.classifiedCoverage<ADHERENCE_STATUS_POLICY.minimumClassifiedCoverage)return result('insufficient_data',['limited_historical_classification']);
  if(!model.priority.plannedMinutes)return result('insufficient_data',['no_recorded_priority_allocation']);
  const timeGap=model.summary.temporalAdherence<ADHERENCE_STATUS_POLICY.target;
  const priorityGap=model.priority.adherence<ADHERENCE_STATUS_POLICY.target;
  return result(timeGap?(priorityGap?'mixed':'time_gap'):(priorityGap?'priority_gap':'aligned'),
    [...(timeGap?['temporal_adherence_below_target']:[]),...(priorityGap?['priority_adherence_below_target']:[])]);
}
