export interface PlanRoadmapProps {
  hasExamDate: boolean;
  hasHours: boolean;
  hasPlan: boolean;
}

/** Roteiro do perfil vazio: data da prova, horas por dia e plano da semana. Só o passo atual tem ação. */
export function PlanRoadmap({ hasExamDate, hasHours, hasPlan }: PlanRoadmapProps) {
  const steps = [
    {
      done: hasExamDate,
      label: 'Data da prova',
      action: (
        <a class="btn" href="#planejamento/prova">
          Definir data da prova
        </a>
      ),
    },
    {
      done: hasHours,
      label: 'Horas por dia',
      action: (
        <button class="btn" type="button" data-delegated-click="openAvailabilityAdjust()">
          Informar horas por dia
        </button>
      ),
    },
    {
      done: hasPlan,
      label: 'Plano da semana',
      action: (
        <button class="btn" type="button" data-delegated-click="calculateStudyPlanPreview()">
          Calcular proposta semanal
        </button>
      ),
    },
  ];
  const current = steps.findIndex(step => !step.done);
  if (current === -1) return null;
  return (
    <section class="plan-roadmap" aria-labelledby="planRoadmapTitle">
      <h4 class="plan-roadmap__title" id="planRoadmapTitle">
        Monte seu plano em 3 passos
      </h4>
      <ol class="plan-roadmap__steps">
        {steps.map((step, index) => (
          <li
            class={`plan-roadmap__step${step.done ? ' is-done' : index === current ? ' is-current' : ''}`}
            aria-current={index === current ? 'step' : undefined}
          >
            <span class="plan-roadmap__mark" aria-hidden="true">
              {step.done ? '✓' : index + 1}
            </span>
            <span class="plan-roadmap__label">
              {step.label}
              <small>{step.done ? 'Feito' : index === current ? 'Próximo passo' : 'Depois'}</small>
            </span>
            {index === current && <span class="plan-roadmap__action">{step.action}</span>}
          </li>
        ))}
      </ol>
    </section>
  );
}
