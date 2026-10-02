import {achievementProjectionHistory} from './achievement-projection-history.js';

export function buildProjectionCloseContext({current=null,snapshots=[],activeExamTags=[],periodStart=null,today=null}={}) {
  if(!current)return {state:'unavailable'};
  const previous=achievementProjectionHistory(snapshots,activeExamTags,today)
    .filter(item => periodStart && item.date < periodStart && item.algorithmVersion === current.algorithmVersion
      && item.current?.targetScore === current.current.targetScore && item.exam?.date === current.exam.date).at(-1);
  if(!previous)return {state:'baseline',current:current.status,confidence:current.confidence.level,
    reasons:[...current.drivers,...current.risks].slice(0,3)};
  const previousAccuracy=previous.current?.simulationAccuracy,currentAccuracy=current.current.simulationAccuracy;
  const accuracyDelta=previousAccuracy==null||currentAccuracy==null?null:Math.round((currentAccuracy-previousAccuracy)*10)/10;
  return {state:'comparable',previous:previous.status,current:current.status,previousDate:previous.date,
    accuracyDelta,confidence:current.confidence.level,reasons:[...current.drivers,...current.risks].slice(0,3)};
}
