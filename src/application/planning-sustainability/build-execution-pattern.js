export function buildExecutionPattern(weeks=[]){
  const included=weeks.filter(week=>week.comparable),sum=selector=>included.reduce((total,week)=>total+selector(week.model),0);
  const planned=sum(model=>model.summary.plannedMinutes),priorityPlanned=sum(model=>model.priority.plannedMinutes);
  return {weeks:included.length,plannedMinutes:planned,executedMinutes:sum(model=>model.summary.executedMinutes),matchedMinutes:sum(model=>model.summary.matchedMinutes),
    timeAdherence:planned?sum(model=>model.summary.temporalAdherence*model.summary.plannedMinutes)/planned:null,
    priorityAdherence:priorityPlanned?sum(model=>model.priority.adherence*model.priority.plannedMinutes)/priorityPlanned:null,
    additionalMinutes:sum(model=>model.summary.additionalMinutes||0),excessLinkedMinutes:sum(model=>model.summary.excessLinkedMinutes||0),
    incompatibleMinutes:sum(model=>model.summary.incompatibleMinutes||0),otherPeriodMinutes:sum(model=>model.summary.otherPeriodMinutes||0),
    deferredItems:sum(model=>model.planningContext.deferredItems||0),replacedItems:sum(model=>model.planningContext.replacedItems||0),skippedItems:sum(model=>model.planningContext.skippedItems||0)};
}
