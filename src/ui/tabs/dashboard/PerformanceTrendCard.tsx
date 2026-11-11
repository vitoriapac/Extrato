import type { JSX } from 'preact';
import { Icon } from '../../primitives/icon.js';
import { formatDecimal } from '../../../core/format-number.js';
import type {
  PerformanceTrendViewModel,
  PerformanceTrendPoint,
} from '../../../application/analytics/build-performance-trend-view-model.js';

export interface PerformanceTrendCardProps {
  model: PerformanceTrendViewModel;
  onNavigateQuestions?: () => void;
}

export function PerformanceTrendCard({
  model,
  onNavigateQuestions,
}: PerformanceTrendCardProps): JSX.Element {
  const { points, targetScore, hasData } = model;

  // Dimensões do gráfico vetorial SVG
  const width = 500;
  const height = 175;
  const padLeft = 32;
  const padRight = 16;
  const padTop = 18;
  const padBottom = 26;

  const plotWidth = width - padLeft - padRight;
  const plotHeight = height - padTop - padBottom;

  const xFor = (index: number) =>
    padLeft + (points.length <= 1 ? plotWidth / 2 : (index / (points.length - 1)) * plotWidth);

  const yFor = (val: number) =>
    padTop + ((100 - Math.max(0, Math.min(100, val))) / 100) * plotHeight;

  const yTarget = yFor(targetScore);

  // Segmentos da linha de questões
  const questionSegments: JSX.Element[] = [];
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    if (prev.questionAccuracy !== null && curr.questionAccuracy !== null) {
      questionSegments.push(
        <line
          key={`q-seg-${i}`}
          x1={xFor(i - 1)}
          y1={yFor(prev.questionAccuracy)}
          x2={xFor(i)}
          y2={yFor(curr.questionAccuracy)}
          class="stroke-green"
          stroke-width="2"
          stroke-linecap="round"
        />
      );
    }
  }

  return (
    <article
      class="chart-card p-card flex flex-col justify-between h-full"
      aria-labelledby="performanceTrendTitle"
    >
      <div>
        <div class="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 mb-3">
          <div>
            <h3
              id="performanceTrendTitle"
              class="font-semibold text-base text-content-primary m-0"
            >
              Evolução de Acertos &amp; Simulados
            </h3>
            <p class="text-xs text-content-secondary m-0 mt-1">
              Tendência semanal de questões e notas dos simulados vs. meta de aprovação
            </p>
          </div>
          {onNavigateQuestions ? (
            <button
              type="button"
              class="btn tertiary"
              onClick={onNavigateQuestions}
              aria-label="Ver histórico completo de questões e simulados"
            >
              <span>Ver questões</span>
              <Icon name="arrow-right" size={12} />
            </button>
          ) : (
            <a
              href="#questoes"
              class="btn tertiary"
              aria-label="Ver histórico completo de questões e simulados"
            >
              <span>Ver questões</span>
              <Icon name="arrow-right" size={12} />
            </a>
          )}
        </div>

        {/* Uma frase no lugar dos quatro KPIs: os números por disciplina já estão em Saúde do edital. */}
        <p class="text-xs text-content-secondary m-0 mb-3" data-testid="performance-trend-summary">
          {model.questionAccuracy != null
            ? `${formatDecimal(model.questionAccuracy)}% de acerto em ${model.totalResolved} questões`
            : 'Sem questões registradas'}
          {model.simulationCount > 0
            ? ` · média de ${formatDecimal(model.simulationMean)}% em ${model.simulationCount} simulados`
            : ' · nenhum simulado'}
          {` · meta ${formatDecimal(model.targetScore)}%`}
          {model.status === 'ok' && model.gap != null && model.gap > 0
            ? ` · na meta (+${formatDecimal(model.gap)} p.p.)`
            : ''}
          {model.status === 'attention' && model.gap != null
            ? ` · abaixo (${formatDecimal(model.gap)} p.p.)`
            : ''}
          {model.status === 'insufficient' ? ' · dados iniciais' : ''}
        </p>

        {/* Gráfico Vetorial ou Estado Inicial */}
        {!hasData ? (
          <div class="p-6 text-center text-sm text-content-secondary bg-surface-subtle rounded-default flex flex-col items-center justify-center gap-2">
            <Icon name="chart-line" size={28} class="text-content-secondary opacity-60" />
            <p class="m-0">
              Registre questões ou simulados para acompanhar a curva de aproveitamento.
            </p>
          </div>
        ) : (
          <div class="w-full overflow-x-auto flex flex-row-reverse" role="region" aria-label="Gráfico de evolução de acertos e simulados, rolável na horizontal" tabIndex={0}>
            <svg
              viewBox={`0 0 ${width} ${height}`}
              style={{ minWidth: `${width}px` }}
              class="w-full h-auto max-h-[175px] block select-none"
              aria-label="Gráfico de evolução de acertos e notas de simulados"
              role="img"
            >
              {/* Linhas de Grade de Fundo */}
              {[0, 50, 100].map(val => (
                <g key={`grid-${val}`}>
                  <line
                    x1={padLeft}
                    y1={yFor(val)}
                    x2={width - padRight}
                    y2={yFor(val)}
                    class="stroke-border-subtle"
                    stroke-width="1"
                  />
                  <text
                    x={padLeft - 6}
                    y={yFor(val) + 3}
                    text-anchor="end"
                    class="fill-content-secondary text-xs font-data"
                  >
                    {val}%
                  </text>
                </g>
              ))}

              {/* Linha da Meta de Aprovação em destaque âmbar/laranja */}
              <line
                x1={padLeft}
                y1={yTarget}
                x2={width - padRight}
                y2={yTarget}
                stroke="var(--chart-series-secondary)"
                stroke-dasharray="4 3"
                stroke-width="1.5"
                opacity="0.9"
              />
              <text
                x={width - padRight - 2}
                y={yTarget - 4}
                text-anchor="end"
                fill="var(--chart-series-secondary)"
                class="text-xs font-data font-semibold"
              >
                Meta {formatDecimal(targetScore)}%
              </text>

              {/* Segmentos de Conexão das Questões */}
              {questionSegments}

              {/* Pontos de Questões por Semana (abaixo da meta ganham destaque laranja) */}
              {points.map((p: PerformanceTrendPoint, i: number) => {
                if (p.questionAccuracy === null) return null;
                const cx = xFor(i);
                const cy = yFor(p.questionAccuracy);
                const belowTarget = p.questionAccuracy < targetScore;
                return (
                  <circle
                    key={`q-dot-${i}`}
                    cx={cx}
                    cy={cy}
                    r="3.5"
                    fill={belowTarget ? 'var(--chart-series-secondary)' : 'var(--surface-card)'}
                    stroke={belowTarget ? 'var(--surface-card)' : 'var(--green)'}
                    class={`chart-point-interactive ${belowTarget ? '' : 'fill-surface-card stroke-green'}`}
                    stroke-width="2"
                  >
                    <title>{`${p.label}: ${formatDecimal(p.questionAccuracy)}% (${p.questionResolved} questões)`}</title>
                  </circle>
                );
              })}

              {/* Marcadores de Simulados em destaque laranja */}
              {points.map((p: PerformanceTrendPoint, i: number) => {
                if (p.simulationScore === null) return null;
                const cx = xFor(i);
                const cy = yFor(p.simulationScore);
                return (
                  <g key={`sim-dot-${i}`}>
                    <circle
                      cx={cx}
                      cy={cy}
                      r="5.5"
                      fill="var(--chart-series-secondary)"
                      stroke="var(--surface-card)"
                      class="chart-point-interactive"
                      stroke-width="2"
                    >
                      <title>{`${p.simulationName || 'Simulado'} (${p.label}): ${formatDecimal(p.simulationScore)}%`}</title>
                    </circle>
                  </g>
                );
              })}

              {/* Rótulos de Data no Eixo X */}
              {points.map((p: PerformanceTrendPoint, i: number) => (
                <text
                  key={`lbl-${i}`}
                  x={xFor(i)}
                  y={height - 8}
                  text-anchor="middle"
                  class="fill-content-secondary text-xs font-data"
                >
                  {p.label}
                </text>
              ))}
            </svg>
          </div>
        )}
      </div>

      {/* Legenda Informativa */}
      {hasData && (
        <div class="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 pt-3 mt-2 border-t border-border-subtle text-xs text-content-secondary font-medium">
          <div class="flex items-center gap-3">
            <span class="inline-flex items-center gap-2">
              <span class="w-3 h-0.5 bg-green rounded-full inline-block" />
              <span>Questões</span>
            </span>
            <span class="inline-flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-warning-emphasis inline-block" />
              <span>Simulados / atenção</span>
            </span>
            <span class="inline-flex items-center gap-2">
              <span class="w-3 border-b border-dashed border-amber inline-block" />
              <span>Meta ({formatDecimal(targetScore)}%)</span>
            </span>
          </div>
          <span class="text-content-secondary text-xs">
            {model.summaryText}
          </span>
        </div>
      )}
    </article>
  );
}
