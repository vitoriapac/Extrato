export const CATALOG_VERSION='2.2.0';
export const EXAM_TAGS=Object.freeze({BB:'bb-escriturario',CAIXA:'caixa-tbn',CAIXA_TI:'caixa-tbn-ti'});
export const INSTITUTIONS=Object.freeze({BB:'bb',CAIXA:'caixa'});
export const EXAM_SOURCES=Object.freeze({
  'bb-escriturario-2023':Object.freeze({institution:'bb',year:2023,role:'Escriturário',official:true,label:'Edital BB 2023'}),
  'caixa-tbn-2024':Object.freeze({institution:'caixa',year:2024,role:'Técnico Bancário Novo',official:true,label:'Edital Caixa 2024'}),
  'studytrack-curated-ti':Object.freeze({institution:'caixa',role:'TBN TI',official:false,label:'Catálogo curado StudyTrack'})
});
export function institutionForExamTag(tag){return tag===EXAM_TAGS.BB?INSTITUTIONS.BB:[EXAM_TAGS.CAIXA,EXAM_TAGS.CAIXA_TI].includes(tag)?INSTITUTIONS.CAIXA:null}
