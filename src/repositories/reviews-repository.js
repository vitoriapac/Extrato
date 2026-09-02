export function createReviewsRepository({getState}={}){
  if(typeof getState!=='function')throw new TypeError('Repositório de revisões requer acesso ao estado.');
  const items=()=>Array.isArray(getState()?.reviewAgenda)?getState().reviewAgenda:[];
  return Object.freeze({
    all:()=>items(),
    findById:id=>items().find(item=>item.id===id)||null,
    listPending:()=>items().filter(item=>item.status!=='Concluído'),
    add:review=>{items().push(review);return review},
    update:(id,changes)=>{const review=items().find(item=>item.id===id);if(!review)return null;Object.assign(review,changes);return review},
    remove:id=>{const list=items(),index=list.findIndex(item=>item.id===id);return index<0?null:list.splice(index,1)[0]},
    hasPendingForTopic:(topicId,date,{exceptId=null}={})=>items().some(item=>item.id!==exceptId&&(item.topicId||item.topicRef)===topicId&&item.status!=='Concluído'&&(!date||item.date===date))
  });
}
