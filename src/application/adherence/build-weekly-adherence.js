import {addLocalDays,parseLocalDate,localDateRange} from '../../core/date-utils.js';
import {buildAdherenceModel} from './build-adherence-model.js';
import {adherenceStatus,ADHERENCE_STATUS_POLICY} from './adherence-status.js';

export function buildWeeklyAdherence({today,start=null,historyWeeks=8,...input}={}){
  const date=typeof today==='string'?parseLocalDate(today):null;
  if(!date||(start!==null&&(typeof start!=='string'||parseLocalDate(start)?.getDay()!==1)))return {state:'invalid_period',current:null,history:[],comparison:null};
  const weekStart=start||addLocalDays(today,-((date.getDay()+6)%7));
  const count=[4,8,12].includes(historyWeeks)?historyWeeks:8;
  const build=(first,cutoff=today)=>{
    const model=buildAdherenceModel({...input,start:first,end:addLocalDays(first,6),today:cutoff});
    return {...model,assessment:adherenceStatus(model),evaluatedDays:model.period?.evaluatedEnd?localDateRange(first,model.period.evaluatedEnd).length:0};
  };
  const current=build(weekStart);
  const history=Array.from({length:count},(_,index)=>build(addLocalDays(weekStart,-7*(count-index))));
  const previousStart=addLocalDays(weekStart,-7);
  const previous=current.evaluatedDays?build(previousStart,current.period.complete?today:addLocalDays(previousStart,current.evaluatedDays-1)):null;
  const comparable=Boolean(previous&&current.assessment.status!=='insufficient_data'&&previous.assessment.status!=='insufficient_data');
  const comparison={state:comparable?'comparable':'insufficient_data',mode:current.period.complete?'complete_weeks':'equal_elapsed',evaluatedDays:current.evaluatedDays,previous,
    temporalDelta:comparable?current.summary.temporalAdherence-previous.summary.temporalAdherence:null,
    priorityDelta:comparable?current.priority.adherence-previous.priority.adherence:null,
    volumeDelta:comparable?current.summary.volumeRatio-previous.summary.volumeRatio:null};
  return {version:1,state:current.state,current,history,comparison,policy:{...ADHERENCE_STATUS_POLICY},historyWeeks:count};
}
