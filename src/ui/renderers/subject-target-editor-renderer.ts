import { formatDecimal } from '../../core/format-number.js';
import { diagnosticLabel } from '../../domain/diagnostics/diagnostic-vocabulary.js';
import { subjectColorOf } from '../../domain/subjects/subject-color.js';
import { renderIconSvg } from '../primitives/icon.js';

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

export function renderSubjectTargetEditor(
  {
    rows = [],
    globalTarget = 80,
    globalWeeklyQuestions = 0,
    blueprint = {},
    weeklyGoalsBySubject = new Map(),
    draftAccuracy = new Map(),
    draftWeeklyGoals = new Map(),
  }: any,
  { escapeHtml, escapeAttr }: any
) {
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

  const hasDirty = accDraftMap.size > 0 || wkDraftMap.size > 0;

  const body = rows
    .map((row: any) => {
      const colorSlot = subjectColorOf({ id: row.subjectId }, subjectList);
      const custom = configs.get(row.subjectId)?.accuracyTarget;
      const accInputValue = accDraftMap.has(row.subjectId)
        ? accDraftMap.get(row.subjectId)
        : (custom ?? '');
      const weeklyEntry = weeklyMap.get(row.subjectId);
      const weeklyMeta = weeklyEntry?.meta;
      const weeklySolved = Number(weeklyEntry?.solved) || 0;
      const wkInputValue = wkDraftMap.has(row.subjectId)
        ? wkDraftMap.get(row.subjectId)
        : (weeklyMeta ?? '');
      const wkPct = weeklyMeta > 0 ? Math.round((weeklySolved / weeklyMeta) * 100) : 0;

      return `<tr><td data-label="Disciplina"><label class="flex items-center gap-2"><input type="checkbox" data-accuracy-select value="${escapeAttr(row.subjectId)}"> <span class="w-2 h-2 rounded-full inline-block flex-shrink-0 subject-bg-${colorSlot}" aria-hidden="true"></span><span class="font-medium">${escapeHtml(row.name)}</span></label></td><td data-label="Meta de acerto (%)"><div class="subject-target-cell"><input type="number" min="0" max="100" step="1" aria-label="Meta de acerto de ${escapeAttr(row.name)}" data-accuracy-value="${escapeAttr(row.subjectId)}" value="${escapeAttr(accInputValue)}" placeholder="${globalTarget}"><small>${custom == null ? `Global (${globalTarget}%)` : 'Personalizada'}</small><button type="button" class="btn ghost small" data-accuracy-save="${escapeAttr(row.subjectId)}">Salvar</button><button type="button" class="btn ghost small" data-accuracy-restore="${escapeAttr(row.subjectId)}" ${custom == null ? 'disabled' : ''}>Restaurar global</button></div></td><td data-label="Acerto atual">${row.state === 'insufficient' ? 'Dados insuficientes' : `<span class="font-mono font-medium">${formatDecimal(row.accuracy)}%</span>`}</td><td data-label="Diferença vs. meta">${signed(row.gap)}</td><td data-label="Tendência">${trend(row.evolution)}</td><td data-label="Questões / semana"><div class="subject-target-cell"><input type="number" min="0" step="1" aria-label="Meta semanal de questões de ${escapeAttr(row.name)}" data-weekly-goal-value="${escapeAttr(row.subjectId)}" value="${escapeAttr(wkInputValue)}" placeholder="—">${weeklyMeta > 0 ? `<small>${weeklySolved}/${weeklyMeta} (${wkPct}%)</small><button type="button" class="icon-btn" data-weekly-goal-remove="${escapeAttr(row.subjectId)}" title="Remover meta" aria-label="Remover meta de questões">${renderIconSvg('x', { size: 14 })}</button>` : '<small>Sem meta semanal</small>'}</div></td></tr>`;
    })
    .join('');

  return `<div class="subject-target-editor"><p class="analytics-note">Configure a meta de acerto (%) e a meta semanal de questões de cada disciplina. Atual e tendência usam os últimos 30 dias (mínimo de 10 questões por período). Meta global semanal: <strong>${Number(globalWeeklyQuestions) || 0}</strong> questões · Soma das metas por disciplina: <strong>${sumWeekly}</strong> questões/semana.</p><div class="subject-target-bulk"><label><input type="checkbox" data-accuracy-select-all> Selecionar disciplinas</label><label>Acerto em lote <input type="number" min="0" max="100" step="1" data-accuracy-bulk-value value="${globalTarget}">%</label><button type="button" class="btn small" data-accuracy-apply>Aplicar às selecionadas</button><button type="button" class="btn ghost small" data-accuracy-restore-selected>Restaurar global nas selecionadas</button></div><div class="subject-target-pending-bar" data-targets-pending-bar ${hasDirty ? '' : 'hidden'}><span class="metadata-text">Alterações pendentes nas metas por disciplina</span><div class="action-group"><button type="button" class="btn small" data-targets-save-all>Salvar alterações</button><button type="button" class="btn ghost small" data-targets-discard>Descartar</button></div></div><div class="performance-table-scroll subject-target-table-wrap" tabindex="0" role="region" aria-label="Metas por disciplina; use as setas para percorrer as colunas"><table><caption>Meta global: ${globalTarget}% · questões/semana: ${Number(globalWeeklyQuestions) || 0}</caption><thead><tr><th scope="col">Disciplina</th><th scope="col">Meta de acerto (%)</th><th scope="col">Acerto atual</th><th scope="col">Diferença vs. meta</th><th scope="col">Tendência</th><th scope="col">Questões / semana</th></tr></thead><tbody>${body}</tbody></table></div></div>`;
}
