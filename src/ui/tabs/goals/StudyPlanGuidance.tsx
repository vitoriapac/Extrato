export function StudyPlanGuidance({ hasPlan, hasExamDate }: { hasPlan: boolean; hasExamDate: boolean }) {
  return <div class="study-plan-guidance helper-text">
    <a href="#planExecutionCard">Ver resumo da semana</a>
    <p>{hasPlan ? 'Distribua o plano nos próximos 7 dias ou calcule outra proposta; revise antes de confirmar.' : hasExamDate ? 'Calcule uma proposta semanal para revisar antes de confirmar.' : 'Defina a data da prova para calcular uma proposta semanal.'} “E se?” simula sem alterar seu plano.</p>
  </div>;
}
