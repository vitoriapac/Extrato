import type { JSX } from 'preact';
import { formatDecimal } from '../../../core/format-number.js';
import { Icon } from '../../primitives/icon.js';
import { buildSimulationBreakdownVisual } from '../../../domain/practice/practice-visual-models.js';
import { SimulationBreakdownBarChart } from '../../primitives/charts/SimulationBreakdownBarChart.js';
import { subjectColorOf } from '../../../domain/subjects/subject-color.js';
import { scorePercent, type PaceAndGuess } from '../../../domain/exams/simulation-score.js';

export interface SimulationBreakdownItem {
  id: string;
  subjectId?: string | null;
  correct: number;
  total: number;
  wrong?: number | null;
}

export interface SimulationItem {
  id: string;
  date?: string;
  nome?: string;
  correct: number;
  total: number;
  wrong?: number | null;
  scoring?: 'padrao' | 'certo-errado';
  breakdown?: SimulationBreakdownItem[];
}

export interface SimulationViewModel {
  date: string;
  name: string;
  correct: number;
  total: number;
  score: number;
  scoring?: 'certo-errado';
  blank?: number;
  belowMinimum?: Array<{ subjectId: string; name: string; score: number; minimum: number }>;
  pace?: PaceAndGuess;
}

const CERTO_ERRADO_HINT =
  'Certo ou errado: cada erro anula um acerto e a questão em branco vale zero.';

/** "2,4 min por questão · chutes +3 p.p." — só o que foi registrado. */
export function paceSummary(pace?: PaceAndGuess): string {
  if (!pace) return '';
  const parts: string[] = [];
  if (pace.minutesPerQuestion != null)
    parts.push(
      `${formatDecimal(pace.minutesPerQuestion)} min por questão${
        pace.examMinutesPerQuestion != null
          ? ` (prova: ${formatDecimal(pace.examMinutesPerQuestion)})`
          : ''
      }`
    );
  if (pace.guessGain != null) {
    const gain = Math.round(pace.guessGain * 10) / 10;
    parts.push(
      `${pace.guessedCorrect} de ${pace.guessed} chutes certos (${gain > 0 ? '+' : ''}${formatDecimal(gain)} p.p.)`
    );
  }
  return parts.join(' · ');
}

function MinimumBadge({ misses }: { misses?: SimulationViewModel['belowMinimum'] }) {
  if (!misses?.length) return null;
  return (
    <span
      class="status-badge status-badge--danger"
      title={misses
        .map(m => `${m.name}: ${formatDecimal(m.score)}% (mínimo ${formatDecimal(m.minimum)}%)`)
        .join(' · ')}
    >
      Abaixo do mínimo em {misses.length === 1 ? misses[0].name : `${misses.length} disciplinas`}
    </span>
  );
}

export interface SimulationLogTableProps {
  simulations: SimulationItem[];
  editingId?: string | null;
  draft?: any;
  openBreakdownIds: Set<string>;
  isMobile?: boolean;
  getViewModel: (sim: SimulationItem) => SimulationViewModel;
  getSubjectOptionsHtml: (selectedSubjectId?: string | null) => string;
  subjects?: any[];
  footerHtml?: string;
}

