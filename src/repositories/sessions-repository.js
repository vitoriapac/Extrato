import {normalizeStudySession} from '../domain/sessions/study-session.js';
export function createSessionsRepository({getState,normalize=normalizeStudySession}={}){
  if(typeof getState!=='function')throw new TypeError('Repositório de sessões requer acesso ao estado.');
  const items=()=>{const sessions=Array.isArray(getState()?.studySessions)?getState().studySessions:[];sessions.forEach((session,index)=>{sessions[index]=normalize(session)});return sessions};
  return Object.freeze({
    all:()=>items(),
    findById:id=>items().find(item=>item.id===id)||null,
    add:session=>{const normalized=normalize(session);if(items().some(item=>item.id===normalized.id))return items().find(item=>item.id===normalized.id);items().push(normalized);return normalized},
    update:(id,changes)=>{const list=items(),index=list.findIndex(item=>item.id===id);if(index<0)return null;list[index]=normalize({...list[index],...changes,id});return list[index]},
    remove:id=>{const list=items(),index=list.findIndex(item=>item.id===id);return index<0?null:list.splice(index,1)[0]},
    listByPeriod:({start=null,end=null}={})=>items().filter(item=>(!start||item.date>=start)&&(!end||item.date<=end)),
    listByTopic:topicId=>items().filter(item=>item.topicId===topicId),
    listByPlanItem:planItemId=>items().filter(item=>item.planItemId===planItemId)
  });
}
