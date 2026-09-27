const terminalStatuses=new Set(['deferred','replaced']);
const timestamp=session=>session.endedAt||session.startedAt||session.createdAt||null;

export function reconcileDemoPlanExecution(dailyPlans=[],studySessions=[],{today}={}){
  const sessionsById=new Map(studySessions.map(session=>[session.id,session]));
  const available=[...studySessions].sort((a,b)=>String(a.startedAt||a.createdAt).localeCompare(String(b.startedAt||b.createdAt)));
  const assigned=new Set();
  const plans=[...dailyPlans].sort((a,b)=>String(a.date).localeCompare(String(b.date)));
  for(const plan of plans){
    for(const item of plan.items||[]){
      if(terminalStatuses.has(item.status))continue;
      const explicit=available.filter(session=>session.planItemId===item.id);
      const compatible=available.filter(session=>!session.planItemId&&!assigned.has(session.id)&&session.date===(item.currentDate||plan.date)&&session.subjectId===item.subjectId&&(!item.topicId||session.topicId===item.topicId));
      const linked=[...explicit,...compatible].filter((session,index,rows)=>rows.findIndex(row=>row.id===session.id)===index);
      for(const session of linked){session.planItemId=item.id;assigned.add(session.id)}
      item.sessionIds=linked.map(session=>session.id);
      item.executedSeconds=linked.reduce((sum,session)=>sum+Math.max(0,Number(session.durationSeconds)||0),0);
      item.lastExecutedAt=linked.map(timestamp).filter(Boolean).sort().at(-1)||null;
      item.status=item.executedSeconds>=Math.max(0,Number(item.plannedMinutes)||0)*60&&linked.length?'completed':linked.length?'partial':(item.currentDate||plan.date)<today?'skipped':'planned';
      if(item.status==='skipped'&&!item.skippedReason)item.skippedReason='Sem sessão registrada neste dia.';
      if(item.status!=='skipped')item.skippedReason=null;
      item.sessionIds=item.sessionIds.filter(id=>sessionsById.has(id));
    }
  }
  return dailyPlans;
}
