import {addLocalDays,parseLocalDate} from '../../core/date-utils.js';

export const PERFORMANCE_SECTIONS=Object.freeze(['overview','questions','simulations','subjects','consistency']);
export const PERFORMANCE_PERIODS=Object.freeze(['7','30','90','all']);

export function createPerformanceViewState(){
  return {section:'overview',period:'30',comparePrevious:true,subjectId:null,topicId:null};
}

export function resolvePerformanceRange({today,period='30',comparePrevious=true}={}){
  if(!parseLocalDate(today))return {start:null,end:null,previous:null,comparePrevious:false,label:'Período indisponível'};
  if(period==='all')return {start:null,end:today,previous:null,comparePrevious:false,label:'Todo o histórico'};
  const days=PERFORMANCE_PERIODS.includes(String(period))?Number(period):30;
  const start=addLocalDays(today,1-days);
  return {start,end:today,previous:comparePrevious?{start:addLocalDays(start,-days),end:addLocalDays(start,-1)}:null,comparePrevious:Boolean(comparePrevious),label:`Últimos ${days} dias`};
}

export function updatePerformanceViewState(state,patch={}){
  const next={...state};
  if(patch.section!==undefined&&PERFORMANCE_SECTIONS.includes(patch.section))next.section=patch.section;
  if(patch.period!==undefined&&PERFORMANCE_PERIODS.includes(String(patch.period)))next.period=String(patch.period);
  if(patch.comparePrevious!==undefined)next.comparePrevious=Boolean(patch.comparePrevious);
  if(patch.subjectId!==undefined){next.subjectId=patch.subjectId||null;next.topicId=null}
  if(patch.topicId!==undefined)next.topicId=patch.topicId||null;
  if(next.period==='all')next.comparePrevious=false;
  return next;
}
