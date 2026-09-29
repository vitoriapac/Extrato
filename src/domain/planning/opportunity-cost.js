export function buildOpportunityCost(advice){
 if(advice?.state!=='proposal')return null;
 const from=advice.from||{},to=advice.to||{},minutes=Number(advice.transferMinutes),budget=Number(advice.weeklyBudgetMinutes);
 const values=[from.beforeMinutes,from.afterMinutes,to.beforeMinutes,to.afterMinutes,budget,minutes];
 if(!values.every(value=>typeof value==='number'&&Number.isFinite(value)&&value>=0)||minutes<=0||!from.subjectId||!to.subjectId||from.subjectId===to.subjectId||from.beforeMinutes+to.beforeMinutes>budget||Math.abs(from.beforeMinutes-from.afterMinutes-minutes)>.01||Math.abs(to.afterMinutes-to.beforeMinutes-minutes)>.01)return null;
 const metric=value=>typeof value==='number'&&Number.isFinite(value)&&value>=0&&value<=100?value:null;
 const side=(item,state)=>({...item,mastery:metric(item.mastery),impact:metric(item.impact),incidence:metric(item.incidence),state});
 return {minutes,budget,from:side(from,'Manutenção proposta'),to:side(to,'Lacuna prioritária'),limitation:'A origem cede tempo de manutenção e deve continuar acompanhada. O ganho no destino é tempo disponível, não uma previsão de melhora ou de pontos na prova.'};
}
