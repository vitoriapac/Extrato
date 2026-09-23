export function createReplanController({service,repository,getState,clock,getDailyCapacity,onChanged=()=>{},onConfirmed=()=>{},onUndone=()=>{}}={}){
  if(!service||!repository||typeof getState!=='function'||!clock)throw new TypeError('Controlador de replanejamento requer serviço, repositório, estado e relógio.');
  let preview=null;
  const view=()=>preview;
  const calculate=()=>{const today=clock.today(),start=clock.startOfWeek(today),end=clock.addDays(start,6),state=getState(),futureDays=[];for(let date=clock.addDays(today,1);date<=end;date=clock.addDays(date,1)){const planned=state.dailyPlans.filter(plan=>plan.date===date).reduce((sum,plan)=>sum+(plan.items||[]).filter(item=>!['skipped','replaced','deferred'].includes(item.status)).reduce((total,item)=>total+(Number(item.plannedMinutes)||0),0),0);futureDays.push({date,availableMinutes:Math.max(0,getDailyCapacity(date)-planned)})}preview=service.calculate({plans:repository.getDailyPlans().filter(plan=>plan.date>=start&&plan.date<today),periodStart:start,periodEnd:end,futureDays});onChanged(preview);return preview};
  const clear=()=>{preview=null;onChanged(null)};
  const confirm=()=>{if(preview?.state!=='proposal')return null;const result=service.confirm(preview);preview=null;onConfirmed(result);return result};
  const undo=id=>{const result=service.undo(id);if(result)onUndone(result);return result};
  return Object.freeze({view,calculate,clear,confirm,undo});
}
