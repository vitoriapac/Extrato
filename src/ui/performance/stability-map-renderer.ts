import { renderCopyBlockLink } from './block-link.js';
import { formatDecimal } from '../../core/format-number.js';
const cells = [
  ['attention', 'Atenção', 'Na meta, mas a precisão caiu'],
  ['maintain', 'Manter', 'Na meta e sem queda relevante'],
  ['intervene', 'Intervir', 'Abaixo da meta e sem melhora relevante'],
  ['evolving', 'Evoluindo', 'Abaixo da meta, com melhora'],
] as const;
export function renderStabilityMap(
  model: Record<string, any>,
  { escapeHtml, escapeAttr }: any = {}
) {
  if (!model?.total) return '';
  const cell = ([key, label, description]: any) =>
    `<div class="stability-map-cell stability-map-cell--${key}"><h4>${label}</h4><p>${description}</p>${model.groups[key].length ? '' : '<p class="analytics-note">Nenhuma disciplina neste grupo no período.</p>'}<ul>${model.groups[
      key
    ]
      .slice(0, 5)
      .map(
        (row: any) =>
          `<li><button type="button" data-stability-subject="${escapeAttr(row.subjectId)}">${escapeHtml(row.name)}</button><small>${formatDecimal(row.accuracy)}% · ${row.evolution > 0 ? '+' : ''}${formatDecimal(row.evolution)} p.p.</small></li>`
      )
      .join('')}</ul>${
      model.groups[key].length > 5
        ? `<details><summary>Mostrar mais · +${model.groups[key].length - 5}</summary><ul>${model.groups[
            key
          ]
            .slice(5)
            .map(
              (row: any) =>
                `<li><button type="button" data-stability-subject="${escapeAttr(row.subjectId)}">${escapeHtml(row.name)}</button><small>${formatDecimal(row.accuracy)}% · ${row.evolution > 0 ? '+' : ''}${formatDecimal(row.evolution)} p.p.</small></li>`
            )
            .join('')}</ul></details>`
        : ''
    }</div>`;
  return `<section class="performance-block stability-map" id="bloco-estabilidade" aria-label="Mapa de estabilidade"><h3>Mapa de estabilidade</h3>${renderCopyBlockLink('estabilidade')}<details class="limits-disclosure"><summary aria-label="Limites de estabilidade">Limites</summary><p class="analytics-note">Precisão pessoal frente à meta e mudança entre períodos equivalentes. Uma queda ou melhora de pelo menos 3 pontos percentuais muda o quadrante. Isto não substitui a prioridade estratégica.</p></details>${model.measured ? `<div class="stability-map-grid">${cells.map(cell).join('')}</div>` : ''}<p class="performance-method-note">${model.measured} de ${model.total} disciplinas com precisão e evolução comparáveis (a comparação entre disciplinas conta também as que têm só precisão). ${model.groups.insufficient.length ? 'As demais precisam de 10 questões em cada período.' : ''}</p></section>`;
}
