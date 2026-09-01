const clamp=value=>Math.max(0,Math.min(100,Math.round(Number(value)||0)));

export function calculateSubjectRadar(input={}){
  const axes={
    coverage:Number.isFinite(input.coverage)?clamp(input.coverage):null,
    mastery:Number.isFinite(input.mastery)?clamp(input.mastery):null,
    retention:Number.isFinite(input.retention)?clamp(input.retention):null,
    frequency:Number.isFinite(input.daysSinceContact)?clamp(100-input.daysSinceContact*5):null,
    consistency:Number.isFinite(input.activeDays)?clamp(input.activeDays/16*100):null
  };
  const available=Object.values(axes).filter(value=>value!==null);
  const confidence=available.length/5;
  return {axes,availableAxes:available.length,confidence,confidenceLabel:confidence>=.8?'Alta':confidence>=.4?'Média':'Baixa',interpretation:interpretRadar(axes)};
}

export function interpretRadar(axes){
  if(axes.coverage!==null&&axes.coverage>=70&&axes.retention!==null&&axes.retention<50)return 'Cobertura alta, mas retenção baixa: reforce as revisões.';
  if(axes.mastery!==null&&axes.mastery>=70&&axes.frequency!==null&&axes.frequency<50)return 'Domínio alto, mas pouco contato recente: programe manutenção.';
  const values=Object.entries(axes).filter(([,value])=>value!==null);if(values.length<2)return 'Aguardando mais dados para interpretar o perfil.';
  const weakest=values.sort((a,b)=>a[1]-b[1])[0];
  const labels={coverage:'cobertura',mastery:'domínio',retention:'retenção',frequency:'frequência',consistency:'consistência'};
  return `Principal ponto de atenção: ${labels[weakest[0]]} (${weakest[1]}/100).`;
}
