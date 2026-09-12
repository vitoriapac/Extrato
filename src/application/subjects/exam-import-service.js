const normalizeName=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().replace(/\s+/g,' ').toLocaleLowerCase('pt-BR');
const selected=(id,set)=>!set||set.has(id);
const unique=(...values)=>[...new Set(values.flat().filter(Boolean))];
const canonical=value=>Array.isArray(value)?value.map(canonical):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(key=>[key,canonical(value[key])])):value;
const stable=value=>JSON.stringify(canonical(value));
const clone=value=>value==null?value:structuredClone(value);

export const matchesCatalogItem=(local,source)=>{
  if(local?.catalogId&&source?.catalogId&&local.catalogId===source.catalogId)return true;
  const localNames=unique(local?.name,local?.aliases).map(normalizeName),sourceNames=unique(source?.name,source?.aliases).map(normalizeName);
  return localNames.some(name=>sourceNames.includes(name));
};
const findMatch=(items,source)=>(items||[]).find(item=>matchesCatalogItem(item,source));

export function buildCatalogMetadata(current={},source={},options={}){
  const sourceDifficulty=source.catalogDifficulty||source.difficulty||null;
  const patch={catalogId:current.catalogId||source.catalogId||source.id,examTags:unique(current.examTags,source.examTags),institutions:unique(current.institutions,source.institutions),sourceRefs:unique(current.sourceRefs,source.sourceRefs),aliases:unique(current.aliases,source.aliases),examMetrics:{...(current.examMetrics||{}),...clone(source.examMetrics||{})}};
  if(sourceDifficulty)patch.catalogDifficulty=clone(sourceDifficulty);
  if(source.incidence)patch.incidence=clone(source.incidence);
  const estimates=Object.fromEntries(Object.entries(source.examMetrics||{}).filter(([,metric])=>metric?.examImportanceEstimate!=null).map(([key,metric])=>[key,Number(metric.examImportanceEstimate)]));
  if(Object.keys(estimates).length)patch.examImportanceEstimates={...(current.examImportanceEstimates||{}),...estimates};
  if(!options.existing&&sourceDifficulty?.level)patch.difficulty=sourceDifficulty.level;
  if(!options.existing&&source.examImportanceEstimate!=null)patch.examImportanceEstimate=source.examImportanceEstimate;
  return patch;
}
export function needsMetadataUpdate(current={},source={}){const patch=buildCatalogMetadata(current,source,{existing:true});return Object.entries(patch).some(([key,value])=>stable(current[key])!==stable(value))}

export function previewExamStructureImport({preset,selectedSubjectIds=null,selectedTopicIds=null,subjects=[]}={}){
  if(!preset||!Array.isArray(preset.subjects))throw new TypeError('Preset de edital inválido.');
  const subjectSet=selectedSubjectIds?new Set(selectedSubjectIds):null,topicSet=selectedTopicIds?new Set(selectedTopicIds):null;
  const result={addedSubjects:0,existingSubjects:0,addedTopics:0,existingTopics:0,metadataUpdates:0,metadataUpdateSubjects:0,metadataUpdateTopics:0,preservedRecords:0,warnings:[],catalogVersion:preset.version||null,sources:[...(preset.sources||[])],selection:[]};
  for(const source of preset.subjects){
    if(!selected(source.id,subjectSet))continue;
    const existing=findMatch(subjects,source),subjectNeedsUpdate=Boolean(existing&&needsMetadataUpdate(existing,source));
    existing?result.existingSubjects++:result.addedSubjects++;
    if(subjectNeedsUpdate){result.metadataUpdates++;result.metadataUpdateSubjects++}
    const topics=(source.topics||[]).filter(topic=>selected(`${source.id}:${topic.id}`,topicSet));
    const topicEntries=topics.map(topic=>{const existingTopic=findMatch(existing?.topics,topic),metadataUpdate=Boolean(existingTopic&&needsMetadataUpdate(existingTopic,topic));if(existingTopic){result.existingTopics++;result.preservedRecords++;if(metadataUpdate){result.metadataUpdates++;result.metadataUpdateTopics++}}else result.addedTopics++;return{source:topic,existing:existingTopic,metadataUpdate}});
    result.selection.push({subject:source,existing,subjectNeedsUpdate,topics,topicEntries});
  }
  if(!result.selection.length)result.warnings.push('Nenhuma disciplina foi selecionada.');
  return result;
}

export function createExamImportService({subjectService,getSubjects}={}){
  if(!subjectService||typeof getSubjects!=='function')throw new TypeError('Importação requer serviço e estado de disciplinas.');
  return Object.freeze({
    preview:input=>previewExamStructureImport({...input,subjects:getSubjects()}),
    importExamStructure(input={}){
      if((input.duplicateStrategy||'merge')!=='merge')throw new TypeError('Apenas a estratégia merge é suportada.');
      const preview=previewExamStructureImport({...input,subjects:getSubjects()}),list=getSubjects(),snapshot=structuredClone(list);
      try{
        for(const entry of preview.selection){
          const target=entry.existing||subjectService.create(entry.subject.name);
          Object.assign(target,buildCatalogMetadata(target,entry.subject,{existing:Boolean(entry.existing)}));
          for(const topicEntry of entry.topicEntries){const topic=topicEntry.source;if(topicEntry.existing)subjectService.updateTopic(target.id,topicEntry.existing.id,buildCatalogMetadata(topicEntry.existing,topic,{existing:true}));else subjectService.addTopic(target.id,{name:topic.name,...buildCatalogMetadata({},topic,{existing:false})});}
        }
      }catch(error){list.splice(0,list.length,...snapshot);throw error}
      return {...preview,selection:undefined};
    }
  });
}
