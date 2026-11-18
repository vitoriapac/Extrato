export function buildProjectionRecovery({
  status,
  current,
  exam,
  coverage,
  adherence,
  topicRisks = [],
}: any = {}) {
  if (status === 'insufficient_data')
    return {
      state: 'collect_evidence',
      gap: null as number | null,
      steps: ['Registre simulados comparáveis em datas diferentes para medir a trajetória.'],
    };
  const gap = Math.max(
    0,
    Math.round((Number(current?.targetScore) || 0) - (Number(current?.simulationAccuracy) || 0))
  );
  const steps = [];
  if (gap > 0)
    steps.push(
      `Acompanhe o déficit medido de ${gap} p.p. nos simulados comparáveis antes de concluir que a meta foi alcançada.`
    );
  if (topicRisks.length)
    steps.push(
      `${topicRisks.length} ${topicRisks.length === 1 ? 'tópico de alto impacto e baixo domínio pesa' : 'tópicos de alto impacto e baixo domínio pesam'} na projeção; a fila do Diagnóstico os ordena e a ação do dia segue a Próxima ação.`
    );
  if (coverage != null && coverage < 50)
    steps.push('Amplie a cobertura dos tópicos do edital ainda não concluídos.');
  if (adherence != null && adherence < 60)
    steps.push('Confira a execução do plano antes de propor mais horas de estudo.');
  if (exam?.phase === 'final_review')
    steps.push(
      'Na revisão final, concentre a execução nas revisões críticas e nos simulados já planejados.'
    );
  if (!steps.length)
    steps.push('Mantenha o plano atual e reavalie a trajetória após novos simulados comparáveis.');
  return {
    state: 'guidance',
    gap,
    weeksRemaining:
      exam?.daysRemaining == null ? null : Math.round((exam.daysRemaining / 7) * 10) / 10,
    steps: steps.slice(0, 4),
  };
}
