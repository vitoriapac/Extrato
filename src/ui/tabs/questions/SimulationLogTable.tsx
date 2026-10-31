import type { JSX } from 'preact';
import { formatDecimal } from '../../../core/format-number.js';
import { Icon } from '../../primitives/icon.js';

export interface SimulationBreakdownItem {
  id: string;
  subjectId?: string | null;
  correct: number;
  total: number;
}

export interface SimulationItem {
  id: string;
  date?: string;
  nome?: string;
  correct: number;
  total: number;
  breakdown?: SimulationBreakdownItem[];
}

export interface SimulationViewModel {
  date: string;
  name: string;
  correct: number;
  total: number;
  score: number;
}

export interface SimulationLogTableProps {
  simulations: SimulationItem[];
  visibleLimit: number;
  editingId?: string | null;
  draft?: any;
  openBreakdownIds: Set<string>;
  isMobile?: boolean;
  getViewModel: (sim: SimulationItem) => SimulationViewModel;
  getSubjectOptionsHtml: (selectedSubjectId?: string | null) => string;
  footerHtml?: string;
}

export function SimulationLogTable({
  simulations,
  visibleLimit,
  editingId,
  draft,
  openBreakdownIds,
  isMobile = false,
  getViewModel,
  getSubjectOptionsHtml,
  footerHtml = '',
}: SimulationLogTableProps): JSX.Element {
  if (simulations.length === 0) {
    return (
      <tr>
        <td colSpan={7}>
          <div class="empty-state" style={{ border: 'none' }}>
            <p>Nenhum simulado registrado ainda.</p>
            <button type="button" class="btn ghost small" data-delegated-click="addSimuladoRow()">
              + Registrar simulado
            </button>
          </div>
        </td>
      </tr>
    );
  }

  const visibleSims = simulations.slice(0, visibleLimit);

  return (
    <>
      {visibleSims.map(sim => {
        const isEditing = editingId === sim.id;

        if (isEditing && draft) {
          const hasBreakdown = Boolean(draft.breakdown?.length);
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
                      >
                        Editar
                      </button>
                    </div>
                    <div class="mobile-card-metrics">
                      <span>
                        {vm.correct} / {vm.total}
                      </span>
                      <strong>Nota {formatDecimal(vm.score)}%</strong>
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
                </td>
                <td class="number-cell">{vm.correct}</td>
                <td class="number-cell">{vm.total}</td>
                <td class="number-cell">{formatDecimal(vm.score)}%</td>
                <td>{detailsBtn}</td>
                <td>
                  <button
                    type="button"
                    class="btn ghost small"
                    data-delegated-click={`editSimulation('${sim.id}')`}
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
                    <div class="breakdown-list">
                      {(sim.breakdown || []).map(row => {
                        const total = Number(row.total) || 0;
                        const correct = Number(row.correct) || 0;
                        const accuracy = total ? Math.round((correct / total) * 100) : null;

                        return (
                          <div key={row.id} class="breakdown-line">
                            <label class="breakdown-subject">
                              <span>Disciplina</span>
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
                              <span>Aproveitamento</span>
                              <strong>{accuracy == null ? '—' : `${accuracy}%`}</strong>
                            </div>
                            <button
                              type="button"
                              class="icon-btn"
                              aria-label="Excluir disciplina do simulado"
                              data-delegated-click={`deleteBreakdownRow('${sim.id}','${row.id}')`}
                            >
                              ✕
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
