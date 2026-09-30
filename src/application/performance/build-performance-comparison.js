const rounded=value=>Math.round(value*10)/10;
const classify=(value,threshold)=>value>threshold?'improved':value< -threshold?'worsened':'stable';
const metric=(label,before,after,unit,threshold,available=true)=>({
  label,before,after,unit,
  delta:available&&before!=null&&after!=null?rounded(after-before):null,
  state:available&&before!=null&&after!=null?classify(after-before,threshold):'insufficient'
});

export function buildPerformanceComparison(overview,{comparePrevious=true}={}){
  if(!comparePrevious||!overview?.previous)return {state:'disabled',rows:[],insights:[]};
  const current=overview.current||{},previous=overview.previous;
  const rows=[
    metric('Precisão',previous.accuracy,current.accuracy,'p.p.',1,previous.resolved>=30&&current.resolved>=30),
    metric('Tempo estudado',previous.studiedMinutes,current.studiedMinutes,'min',30,(previous.sessionCount||0)+(current.sessionCount||0)>0),
    metric('Questões resolvidas',previous.resolved,current.resolved,'questões',10,(previous.resolved||0)+(current.resolved||0)>0),
    metric('Aderência de carga',previous.adherence,current.adherence,'p.p.',2,previous.plannedMinutes>=60&&current.plannedMinutes>=60)
  ];
  const insights=[];
  const accuracy=rows[0],volume=rows[2],load=rows[3];
  if(accuracy.state==='improved'&&volume.delta!=null&&volume.delta>=0){
    insights.push(`A precisão subiu ${accuracy.delta} p.p. enquanto o volume de questões ${volume.delta?'cresceu '+volume.delta:'se manteve'}. A mudança observada não indica, sozinha, sua causa.`);
  }else if(accuracy.state==='worsened'){
    insights.push(`A precisão caiu ${Math.abs(accuracy.delta)} p.p. em relação ao período anterior. Confira os erros e a composição das questões antes de ajustar o plano.`);
  }
  if(load.after>=90&&load.state!=='insufficient'&&overview.strategic?.strategicAdherence!=null&&overview.strategic.classifiedCoverage>=70&&overview.strategic.strategicAdherence<75){
    insights.push(`Você estudou ${rounded(load.after)}% do tempo planejado, mas executou ${overview.strategic.strategicAdherence}% do tempo prioritário previsto em sessões vinculadas.`);
  }
  if(overview.readinessComparison?.state==='algorithm-change'||overview.readinessComparison?.state==='weights-change'||overview.readinessComparison?.state==='evidence-change'){
    insights.push('A prontidão salva não foi comparada porque a base do cálculo mudou entre os períodos. Os valores originais continuam disponíveis no histórico.');
  }
  if(!insights.length){
    const comparable=rows.filter(row=>row.state!=='insufficient');
    if(!comparable.length)insights.push('Ainda faltam registros comparáveis nos dois períodos para interpretar a evolução.');
    else if(comparable.every(row=>row.state==='stable'))insights.push('Os indicadores comparáveis permaneceram próximos dos valores do período anterior.');
    else insights.push('Os indicadores mudaram em direções diferentes. Compare precisão, volume e execução antes de tirar uma conclusão geral.');
  }
  return {state:'ready',rows,insights:insights.slice(0,3)};
}
