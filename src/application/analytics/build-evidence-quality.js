export function buildEvidenceQuality({confidence=null,label=null,counts={},reasons=[]}={}){
 const normalized=String(label||'').toLowerCase();
 const known=typeof confidence==='number'&&Number.isFinite(confidence);
 const level=known?(confidence>=.7?'Alta':confidence>=.35?'Moderada':'Baixa'):['alta','high'].includes(normalized)?'Alta':['moderada','média','moderate','medium'].includes(normalized)?'Moderada':'Baixa';
 const limited=['insufficient','evidência limitada','insuficiente'].includes(normalized);
 const assessed=known||limited||['alta','high','moderada','média','moderate','medium','baixa','low'].includes(normalized);
 return {level,assessed,counts:Object.entries(counts).filter(([,value])=>typeof value==='number'&&Number.isFinite(value)&&value>=0).map(([label,value])=>({label,value})),reasons:[...reasons.filter(value=>typeof value==='string'&&value.trim()),...(limited?['Evidência limitada: a base ainda não atende aos critérios deste indicador.']:[]),...(!assessed?['Qualidade não avaliada neste registro. A classificação conservadora não indica desempenho ruim.']:[])],limitation:'Qualidade descreve a evidência deste indicador; não é probabilidade de acerto ou aprovação.'};
}
