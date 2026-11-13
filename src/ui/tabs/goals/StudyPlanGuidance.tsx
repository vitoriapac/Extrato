export function StudyPlanGuidance({ hasPlan, hasExamDate }: { hasPlan: boolean; hasExamDate: boolean }) {
  return <div class="study-plan-guidance helper-text">
    <a href="#planExecutionCard">Ver resumo da semana</a>
    <p>{hasPlan ? 'Distribua o plano nos próximos 7 dias ou calcule outra proposta; nada é salvo sem sua confirmação.' : hasExamDate ? 'Calcule uma proposta semanal para revisar antes de confirmar.' : 'Defina a data da prova para calcular uma proposta semanal.'}</p>
  </div>;
}
