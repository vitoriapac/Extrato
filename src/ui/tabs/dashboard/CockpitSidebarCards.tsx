import type { JSX } from 'preact';
import type {
  CockpitSidebarViewModel,
  TodayGoalData,
  WeeklyReviewLoadData,
  ConsistencyMiniHeatmapData,
} from '../../../application/analytics/build-cockpit-sidebar-view-model.js';

export interface CockpitSidebarCardsProps {
  model: CockpitSidebarViewModel;
}

export function TodayGoalCard({
  data,
  variant = 'card',
}: {
  data: TodayGoalData;
  variant?: 'card' | 'inline';
}): JSX.Element | null {
  const { hasConfiguredPlan, percent, studiedFormatted, plannedFormatted, planFormatted, questionsDone, questionsTarget, dateLabel } = data;

  // Inline: dentro do card "Próxima ação", só o que "Execução de hoje" não mostra (meta diária e questões).
  if (variant === 'inline') {
    if (!hasConfiguredPlan) return null;
    return (
      <p class="today-goal-inline" aria-label="Meta diária e questões de hoje">
        Meta diária <span class="font-data">{plannedFormatted}</span>
        {' · '}Questões <span class="font-data">{questionsDone} de {questionsTarget}</span> previstas
      </p>
    );
  }

  if (!hasConfiguredPlan) {
    return (
      <article class="chart-card p-5" aria-labelledby="todayGoalTitle">
        <div class="flex items-center justify-between mb-2">
          <h3 id="todayGoalTitle" class="font-semibold text-base text-content-primary m-0">
            Meta de Hoje
          </h3>
          <span class="text-xs font-data text-content-secondary">{dateLabel}</span>
        </div>
        <p class="text-xs text-content-secondary m-0 leading-relaxed">
          Nenhuma meta ativa hoje. Configure seu plano de estudos para definir sua disponibilidade diária e metas de questões.
        </p>
      </article>
    );
  }

  const circumference = 163.36; // 2 * Math.PI * 26
  const strokeDashoffset = circumference - (circumference * Math.min(100, Math.max(0, percent))) / 100;

  return (
    <article class="chart-card p-5" aria-labelledby="todayGoalTitle">
      <div class="flex items-center justify-between mb-3">
        <h3 id="todayGoalTitle" class="font-semibold text-base text-content-primary m-0">
          Meta de Hoje
        </h3>
        <span class="text-xs font-data text-content-secondary">{dateLabel}</span>
      </div>

      <div class="flex items-center gap-4">
        <div class="relative w-16 h-16 flex-shrink-0">
          <svg class="w-16 h-16 transform -rotate-90" viewBox="0 0 64 64" aria-hidden="true">
            <circle
              cx="32"
              cy="32"
              r="26"
              stroke="var(--surface-subtle)"
              stroke-width="6"
              fill="none"
            />
            <circle
              cx="32"
              cy="32"
              r="26"
              stroke="var(--brand)"
              stroke-width="6"
              stroke-linecap="round"
              stroke-dasharray={circumference.toFixed(2)}
              stroke-dashoffset={strokeDashoffset.toFixed(2)}
              fill="none"
            />
          </svg>
          <div class="absolute inset-0 flex flex-col items-center justify-center">
            <span class="font-data font-semibold text-sm leading-none text-content-primary">
              {percent}%
            </span>
          </div>
        </div>

        <div class="space-y-1.5 text-xs">
          <div>
            <span class="text-content-secondary">Estudo realizado:</span>
            <div class="font-data font-semibold text-sm text-content-primary">
              {studiedFormatted}{' '}
              <span class="text-content-secondary text-xs font-normal">/ {plannedFormatted} de meta diária</span>
            </div>
          </div>
          {planFormatted && (
            <div>
              <span class="text-content-secondary">Plano de hoje:</span>
              <div class="font-data font-semibold text-sm text-content-primary">
                {planFormatted}{' '}
                <span class="text-content-secondary text-xs font-normal">em atividades</span>
              </div>
            </div>
          )}
          <div>
            <span class="text-content-secondary">Questões resolvidas:</span>
            <div class="font-data font-semibold text-sm text-content-primary">
              {questionsDone}{' '}
              <span class="text-content-secondary text-xs font-normal">/ {questionsTarget} previstas</span>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

export function WeeklyReviewLoadCard({ data }: { data: WeeklyReviewLoadData }): JSX.Element {
  const { days, overdueCount, tip } = data;

  return (
    <article class="chart-card p-5" aria-labelledby="reviewLoadTitle">
      <div class="flex items-center justify-between mb-2">
        <div>
          <h3 id="reviewLoadTitle" class="font-semibold text-base text-content-primary m-0">
            Carga de Revisões
          </h3>
          <p class="text-xs text-content-secondary m-0 mt-0.5">Próximos 7 dias</p>
        </div>
        <span
          class={`text-xs font-data font-semibold ${
            overdueCount > 0 ? 'text-amber' : 'text-green'
          }`}
        >
          {overdueCount} atrasadas
        </span>
      </div>

      <div class="grid grid-cols-7 gap-1.5 items-end h-20 pt-3 pb-1 border-b border-border-default">
        {days.map(d => (
          <div key={d.dateISO} class="flex flex-col items-center gap-1 h-full justify-end">
            <span
              class={`text-xs font-data ${
                d.isPeak
                  ? 'font-bold text-content-primary'
                  : d.isToday
                    ? 'font-bold text-content-primary'
                    : 'text-content-secondary'
              }`}
            >
              {d.count}
            </span>
            <div
              class={`w-full rounded-t transition-all ${
                d.isPeak
                  ? 'bg-accent'
                  : d.isToday
                    ? 'bg-accent'
                    : d.count > 0
                      ? 'bg-brand-secondary opacity-50'
                      : 'bg-surface-subtle'
              }`}
              style={{ height: `${d.heightPct}%` }}
              title={`${d.dayName}: ${d.count} revisões`}
            />
            <span
              class={`text-xs font-data ${
                d.isToday ? 'font-bold text-content-primary' : 'text-content-secondary'
              }`}
            >
              {d.dayName}
            </span>
          </div>
        ))}
      </div>
      <p class="text-xs text-content-secondary mt-2 m-0">{tip}</p>
    </article>
  );
}

export function ConsistencyMiniHeatmapCard({
  data,
}: {
  data: ConsistencyMiniHeatmapData;
}): JSX.Element {
  const { days, activeDaysCount, totalDays } = data;

  return (
    <article class="chart-card p-5" aria-labelledby="consistencyTitle">
      <div class="flex items-center justify-between mb-2">
        <h3 id="consistencyTitle" class="font-semibold text-base text-content-primary m-0">
          Consistência (4 Semanas)
        </h3>
        <span class="text-xs font-data text-content-secondary">
          {activeDaysCount} / {totalDays} dias
        </span>
      </div>

      <div class="grid grid-cols-7 gap-1.5 pt-1">
        {days.map(d => (
          <div
            key={d.dateISO}
            class={`w-full aspect-square rounded-xs ${
              d.level === 4
                ? 'bg-green opacity-100'
                : d.level === 3
                  ? 'bg-green opacity-80'
                  : d.level === 2
                    ? 'bg-green opacity-60'
                    : d.level === 1
                      ? 'bg-green opacity-40'
                      : 'bg-surface-subtle'
            } ${d.isToday ? 'ring-2 ring-offset-1 ring-green' : ''}`}
            title={d.title}
          />
        ))}
      </div>
    </article>
  );
}

export function CockpitSidebarCards({ model }: CockpitSidebarCardsProps): JSX.Element {
  const { todayGoal, reviewLoad, consistency } = model;

  return (
    <div class="space-y-4">
      <TodayGoalCard data={todayGoal} />
      <WeeklyReviewLoadCard data={reviewLoad} />
      <ConsistencyMiniHeatmapCard data={consistency} />
    </div>
  );
}
