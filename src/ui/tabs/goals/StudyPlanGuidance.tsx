export function StudyPlanGuidance({
  hasPlan,
  hasExamDate,
}: {
  hasPlan: boolean;
  hasExamDate: boolean;
}) {
  // Com plano confirmado a linha de estado e as ações já dizem o que fazer.
  if (hasPlan) return null;
  return (
    <div class="study-plan-guidance helper-text">
      <p>
        {hasExamDate
          ? 'Calcule uma proposta semanal para revisar antes de confirmar.'
          : 'Defina a data da prova para calcular uma proposta semanal.'}
      </p>
    </div>
  );
}
