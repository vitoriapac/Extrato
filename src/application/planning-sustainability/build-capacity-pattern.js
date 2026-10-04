import {SUSTAINABILITY_POLICY as policy} from '../../domain/planning/sustainability-policy.js';
const quantile=(sorted,p)=>{const index=(sorted.length-1)*p,low=Math.floor(index);return sorted[low]+(sorted[Math.ceil(index)]-sorted[low])*(index-low)};
export function buildCapacityPattern(weeks=[]){
  const included=weeks.filter(week=>week.comparable),values=included.map(week=>week.model.summary.executedMinutes).sort((a,b)=>a-b);
  if(!values.length)return {state:'insufficient_data',observedRange:null,averageAvailableMinutes:null,averagePlannedMinutes:null,averageExecutedMinutes:null};
  const average=selector=>included.reduce((sum,week)=>sum+selector(week.model),0)/included.length;
  const step=policy.rangeRoundingMinutes;
  return {state:included.length>=policy.minimumComparableWeeks?'available':'insufficient_data',
    averageAvailableMinutes:average(model=>model.planningContext.capacity.availableMinutes),averagePlannedMinutes:average(model=>model.summary.plannedMinutes),
    averageExecutedMinutes:average(model=>model.summary.executedMinutes),
    observedRange:included.length>=policy.minimumComparableWeeks?{method:policy.rangeMethod,lowMinutes:Math.floor(quantile(values,.25)/step)*step,
      highMinutes:Math.ceil(quantile(values,.75)/step)*step,minimumMinutes:values[0],maximumMinutes:values.at(-1),roundingMinutes:step}:null};
}
