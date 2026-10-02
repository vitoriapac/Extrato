import {buildDailyExecutionModel} from '../../application/daily-execution/build-daily-execution-model.js';
export function createDailyExecutionController({getContext,getNextBestAction,onStart,onResume,getTimer=()=>null}={}){
  const build=()=>buildDailyExecutionModel({...getContext(),nextBestAction:getNextBestAction()});
  const start=id=>{
    const item=build().items?.find(row=>row.id===id&&row.remainingSeconds>0);
    if(!item)return {state:'unavailable'};
    const timer=getTimer();
    if(timer?.active){if(timer.planItemId===id){onResume();return {state:'resumed'};}return {state:'blocked'};}
    onStart(id);return {state:'started'};
  };
  return Object.freeze({build,start});
}
