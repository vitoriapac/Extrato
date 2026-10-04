// Pure help indexing: no state, persistence or analytical calculations.
export const normalizeHelpText=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR');
export function buildHelpSearchIndex(entry){
  return normalizeHelpText([entry.title,entry.summary,entry.note,entry.visual?.title,...(entry.paragraphs||[]),...(entry.bullets||[]),...(entry.flow||[]),...(entry.steps||[]).flatMap(step=>typeof step==='string'?[step]:[step.title,step.detail]),...(entry.keywords||[]),...(entry.concepts||[]),...(entry.questions||[])].filter(Boolean).join(' '));
}
export function matchesHelpSearch(index,query){
  const terms=normalizeHelpText(query).trim().split(/\s+/).filter(Boolean);
  const text=normalizeHelpText(index);
  return terms.every(term=>text.includes(term));
}
export function searchHelpEntries(categories,query,{categoryId}={}){
  return categories.filter(category=>!categoryId||category.id===categoryId).flatMap(category=>category.entries.filter(entry=>matchesHelpSearch(category.title+' '+buildHelpSearchIndex(entry),query)).map(entry=>({categoryId:category.id,id:entry.id})));
}
