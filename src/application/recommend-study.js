import {calculatePriorityScore,PRIORITY_WEIGHTS} from '../domain/analytics/priority-score.js';
import {canStudy,sessionMinutes,resolveStudyEligibility} from '../domain/study-eligibility.js';

export const RECOMMENDATION_WEIGHTS=PRIORITY_WEIGHTS;

export function recommendStudy(candidates=[],options={}){
  const availableMinutes=Math.max(0,Number(options.availableMinutes)||0);
  const excluded=new Set(options.excludedIds||[]);
  const eligible=resolveStudyEligibility(candidates,options.topics);
  return eligible.filter(item=>canStudy(item)&&!excluded.has(item.id))
    .map(item=>({...item,...calculatePriorityScore(item),estimatedMinutes:sessionMinutes(item,availableMinutes)}))
    .filter(item=>item.estimatedMinutes>0&&Object.keys(item.factors).length)
    .sort((a,b)=>b.score-a.score||a.estimatedMinutes-b.estimatedMinutes||String(a.id).localeCompare(String(b.id)));
}
