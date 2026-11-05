import { buildPlanImpactAlignmentVisual } from '../../domain/planning/planning-visual-models.js';
import { renderIconSvg } from '../primitives/icon.js';

export function renderPlanImpactAlignment(
  model: Record<string, any>,
  { escapeHtml = (s: string) => s, subjects = [] }: { escapeHtml?: (s: string) => string; subjects?: any[] } = {}
): string {
  if (model.state !== 'ready' || !model.rows || model.rows.length === 0) {
    return `<div class="ui-state--empty">${escapeHtml(model.reason || 'Nenhuma disciplina com plano e impacto cadastrados.')}</div>`;
  }

  const subjectsList = subjects && subjects.length > 0
    ? subjects
    : model.rows.map((r: any) => ({ id: r.subjectId, name: r.name }));

  const visual = buildPlanImpactAlignmentVisual({
    alignmentRows: model.rows,
    subjects: subjectsList,
  });

  const checkIcon = renderIconSvg('check', { size: 12, stroke: 2.5 });
  const alertIcon = renderIconSvg('alert-triangle', { size: 12, stroke: 2.5 });
  const trendingIcon = renderIconSvg('trending-up', { size: 12, stroke: 2.5 });

  const rowsHtml = visual.rows.map(row => {
    let statusBadge = '';
    if (row.alignmentStatus === 'underallocated') {
      statusBadge = `<span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium text-warning-emphasis bg-warning-subtle" title="Menos tempo planejado do que o peso proporcional no edital">${alertIcon} Subalocada (${row.gapShare}% p.p.)</span>`;
    } else if (row.alignmentStatus === 'overallocated') {
      statusBadge = `<span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium text-accent-emphasis bg-accent-subtle" title="Mais tempo planejado do que o peso proporcional no edital">${trendingIcon} Sobrealocada (+${row.gapShare}% p.p.)</span>`;
    } else {
      statusBadge = `<span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium text-success-emphasis bg-success-subtle">${checkIcon} Alinhada</span>`;
    }

    const maxShare = Math.max(1, row.plannedShare, row.impactShare);
    const plannedPct = Math.min(100, (row.plannedShare / Math.max(50, maxShare)) * 100);
    const impactPct = Math.min(100, (row.impactShare / Math.max(50, maxShare)) * 100);

    return `
      <div class="p-2.5 rounded-lg border border-border-subtle bg-surface-elevated/40 space-y-2">
        <div class="flex items-center justify-between gap-2 text-xs">
          <div class="flex items-center gap-2 min-w-0">
            <span class="w-2.5 h-2.5 rounded-full flex-shrink-0 subject-bg-${row.colorSlot}" aria-hidden="true"></span>
            <span class="font-medium text-content-primary truncate">${escapeHtml(row.name)}</span>
          </div>
          <div class="flex items-center gap-2 flex-shrink-0">
            ${statusBadge}
          </div>
        </div>

        <div class="space-y-1.5 text-[11px]">
          <div>
            <div class="flex justify-between text-content-secondary mb-0.5">
              <span>Plano semanal</span>
              <span class="font-mono font-medium text-content-primary">${row.plannedShare}%</span>
            </div>
            <div class="h-1.5 w-full bg-surface-sunken rounded-full overflow-hidden flex">
              <div class="h-full subject-bg-${row.colorSlot} rounded-full" style="width:${plannedPct}%"></div>
            </div>
          </div>

          <div>
            <div class="flex justify-between text-content-secondary mb-0.5">
              <span>Impacto relativo no edital</span>
              <span class="font-mono font-medium text-content-primary">${row.impactShare}%</span>
            </div>
            <div class="h-1.5 w-full bg-surface-sunken rounded-full overflow-hidden flex">
              <div class="h-full bg-content-secondary/40 rounded-full" style="width:${impactPct}%"></div>
            </div>
          </div>
        </div>

        <div class="text-[10px] text-content-secondary">
          ${row.impactCount} de ${row.topicCount} tópicos com impacto estimado
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="plan-impact-alignment-modern space-y-3">
      <details class="limits-disclosure text-xs">
        <summary aria-label="Limites do alinhamento do plano">Sobre o alinhamento com o edital</summary>
        <p class="analytics-note mt-1">
          Comparação relativa entre as disciplinas planejadas nesta semana e o peso/incidência estimado nos tópicos da prova.
          Serve como guia visual para não negligenciar matérias de alto peso nem sobrecarregar matérias secundárias.
        </p>
      </details>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        ${rowsHtml}
      </div>
    </div>
  `;
}
