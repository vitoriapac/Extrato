export const PRIORITY_FACTOR_LABELS=Object.freeze({
  examImpact:'Impacto na prova',retentionRisk:'Risco de retenção',masteryGap:'Lacuna de domínio',
  reviewUrgency:'Urgência da revisão',reviewHealthRisk:'Saúde da revisão',
  planAlignment:'Alinhamento com o plano',recencyRisk:'Tempo sem contato'
});

export function buildPriorityViewModel(item={},position=1){
  const score=item.score==null||item.score===''?null:Number.isFinite(Number(item.score))?Math.max(0,Math.min(100,Math.round(Number(item.score)))):null;
  const evidenceStrength=Number(item.evidence?.evidenceStrength)||0;
  const state=item.blockedPrerequisites?.length?'blocked':item.reviewHealth?.level==='critical'?'review':evidenceStrength<.35?'limited':score>=70?'high':'calculated';
  const stateLabels={blocked:'Bloqueado por pré-requisito',review:'Revisão recomendada',limited:'Poucos dados',high:'Prioridade elevada',calculated:'Prioridade calculada'};
  const contributionRows=Object.entries(item.contributions||{}).map(([key,value])=>({
    key,label:PRIORITY_FACTOR_LABELS[key]||key,value:Math.max(0,Math.round(Number(value)||0)),factor:item.factors?.[key]??null
  })).sort((a,b)=>b.value-a.value||a.label.localeCompare(b.label));
  const exam=item.examIntelligence||{};
  const impactOrigin=exam.impactSourceType==='official'?'Peso oficial':exam.impactSourceType==='manual'?'Impacto manual':exam.usedHistory?'Impacto estimado com histórico':'Impacto estimado';
  const impactLabel=exam.value==null?'Impacto ainda sem dados':`${impactOrigin} ${Math.round(exam.value)}/100`;
  const examExplanation=exam.analyzedExamCount?`${impactLabel} · ${exam.presentExamCount} de ${exam.analyzedExamCount} provas · incidência ${exam.presencePercent}% · confiança ${String(exam.confidenceLabel||'limitada').toLowerCase()}${exam.usedHistory?' · histórico considerado no impacto':' · histórico informativo'}`:impactLabel;
  const personalExplanation=[item.mastery==null?'Domínio sem evidência':`Domínio ${Math.round(item.mastery)}/100`,item.retention==null?null:`Retenção ${Math.round(item.retention)}/100`,item.reviewUrgency>=40?'Revisão pendente':null].filter(Boolean).join(' · ');
  return {position,score,state,stateLabel:stateLabels[state],contributionRows,examExplanation,personalExplanation,
    completeness:Math.round((Number(item.evidence?.completeness)||0)*100),
    evidenceLabel:item.evidence?.evidenceLabel||'Não avaliada',reasons:(item.reasons||[]).filter(Boolean)};
}
