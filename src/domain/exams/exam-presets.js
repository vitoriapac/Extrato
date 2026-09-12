import {CATALOG_VERSION,EXAM_TAGS,catalogForExamTags} from './exam-catalog.js';
const preset=(id,name,examTags,sources,description)=>Object.freeze({id,name,version:CATALOG_VERSION,examTags,sources,description,subjects:catalogForExamTags(examTags)});
export const EXAM_PRESETS=Object.freeze([
  preset('bb-escriturario','Banco do Brasil — Escriturário',[EXAM_TAGS.BB],['bb-escriturario-2023'],'Conteúdo e pesos do edital BB 2023; incidência por tópico estimada.'),
  preset('caixa-tbn','Caixa — Técnico Bancário Novo',[EXAM_TAGS.CAIXA],['caixa-tbn-2024'],'Conteúdo e pesos do edital Caixa 2024; incidência por tópico estimada.'),
  preset('caixa-tbn-ti','Caixa — TBN Tecnologia da Informação',[EXAM_TAGS.CAIXA_TI],['studytrack-curated-ti'],'Catálogo curado para preparação em TI.'),
  preset('bb-caixa','BB + Caixa — preparação combinada',[EXAM_TAGS.BB,EXAM_TAGS.CAIXA],['bb-escriturario-2023','caixa-tbn-2024'],'Conteúdo único dos dois concursos, sem duplicar tópicos comuns.'),
  Object.freeze({id:'empty',name:'Estrutura vazia',version:CATALOG_VERSION,examTags:[],sources:[],description:'Começar sem conteúdo predefinido.',subjects:[]})
]);
export function getExamPreset(id){return EXAM_PRESETS.find(item=>item.id===id)||null}
