// Presentation only: evidence gates and confidence belong to the domain.
export const EVIDENCE_STATES=Object.freeze({MEASURED:'measured',ESTIMATED:'estimated',NO_DATA:'no_data',INSUFFICIENT:'insufficient',NOT_APPLICABLE:'not_applicable'});
const descriptions=Object.freeze({measured:{label:'Medido',message:'Resultado obtido dos registros disponíveis.'},estimated:{label:'Estimado',message:'Estimativa baseada nas evidências disponíveis.'},no_data:{label:'Sem dados',message:'Ainda não há registros para apresentar este indicador.'},insufficient:{label:'Amostra insuficiente',message:'Os registros disponíveis ainda não sustentam esta análise.'},not_applicable:{label:'Ainda não aplicável',message:'Este indicador não se aplica ao contexto atual.'}});
export function presentEvidence({state,value=null,unit='',format=String,message=null,confidence=null}={}){
 const validValue=typeof value==='number'&&Number.isFinite(value);
 const selected=state??(validValue?EVIDENCE_STATES.MEASURED:EVIDENCE_STATES.NO_DATA);
 if(!Object.hasOwn(descriptions,selected))throw new TypeError('Estado de evidência desconhecido: '+selected);
 const numeric=selected===EVIDENCE_STATES.MEASURED||selected===EVIDENCE_STATES.ESTIMATED;
 const effective=numeric&&!validValue?EVIDENCE_STATES.NO_DATA:selected;
 const description=descriptions[effective];
 return {state:effective,label:description.label,text:numeric&&validValue?format(value)+unit:'—',message:message??description.message,confidence};
}
export const formatEvidencePercent=value=>presentEvidence({value,unit:'%',format:number=>String(Math.round(number))}).text;
