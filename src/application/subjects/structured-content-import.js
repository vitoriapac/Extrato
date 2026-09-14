const clean=value=>String(value??'').trim();
const key=value=>clean(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9]+/g,' ').trim().toLocaleLowerCase('pt-BR');
const finite=value=>value===''||value==null?null:Number.isFinite(Number(value))?Number(value):null;
const DIFFICULTIES=new Set(['Fácil','Médio','Difícil']);
const headerAliases={disciplina:'subject',materia:'subject',subject:'subject',topico:'topic',conteudo:'topic',topic:'topic',dificuldade:'difficulty',difficulty:'difficulty',importancia:'importance',impacto:'importance',examimportance:'importance',esforco:'effort',minutos:'effort',estimatedstudyminutes:'effort',tags:'tags',etiquetas:'tags'};

function parseCsvRows(text){
  const rows=[];let row=[],field='',quoted=false;
  for(let index=0;index<text.length;index++){const char=text[index],next=text[index+1];if(char==='"'&&quoted&&next==='"'){field+='"';index++;continue}if(char==='"'){quoted=!quoted;continue}if((char===','||char===';'||char==='\t')&&!quoted){row.push(field);field='';continue}if((char==='\n'||char==='\r')&&!quoted){if(char==='\r'&&next==='\n')index++;row.push(field);if(row.some(value=>clean(value)))rows.push(row);row=[];field='';continue}field+=char}
  row.push(field);if(row.some(value=>clean(value)))rows.push(row);if(quoted)throw new TypeError('O CSV possui aspas não fechadas.');return rows;
}
function normalizeTopic(input={}){
  const name=clean(input.name??input.topic??input.topico??input.conteudo);if(!name)throw new TypeError('Todo tópico precisa ter um nome.');
  const rawDifficulty=clean(input.difficulty??input.dificuldade),difficulty=DIFFICULTIES.has(rawDifficulty)?rawDifficulty:null;
  const importance=finite(input.importance??input.importancia??input.examImportance),effort=finite(input.effort??input.esforco??input.estimatedStudyMinutes);
  if(importance!=null&&(importance<0||importance>100))throw new TypeError(`A importância de "${name}" deve estar entre 0 e 100.`);
  if(effort!=null&&effort<=0)throw new TypeError(`O esforço de "${name}" deve ser maior que zero.`);
  const rawTags=input.tags??input.etiquetas??[],tags=[...new Set((Array.isArray(rawTags)?rawTags:String(rawTags).split('|')).map(clean).filter(Boolean))];
  return {name,...(difficulty?{difficulty}:{}),...(importance==null?{}:{examImportance:importance/100}),...(effort==null?{}:{estimatedStudyMinutes:Math.round(effort)}),...(tags.length?{tags}:{})};
}
function normalizeSubjects(subjects){
  if(!Array.isArray(subjects)||!subjects.length)throw new TypeError('O arquivo não contém disciplinas.');
  if(subjects.length>500)throw new TypeError('O arquivo excede o limite de 500 disciplinas.');
  let topicCount=0;const result=subjects.map(input=>{const name=clean(input?.name??input?.subject??input?.disciplina??input?.materia);if(!name)throw new TypeError('Toda disciplina precisa ter um nome.');const topics=(input?.topics??input?.topicos??[]).map(normalizeTopic);topicCount+=topics.length;return{name,topics}});
  if(topicCount>10000)throw new TypeError('O arquivo excede o limite de 10.000 tópicos.');return result;
}
export function parseStructuredStudyContent(text,{fileName=''}={}){
  if(typeof text!=='string'||!text.trim())throw new TypeError('O arquivo está vazio.');
  const json=/\.json$/i.test(fileName)||/^[\s]*[\[{]/.test(text);
  if(json){let value;try{value=JSON.parse(text)}catch{throw new TypeError('O JSON não pôde ser interpretado.')}return normalizeSubjects(Array.isArray(value)?value:value?.subjects??value?.disciplinas)}
  const rows=parseCsvRows(text);if(rows.length<2)throw new TypeError('O CSV precisa de cabeçalho e ao menos uma linha.');
  const headers=rows.shift().map(value=>headerAliases[key(value)]||null);if(!headers.includes('subject')||!headers.includes('topic'))throw new TypeError('O CSV precisa das colunas disciplina e topico.');
  const grouped=new Map();
  rows.forEach(row=>{const record=Object.fromEntries(headers.map((header,index)=>[header,row[index]]).filter(([header])=>header));const subject=clean(record.subject);if(!subject)throw new TypeError('Toda linha do CSV precisa informar a disciplina.');const id=key(subject);if(!grouped.has(id))grouped.set(id,{name:subject,topics:[]});grouped.get(id).topics.push(record)});
  return normalizeSubjects([...grouped.values()]);
}

export function createStructuredContentImportService({subjectService,getSubjects}={}){
  if(!subjectService||typeof getSubjects!=='function')throw new TypeError('Importação estruturada requer serviço e estado de disciplinas.');
  const inspect=subjects=>{const current=getSubjects(),summary={addedSubjects:0,existingSubjects:0,addedTopics:0,updatedTopics:0,totalTopics:0};for(const source of subjects){const subject=current.find(item=>key(item.name)===key(source.name));subject?summary.existingSubjects++:summary.addedSubjects++;for(const topic of source.topics){summary.totalTopics++;subject?.topics?.some(item=>key(item.name)===key(topic.name))?summary.updatedTopics++:summary.addedTopics++}}return summary};
  return Object.freeze({preview:inspect,import(subjects){const current=getSubjects(),snapshot=structuredClone(current),summary=inspect(subjects);try{for(const source of subjects){let subject=current.find(item=>key(item.name)===key(source.name));if(!subject)subject=subjectService.create(source.name);for(const imported of source.topics){const existing=subject.topics.find(item=>key(item.name)===key(imported.name));if(existing){const patch={...imported,tags:[...new Set([...(existing.tags||[]),...(imported.tags||[])])]};delete patch.name;subjectService.updateTopic(subject.id,existing.id,patch)}else subjectService.addTopic(subject.id,imported)}}}catch(error){current.splice(0,current.length,...snapshot);throw error}return summary}});
}
