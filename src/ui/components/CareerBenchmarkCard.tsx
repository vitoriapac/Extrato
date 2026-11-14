import type { JSX } from 'preact';
import { Icon } from '../primitives/icon.js';
import { Badge } from '../primitives/badge.js';
import { SelectField } from '../primitives/select-field.js';
import { Tooltip } from '../primitives/tooltip.js';
import { WindowBadge } from '../performance/window-badge.js';
import { formatDecimal } from '../../core/format-number.js';
import {
  CAREER_BENCHMARKS,
  type CareerClusterId,
  type CareerBenchmarkComparisonResult,
  type BenchmarkMetricComparison,
} from '../../domain/analytics/career-benchmarks.js';

export interface CareerBenchmarkCardProps {
  comparison: CareerBenchmarkComparisonResult;
  selectedCareerId: CareerClusterId;
  onSelectCareer?: (careerId: CareerClusterId) => void;
}

function MetricBulletBar({
  comparison,
  maxDisplay,
}: {
  comparison: BenchmarkMetricComparison;
  maxDisplay: number;
}): JSX.Element {
  const { currentValue, targetMin, targetMax, unit } = comparison;

  const targetMinPct = Math.min(100, Math.round((targetMin / maxDisplay) * 100));
  const targetMaxPct = Math.min(100, Math.round((targetMax / maxDisplay) * 100));
  const targetWidthPct = Math.max(2, targetMaxPct - targetMinPct);
  const currentPct = Math.min(100, Math.round((currentValue / maxDisplay) * 100));

  const isCompetitive = comparison.status === 'competitive' || comparison.status === 'advanced';

  return (
    <div class="space-y-2 w-full">
      <div class="flex justify-between items-baseline text-xs gap-2">
        <span class="font-medium text-content-primary">{comparison.label}</span>
        <div class="flex items-center gap-2 font-mono">
          <span class="font-semibold text-sm text-content-primary">
            {formatDecimal(currentValue)} {unit}
          </span>
          <span class="text-content-secondary text-xs">
            (alvo: {formatDecimal(targetMin)}–{formatDecimal(targetMax)} {unit})
          </span>
          <Tooltip
            content={`Faixa competitiva de referência: ${formatDecimal(targetMin)} a ${formatDecimal(targetMax)} ${unit}`}
            placement="top"
            align="end"
          >
            <button
              type="button"
              class="inline-flex items-center justify-center rounded-full min-w-7 min-h-7 max-md:min-w-11 max-md:min-h-11 pointer-coarse:min-w-11 pointer-coarse:min-h-11 p-1 text-content-secondary hover:text-content-primary focus-visible:outline-2 focus-visible:outline-accent border-0 bg-transparent cursor-help"
              aria-label={`Explicar faixa competitiva de ${comparison.label}`}
            >
              <Icon name="info-circle" size={14} />
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Régua Visual Bullet / Range */}
      <div
        class="relative w-full h-3 bg-surface-subtle border border-border-default rounded overflow-hidden"
        role="progressbar"
        aria-valuenow={currentValue}
        aria-valuemin={0}
        aria-valuemax={maxDisplay}
        aria-label={`${comparison.label}: ${currentValue} ${unit}`}
      >
        {/* Zona Alvo Recomendada (Faixa Competitiva) */}
        <div
          class="absolute top-0 bottom-0 bg-accent/15 border-x border-accent/30"
          style={{ left: `${targetMinPct}%`, width: `${targetWidthPct}%` }}
        />

        {/* Barra de Progresso Atual */}
        <div
          class={`h-full rounded transition-all duration-300 ${
            isCompetitive ? 'bg-brand' : 'bg-brand-secondary/70'
          }`}
          style={{ width: `${currentPct}%` }}
        />
      </div>

      {/* Rótulo de Status e Comentário */}
      <div class="flex justify-between items-start gap-2 pt-1">
        <span
          class={`text-xs font-semibold ${
            isCompetitive ? 'text-accent' : 'text-content-secondary'
          }`}
        >
          {comparison.statusLabel}
        </span>
        <span class="text-xs text-content-secondary text-right leading-tight">
          {comparison.commentary}
        </span>
      </div>
    </div>
  );
}

