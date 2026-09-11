const normalizeName=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().replace(/\s+/g,' ').toLocaleLowerCase('pt-BR');
const selected=(id,set)=>!set||set.has(id);
const unique=(...values)=>[...new Set(values.flat().filter(Boolean))];
const matchesCatalogItem=(local,source)=>{
  if(local?.catalogId&&source?.catalogId&&local.catalogId===source.catalogId)return true;
  const localNames=unique(local?.name,local?.aliases).map(normalizeName),sourceNames=unique(source?.name,source?.aliases).map(normalizeName);
  return localNames.some(name=>sourceNames.includes(name));
};
const findMatch=(items,source)=>(items||[]).find(item=>matchesCatalogItem(item,source));
const metadata=(current,source)=>({catalogId:current.catalogId||source.catalogId||source.id,examTags:unique(current.examTags,source.examTags),institutions:unique(current.institutions,source.institutions),sourceRefs:unique(current.sourceRefs,source.sourceRefs),aliases:unique(current.aliases,source.aliases)});
export function previewExamStructureImport({preset,selectedSubjectIds=null,selectedTopicIds=null,subjects=[]}={}){
  if(!preset||!Array.isArray(preset.subjects))throw new TypeError('Preset de edital inválido.');
  const subjectSet=selectedSubjectIds?new Set(selectedSubjectIds):null,topicSet=selectedTopicIds?new Set(selectedTopicIds):null;
  const result={addedSubjects:0,existingSubjects:0,addedTopics:0,existingTopics:0,warnings:[],selection:[]};
  for(const source of preset.subjects){if(!selected(source.id,subjectSet))continue;const existing=findMatch(subjects,source);existing?result.existingSubjects++:result.addedSubjects++;const topics=(source.topics||[]).filter(topic=>selected(`${source.id}:${topic.id}`,topicSet));for(const topic of topics){if(findMatch(existing?.topics,topic))result.existingTopics++;else result.addedTopics++;}result.selection.push({subject:source,existing,topics});}
  if(!result.selection.length)result.warnings.push('Nenhuma disciplina foi selecionada.');return result;
}
export function createExamImportService({subjectService,getSubjects}={}){
  if(!subjectService||typeof getSubjects!=='function')throw new TypeError('Importação requer serviço e estado de disciplinas.');
  return Object.freeze({preview:input=>previewExamStructureImport({...input,subjects:getSubjects()}),importExamStructure(input={}){if((input.duplicateStrategy||'merge')!=='merge')throw new TypeError('Apenas a estratégia merge é suportada.');const preview=previewExamStructureImport({...input,subjects:getSubjects()}),list=getSubjects(),snapshot=structuredClone(list);try{for(const entry of preview.selection){const target=entry.existing||subjectService.create(entry.subject.name);Object.assign(target,metadata(target,entry.subject));for(const topic of entry.topics){const existingTopic=findMatch(target.topics,topic);if(existingTopic)subjectService.updateTopic(target.id,existingTopic.id,metadata(existingTopic,topic));else subjectService.addTopic(target.id,{name:topic.name,...metadata({},topic)});}}}catch(error){list.splice(0,list.length,...snapshot);throw error}return {...preview,selection:undefined};}});
}
