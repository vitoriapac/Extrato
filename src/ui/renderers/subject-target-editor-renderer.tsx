import { formatDecimal } from '../../core/format-number.js';
import { diagnosticLabel } from '../../domain/diagnostics/diagnostic-vocabulary.js';
import { subjectColorOf } from '../../domain/subjects/subject-color.js';
import { Icon } from '../primitives/icon.js';
import { render } from 'preact-render-to-string';

const signed = (value: number | null | undefined) =>
  value == null ? '—' : `${value > 0 ? '+' : ''}${formatDecimal(value)} p.p.`;
const trend = (value: number | null | undefined) =>
  value == null
    ? diagnosticLabel('trend', 'insufficient')
    : value > 1
      ? diagnosticLabel('trend', 'improving')
      : value < -1
        ? diagnosticLabel('trend', 'worsening')
        : diagnosticLabel('trend', 'stable');

export function renderSubjectTargetEditor({
  rows = [],
  globalTarget = 80,
  globalWeeklyQuestions = 0,
  blueprint = {},
  weeklyGoalsBySubject = new Map(),
  draftAccuracy = new Map(),
  draftWeeklyGoals = new Map(),
  splitPreview = null,
}: any) {
  const configs = new Map<string, any>(
    (blueprint.subjects || []).map((item: any) => [item.subjectId, item])
  );
  if (!rows.length)
    return '<p class="empty-state empty-state--compact">Cadastre disciplinas no concurso ativo para configurar metas de acerto e de questões semanais.</p>';

  const subjectList = rows.map((r: any) => ({ id: r.subjectId }));
  const weeklyMap =
    weeklyGoalsBySubject instanceof Map ? weeklyGoalsBySubject : new Map<string, any>();
  const accDraftMap = draftAccuracy instanceof Map ? draftAccuracy : new Map<string, string>();
  const wkDraftMap = draftWeeklyGoals instanceof Map ? draftWeeklyGoals : new Map<string, string>();

  let sumWeekly = 0;
  for (const row of rows) {
    const draftVal = wkDraftMap.has(row.subjectId)
      ? wkDraftMap.get(row.subjectId)
      : weeklyMap.get(row.subjectId)?.meta;
    const numeric = Number(draftVal);
    if (Number.isFinite(numeric) && numeric > 0) sumWeekly += numeric;
  }

  const globalQuestions = Number(globalWeeklyQuestions) || 0;
  const hasDirty = accDraftMap.size > 0 || wkDraftMap.size > 0;
  const splitDiff = sumWeekly - globalQuestions;
  const needsSplit = globalQuestions > 0 && sumWeekly > 0 && splitDiff !== 0 && !hasDirty;

  return render(
    <div class="subject-target-editor">
      <p class="analytics-note">
        Acerto atual e tendência usam os últimos 30 dias, com pelo menos 10 questões por período.
      </p>
      {splitPreview ? (
        <section class="subject-target-split" aria-labelledby="questionSplitTitle">
          <h4 id="questionSplitTitle">Prévia: repartir {globalQuestions} questões por semana</h4>
          <ul>
            {splitPreview.map((item: any) => (
              <li key={item.id}>
                <span class="break-words">{item.name}</span>{' '}
                <span class="metadata-text">
                  {item.before} → {item.after}
                </span>
              </li>
            ))}
          </ul>
          <p class="metadata-text">
            Proporcional às metas atuais. Nada é gravado até você confirmar; depois dá para
            desfazer.
          </p>
          <div class="action-group">
            <button type="button" class="btn small" data-questions-split-confirm>
              Confirmar repartição
            </button>
            <button type="button" class="btn ghost small" data-questions-split-cancel>
              Cancelar
            </button>
          </div>
        </section>
      ) : needsSplit ? (
        <p class="subject-target-split" role="status">
          As metas por disciplina somam {sumWeekly} questões por semana; a meta global é{' '}
          {globalQuestions} ({splitDiff > 0 ? 'passam' : 'faltam'} {Math.abs(splitDiff)}).{' '}
          <button type="button" class="btn ghost small" data-questions-split-preview>
            Repartir a meta global entre as disciplinas
          </button>
        </p>
      ) : null}
      <details>
        <summary>Editar metas de acerto em lote</summary>
        <div class="subject-target-bulk">
          <label>
            <input type="checkbox" data-accuracy-select-all /> Selecionar disciplinas
          </label>
          <label>
            Acerto em lote{' '}
            <input
              type="number"
              min="0"
              max="100"
              step="1"
              data-accuracy-bulk-value
              value={globalTarget}
            />
            %
          </label>
          <button type="button" class="btn small" data-accuracy-apply>
            Aplicar às selecionadas
          </button>
          <button type="button" class="btn ghost small" data-accuracy-restore-selected>
            Restaurar global nas selecionadas
          </button>
        </div>
      </details>
      <div class="subject-target-pending-bar" data-targets-pending-bar hidden={!hasDirty}>
        <span class="metadata-text">Alterações pendentes nas metas por disciplina</span>
        <div class="action-group">
          <button type="button" class="btn small" data-targets-save-all>
            Salvar alterações
          </button>
          <button type="button" class="btn ghost small" data-targets-discard>
            Descartar
          </button>
        </div>
      </div>
      <div
        class="performance-table-scroll subject-target-table-wrap"
        role="region"
        aria-label="Metas por disciplina"
        tabIndex={0}
      >
        <table>
          <caption>
            {globalQuestions > 0
              ? `Meta global: ${globalTarget}% de acerto · ${globalQuestions} questões/semana.`
              : `Meta global: ${globalTarget}% de acerto, sem meta global de questões: vale a soma das disciplinas.`}{' '}
            Soma das metas por disciplina: {sumWeekly} questões/semana.
          </caption>
          <thead>
            <tr>
              <th scope="col">Disciplina</th>
              <th scope="col">Acerto atual</th>
              <th scope="col">Diferença vs. meta</th>
              <th scope="col">Tendência</th>
              <th scope="col">Metas</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row: any) => {
              const id = row.subjectId;
              const custom = configs.get(id)?.accuracyTarget;
              const weekly = weeklyMap.get(id);
              const weeklySolved = Number(weekly?.solved) || 0;
              const weeklyMeta = weekly?.meta;
              return (
                <tr key={id}>
                  <td data-label="Disciplina">
                    <label class="flex items-center gap-2">
                      <input
                        type="checkbox"
                        data-accuracy-select
                        value={id}
                        aria-label={`Selecionar ${row.name}`}
                      />
                      <span
                        class={`w-2 h-2 rounded-full inline-block flex-shrink-0 subject-bg-${subjectColorOf({ id }, subjectList)}`}
                        aria-hidden="true"
                      />
                      <strong class="break-words">{row.name}</strong>
                    </label>
                  </td>
                  <td data-label="Acerto atual">
                    {row.state === 'insufficient'
                      ? 'Dados insuficientes'
                      : `${formatDecimal(row.accuracy)}%`}
                  </td>
                  <td data-label="Diferença vs. meta">{signed(row.gap)}</td>
                  <td data-label="Tendência">{trend(row.evolution)}</td>
                  <td data-label="Metas">
                    <details>
                      <summary aria-label={`Editar metas de ${row.name}`}>
                        Editar · {custom ?? globalTarget}% de acerto ·{' '}
                        {weeklyMeta > 0
                          ? `${weeklySolved}/${weeklyMeta} questões`
                          : 'sem meta de questões'}
                      </summary>
                      <div class="subject-target-cell">
                        <label>
                          Meta de acerto (%){' '}
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="1"
                            data-accuracy-value={id}
                            value={accDraftMap.get(id) ?? custom ?? ''}
                            placeholder={String(globalTarget)}
                            aria-label={`Meta de acerto de ${row.name}`}
                          />
                        </label>
                        <button type="button" class="btn ghost small" data-accuracy-save={id}>
                          Salvar acerto
                        </button>
                        <button
                          type="button"
                          class="btn ghost small"
                          data-accuracy-restore={id}
                          disabled={custom == null}
                        >
                          Restaurar global
                        </button>
                      </div>
                      <div class="subject-target-cell">
                        <label>
                          Questões por semana{' '}
                          <input
                            type="number"
                            min="0"
                            step="1"
                            data-weekly-goal-value={id}
                            value={wkDraftMap.get(id) ?? weeklyMeta ?? ''}
                            aria-label={`Meta semanal de questões de ${row.name}`}
                          />
                        </label>
                        <button type="button" class="btn ghost small" data-weekly-goal-save>
                          Salvar questões
                        </button>
                        {weeklyMeta > 0 && (
                          <button
                            type="button"
                            class="icon-btn"
                            data-weekly-goal-remove={id}
                            aria-label={`Remover meta de questões de ${row.name}`}
                          >
                            <Icon name="x" size={14} />
                          </button>
                        )}
                      </div>
                    </details>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
