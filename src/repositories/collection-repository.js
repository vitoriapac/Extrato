import {createReviewsRepository} from './reviews-repository.js';
import {createPlanningRepository} from './planning-repository.js';
import {createSessionsRepository} from './sessions-repository.js';

export function createCollectionRepository({getState,field}={}){
  if(typeof getState!=='function'||!field)throw new TypeError('Repositório requer estado e coleção.');
  const collection=()=>{const value=getState()?.[field];return Array.isArray(value)?value:[]};
  return Object.freeze({
    all:()=>collection(),findById:id=>collection().find(item=>item.id===id)||null,
    add:item=>{collection().push(item);return item},
    remove:id=>{const items=collection(),index=items.findIndex(item=>item.id===id);return index<0?null:items.splice(index,1)[0]},
    update:(id,changes)=>{const item=collection().find(entry=>entry.id===id);if(!item)return null;Object.assign(item,changes);return item}
  });
}

export function createAppRepositories(getState){
  const repositories=Object.fromEntries(['subjects','calendar','questoes','simulados','dailyPlans','studyPlans','recommendationFeedback','topicHistory','metasPorDisciplina'].map(field=>[field,createCollectionRepository({getState,field})]));
  repositories.studySessions=createSessionsRepository({getState});
  repositories.reviewAgenda=createReviewsRepository({getState});
  repositories.planning=createPlanningRepository({getState});
  return Object.freeze(repositories);
}
