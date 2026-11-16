import { formatPercent } from '../../core/format-number.js';
import { formatStudyMinutes } from '../format-study-time.js';

type Row = Record<string, any>;
const TOP = 8;

/**
 * Tempo por disciplina em barras horizontais: as 8 com mais tempo e "Outras" somando o resto.
 * Barras comparam melhor que as fatias de um donut com 17 disciplinas; cada linha traz tempo e percentual em texto.
 */
export function renderTimeBySubjectBars(
  distribution: { slices: Row[]; totalSeconds: number },
  { escapeHtml }: { escapeHtml: (value: any) => string }
) {
  const all = (distribution?.slices || []).filter(slice => slice.seconds > 0);
  if (!all.length) return '';
  // O modelo já agrupa as menores em "Outras disciplinas" (id `__outras`); ela fica sempre por último.
  const named = all.filter(slice => slice.subjectId !== '__outras').sort((a, b) => b.seconds - a.seconds);
  const top = named.slice(0, TOP).map(slice => ({ name: slice.subjectName, seconds: slice.seconds, percentage: slice.percentage, colorSlot: slice.colorSlot as number | null }));
  const rest = [...named.slice(TOP), ...all.filter(slice => slice.subjectId === '__outras')];
  if (rest.length)
    top.push({
      name: 'Outras disciplinas',
      seconds: rest.reduce((sum, slice) => sum + slice.seconds, 0),
      percentage: rest.reduce((sum, slice) => sum + slice.percentage, 0),
      colorSlot: null,
    });
  const max = Math.max(...top.map(item => item.seconds));
  const rows = top
    .map(item => {
      const width = Math.max(1, Math.round((item.seconds / max) * 100));
      const text = `${formatStudyMinutes(item.seconds / 60)} (${formatPercent(item.percentage)})`;
      return `<li class="time-bars__row"><span class="time-bars__name">${escapeHtml(item.name)}</span><div class="time-bars__track" role="img" aria-label="${escapeHtml(`${item.name}: ${text}`)}"><i class="${item.colorSlot ? `subject-color-${item.colorSlot}` : 'is-other'}" style="width:${width}%"></i></div><span class="time-bars__value">${text}</span></li>`;
    })
    .join('');
  return `<div class="time-bars"><p class="analytics-note">Total no período: ${formatStudyMinutes(distribution.totalSeconds / 60)}.</p><ul class="time-bars__list">${rows}</ul></div>`;
}
