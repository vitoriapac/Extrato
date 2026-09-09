export const POST_SIMULATION_REPLAN_VERSION='1.0.0';
const n=value=>Number.isFinite(Number(value))?Number(value):null;
export function buildPostSimulationReplan({simulation=null,subjects=[],topics=[],minimumQuestions=5}={}){
 const rows=Array.isArray(simulation?.breakdown)?simulation.breakdown.filter(row=>n(row.total)>=minimumQuestions):[];
 if(!simulation||!rows.length)return{algorithmVersion:POST_SIMULATION_REPLAN_VERSION,state:'insufficient',reason:'É necessário um simulado com detalhamento suficiente por disciplina.',adjustments:[],evidence:{rows:rows.length,minimumQuestions}};
 const subjectMap=new Map(subjects.map(item=>[item.id,item]));
 const adjustments=rows.map(row=>{const total=n(row.total)||0,correct=n(row.correct)||0,accuracy=Math.round(correct/total*100),subject=subjectMap.get(row.subjectId);const delta=accuracy<50?30:accuracy<70?15:0;return{subjectId:row.subjectId||null,subjectName:subject?.name||'Disciplina não identificada',accuracy,deltaMinutes:delta,reason:delta?`Desempenho de ${accuracy}% no simulado; reforçar questões e revisão.`:'Desempenho sem déficit crítico identificado.'};}).filter(item=>item.deltaMinutes>0);
 return{algorithmVersion:POST_SIMULATION_REPLAN_VERSION,state:adjustments.length?'proposal':'balanced',simulationId:simulation.id,simulationDate:simulation.date,adjustments,evidence:{rows:rows.length,minimumQuestions,measuredRows:rows.length},message:adjustments.length?'Proposta aguardando confirmação explícita.':'O simulado não indica redistribuição imediata.'};
}
