import {SUSTAINABILITY_POLICY as policy} from '../../domain/planning/sustainability-policy.js';

const labels={sustainable:'Plano compatível com a execução',capacity_mismatch:'Carga acima da execução recente',priority_mismatch:'Prioridades recorrentes pendentes',unstable_execution:'Execução irregular',isolated_anomaly:'Desvio pontual observado',monitor:'Acompanhar execução',insufficient_data:'Evidência insuficiente'};
export function sustainabilityStatus(model){
  const weeks=(model.weeks||[]).filter(week=>week.comparable),count=weeks.length;
  const result=(status,reasonCodes,action=null)=>({status,label:labels[status],reasonCodes,action,policyVersion:policy.version});
  if(count<policy.minimumComparableWeeks)return result('insufficient_data',['not_enough_comparable_weeks']);
  const times=weeks.map(week=>week.model.summary.temporalAdherence),sorted=[...times].sort((a,b)=>a-b);
  const median=sorted[Math.floor(count/2)],outliers=times.filter(value=>median-value>=policy.anomalyDeviationPoints);
  if(outliers.length===1&&times.filter(value=>value>=policy.timeAdherence.sustainable).length>=count-1)return result('isolated_anomaly',['single_low_execution_week']);
  const executed=weeks.map(week=>week.model.summary.executedMinutes),mean=executed.reduce((a,b)=>a+b,0)/count;
  const coefficient=mean?Math.sqrt(executed.reduce((sum,value)=>sum+(value-mean)**2,0)/count)/mean:0;
  if(coefficient>=policy.variabilityCoefficient)return result('unstable_execution',['large_weekly_variation']);
  const time=model.execution.timeAdherence,priority=model.execution.priorityAdherence;
  const capacityWeeks=weeks.filter(week=>week.model.summary.temporalAdherence<policy.timeAdherence.mismatch&&week.model.priority.adherence>=policy.priorityAdherence.preserved&&week.model.summary.executedMinutes<week.model.summary.plannedMinutes).length;
  const priorityWeeks=weeks.filter(week=>week.model.summary.executedMinutes>=week.model.summary.plannedMinutes*policy.timeAdherence.sustainable/100&&week.model.priority.adherence<policy.priorityAdherence.low).length;
  if(count>=policy.confirmedComparableWeeks&&capacityWeeks>=policy.minimumRepeatedWeeks&&time<policy.timeAdherence.mismatch&&priority>=policy.priorityAdherence.preserved)return result('capacity_mismatch',['repeated_volume_gap','priorities_preserved'],'review_capacity');
  if(count>=policy.confirmedComparableWeeks&&priorityWeeks>=policy.minimumRepeatedWeeks&&priority<policy.priorityAdherence.low)return result('priority_mismatch',['repeated_priority_gap','study_volume_preserved'],'review_distribution');
  if(time>=policy.timeAdherence.sustainable&&priority>=policy.priorityAdherence.preserved)return result('sustainable',['time_and_priorities_preserved']);
  return result('monitor',[count<policy.confirmedComparableWeeks?'preliminary_evidence':'no_dominant_repeated_pattern']);
}
