const TYPES=Object.freeze({study:'Estudo',review:'Revisão',questions:'Questões',prerequisite:'Pré-requisito'});
const typeOf=item=>{const value=item.actionKind||item.snapshot?.recommendationType||'study';return Object.hasOwn(TYPES,value)?value:'study'};
const resultOf=item=>{const state=item.outcome?.state;if(state==='positive'||state==='improved')return'improved';if(state==='neutral'||state==='stable')return'stable';if(state==='negative'||state==='declined'||state==='worsened')return'declined';return'insufficient'};

export function buildRecommendationOutcomeAudit(feedback=[]){
  const executed=(Array.isArray(feedback)?feedback:[]).filter(item=>item.accepted);
  const groups=Object.entries(TYPES).map(([type,label])=>{
    const rows=executed.filter(item=>typeOf(item)===type),counts={improved:0,stable:0,declined:0,insufficient:0};
    rows.forEach(item=>counts[resultOf(item)]++);
    return {type,label,executed:rows.length,...counts};
  }).filter(group=>group.executed>0);
  const total={executed:executed.length,improved:0,stable:0,declined:0,insufficient:0};
  groups.forEach(group=>{for(const key of ['improved','stable','declined','insufficient'])total[key]+=group[key]});
  return {groups,total,available:executed.length>0};
}
