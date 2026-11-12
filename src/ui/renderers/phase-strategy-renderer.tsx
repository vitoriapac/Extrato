import { render } from 'preact-render-to-string';

const activities = (mix: Record<string, any>) =>
  `teoria ${mix.theory} min · questões ${mix.questions} min · revisão ${mix.reviews} min`;

export function renderPhaseStrategy(
  model: Record<string, any>,
  { preview = false, canRevert = false }: any = {}
) {
  if (!model) return '';
  return render(
    <section class="chart-frame" aria-label="Estratégia por fase">
      <h4>Estratégia por fase · {model.phase?.label}</h4>
      {model.state === 'proposal' ? (
        <>
          <p>
            {model.phase.days} dias até a prova · carga de {model.budget} min e capacidade de{' '}
            {model.capacity} min preservadas.
          </p>
          <details open={preview}>
            <summary>{model.changes.length} divisões de atividades propostas</summary>
            {model.contextExplanation && (
              <p class="phase-planning-context">{model.contextExplanation}</p>
            )}
            {model.decisionContext && (
              <p>
                Meta:{' '}
                {model.decisionContext.targetScore == null
                  ? 'não definida'
                  : `${model.decisionContext.targetScore}%`}{' '}
                · resultado central dos simulados:{' '}
                {model.decisionContext.currentScore == null
                  ? 'dados insuficientes'
                  : `${model.decisionContext.currentScore}%`}
                .
              </p>
            )}
            <p>
              Todos os tópicos e minutos do plano são preservados. A proposta não reserva novos
              simulados automaticamente.
            </p>
            <ul class="phase-strategy-changes">
              {model.changes.map((item: any) => (
                <li>
                  <strong>
                    {item.subjectName} — {item.topicName}
                  </strong>
                  <p>
                    Antes: {activities(item.before)}
                    <br />
                    Depois: {activities(item.after)}
                  </p>
                  <small>
                    {item.reasons.join(' ')} Domínio {Math.round(item.mastery)}/100 · impacto{' '}
                    {item.examImpact == null ? 'sem dados' : `${Math.round(item.examImpact)}/100`}.
                  </small>
                </li>
              ))}
            </ul>
            <p>
              Planos diários e sessões existentes continuam vinculados às versões originais.
              Distribua a nova versão nos próximos dias após confirmar.
            </p>
          </details>
          <button
            class="btn ghost small"
            type="button"
            data-delegated-click={preview ? 'confirmPhaseStrategy()' : 'previewPhaseStrategy()'}
          >
            {preview ? 'Confirmar nova versão do plano' : 'Revisar proposta de estratégia'}
          </button>
          {preview && (
            <button
              class="btn ghost small"
              type="button"
              data-delegated-click="cancelPhaseStrategy()"
            >
              Cancelar
            </button>
          )}
        </>
      ) : (
        <p>{model.reason}</p>
      )}
      {canRevert && (
        <button class="btn ghost small" type="button" data-delegated-click="revertPhaseStrategy()">
          Reverter última estratégia por fase
        </button>
      )}
    </section>
  );
}
