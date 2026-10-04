export function buildCapacityReviewPreview(model,currentMinutes){
  const range=model?.capacity?.observedRange;
  if(model?.assessment?.action!=='review_capacity'||!range||!Number.isFinite(currentMinutes)||currentMinutes<=0)return {state:'unavailable'};
  if(currentMinutes!==model.referenceCapacityMinutes)return {state:'stale_capacity',message:'Sua disponibilidade mudou desde as semanas comparadas. Acompanhe a nova configuração antes de revisar a capacidade.'};
  const hypotheticalMinutes=Math.min(currentMinutes,range.highMinutes);
  if(hypotheticalMinutes<=0||hypotheticalMinutes>=currentMinutes)return {state:'unavailable',message:'A faixa observada não sustenta uma prévia de redução da disponibilidade.'};
  return {version:1,state:'ready',currentMinutes,hypotheticalMinutes,differenceMinutes:currentMinutes-hypotheticalMinutes,
    observedRange:{...range},comparableWeeks:model.evidence.comparableWeeks,
    message:'O cenário usa o limite superior da faixa observada, apenas para comparação. Não recomenda uma capacidade ideal. O planejamento teria de ser revisto separadamente.'};
}
