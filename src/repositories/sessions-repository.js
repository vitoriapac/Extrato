export function createSessionsRepository({getState}={}){
  if(typeof getState!=='function')throw new TypeError('Repositório de sessões requer acesso ao estado.');
  const items=()=>Array.isArray(getState()?.studySessions)?getState().studySessions:[];
  return Object.freeze({
    all:()=>items(),
    findById:id=>items().find(item=>item.id===id)||null,
    add:session=>{if(items().some(item=>item.id===session.id))return items().find(item=>item.id===session.id);items().push(session);return session},
    update:(id,changes)=>{const session=items().find(item=>item.id===id);if(!session)return null;Object.assign(session,changes);return session},
    remove:id=>{const list=items(),index=list.findIndex(item=>item.id===id);return index<0?null:list.splice(index,1)[0]},
    listByPeriod:({start=null,end=null}={})=>items().filter(item=>(!start||item.date>=start)&&(!end||item.date<=end)),
    listByTopic:topicId=>items().filter(item=>item.topicId===topicId),
    listByPlanItem:planItemId=>items().filter(item=>item.planItemId===planItemId)
  });
}
