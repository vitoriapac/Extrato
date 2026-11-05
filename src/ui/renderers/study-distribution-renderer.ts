import { buildSubjectStudyDistributionVisual } from '../../domain/planning/planning-visual-models.js';
import { renderGroupedBarChart } from '../primitives/charts/charts.js';

const fmt = (value: number) => `${Math.floor(value / 60)}h${String(value % 60).padStart(2, '0')}`;

export function renderStudyDistribution(
  model: Record<string, any>,
  { escapeHtml: _escapeHtml, subjects = [] }: { escapeHtml?: (s: string) => string; subjects?: any[] } = {}
): string {
  if (model.state !== 'ready' || !model.rows || model.rows.length === 0) {
    return '<div class="ui-state--empty">Registre planos ou sessões para comparar a distribuição do tempo entre disciplinas.</div>';
  }

  const subjectsList = subjects && subjects.length > 0
    ? subjects
    : model.rows.map((r: any) => ({ id: r.subjectId, name: r.name }));

  const visual = buildSubjectStudyDistributionVisual({
    distributionRows: model.rows,
    subjects: subjectsList,
  });

  const chartHtml = renderGroupedBarChart({
    rows: visual.rows,
    maxMinutes: visual.maxMinutes,
    label: 'Distribuição de estudo da semana por matéria: Planejado vs Realizado',
  });

  const noteHtml = `<p class="analytics-note mb-3">Até hoje nesta semana: ${fmt(model.plannedMinutes)} em planos diários e ${fmt(model.studiedMinutes)} em sessões realizadas.</p>`;

  return `<div class="study-distribution-wrap">${noteHtml}${chartHtml}</div>`;
}
