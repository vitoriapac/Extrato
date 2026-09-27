const accuracy=(correct,total)=>Math.round(correct/total*100);
const breakdownBySubject=simulation=>{
  const rows=new Map();
  for(const item of simulation.breakdown||[]){
    const total=Math.max(0,Number(item.total)||0),correct=Math.min(total,Math.max(0,Number(item.correct)||0));
    if(!item.subjectId||!total)continue;
    const previous=rows.get(item.subjectId)||{correct:0,total:0};
    rows.set(item.subjectId,{correct:previous.correct+correct,total:previous.total+total});
  }
  return rows;
};

export function buildSimulationComparison({simulations=[],subjects=[]}={}){
  const ordered=simulations.filter(item=>item.date).slice().sort((a,b)=>String(a.date).localeCompare(String(b.date))||String(a.id).localeCompare(String(b.id)));
  if(ordered.length<2)return {state:'insufficient',message:'Registre dois simulados para comparar as disciplinas.',rows:[]};
  const [previous,current]=ordered.slice(-2);
  const before=breakdownBySubject(previous),after=breakdownBySubject(current);
  const names=new Map(subjects.map(item=>[item.id,item.name]));
  const rows=[...after.entries()].filter(([id])=>before.has(id)).map(([id,latest])=>{
    const earlier=before.get(id),previousAccuracy=accuracy(earlier.correct,earlier.total),currentAccuracy=accuracy(latest.correct,latest.total);
    return {subjectId:id,name:names.get(id)||'Disciplina removida',previousAccuracy,currentAccuracy,
      previousTotal:earlier.total,currentTotal:latest.total,delta:currentAccuracy-previousAccuracy};
  }).sort((a,b)=>a.name.localeCompare(b.name,'pt-BR'));
  return {state:rows.length?'ready':'insufficient',message:rows.length?'':'Os dois últimos simulados precisam ter disciplinas detalhadas em comum.',
    previous:{name:previous.nome||'Simulado anterior',date:previous.date},current:{name:current.nome||'Último simulado',date:current.date},rows};
}
