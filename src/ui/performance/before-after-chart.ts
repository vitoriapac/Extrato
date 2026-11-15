import { formatDecimal, formatPoints } from '../../core/format-number.js';

type Row = Record<string, any>;
const clamp = (value: number) => Math.max(0, Math.min(100, value));
const MAX_ROWS = 10;

/**
 * Antes × agora por disciplina: uma trilha de 0 a 100 por linha, com o ponto do período anterior (vazio),
 * o do período atual (cheio) e a marca da meta. Piores quedas primeiro; o texto de cada linha repete os números.
 */
export function renderBeforeAfterChart(
  model: Row,
  { escapeHtml, escapeAttr, targets = {} }: { escapeHtml: (v: any) => string; escapeAttr: (v: any) => string; targets?: Record<string, number> }
) {
  const rows: Row[] = ['attention', 'maintain', 'intervene', 'evolving']
    .flatMap(key => model?.groups?.[key] || [])
    .filter(row => Number.isFinite(row.accuracy) && Number.isFinite(row.evolution))
    .map(row => ({ ...row, before: Math.round((row.accuracy - row.evolution) * 10) / 10 }))
    .sort((a, b) => a.evolution - b.evolution);
  if (!rows.length) return '';
  const shown = rows.slice(0, MAX_ROWS);
  const items = shown
    .map(row => {
      const target = targets[row.subjectId];
      const left = clamp(Math.min(row.before, row.accuracy));
      const width = Math.max(0.5, clamp(Math.max(row.before, row.accuracy)) - left);
      const falling = row.evolution < 0;
      const text = `${formatDecimal(row.before)}% antes, ${formatDecimal(row.accuracy)}% agora (${formatPoints(row.evolution)})${Number.isFinite(target) ? `, meta ${formatDecimal(target)}%` : ''}`;
      return `<li class="chart-dumbbell__row"><button type="button" class="performance-topic-link" data-stability-subject="${escapeAttr(row.subjectId)}">${escapeHtml(row.name)}</button><div class="chart-dumbbell__track" role="img" aria-label="${escapeAttr(`${row.name}: ${text}`)}"><i class="chart-dumbbell__span${falling ? ' is-falling' : ''}" style="left:${left}%;width:${width}%"></i><b class="chart-dumbbell__before" style="left:${clamp(row.before)}%"></b><b class="chart-dumbbell__after${falling ? ' is-falling' : ''}" style="left:${clamp(row.accuracy)}%"></b>${Number.isFinite(target) ? `<u class="chart-dumbbell__target" style="left:${clamp(target)}%"></u>` : ''}</div><small>${escapeHtml(`${formatDecimal(row.accuracy)}% · ${formatPoints(row.evolution)}`)}</small></li>`;
    })
    .join('');
  const more = rows.length > shown.length ? `<p class="analytics-note">Mostrando as ${shown.length} maiores quedas de ${rows.length} disciplinas comparáveis; o mapa abaixo lista todas.</p>` : '';
  return `<section class="performance-block chart-dumbbell" aria-label="Precisão antes e agora por disciplina"><h3>Antes × agora</h3><p class="analytics-note chart-dumbbell__legend"><span aria-hidden="true"><b class="chart-dumbbell__key is-before"></b> período anterior · <b class="chart-dumbbell__key is-after"></b> período atual · <u class="chart-dumbbell__key is-target"></u> meta</span><span class="sr-only">Cada linha traz a precisão no período anterior, no atual e a meta.</span></p><ul class="chart-dumbbell__list">${items}</ul>${more}</section>`;
}
