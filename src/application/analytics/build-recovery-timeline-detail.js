const trajectoryLabels={on_track:'No caminho',attention:'Atenção',at_risk:'Em risco',insufficient_data:'Dados insuficientes'};
const minutes=value=>Number.isFinite(value)&&value>=0?`${value} min`:'Não registrado';

// Audit fields come exclusively from the decision recorded at confirmation.
export function buildRecoveryTimelineDetail(record,{reverted=false}={}){
  if(record?.decisionType!=='recovery')return null;
  const snapshot=record.explanationSnapshot?.action;
  const metric=(side,key)=>Number.isFinite(snapshot?.[side]?.[key])?`${snapshot[side][key]}/100`:'Não registrado';
  return {
    decisionId:record.id,planId:reverted?record.reversionPlanId||null:record.planId||null,
    originalDecisionId:record.originalDecisionId||record.id,
    sourceName:record.sourceName||'Origem não registrada',targetName:record.targetName||'Destino não registrado',
    transferMinutes:record.minutes??null,
    rows:[
      {label:'Origem',value:record.sourceName||'Não registrada'},
      {label:'Destino',value:record.targetName||'Não registrado'},
      {label:'Transferência',value:minutes(record.minutes)},
      {label:'Domínio da origem',value:metric('from','mastery')},
      {label:'Domínio do destino',value:metric('to','mastery')},
      {label:'Impacto do destino',value:metric('to','impact')},
      {label:'Carga semanal',value:`${minutes(record.totalMinutesBefore)} → ${minutes(record.totalMinutesAfter)}`},
      {label:'Trajetória naquele momento',value:trajectoryLabels[record.trajectoryStatus]||'Não registrada'},
      {label:'Algoritmo adaptativo',value:record.algorithmVersion==null?'Não registrado':`Versão ${record.algorithmVersion}`}
    ],
    reasons:(Array.isArray(record.reasons)?record.reasons:[]).filter(reason=>typeof reason==='string'),
    revertReason:reverted?record.revertReason||'Motivo não registrado':null,
    note:reverted?'Atividades já realizadas e versões anteriores foram preservadas.':'Evidências congeladas na confirmação; não recalculadas com o estado atual.'
  };
}