export function CareerBenchmarkCard({
  comparison,
  selectedCareerId,
  onSelectCareer,
}: CareerBenchmarkCardProps): JSX.Element {
  const {
    career,
    weeklyHours,
    weeklyQuestions,
    accuracy,
    measuredMix,
    overallStatus,
    overallLabel,
    guidanceNote,
  } = comparison;

  const careerOptions = Object.values(CAREER_BENCHMARKS);

  const overallBadgeVariant =
    overallStatus === 'advanced' || overallStatus === 'competitive'
      ? 'success'
      : overallStatus === 'building'
        ? 'info'
        : 'info';

  return (
    <article
      class="card bg-surface-card border border-border-default rounded-default p-card sm:p-panel shadow-xs space-y-4"
      aria-labelledby="careerBenchmarkTitle"
      data-career-benchmark-card="true"
    >
      {/* Cabeçalho com Seletor e Badge */}
      <header class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-border-subtle">
        <div class="flex items-center gap-3">
          <div class="p-2 rounded bg-surface-subtle text-accent shrink-0">
            <Icon name="chart-bar" size={20} />
          </div>
          <div>
            <div class="flex items-center gap-2 flex-wrap">
              <h3
                id="careerBenchmarkTitle"
                class="text-base font-semibold text-content-primary m-0"
              >
                Referência interna de ritmo
              </h3>
              <Badge variant={overallBadgeVariant}>{overallLabel}</Badge>
            </div>
            <p class="text-xs text-content-secondary m-0 mt-1">
              Faixas de referência internas para <strong>{career.name}</strong>, sem fonte oficial ·
              últimos 7 dias · 100% privado no seu aparelho
            </p>
          </div>
        </div>

        {/* Seletor de Carreira */}
        <SelectField
          id="careerClusterSelect"
          label="Carreira:"
          inline
          size="compact"
          aria-label="Filtrar parâmetros de aprovados por carreira"
          value={selectedCareerId}
          options={careerOptions.map(opt => ({ value: opt.id, label: opt.name }))}
          onChange={e => onSelectCareer?.((e.target as HTMLSelectElement).value as CareerClusterId)}
          className="w-full sm:w-auto"
          selectClassName="w-full sm:w-auto font-medium"
        />
      </header>

      {/* Grid com os 3 Indicadores Principais */}
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-1">
        {/* 1. Horas Líquidas */}
        <div class="p-card rounded border border-border-subtle bg-surface-subtle/40 flex flex-col justify-between">
          <MetricBulletBar
            comparison={weeklyHours}
            maxDisplay={Math.max(40, career.weeklyHours.advanced + 5)}
          />
        </div>

        {/* 2. Questões Semanais */}
        <div class="p-card rounded border border-border-subtle bg-surface-subtle/40 flex flex-col justify-between">
          <MetricBulletBar
            comparison={weeklyQuestions}
            maxDisplay={Math.max(400, career.weeklyQuestions.advanced + 50)}
          />
        </div>

        {/* 3. Precisão em Questões */}
        <div class="p-card rounded border border-border-subtle bg-surface-subtle/40 flex flex-col justify-between">
          <div class="text-xs mb-1">
            <WindowBadge kind="sevenDays" />
          </div>
          <MetricBulletBar comparison={accuracy} maxDisplay={100} />
        </div>
      </div>

      {/* Mix de Tempo: Atual vs Recomendado */}
      <div class="p-card rounded border border-border-subtle bg-surface-subtle/25 space-y-2">
        <div class="flex justify-between items-center text-xs">
          <span class="font-medium text-content-primary">
            Mix de Estudo (Teoria / Questões / Revisão)
          </span>
          <span class="text-content-secondary text-xs">
            Recomendado para {career.name}: {career.targetMix.theoryPercent}% T /{' '}
            {career.targetMix.questionsPercent}% Q / {career.targetMix.reviewPercent}% R
          </span>
        </div>

        {/* Barra Segmentada do Mix Real */}
        <div
          class="w-full h-3 rounded overflow-hidden flex bg-surface-subtle border border-border-default"
          role="img"
          aria-label={`Mix medido: ${measuredMix.theoryPercent}% teoria, ${measuredMix.questionsPercent}% questões, ${measuredMix.reviewPercent}% revisão`}
        >
          <div
            class="h-full transition-all"
            style={{
              width: `${measuredMix.theoryPercent}%`,
              background: 'var(--chart-series-primary)',
            }}
          />
          <div
            class="h-full transition-all"
            style={{ width: `${measuredMix.questionsPercent}%`, background: 'var(--subject-2)' }}
          />
          <div
            class="h-full transition-all"
            style={{ width: `${measuredMix.reviewPercent}%`, background: 'var(--ink-soft)' }}
          />
        </div>

        {/* Legenda do Mix */}
        <div class="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs text-content-secondary pt-1">
          <div class="flex flex-wrap items-center gap-3">
            <Tooltip
              content={`Teoria: ${measuredMix.theoryPercent}% do tempo medido (referência recomendada: ${career.targetMix.theoryPercent}%)`}
              placement="top"
              align="start"
            >
              <button
                type="button"
                class="inline-flex items-center gap-1 border-0 bg-transparent p-0 text-inherit font-inherit cursor-help rounded focus-visible:outline-2 focus-visible:outline-accent"
              >
                <span
                  class="w-2 h-2 rounded-full"
                  style={{ background: 'var(--chart-series-primary)' }}
                />
                <span>
                  Teoria: <strong>{measuredMix.theoryPercent}%</strong>
                </span>
              </button>
            </Tooltip>
            <Tooltip
              content={`Questões: ${measuredMix.questionsPercent}% do tempo medido (referência recomendada: ${career.targetMix.questionsPercent}%)`}
              placement="top"
              align="center"
            >
              <button
                type="button"
                class="inline-flex items-center gap-1 border-0 bg-transparent p-0 text-inherit font-inherit cursor-help rounded focus-visible:outline-2 focus-visible:outline-accent"
              >
                <span class="w-2 h-2 rounded-full" style={{ background: 'var(--subject-2)' }} />
                <span>
                  Questões: <strong>{measuredMix.questionsPercent}%</strong>
                </span>
              </button>
            </Tooltip>
            <Tooltip
              content={`Revisão: ${measuredMix.reviewPercent}% do tempo medido (referência recomendada: ${career.targetMix.reviewPercent}%)`}
              placement="top"
              align="center"
            >
              <button
                type="button"
                class="inline-flex items-center gap-1 border-0 bg-transparent p-0 text-inherit font-inherit cursor-help rounded focus-visible:outline-2 focus-visible:outline-accent"
              >
                <span class="w-2 h-2 rounded-full" style={{ background: 'var(--ink-soft)' }} />
                <span>
                  Revisão: <strong>{measuredMix.reviewPercent}%</strong>
                </span>
              </button>
            </Tooltip>
          </div>
          <span class="text-content-secondary">Período: últimos 7 dias</span>
        </div>
      </div>

      {/* Nota de Orientação Pedagógica */}
      <footer class="flex items-start gap-2 p-3 rounded bg-surface-subtle text-xs text-content-secondary leading-relaxed">
        <span class="inline-flex h-4 items-center shrink-0">
          <Icon name="info-circle" size={16} class="text-accent shrink-0" />
        </span>
        <div>
          <strong class="text-content-primary">Leitura: </strong>
          <span>{guidanceNote}</span>
        </div>
      </footer>
    </article>
  );
}
