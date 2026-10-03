import {adherencePercent} from './build-adherence-summary.js';

export function buildSubjectAdherence(execution){
  return execution.subjects.map(row=>({subjectId:row.subjectId,name:row.name,plannedMinutes:row.plannedMinutes,
    executedMinutes:row.studiedSeconds/60,matchedMinutes:row.creditedMinutes,
    temporalAdherence:adherencePercent(row.creditedMinutes,row.plannedMinutes),
    volumeRatio:row.plannedMinutes?row.studiedSeconds/60/row.plannedMinutes*100:null,
    priorityPlannedMinutes:row.priorityPlannedMinutes,priorityExecutedMinutes:row.priorityCreditedMinutes,
    priorityAdherence:adherencePercent(row.priorityCreditedMinutes,row.priorityPlannedMinutes),
    classifiedCoverage:adherencePercent(row.plannedMinutes-row.unknownPlannedMinutes,row.plannedMinutes),unknownPlannedMinutes:row.unknownPlannedMinutes}));
}
