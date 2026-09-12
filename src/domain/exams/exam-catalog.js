import catalogData from './exam-catalog-data.json' with {type:'json'};

export const CATALOG_VERSION=catalogData.catalogVersion;
export const EXAM_TAGS=Object.freeze({BB:'bb-escriturario',CAIXA:'caixa-tbn',CAIXA_TI:'caixa-tbn-ti'});
export const INSTITUTIONS=Object.freeze({BB:'bb',CAIXA:'caixa'});
export const EXAM_SOURCES=Object.freeze({
  'bb-escriturario-2023':Object.freeze({institution:'bb',year:2023,role:'Escriturário',official:true,label:'Edital BB 2023'}),
  'caixa-tbn-2024':Object.freeze({institution:'caixa',year:2024,role:'Técnico Bancário Novo',official:true,label:'Edital Caixa 2024'}),
  'studytrack-curated-ti':Object.freeze({institution:'caixa',role:'TBN TI',official:false,label:'Catálogo curado StudyTrack'})
});

const clone=value=>structuredClone(value);
const deepFreeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);Object.values(value).forEach(deepFreeze)}return value};
const slug=value=>String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
export function institutionForExamTag(tag){return tag===EXAM_TAGS.BB?INSTITUTIONS.BB:[EXAM_TAGS.CAIXA,EXAM_TAGS.CAIXA_TI].includes(tag)?INSTITUTIONS.CAIXA:null}

function normalizeTopic(topic){
  const topicAliases={
    'estrutura-do-sistema-financeiro-nacional':['Sistema Financeiro Nacional','SFN'],
    'prevencao-a-lavagem-de-dinheiro':['PLD','PLD/FT'],
    'lei-geral-de-protecao-de-dados':['LGPD'],
    'programacao-python':['Python'],
    'programacao-java':['Java']
  };
  const examTags=[...new Set((topic.examTags||[]).filter(tag=>Object.values(EXAM_TAGS).includes(tag)))];
  return {...topic,id:topic.id||topic.catalogId||slug(topic.name),catalogId:topic.catalogId||topic.id||slug(topic.name),examTags,
    institutions:[...new Set((topic.institutions||examTags.map(institutionForExamTag)).filter(Boolean))],aliases:[...new Set([...(topic.aliases||[]),...(topicAliases[topic.catalogId||topic.id]||[])])],sourceRefs:[...new Set([...(topic.sourceRefs||[]),...Object.keys(topic.examMetrics||{})])],
    catalogDifficulty:topic.difficulty?clone(topic.difficulty):null,difficulty:topic.difficulty?clone(topic.difficulty):null,incidence:topic.incidence?clone(topic.incidence):null,examMetrics:clone(topic.examMetrics||{})};
}
function normalizeSubject(subject){const aliases={'lingua-portuguesa':['Português'],'informatica-e-tic':['Informática','TIC'],'probabilidade-e-estatistica':['Probabilidade e Estatística'],'mercado-financeiro-e-transformacao-digital':['Atualidades do Mercado Financeiro'],'tecnologia-e-inteligencia-artificial':['Tecnologia da Informação','TI'],'compliance-etica-e-legislacao-bancaria':['Compliance']}[subject.catalogId||subject.id]||[];return {...subject,id:subject.id||subject.catalogId||slug(subject.name),catalogId:subject.catalogId||subject.id||slug(subject.name),aliases:[...new Set([...(subject.aliases||[]),...aliases])],examMetrics:clone(subject.examMetrics||{}),topics:(subject.topics||[]).map(normalizeTopic)}}

const tiNames=['Lógica de programação','Algoritmos e estruturas de dados','Programação Java','Programação Python','Bancos de dados relacionais','Bancos de dados NoSQL','Engenharia de software','Arquitetura de software','APIs e microsserviços','DevOps e DevSecOps','Contêineres e orquestração','Testes de software','Métodos ágeis','Ciência de dados','Aprendizado de máquina','Inteligência artificial generativa','Governança de TI','Segurança cibernética'];
const tiTopics=tiNames.map(name=>normalizeTopic({id:slug(name),catalogId:slug(name),name,examTags:[EXAM_TAGS.CAIXA_TI],institutions:['caixa'],aliases:[],sourceRefs:['studytrack-curated-ti'],difficulty:null,incidence:null,examMetrics:{}}));
const enrichedSubjects=catalogData.subjects.map(normalizeSubject);

export const EXAM_CATALOG=deepFreeze(enrichedSubjects);
export const CURATED_TI_TOPICS=deepFreeze(tiTopics);
export const EXAM_PROFILES=deepFreeze(clone(catalogData.examProfiles||{}));
export const CATALOG_METADATA=deepFreeze({schemaVersion:catalogData.schemaVersion,catalogVersion:CATALOG_VERSION,catalogId:catalogData.catalogId,name:catalogData.name,description:catalogData.description,metadataModel:clone(catalogData.metadataModel||{})});

export function catalogForExamTags(examTags=[]){const selected=new Set(examTags),result=EXAM_CATALOG.map(group=>({...clone(group),topics:group.topics.filter(item=>item.examTags.some(tag=>selected.has(tag))).map(clone)})).filter(group=>group.topics.length);if(selected.has(EXAM_TAGS.CAIXA_TI)){const source=EXAM_CATALOG.find(subject=>subject.catalogId==='tecnologia-e-inteligencia-artificial'),existing=result.find(subject=>subject.catalogId===source?.catalogId);if(existing)existing.topics.push(...clone(tiTopics));else if(source)result.push({...clone(source),topics:clone(tiTopics)})}return result}
export function validateExamCatalog(subjects=EXAM_CATALOG){
  const errors=[],subjectIds=new Set(),topicIds=new Set();
  for(const subject of subjects){if(!subject.catalogId||subjectIds.has(subject.catalogId))errors.push(`Disciplina duplicada ou sem catalogId: ${subject.name||'sem nome'}`);subjectIds.add(subject.catalogId);
    for(const topic of subject.topics||[]){const key=`${subject.catalogId}:${topic.catalogId}`;if(!topic.catalogId||topicIds.has(key))errors.push(`Tópico duplicado ou sem catalogId: ${topic.name||'sem nome'}`);topicIds.add(key);if(!(topic.examTags||[]).length)errors.push(`Tópico sem examTags: ${topic.name}`);if((topic.examTags||[]).some(tag=>!Object.values(EXAM_TAGS).includes(tag)))errors.push(`Tag inválida em ${topic.name}`)}}
  return Object.freeze({valid:errors.length===0,errors,subjects:subjects.length,topics:subjects.reduce((sum,subject)=>sum+(subject.topics||[]).length,0)});
}
