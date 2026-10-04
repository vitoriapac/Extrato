const messages={
  sustainable:'Seu planejamento recente está compatível com a execução observada.',
  capacity_mismatch:'As prioridades têm sido preservadas, mas o volume executado ficou abaixo do planejado de forma recorrente. Vale revisar a disponibilidade declarada; isso não comprova a causa do desvio.',
  priority_mismatch:'O volume de estudo está próximo do planejado, mas prioridades importantes têm ficado pendentes. Revise a distribuição e os blocos prioritários.',
  unstable_execution:'A execução variou bastante entre as semanas. A média não representa uma rotina estável; investigue as diferenças antes de ajustar a capacidade.',
  isolated_anomaly:'Uma semana destoou das demais. Esse desvio isolado não justifica uma mudança estrutural de capacidade.',
  monitor:'Continue acompanhando semanas comparáveis. Ainda não há um padrão repetido que justifique uma recomendação estrutural.',
  insufficient_data:'Registre planejamento, prioridades e disponibilidade ao longo de mais semanas completas para comparar a execução.'
};
export function buildSustainabilityInsights(model){
  const excluded=model.weeks.filter(week=>!week.comparable);
  return {version:1,message:messages[model.assessment.status],preliminary:model.evidence.level==='preliminary',
    comparableWeeks:model.evidence.comparableWeeks,excludedWeeks:excluded.map(week=>({period:{...week.period},reasonCodes:[...week.reasonCodes]})),
    caveat:'A faixa representa execução observada, incluindo estudo adicional. Não é capacidade ideal nem uma previsão de resultado.'};
}
