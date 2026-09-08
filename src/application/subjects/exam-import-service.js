const normalizeName=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().replace(/\s+/g,' ').toLocaleLowerCase('pt-BR');
const selected=(id,set)=>!set||set.has(id);
export function previewExamStructureImport({preset,selectedSubjectIds=null,selectedTopicIds=null,subjects=[]}={}){
  if(!preset||!Array.isArray(preset.subjects))throw new TypeError('Preset de edital inválido.');
  const subjectSet=selectedSubjectIds?new Set(selectedSubjectIds):null,topicSet=selectedTopicIds?new Set(selectedTopicIds):null;
  const result={addedSubjects:0,existingSubjects:0,addedTopics:0,existingTopics:0,warnings:[],selection:[]};
  for(const source of preset.subjects){if(!selected(source.id,subjectSet))continue;const existing=(subjects||[]).find(item=>normalizeName(item.name)===normalizeName(source.name));existing?result.existingSubjects++:result.addedSubjects++;const topics=(source.topics||[]).filter(topic=>selected(`${source.id}:${topic.id}`,topicSet));for(const topic of topics){if((existing?.topics||[]).some(item=>normalizeName(item.name)===normalizeName(topic.name)))result.existingTopics++;else result.addedTopics++;}result.selection.push({subject:source,existing,topics});}
  if(!result.selection.length)result.warnings.push('Nenhuma disciplina foi selecionada.');return result;
}
export function createExamImportService({subjectService,getSubjects}={}){
  if(!subjectService||typeof getSubjects!=='function')throw new TypeError('Importação requer serviço e estado de disciplinas.');
  return Object.freeze({preview:input=>previewExamStructureImport({...input,subjects:getSubjects()}),importExamStructure(input={}){if((input.duplicateStrategy||'merge')!=='merge')throw new TypeError('Apenas a estratégia merge é suportada.');const preview=previewExamStructureImport({...input,subjects:getSubjects()}),list=getSubjects(),snapshot=structuredClone(list);try{for(const entry of preview.selection){const target=entry.existing||subjectService.create(entry.subject.name);for(const topic of entry.topics)if(!(target.topics||[]).some(item=>normalizeName(item.name)===normalizeName(topic.name)))subjectService.addTopic(target.id,{name:topic.name});}}catch(error){list.splice(0,list.length,...snapshot);throw error}return {...preview,selection:undefined};}});
}
