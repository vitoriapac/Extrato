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
  return categories.filter(category=>!categoryId||category.id===categoryId).flatMap(category=>category.entries.filter(entry=>matchesHelpSearch(category.title+' '+buildHelpSearchIndex(entry),query)).map(entry=>({categoryId:category.id,id:entry.id,score:rankHelpSearch(entry,query)}))).sort((a,b)=>b.score-a.score);
}

export function rankHelpSearch(entry,query){
  if(!normalizeHelpText(query).trim())return 0;
  if(!matchesHelpSearch(buildHelpSearchIndex(entry),query))return 0;
  const title=normalizeHelpText(entry.title),phrase=normalizeHelpText(query).trim();
  if(title===phrase)return 400;
  if(matchesHelpSearch(title,phrase))return 300;
  if(matchesHelpSearch([...(entry.keywords||[]),...(entry.concepts||[]),...(entry.questions||[])].join(' '),phrase))return 200;
  return 100;
}
