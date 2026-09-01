export function filterStudySessions(sessions,filters,{today,addDays,subjectIdOf}){
  let rows=[...(sessions||[])];
  if(filters.date) rows=rows.filter(item=>item.date===filters.date);
  else if(filters.period!=='all'){
    const days=Math.max(1,Number(filters.period)||30),cutoff=addDays(today,-(days-1));
    rows=rows.filter(item=>item.date&&item.date>=cutoff&&item.date<=today);
  }
  if(filters.subjectId) rows=rows.filter(item=>subjectIdOf(item)===filters.subjectId);
  if(filters.type) rows=rows.filter(item=>(item.type||'study')===filters.type);
  return rows.sort((a,b)=>(b.endedAt||b.date||'').localeCompare(a.endedAt||a.date||''));
}

export function groupStudySessionsByDate(sessions){
  const groups=new Map();
  for(const session of sessions||[]){
    const date=session.date||'Sem data';
    if(!groups.has(date))groups.set(date,[]);
    groups.get(date).push(session);
  }
  return [...groups.entries()];
}
