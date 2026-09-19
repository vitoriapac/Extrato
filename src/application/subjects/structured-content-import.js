const clean=value=>String(value??'').trim();
const key=value=>clean(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9]+/g,' ').trim().toLocaleLowerCase('pt-BR');
const finite=value=>value===''||value==null?null:Number.isFinite(Number(value))?Number(value):null;
const DIFFICULTIES=new Set(['Fácil','Médio','Difícil']);
const IMPORTABLE_FIELDS=['difficulty','examImportance','estimatedStudyMinutes'];
const headerAliases={disciplina:'subject',materia:'subject',subject:'subject',topico:'topic',conteudo:'topic',topic:'topic',dificuldade:'difficulty',difficulty:'difficulty',importancia:'importance',impacto:'importance',examimportance:'importance',esforco:'effort',minutos:'effort',estimatedstudyminutes:'effort',tags:'tags',etiquetas:'tags'};

export class StructuredImportError extends TypeError{constructor(issues=[]){super('Não foi possível importar o arquivo.');this.name='StructuredImportError';this.issues=issues}}
const problem=(line,field,code,message)=>({line,field,code,message});
function parseCsvRows(text){const rows=[];let row=[],field='',quoted=false,line=1,rowLine=1;for(let index=0;index<text.length;index++){const char=text[index],next=text[index+1];if(char==='"'&&quoted&&next==='"'){field+='"';index++;continue}if(char==='"'){quoted=!quoted;continue}if((char===','||char===';'||char==='\t')&&!quoted){row.push(field);field='';continue}if((char==='\n'||char==='\r')&&!quoted){if(char==='\r'&&next==='\n')index++;row.push(field);if(row.some(value=>clean(value)))rows.push({values:row,line:rowLine});row=[];field='';line++;rowLine=line;continue}field+=char}row.push(field);if(row.some(value=>clean(value)))rows.push({values:row,line:rowLine});if(quoted)throw new StructuredImportError([problem(line,'arquivo','unclosed_quote','Há aspas sem fechamento no CSV.')]);return rows}
function normalizedTopic(input={},line=null,issues=[]){const name=clean(input.name??input.topic??input.topico??input.conteudo),rawDifficulty=clean(input.difficulty??input.dificuldade),importance=finite(input.importance??input.importancia??input.examImportance),effort=finite(input.effort??input.esforco??input.estimatedStudyMinutes);if(!name)issues.push(problem(line,'topico','required','O campo "topico" está vazio.'));if(rawDifficulty&&!DIFFICULTIES.has(rawDifficulty))issues.push(problem(line,'dificuldade','invalid','Use Fácil, Médio ou Difícil em "dificuldade".'));if((input.importance??input.importancia??input.examImportance)!==undefined&&importance==null)issues.push(problem(line,'importancia','invalid','O campo "importancia" precisa ser numérico.'));else if(importance!=null&&(importance<0||importance>100))issues.push(problem(line,'importancia','range','"importancia" deve estar entre 0 e 100.'));if((input.effort??input.esforco??input.estimatedStudyMinutes)!==undefined&&effort==null)issues.push(problem(line,'esforco','invalid','O campo "esforco" precisa ser numérico.'));else if(effort!=null&&effort<=0)issues.push(problem(line,'esforco','range','"esforco" deve ser maior que 0.'));const rawTags=input.tags??input.etiquetas??[],tags=[...new Set((Array.isArray(rawTags)?rawTags:String(rawTags).split('|')).map(clean).filter(Boolean))];return{name,...(DIFFICULTIES.has(rawDifficulty)?{difficulty:rawDifficulty}:{}),...(importance==null?{}:{examImportance:importance>1?importance/100:importance}),...(effort==null?{}:{estimatedStudyMinutes:Math.round(effort)}),...(tags.length?{tags}:{})}}
function normalizeSubjects(subjects,lines=[]){const issues=[];if(!Array.isArray(subjects)||!subjects.length)throw new StructuredImportError([problem(null,'arquivo','empty','O arquivo não contém disciplinas.')]);if(subjects.length>500)throw new StructuredImportError([problem(null,'arquivo','limit','O arquivo excede o limite de 500 disciplinas.')]);let topicCount=0;const result=subjects.map((input,index)=>{const line=lines[index]??null,name=clean(input?.name??input?.subject??input?.disciplina??input?.materia);if(!name)issues.push(problem(line,'disciplina','required','O campo "disciplina" está vazio.'));const topics=(input?.topics??input?.topicos??[]).map(topic=>normalizedTopic(topic,topic.__line??line,issues));topicCount+=topics.length;return{name,topics}});if(topicCount>10000)issues.push(problem(null,'arquivo','limit','O arquivo excede o limite de 10.000 tópicos.'));if(issues.length)throw new StructuredImportError(issues);return result}
export function parseStructuredStudyContent(text,{fileName=''}={}){if(typeof text!=='string'||!text.trim())throw new StructuredImportError([problem(null,'arquivo','empty','O arquivo está vazio.')]);const json=/\.json$/i.test(fileName)||/^[\s]*[\[{]/.test(text);if(json){let value;try{value=JSON.parse(text)}catch{throw new StructuredImportError([problem(null,'arquivo','invalid_json','O JSON não pôde ser interpretado. Verifique vírgulas, aspas e chaves.')])}return normalizeSubjects(Array.isArray(value)?value:value?.subjects??value?.disciplinas)}const rows=parseCsvRows(text);if(rows.length<2)throw new StructuredImportError([problem(null,'arquivo','empty_csv','O CSV precisa de cabeçalho e ao menos uma linha.')]);const headers=rows.shift().values.map(value=>headerAliases[key(value)]||null),missing=[];if(!headers.includes('subject'))missing.push('disciplina');if(!headers.includes('topic'))missing.push('topico');if(missing.length)throw new StructuredImportError(missing.map(field=>problem(1,field,'missing_column',`A coluna obrigatória "${field}" não foi encontrada.`)));const grouped=new Map();rows.forEach(({values,line})=>{const record=Object.fromEntries(headers.map((header,index)=>[header,values[index]]).filter(([header])=>header)),subject=clean(record.subject),id=key(subject)||`linha-${line}`;if(!grouped.has(id))grouped.set(id,{name:subject,topics:[],__line:line});grouped.get(id).topics.push({...record,__line:line})});const values=[...grouped.values()];return normalizeSubjects(values,values.map(item=>item.__line))}

const originOf=(topic,field)=>topic?.fieldOrigins?.[field]||null;
const manualValue=(topic,field)=>topic?.[field]!=null&&originOf(topic,field)!=='import';
const fieldLabel={difficulty:'dificuldade',examImportance:'importância',estimatedStudyMinutes:'esforço'};
function compareTopic(existing,imported){const updates=[],preserved=[];for(const field of IMPORTABLE_FIELDS){if(!(field in imported))continue;if(manualValue(existing,field))preserved.push({field,label:fieldLabel[field],current:existing[field],imported:imported[field]});else if(existing[field]!==imported[field])updates.push({field,label:fieldLabel[field],from:existing[field]??null,to:imported[field]})}const importedTags=(imported.tags||[]).filter(tag=>!(existing.tags||[]).includes(tag));if(importedTags.length)updates.push({field:'tags',label:'tags',from:existing.tags||[],to:[...(existing.tags||[]),...importedTags]});return{updates,preserved}}
export function createStructuredContentImportService({ subjectService, getSubjects } = {}) {
  if (!subjectService || typeof getSubjects !== 'function') {
    throw new TypeError('Importação estruturada requer serviço e estado de disciplinas.');
  }

  const inspect = subjects => {
    const current = getSubjects();
    const summary = {
      addedSubjects: 0,
      existingSubjects: 0,
      addedTopics: 0,
      existingTopics: 0,
      updatedTopics: 0,
      preservedTopics: 0,
      totalTopics: 0,
      fieldUpdates: { difficulty: 0, examImportance: 0, estimatedStudyMinutes: 0, tags: 0 },
      conflicts: []
    };

    for (const source of subjects) {
      const subject = current.find(item => key(item.name) === key(source.name));
      subject ? summary.existingSubjects++ : summary.addedSubjects++;

      for (const topic of source.topics) {
        summary.totalTopics++;
        const existing = subject?.topics?.find(item => key(item.name) === key(topic.name));
        if (!existing) {
          summary.addedTopics++;
          continue;
        }

        summary.existingTopics++;
        const comparison = compareTopic(existing, topic);
        comparison.updates.forEach(item => summary.fieldUpdates[item.field]++);
        if (comparison.updates.length) summary.updatedTopics++;
        else summary.preservedTopics++;
        summary.conflicts.push({
          subjectName: subject.name,
          topicName: existing.name,
          status: 'existing',
          stablePreserved: ['ID', 'progresso', 'sessões', 'revisões', 'histórico'],
          ...comparison
        });
      }
    }

    return summary;
  };

  return Object.freeze({
    preview: inspect,
    import(subjects) {
      const current = getSubjects();
      const snapshot = structuredClone(current);
      const summary = inspect(subjects);

      try {
        for (const source of subjects) {
          let subject = current.find(item => key(item.name) === key(source.name));
          if (!subject) subject = subjectService.create(source.name);

          for (const imported of source.topics) {
            const existing = subject.topics.find(item => key(item.name) === key(imported.name));
            if (existing) {
              const comparison = compareTopic(existing, imported);
              const patch = { fieldOrigins: { ...(existing.fieldOrigins || {}) } };
              for (const update of comparison.updates) {
                if (update.field === 'tags') patch.tags = update.to;
                else {
                  patch[update.field] = update.to;
                  patch.fieldOrigins[update.field] = 'import';
                }
              }
              subjectService.updateTopic(subject.id, existing.id, patch);
            } else {
              const fieldOrigins = Object.fromEntries(
                IMPORTABLE_FIELDS.filter(field => field in imported).map(field => [field, 'import'])
              );
              subjectService.addTopic(subject.id, { ...imported, fieldOrigins });
            }
          }
        }
      } catch (error) {
        current.splice(0, current.length, ...snapshot);
        throw error;
      }

      return summary;
    }
  });
}
