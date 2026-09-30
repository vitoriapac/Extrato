import {compareReadinessSnapshots} from '../analytics/build-readiness-evolution.js';

export function buildReadinessChangeExplanation({previous=null,current=null}={}){
  const comparison=compareReadinessSnapshots(previous,current);
  return {state:comparison.state,reason:comparison.reason,previous:previous?{date:previous.date,score:previous.score}:null,
    current:current?{date:current.date,score:current.score}:null,delta:comparison.delta,
    factors:comparison.state==='comparable'?comparison.factors.filter(item=>item.delta!==0).map(item=>({label:item.label,before:item.before,after:item.after,direction:item.delta>0?'up':'down'})):[]};
}