export function SimulationLogTable({
  simulations,
  editingId,
  draft,
  openBreakdownIds,
  isMobile = false,
  getViewModel,
  getSubjectOptionsHtml,
  subjects = [],
  footerHtml = '',
}: SimulationLogTableProps): JSX.Element {
  if (simulations.length === 0) {
    return (
      <tr>
        <td colSpan={7}>
          <div class="empty-state" style={{ border: 'none' }}>
            <p class="font-medium text-content-primary m-0">Nenhum simulado registrado ainda.</p>
            <p class="text-xs text-content-secondary max-w-md mx-auto leading-relaxed mt-1 mb-1">
              Use "Registrar simulado", acima, para registrar simulados completos ou parciais e
              alimentar a curva de tendência de pontuação de 30 dias e diagnósticos pós-simulado.
            </p>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <>
      {simulations.map(sim => {
        const isEditing = editingId === sim.id;

        if (isEditing && draft) {
          const hasBreakdown = Boolean(draft.breakdown?.length);
          const certoErrado = draft.scoring === 'certo-errado';
          return (
            <tr key={sim.id} class="row-editing" data-id={sim.id}>
              <td colSpan={7}>
                <div class="inline-edit-form">
                  <label>
                    Data
                    <input
                      type="date"
                      value={draft.date || ''}
                      data-delegated-change="updateSimulationDraft('date',this.value)"
                    />
                  </label>
                  <label>
                    Nome
                    <input
                      type="text"
                      value={draft.nome || ''}
                      data-delegated-input="updateSimulationDraft('nome',this.value)"
                    />
                  </label>
                  <label>
                    Acertos
                    <input
                      type="number"
                      min="0"
                      value={Number(draft.correct) || 0}
                      disabled={hasBreakdown}
                      data-delegated-input="updateSimulationDraft('correct',this.value)"
                    />
                  </label>
                  {certoErrado && (
                    <label>
                      Erradas
                      <input
                        type="number"
                        min="0"
                        value={draft.wrong ?? ''}
                        placeholder="Nenhuma em branco"
                        disabled={hasBreakdown}
                        data-delegated-input="updateSimulationDraft('wrong',this.value)"
                      />
                    </label>
                  )}
                  <label>
                    Total
                    <input
                      type="number"
                      min="0"
                      value={Number(draft.total) || 0}
                      disabled={hasBreakdown}
                      data-delegated-input="updateSimulationDraft('total',this.value)"
                    />
                  </label>
                  <label>
                    Tempo (min)
                    <input
                      type="number"
                      min="0"
                      value={draft.durationMinutes ?? ''}
                      placeholder="Opcional"
                      data-delegated-input="updateSimulationDraft('durationMinutes',this.value)"
                    />
                  </label>
                  <label title="Questões que você marcou sem saber, para medir se o chute compensa.">
                    Chutes
                    <input
                      type="number"
                      min="0"
                      value={draft.guessed ?? ''}
                      placeholder="Opcional"
                      data-delegated-input="updateSimulationDraft('guessed',this.value)"
                    />
                  </label>
                  <label>
                    Chutes certos
                    <input
                      type="number"
                      min="0"
                      value={draft.guessedCorrect ?? ''}
                      placeholder="Opcional"
                      data-delegated-input="updateSimulationDraft('guessedCorrect',this.value)"
                    />
                  </label>
                  <label title={CERTO_ERRADO_HINT}>
                    <input
                      type="checkbox"
                      checked={certoErrado}
                      data-delegated-change="updateSimulationDraft('scoring',this.checked)"
                    />{' '}
                    Certo ou errado (um erro anula um acerto)
                  </label>
                  <div class="inline-edit-actions">
                    <button
                      type="button"
                      class="btn ghost small"
                      data-delegated-click="cancelSimulationEdit()"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      class="btn small"
                      data-delegated-click="saveSimulationEdit()"
                    >
                      Salvar alterações
                    </button>
                    <button
                      type="button"
                      class="btn ghost small"
                      data-delegated-click={`deleteSimuladoRow('${sim.id}')`}
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              </td>
            </tr>
          );
        }

        const vm = getViewModel(sim);
        const expanded = openBreakdownIds.has(sim.id);
        const hasBreakdown = Boolean(sim.breakdown?.length);

        const detailsBtn = (
          <button
            type="button"
            class={`btn ghost small ${hasBreakdown ? 'has-notes' : ''}`}
            aria-expanded={expanded}
            aria-label={`${expanded ? 'Ocultar detalhes' : 'Ver desempenho'}: ${vm.name}, ${vm.date}`}
            data-delegated-click={`toggleBreakdown('${sim.id}')`}
          >
            {expanded ? 'Ocultar detalhes' : 'Ver desempenho'}
          </button>
        );

        return (
          <>
            {isMobile ? (
              <tr key={sim.id} class="mobile-history-row" data-id={sim.id}>
                <td colSpan={7}>
                  <article class="mobile-history-card">
                    <div class="mobile-card-head">
                      <div>
                        <div class="mobile-card-date">{vm.date}</div>
                        <div class="mobile-card-title">{vm.name}</div>
                      </div>
                      <button
                        type="button"
                        class="btn ghost small"
                        data-delegated-click={`editSimulation('${sim.id}')`}
                        aria-label={`Editar simulado: ${vm.name}, ${vm.date}`}
                      >
                        Editar
                      </button>
                    </div>
                    <div class="mobile-card-metrics">
                      <span>
                        {vm.correct} / {vm.total}
                      </span>
                      <strong title={vm.scoring ? CERTO_ERRADO_HINT : undefined}>
                        {vm.scoring ? 'Nota líquida' : 'Nota'} {formatDecimal(vm.score)}%
                      </strong>
                      <MinimumBadge misses={vm.belowMinimum} />
                      {paceSummary(vm.pace) && (
                        <small class="metadata-text">{paceSummary(vm.pace)}</small>
                      )}
                      {detailsBtn}
                    </div>
                  </article>
                </td>
              </tr>
            ) : (
              <tr key={sim.id} class="history-read-row history-desktop-row" data-id={sim.id}>
                <td>{vm.date}</td>
                <td>
                  <div class="row-primary">{vm.name}</div>
                  {paceSummary(vm.pace) && (
                    <small class="metadata-text block">{paceSummary(vm.pace)}</small>
                  )}
                  <MinimumBadge misses={vm.belowMinimum} />
                </td>
                <td class="number-cell">{vm.correct}</td>
                <td class="number-cell">{vm.total}</td>
                <td class="number-cell" title={vm.scoring ? CERTO_ERRADO_HINT : undefined}>
                  {formatDecimal(vm.score)}%
                  {vm.scoring && (
                    <small class="metadata-text block">
                      líquida{vm.blank ? ` · ${vm.blank} em branco` : ''}
                    </small>
                  )}
                </td>
                <td>{detailsBtn}</td>
                <td>
                  <button
                    type="button"
                    class="btn ghost small"
                    data-delegated-click={`editSimulation('${sim.id}')`}
                    aria-label={`Editar simulado: ${vm.name}, ${vm.date}`}
                  >
                    Editar
                  </button>
                </td>
              </tr>
            )}

            {expanded && (
              <tr key={`${sim.id}-breakdown`} class="breakdown-row">
                <td colSpan={7}>
                  <div class="breakdown-box">
                    <strong class="breakdown-title">Desempenho por disciplina</strong>
                    {sim.breakdown && sim.breakdown.length > 0 && (
                      <SimulationBreakdownBarChart
                        visual={buildSimulationBreakdownVisual({
                          breakdownItems: sim.breakdown,
                          subjects: subjects || [],
                          overallScore: vm.score,
                          scoring: sim.scoring,
                        })}
                        className="mb-3"
                      />
                    )}
                    {!hasBreakdown && <p>Nenhuma disciplina registrada neste simulado.</p>}
                    <details class="simulation-breakdown-edit">
                      <summary>Editar disciplinas</summary>
                      <p>As alterações são salvas automaticamente.</p>
                      <div class="breakdown-list">
                        {(sim.breakdown || []).map(row => {
                          const total = Number(row.total) || 0;
                          const correct = Number(row.correct) || 0;
                          const accuracy = total
                            ? Math.round(scorePercent(row, sim.scoring))
                            : null;
                          const miss = vm.belowMinimum?.find(m => m.subjectId === row.subjectId);
                          const colorSlot = subjectColorOf(
                            { id: row.subjectId || '' },
                            subjects || []
                          );

                          return (
                            <div
                              key={row.id}
                              class={`breakdown-line${sim.scoring === 'certo-errado' ? ' breakdown-line--net' : ''}`}
                            >
                              <label class="breakdown-subject">
                                <span class="flex items-center gap-2">
                                  <span
                                    class={`w-2 h-2 rounded-full inline-block flex-shrink-0 subject-bg-${colorSlot}`}
                                    aria-hidden="true"
                                  />
                                  Disciplina
                                </span>
                                <select
                                  class="select-control"
                                  data-delegated-change={`updateBreakdownRow('${sim.id}','${row.id}','subjectId',this.value)`}
                                  dangerouslySetInnerHTML={{
                                    __html: `<option value="">Selecione</option>${getSubjectOptionsHtml(row.subjectId)}`,
                                  }}
                                />
                              </label>
                              <label>
                                <span>Acertos</span>
                                <input
                                  type="number"
                                  min="0"
                                  max={total || 999}
                                  value={correct}
                                  placeholder="0"
                                  data-delegated-blur={`updateBreakdownRow('${sim.id}','${row.id}','correct',this.value)`}
                                />
                              </label>
                              {sim.scoring === 'certo-errado' && (
                                <label>
                                  <span>Erradas</span>
                                  <input
                                    type="number"
                                    min="0"
                                    value={row.wrong ?? ''}
                                    placeholder={String(Math.max(0, total - correct))}
                                    aria-label="Erradas (vazio: nenhuma em branco)"
                                    data-delegated-blur={`updateBreakdownRow('${sim.id}','${row.id}','wrong',this.value)`}
                                  />
                                </label>
                              )}
                              <label>
                                <span>Questões</span>
                                <input
                                  type="number"
                                  min="0"
                                  value={total}
                                  placeholder="0"
                                  data-delegated-blur={`updateBreakdownRow('${sim.id}','${row.id}','total',this.value)`}
                                />
                              </label>
                              <div class="breakdown-result">
                                <span>
                                  {sim.scoring === 'certo-errado'
                                    ? 'Nota líquida'
                                    : 'Aproveitamento'}
                                </span>
                                <strong>{accuracy == null ? '—' : `${accuracy}%`}</strong>
                                {miss && (
                                  <small class="status-badge status-badge--danger whitespace-nowrap justify-self-start">
                                    mín. {formatDecimal(miss.minimum)}%
                                  </small>
                                )}
                              </div>
                              <button
                                type="button"
                                class="icon-btn"
                                aria-label="Excluir disciplina do simulado"
                                data-delegated-click={`deleteBreakdownRow('${sim.id}','${row.id}')`}
                              >
                                <Icon name="x" size={14} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                      <div class="flex items-center gap-2 mt-2">
                        <button
                          type="button"
                          class="btn ghost small breakdown-add-btn"
                          data-delegated-click={`addBreakdownRow('${sim.id}')`}
                        >
                          + Adicionar disciplina
                        </button>
                      </div>
                    </details>
                    <div class="flex items-center gap-2 mt-2">
                      <button
                        type="button"
                        class="btn small breakdown-remediation-btn inline-flex items-center gap-1"
                        data-delegated-click={`openSimulatedRemediation('${sim.id}')`}
                        aria-label={`Abrir Raio-X e Plano de Remediação para ${vm.name}`}
                      >
                        <Icon name="bolt" size={14} class="shrink-0" />
                        <span>Raio-X &amp; Remediação</span>
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            )}
          </>
        );
      })}

      {footerHtml && <tr dangerouslySetInnerHTML={{ __html: footerHtml }} />}
    </>
  );
}
