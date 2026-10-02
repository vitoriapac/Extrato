export function buildProjectionExplanation({status, calibrated, forecast, coverage, adherence, consistency, openHighImpactPriorities, target, daysRemaining}) {
  const drivers = [], risks = [];
  if (!calibrated.available) return {drivers, risks, summary: calibrated.reason};
  const current = calibrated.central;
  if (current >= target) drivers.push(`Resultado central dos simulados (${current}%) alcança a meta de ${target}%.`);
  else risks.push(`Resultado central dos simulados (${current}%) está ${target - current} p.p. abaixo da meta.`);
  if (forecast?.forecast30?.available) {
    if (forecast.forecast30.slopePerWeek > 0) drivers.push('Os simulados comparáveis mostram evolução recente.');
    if (forecast.forecast30.slopePerWeek < 0) risks.push('Os simulados comparáveis mostram deterioração recente.');
  }
  if (coverage != null && coverage < 50) risks.push(`Cobertura de tópicos baixa (${Math.round(coverage)}%).`);
  if (adherence != null && adherence < 60) risks.push(`Execução do plano baixa (${Math.round(adherence)}%).`);
  if (consistency?.target > 0 && consistency.days >= consistency.target) drivers.push('Meta de consistência cumprida; isso não substitui evidência de desempenho.');
  if (openHighImpactPriorities > 0) risks.push(`${openHighImpactPriorities} lacuna(s) de alto impacto com domínio baixo e evidência suficiente.`);
  if (status === 'at_risk' && daysRemaining != null && daysRemaining <= 14) risks.push(`Prazo curto: ${daysRemaining} dia(s) até a prova para reduzir o déficit medido.`);
  const summaries = {
    insufficient_data: 'Ainda não há simulados comparáveis suficientes para avaliar a trajetória.',
    on_track: 'Os sinais medidos são compatíveis com a meta, sujeitos à incerteza indicada.',
    attention: 'A meta exige atenção aos sinais de desempenho e cobertura.',
    at_risk: 'O prazo e os sinais medidos indicam risco para atingir a meta.'
  };
  return {drivers, risks, summary: summaries[status]};
}
