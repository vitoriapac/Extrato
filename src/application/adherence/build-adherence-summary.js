export const adherencePercent=(credit,planned)=>planned>0?Math.min(100,Math.max(0,credit/planned*100)):null;

export function buildAdherenceSummary(execution){
  const data=execution.reconciliation;
  return {plannedMinutes:data.plannedMinutes,executedMinutes:data.studiedMinutes,matchedMinutes:data.creditedMinutes,
    temporalAdherence:adherencePercent(data.creditedMinutes,data.plannedMinutes),
    volumeRatio:data.plannedMinutes>0?data.studiedMinutes/data.plannedMinutes*100:null,
    remainingMinutes:Math.max(0,data.plannedMinutes-data.creditedMinutes),
    linkedMinutes:data.linkedMinutes,excessLinkedMinutes:data.excessLinkedMinutes,
    additionalMinutes:data.additionalMinutes,incompatibleMinutes:data.incompatibleMinutes,otherPeriodMinutes:data.otherPeriodMinutes};
}
