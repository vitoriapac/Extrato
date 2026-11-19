import { matrixAbbreviations } from '../primitives/charts/matrix-abbreviations.js';
import { formatDecimal } from '../../core/format-number.js';
import { classifyPedagogicalQuadrant } from '../../domain/analytics/pedagogical-matrix.js';
import { renderPedagogicalMatrixChart } from '../primitives/charts/charts.js';

type Row = Record<string, any>;
const value = (number: number | null | undefined, suffix = '') =>
  number == null ? '—' : `${formatDecimal(number)}${suffix}`;

/** Matriz Domínio × Retenção: vive em Diagnóstico, com os demais blocos de lacunas. */
export function renderPedagogicalMatrixSection(
  pedagogicalMatrix: Row | null | undefined,
  { escapeHtml }: { escapeHtml: (value: any) => string }
) {
  const matrix = pedagogicalMatrix;
  let matrixSection = '';
  if (matrix && matrix.items && matrix.items.length > 0) {
    const counts = matrix.quadrantCounts;
    const thresholdMastery = Number(matrix.thresholdMastery) || 70;
    const thresholdRetention = Number(matrix.thresholdRetention) || 60;
    // Com todas as disciplinas no quadrante crítico a dispersão não distingue nada: a lista basta.
    const scattered = counts.consolidated + counts.forgetting_risk + counts.building > 0;
    const matrixChart = !scattered ? '' : renderPedagogicalMatrixChart({
      items: matrix.items,
      thresholdMastery,
      thresholdRetention,
    });
    // No celular a dispersão não cabe com rótulos legíveis: a lista ordena as disciplinas de menor domínio.
    const abbreviations = matrixAbbreviations(matrix.items.map((item: Row) => item.name));
    const matrixRanked = `<ol class="matrix-ranked" aria-label="Nomes completos das disciplinas, do menor para o maior domínio">${[
      ...matrix.items,
    ]
      .sort((a: Row, b: Row) => a.mastery - b.mastery)
      .map((item: Row) => {
        const action =
          item.recommendedAction ||
          classifyPedagogicalQuadrant(
            Number(item.mastery) || 0,
            Number(item.retention) || 0,
            thresholdMastery,
            thresholdRetention
          ).recommendedAction;
        return `<li><span><abbr title="${escapeHtml(item.name)}">${escapeHtml(abbreviations.get(item.name) ?? '')}</abbr> · ${escapeHtml(item.name)}</span><span>domínio ${value(item.mastery, '/100')} · retenção ${value(item.retention, '/100')} · ${escapeHtml(action)}</span></li>`;
      })
      .join('')}</ol>`;
    const methodNote = `<p class="analytics-note mt-2" data-matrix-method="true">Critérios dos quadrantes: Domínio ≥ ${formatDecimal(thresholdMastery)}/100 e Retenção ≥ ${formatDecimal(thresholdRetention)}/100. A retenção estima a estabilidade da memória combinando revisões no prazo, acertos recentes e recência — não é sinônimo simples de acerto.</p>`;
    matrixSection = `<section class="performance-block" id="bloco-matriz" aria-label="Matriz de Domínio versus Retenção">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div class="min-w-0">
          <h3 class="m-0">Matriz Pedagógica: Domínio × Retenção</h3>
          <p class="analytics-note m-0">${scattered ? 'Dispersão em 4 quadrantes cruzando aproveitamento e memória, com a escala ajustada aos dados (os valores das pontas dos eixos estão escritos).<span class="matrix-chart-note"> As esferas recebem a cor oficial e tamanho relativo às horas estudadas.</span>' : 'Todas as disciplinas estão no quadrante de prioridade alta, então a dispersão não separa nada: a lista abaixo vai do menor para o maior domínio.'}</p>
        </div>
        <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-micro font-medium text-content-secondary">
          <span class="inline-flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-green inline-block"></span>Consolidada: ${counts.consolidated}</span>
          <span class="inline-flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-amber inline-block"></span>Risco de Esquecimento: ${counts.forgetting_risk}</span>
          <span class="inline-flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-info-emphasis inline-block"></span>Em Construção: ${counts.building}</span>
          <span class="inline-flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-red inline-block"></span>Vulnerabilidade Crítica: ${counts.critical}</span>
        </div>
      </div>
      ${matrixChart ? `<div class="matrix-chart-scroll mt-3 overflow-x-auto">${matrixChart}</div>` : ''}${matrixRanked}${methodNote}
    </section>`;
  }

  return matrixSection;
}
