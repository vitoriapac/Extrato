import {buildSimulationComparison} from '../simulations/build-simulation-comparison.js';
import {buildProjectionCalibration} from '../analytics/projection-calibration-history.js';

const score=item=>item.total?Math.round(item.correct/item.total*1000)/10:null;
const inRange=(date,range)=>Boolean(date&&range?.end&&date<=range.end&&(!range.start||date>=range.start));

export function buildPerformanceSimulations({simulations=[],subjects=[],projectionSnapshots=[],activeExamTags=[],range,today}={}){
  const items=simulations.filter(item=>inRange(item.date,range)&&Number(item.total)>0).slice().sort((a,b)=>a.date.localeCompare(b.date)||String(a.id).localeCompare(String(b.id)));
  const scores=items.map(score).filter(value=>value!=null);
  const previous=range?.previous?simulations.filter(item=>inRange(item.date,range.previous)&&Number(item.total)>0).map(score).filter(value=>value!=null):[];
  const mean=values=>values.length?Math.round(values.reduce((a,b)=>a+b,0)/values.length*10)/10:null;
  const calibration=buildProjectionCalibration({snapshots:projectionSnapshots,simulations:items,activeExamTags,today});
  return {items,count:items.length,latest:scores.at(-1)??null,mean:mean(scores),best:scores.length?Math.max(...scores):null,
    trend:scores.length>=2?Math.round((scores.at(-1)-scores.at(-2))*10)/10:null,
    previousMean:mean(previous),comparison:buildSimulationComparison({simulations:items,subjects}),calibration};
}
