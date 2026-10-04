export const normalizeSubjectSearch=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
export function matchesSubjectSearch(subject,topic,query){const terms=normalizeSubjectSearch(query).split(/\s+/).filter(Boolean),text=normalizeSubjectSearch(subject.name+' '+(topic?.name||''));return terms.every(term=>text.includes(term))}
export function createSubjectSearchController({document,onChange}){
 let query='';
 document.addEventListener('input',event=>{if(event.target.id!=='subjectContentSearch')return;query=event.target.value;const position=event.target.selectionStart;onChange();const input=document.getElementById('subjectContentSearch');input?.focus({preventScroll:true});input?.setSelectionRange(position,position)});
 return {get query(){return query}};
}
