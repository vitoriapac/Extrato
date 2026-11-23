import { formatDecimal } from '../../core/format-number.js';
import { diagnosticLabel } from '../../domain/diagnostics/diagnostic-vocabulary.js';
import { subjectColorOf } from '../../domain/subjects/subject-color.js';
import { BulletBar } from '../primitives/charts/charts.js';
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
  drafts = new Map(),
  masteryGlobal = 80,
  sort = { key: 'edital', dir: 'asc' },
  splitPreview = null,
  openRows = new Set<string>(),
  showAllRows = false,
}: any) {
  const configs = new Map<string, any>(
    (blueprint.subjects || []).map((item: any) => [item.subjectId, item])
  );
  if (!rows.length)
    return '<p class="empty-state empty-state--compact">Cadastre disciplinas no concurso ativo para configurar metas de acerto e de questões semanais.</p>';

  const subjectList = rows.map((r: any) => ({ id: r.subjectId }));
  const weeklyMap =
    weeklyGoalsBySubject instanceof Map ? weeklyGoalsBySubject : new Map<string, any>();
  const draftMap: Map<string, Record<string, string>> = drafts instanceof Map ? drafts : new Map();
  const draftOf = (id: string, field: string): string | undefined => draftMap.get(id)?.[field];

  let sumWeekly = 0;
  for (const row of rows) {
    const draftVal =
      draftOf(row.subjectId, 'weekly') !== undefined
        ? draftOf(row.subjectId, 'weekly')
        : weeklyMap.get(row.subjectId)?.meta;
    const numeric = Number(draftVal);
    if (Number.isFinite(numeric) && numeric > 0) sumWeekly += numeric;
  }

  const globalQuestions = Number(globalWeeklyQuestions) || 0;
  const hasDirty = draftMap.size > 0;
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
      <details class="subject-target-bulk-fold">
        <summary>Aplicar a várias disciplinas</summary>
        <div class="subject-target-bulk">
          <label>
            <input type="checkbox" data-row-select-all /> Selecionar disciplinas
          </label>
          <label>
            Prioridade
            <select data-bulk-field="priority">
              <option value="">Manter</option>
              <option value="normal">Normal</option>
              <option value="high">Alta</option>
              <option value="low">Baixa</option>
            </select>
          </label>
          <label>
            Peso
            <input
              type="number"
              min="0.1"
              step="0.1"
              data-bulk-field="weight"
              placeholder="Manter"
            />
          </label>
          <label>
            Meta de acerto (%)
            <input
              type="number"
              min="0"
              max="100"
              step="1"
              data-bulk-field="accuracy"
              placeholder="Manter"
            />
          </label>
          <label>
            Questões por semana
            <input type="number" min="0" step="1" data-bulk-field="weekly" placeholder="Manter" />
          </label>
          <button type="button" class="btn small" data-bulk-apply>
            Aplicar às selecionadas
          </button>
          <button type="button" class="btn ghost small" data-bulk-use-global>
            Usar a meta geral de acerto nas selecionadas
          </button>
        </div>
        <p class="metadata-text">
          A seleção só preenche as linhas; nada é gravado até você clicar em Salvar alterações.
        </p>
      </details>
      <div
        class="performance-table-scroll subject-target-table-wrap"
        role="region"
        aria-label="Metas por disciplina"
        tabIndex={0}
      >
        <table class="subject-target-table">
          <caption>
            {globalQuestions > 0
              ? `Meta geral: ${globalTarget}% de acerto · ${globalQuestions} questões/semana.`
              : `Meta geral: ${globalTarget}% de acerto, sem meta geral de questões: vale a soma das disciplinas.`}{' '}
            Soma das metas por disciplina: {sumWeekly} questões/semana.
          </caption>
          <thead>
            <tr>
              <th scope="col">
                <span class="sr-only">Selecionar</span>
              </th>
              {HEADERS.map(col => (
                <th
                  scope="col"
                  class={col.advanced ? 'col-advanced' : undefined}
                  aria-sort={
                    sort.key === col.key
                      ? sort.dir === 'desc'
                        ? 'descending'
                        : 'ascending'
                      : 'none'
                  }
                >
                  {col.sortable ? (
                    <button type="button" class="sort-button" data-sort={col.key}>
                      {col.label}
                    </button>
                  ) : (
                    col.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row: any, rowIndex: number) => {
              const id = row.subjectId;
              const config = configs.get(id) || {};
              const weekly = weeklyMap.get(id);
              const weeklySolved = Number(weekly?.solved) || 0;
              const weeklyMeta = weekly?.meta;
              const value = (field: string, saved: unknown): string | number => {
                const draft = draftOf(id, field);
                return draft !== undefined
                  ? draft
                  : ((saved as string | number | null | undefined) ?? '');
              };
              const goal = draftOf(id, 'accuracy');
              const effectiveGoal =
                goal !== undefined
                  ? goal === ''
                    ? globalTarget
                    : Number(goal)
                  : (config.accuracyTarget ?? globalTarget);
              return (
                <tr
                  key={id}
                  class={
                    [
                      draftMap.has(id) ? 'is-dirty' : '',
                      openRows.has(id) ? 'is-open' : '',
                      !showAllRows && rowIndex >= MOBILE_ROWS ? 'is-extra' : '',
                    ]
                      .filter(Boolean)
                      .join(' ') || undefined
                  }
                >
                  <td data-label="Selecionar">
                    <label class="subject-target-select">
                      <input
                        type="checkbox"
                        data-row-select
                        value={id}
                        aria-label={`Selecionar ${row.name}`}
                      />
                    </label>
                  </td>
                  <th scope="row" data-label="Disciplina" class="subject-target-name">
                    <span
                      class={`w-2 h-2 rounded-full inline-block flex-shrink-0 subject-bg-${subjectColorOf({ id }, subjectList)}`}
                      aria-hidden="true"
                    />{' '}
                    <strong class="break-words">{row.name}</strong>
                    <button
                      type="button"
                      class="btn ghost small subject-target-more"
                      data-row-toggle={id}
                      aria-expanded={openRows.has(id) ? 'true' : 'false'}
                      aria-label={`${openRows.has(id) ? 'Menos' : 'Mais'} campos de ${row.name}`}
                    >
                      {openRows.has(id) ? 'Menos campos' : 'Mais campos'}
                    </button>
                  </th>
                  <td data-label="Prioridade">
                    <select
                      data-field="priority"
                      data-subject={id}
                      aria-label={`Prioridade de ${row.name}`}
                    >
                      {[
                        ['normal', 'Normal'],
                        ['high', 'Alta'],
                        ['low', 'Baixa'],
                      ].map(([key, label]) => (
                        <option
                          value={key}
                          selected={value('priority', config.priority || 'normal') === key}
                        >
                          {label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td data-label="Peso">
                    <input
                      type="number"
                      min="0.1"
                      step="0.1"
                      data-field="weight"
                      data-subject={id}
                      value={value('weight', config.questionWeight)}
                      placeholder="1"
                      aria-label={`Peso por questão de ${row.name}`}
                    />
                  </td>
                  <td data-label="Questões na prova">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      data-field="expected"
                      data-subject={id}
                      value={value(
                        'expected',
                        config.expectedQuestions > 0 ? config.expectedQuestions : ''
                      )}
                      placeholder="—"
                      aria-label={`Questões esperadas na prova de ${row.name}`}
                    />
                  </td>
                  <td data-label="Meta de acerto">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      data-field="accuracy"
                      data-subject={id}
                      value={value('accuracy', config.accuracyTarget)}
                      placeholder={String(globalTarget)}
                      aria-label={`Meta de acerto de ${row.name}`}
                    />
                  </td>
                  <td data-label="Acerto atual" class="subject-target-now">
                    {row.state === 'insufficient' ? (
                      <span class="metadata-text">Dados insuficientes</span>
                    ) : (
                      <>
                        <BulletBar
                          value={Number(row.accuracy)}
                          target={Number(effectiveGoal)}
                          label={`Acerto atual de ${row.name}`}
                        />
                        <small class="metadata-text">
                          {signed(row.gap)} · {trend(row.evolution)}
                        </small>
                      </>
                    )}
                  </td>
                  <td data-label="Questões por semana">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      data-field="weekly"
                      data-subject={id}
                      value={value('weekly', weeklyMeta > 0 ? weeklyMeta : '')}
                      aria-label={`Meta semanal de questões de ${row.name}`}
                    />
                    {weeklyMeta > 0 && (
                      <small class="metadata-text">
                        {weeklySolved}/{weeklyMeta} nesta semana
                      </small>
                    )}
                  </td>
                  <td data-label="Meta de domínio" class="col-advanced">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      data-field="mastery"
                      data-subject={id}
                      value={value('mastery', config.masteryTarget)}
                      placeholder={String(masteryGlobal)}
                      aria-label={`Meta de domínio de ${row.name}`}
                    />
                  </td>
                  <td data-label="Mínimo eliminatório">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      data-field="minimum"
                      data-subject={id}
                      value={value('minimum', config.minScore)}
                      placeholder="—"
                      aria-label={`Nota mínima eliminatória de ${row.name}, em %`}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {rows.length > MOBILE_ROWS && (
          <button type="button" class="btn ghost small subject-target-showall" data-rows-showall>
            {showAllRows
              ? 'Mostrar só as primeiras'
              : `Mostrar todas as ${rows.length} disciplinas`}
          </button>
        )}
      </div>
      <div class="subject-target-footer" data-targets-pending-bar hidden={!hasDirty}>
        <span class="metadata-text" role="status">
          Alterações não salvas nas disciplinas
        </span>
        <div class="action-group">
          <button type="button" class="btn small" data-targets-save-all>
            Salvar alterações
          </button>
          <button type="button" class="btn ghost small" data-targets-discard>
            Descartar
          </button>
        </div>
      </div>
    </div>
  );
}

// No celular, só as primeiras disciplinas aparecem até pedir "Mostrar todas".
const MOBILE_ROWS = 6;
const HEADERS: Array<{ key: string; label: string; sortable?: boolean; advanced?: boolean }> = [
  { key: 'edital', label: 'Disciplina', sortable: true },
  { key: 'priority', label: 'Prioridade', sortable: true },
  { key: 'weight', label: 'Peso', sortable: true },
  { key: 'expected', label: 'Questões na prova', sortable: true },
  { key: 'accuracyGoal', label: 'Meta de acerto' },
  { key: 'accuracy', label: 'Acerto atual', sortable: true },
  { key: 'weekly', label: 'Questões por semana', sortable: true },
  { key: 'mastery', label: 'Meta de domínio', advanced: true },
  { key: 'minimum', label: 'Mínimo eliminatório (%)' },
];
