const validPeriod=period=>/^\d{4}-\d{2}-\d{2}$/.test(period?.start||'')&&/^\d{4}-\d{2}-\d{2}$/.test(period?.end||'')&&period.start<=period.end;
const scopeKey=tags=>Array.isArray(tags)?JSON.stringify([...new Set(tags)].sort()):null;
const percent=value=>value!=null&&Number.isFinite(Number(value))?Math.max(0,Math.min(100,Math.round(Number(value)))):null;
const minutes=value=>value!=null&&Number.isFinite(Number(value))?Math.max(0,Math.round(Number(value))):null;
const rowOf=(period,close,{current=false}={})=>{
  const focus=close?.strategicFocus;
  if(!validPeriod(period)||focus?.state!=='available'||[focus.highImpactPercent,focus.highImpactMinutes,focus.totalMinutes,focus.workedGaps,focus.improved,focus.stable,focus.declined,focus.unmeasured,close?.investment?.executedMinutes].some(value=>minutes(value)==null))return null;
  return {start:period.start,end:period.end,current,focusPercent:percent(focus.highImpactPercent),highImpactMinutes:minutes(focus.highImpactMinutes),studiedMinutes:minutes(focus.totalMinutes),executedMinutes:minutes(close?.investment?.executedMinutes),workedGaps:minutes(focus.workedGaps),improved:minutes(focus.improved),stable:minutes(focus.stable),declined:minutes(focus.declined),unmeasured:minutes(focus.unmeasured)};
};

export function buildStrategicFocusHistory({snapshots=[],current=null,activeExamTags=[],limit=4}={}){
  const wantedScope=scopeKey(activeExamTags);
  const currentRow=rowOf(current?.period,current?.weeklyClose,{current:true});
  const eligible=(Array.isArray(snapshots)?snapshots:[]).filter(item=>scopeKey(item.activeExamTags)===wantedScope)
    .map(item=>({...rowOf(item.period,item.weeklyClose),savedAt:item.savedAt||''})).filter(item=>item.start&&(!currentRow||item.end<currentRow.start))
    .sort((a,b)=>b.end.localeCompare(a.end)||b.savedAt.localeCompare(a.savedAt));
  const selected=[];
  for(const item of eligible){
    if(selected.some(previous=>item.end>=previous.start))continue;
    selected.push(item);
    if(selected.length>=limit)break;
  }
  const history=selected.reverse().map(({savedAt,...item})=>item),rows=[...history,...currentRow?[currentRow]:[]];
  const previous=history.at(-1)||null;
  const comparison=currentRow&&previous?{focusDelta:currentRow.focusPercent-previous.focusPercent,executionDelta:currentRow.executedMinutes-previous.executedMinutes,previousEnd:previous.end}:null;
  const totals=rows.reduce((sum,item)=>({workedGaps:sum.workedGaps+item.workedGaps,measured:sum.measured+item.improved+item.stable+item.declined,improved:sum.improved+item.improved,stable:sum.stable+item.stable,declined:sum.declined+item.declined}),{workedGaps:0,measured:0,improved:0,stable:0,declined:0});
  return {state:history.length?'available':'insufficient',rows,historyCount:history.length,comparison,totals,hasCurrent:Boolean(currentRow)};
}
