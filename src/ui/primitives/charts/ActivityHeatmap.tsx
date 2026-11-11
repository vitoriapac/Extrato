import type { JSX } from 'preact';
import { Icon } from '../icon.js';
import { formatDecimal } from '../../../core/format-number.js';
import type {
  ActivityCalendarHeatmapVisualModel,
  ActivityHoursHeatmapVisualModel,
} from '../../../domain/analytics/activity-heatmap-models.js';

export interface ActivityHeatmapProps {
  mode?: 'calendar' | 'hours';
  calendarVisual?: ActivityCalendarHeatmapVisualModel;
  hoursVisual?: ActivityHoursHeatmapVisualModel;
  className?: string;
  metric?: string;
  activityStreak?: number;
  goalStreak?: number;
  selectedDate?: string | null;
  selectedTooltip?: string;
  hasActivity?: boolean;
  /** Título, período e filtros dentro do card; sem isso o card renderiza só o mapa. */
  controls?: ActivityHeatmapControls;
}

export interface ActivityHeatmapControls {
  subjects: Array<{ id: string; name: string }>;
  subjectId: string;
  /** Janela em semanas; 0 = todo o histórico. */
  weeks: number;
  onlyActiveDays: boolean;
}

const HEATMAP_PERIODS: Array<[number, string]> = [
  [12, 'Últimas 12 semanas'],
  [24, 'Últimas 24 semanas'],
  [52, 'Últimas 52 semanas'],
  [0, 'Todo o período'],
];

const HEATMAP_METRICS: Array<[string, string]> = [
  ['hours', 'Horas'],
  ['questions', 'Questões'],
  ['reviews', 'Revisões'],
  ['simulations', 'Simulados'],
];

const WEEKDAYS_PT = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

/** Alternativa em texto à grade: dias com atividade por semana (segunda a domingo), das mais recentes. */
function weeklyActivity(days: ActivityCalendarHeatmapVisualModel['days'], limit = 12) {
  const weeks = new Map<string, { start: string; active: number; total: number }>();
  for (const day of days) {
    const time = Date.parse(day.date + 'T00:00:00');
    const monday = new Date(time - day.dayOfWeek * 86400000).toISOString().slice(0, 10);
    const week = weeks.get(monday) || { start: monday, active: 0, total: 0 };
    week.total++;
    if (day.level > 0) week.active++;
    weeks.set(monday, week);
  }
  return [...weeks.values()].slice(-limit).reverse();
}

/** Resumo só do período exibido: independe da métrica, pois usa apenas o nível de cada dia. */
function summarizeCalendar(days: ActivityCalendarHeatmapVisualModel['days']) {
  if (!days.length) return null;
  let activeDays = 0;
  let bestRun = 0;
  let run = 0;
  let prev: number | null = null;
  const byWeekday = new Array(7).fill(0);
  for (const day of days) {
    const time = Date.parse(day.date + 'T00:00:00');
    if (day.level > 0) {
      activeDays++;
      byWeekday[day.dayOfWeek] = (byWeekday[day.dayOfWeek] || 0) + 1;
      run = prev !== null && Math.round((time - prev) / 86400000) === 1 && run > 0 ? run + 1 : 1;
      bestRun = Math.max(bestRun, run);
    } else {
      run = 0;
    }
    prev = time;
  }
  const top = Math.max(...byWeekday);
  return {
    activeDays,
    totalDays: days.length,
    bestRun,
    topWeekday: top > 0 ? WEEKDAYS_PT[byWeekday.indexOf(top)] : '—',
  };
}

export function ActivityHeatmap({
  mode = 'calendar',
  calendarVisual,
  hoursVisual,
  className = '',
  metric = 'hours',
  activityStreak = 0,
  goalStreak = 0,
  selectedDate = null,
  selectedTooltip = '',
  hasActivity = true,
  controls,
}: ActivityHeatmapProps): JSX.Element {
  const isCalendar = mode === 'calendar';
  // Filtros num disclosure fechado; abre sozinho enquanto algum filtro foge do padrão.
  const filtersActive = Boolean(
    controls && (metric !== 'hours' || controls.subjectId || controls.onlyActiveDays)
  );
  // Roving tabindex: uma única parada de Tab na grade; as setas movem entre as células.
  const days = calendarVisual?.days ?? [];
  const tabStopDate = (days.find(d => d.selected) ?? days[days.length - 1])?.date;

  const insights = isCalendar ? summarizeCalendar(days) : null;

  return (
    <div
      class={`activity-heatmap-container chart-card-interactive space-y-4 p-4 rounded-default bg-surface-elevated border border-border-default ${className}`}
      role="region"
      aria-label="Mapa de calor de consistência e hábitos de estudo"
    >
      {controls && (
        <div class="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <h3 class="font-semibold text-base text-content-primary m-0">Consistência de estudos</h3>
          <select
            aria-label="Período do heatmap"
            data-delegated-change="setHeatmapFilter('weeks',this.value)"
          >
            {HEATMAP_PERIODS.map(([value, label]) => (
              <option key={value} value={value} selected={controls.weeks === value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Topo com seletor de modo e atalhos rápidos */}
      <div class="flex flex-wrap items-center justify-between gap-3 text-xs border-b border-border-subtle pb-3">
        {/* Seletor de Modo (Calendário vs Horários do Dia) */}
        <div
          class="flex flex-wrap items-center gap-2"
          role="group"
          aria-label="Visualização do heatmap"
        >
          <button
            type="button"
            aria-pressed={isCalendar}
            data-delegated-click="setHeatmapMode('calendar')"
            class={`btn small inline-flex items-center gap-2${isCalendar ? ' active' : ' ghost'}`}
          >
            <Icon name="calendar" size={13} />
            Calendário contínuo
          </button>
          <button
            type="button"
            aria-pressed={!isCalendar}
            data-delegated-click="setHeatmapMode('hours')"
            class={`btn small inline-flex items-center gap-2${!isCalendar ? ' active' : ' ghost'}`}
          >
            <Icon name="clock" size={13} />
            Horários do dia (24h)
          </button>
        </div>

        {/* Resumo de Streaks */}
        <div class="flex items-center gap-3 text-xs text-content-secondary">
          <span class="inline-flex items-center gap-2">
            <Icon name="flame" size={14} class="text-warning-emphasis" />
            Atividade:{' '}
            <strong class="font-semibold text-content-primary">
              {activityStreak} {activityStreak === 1 ? 'dia' : 'dias'}
            </strong>
          </span>
          <span class="inline-flex items-center gap-2">
            <Icon name="target" size={14} class="text-success-emphasis" />
            Meta:{' '}
            <strong class="font-semibold text-content-primary">
              {goalStreak} {goalStreak === 1 ? 'dia' : 'dias'}
            </strong>
          </span>
        </div>
      </div>

      {controls && (
        <details class="heatmap-filters" open={filtersActive}>
          <summary>Filtros do mapa{filtersActive ? ' (ativos)' : ''}</summary>
          <div class="heatmap-toolbar">
            <select
              aria-label="Métrica do heatmap"
              data-delegated-change="setHeatmapFilter('metric',this.value)"
            >
              {HEATMAP_METRICS.map(([value, label]) => (
                <option key={value} value={value} selected={metric === value}>
                  {label}
                </option>
              ))}
            </select>
            <select
              aria-label="Disciplina do heatmap"
              data-delegated-change="setHeatmapFilter('subjectId',this.value)"
            >
              <option value="">Todas as disciplinas</option>
              {controls.subjects.map(subject => (
                <option
                  key={subject.id}
                  value={subject.id}
                  selected={controls.subjectId === subject.id}
                >
                  {subject.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              class="btn ghost small"
              aria-pressed={controls.onlyActiveDays}
              data-delegated-click="toggleStreakActiveDays()"
            >
              {controls.onlyActiveDays ? 'Mostrar todos os dias' : 'Apenas dias com atividade'}
            </button>
          </div>
        </details>
      )}

      {/* Visão 1: Calendário Contínuo Estilo GitHub / EasyUI */}
      {isCalendar && calendarVisual && (
        <div class="space-y-2">
          <div class="lg:flex lg:items-start lg:gap-8">
            <div class="min-w-0 flex-1 overflow-x-auto pb-2">
              <div class="inline-flex flex-col min-w-[580px]">
                {/* Linha com os rótulos de meses */}
                <div class="relative h-4 mb-1 pl-8 text-xs text-content-secondary font-mono">
                  {calendarVisual.monthLabels.map(m => (
                    <span
                      key={`month-${m.label}-${m.weekIndex}`}
                      class="absolute"
                      style={{
                        left: `calc(32px + ${m.weekIndex} * (var(--hm-cell) + var(--hm-gap)))`,
                      }}
                    >
                      {m.label}
                    </span>
                  ))}
                </div>

                {/* Grade de 7 dias com rótulos à esquerda */}
                <div class="flex items-start gap-2">
                  {/* Rótulos dos dias da semana (Seg, Qua, Sex) */}
                  <div class="heatmap-weekdays flex flex-col justify-between text-xs text-content-secondary font-mono select-none">
                    <span class="leading-none">Seg</span>
                    <span class="leading-none">Qua</span>
                    <span class="leading-none">Sex</span>
                  </div>

                  {/* Grid de células do calendário */}
                  <div
                    class="heatmap-grid"
                    role="group"
                    aria-label="Grade de consistência diária de estudos. Use as setas para percorrer os dias."
                    data-heatmap-grid
                  >
                    {calendarVisual.days.map(day => (
                      <button
                        key={`day-${day.date}`}
                        type="button"
                        class={`heatmap-cell heat-${day.level} ${day.selected ? 'selected' : ''}`}
                        title={day.tooltip}
                        aria-label={day.tooltip}
                        aria-pressed={day.selected}
                        tabIndex={day.date === tabStopDate ? 0 : -1}
                        data-heatmap-date={day.date}
                        data-delegated-click={`selectHeatmapDay('${day.date}')`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
            {hasActivity && insights && (
              <dl
                class="heatmap-insights mt-3 lg:mt-0 lg:w-60 lg:shrink-0 lg:border-l lg:border-border-subtle lg:pl-6 grid grid-cols-1 gap-3 text-xs"
                aria-label="Resumo do período exibido"
              >
                <div>
                  <dt class="text-content-secondary">Dias com atividade</dt>
                  <dd class="m-0 font-data font-semibold text-sm text-content-primary">
                    {insights.activeDays} de {insights.totalDays}
                  </dd>
                </div>
                <div>
                  <dt class="text-content-secondary">Maior sequência no período</dt>
                  <dd class="m-0 font-data font-semibold text-sm text-content-primary">
                    {insights.bestRun} {insights.bestRun === 1 ? 'dia' : 'dias'}
                  </dd>
                </div>
                <div>
                  <dt class="text-content-secondary">Dia da semana mais ativo</dt>
                  <dd class="m-0 font-semibold text-sm text-content-primary">
                    {insights.topWeekday}
                  </dd>
                </div>
              </dl>
            )}
          </div>

          {hasActivity && isCalendar && (
            <details class="performance-more heatmap-weekly-text">
              <summary>Dias com atividade por semana, em texto</summary>
              <ul class="m-0 mt-2 pl-4 text-xs text-content-secondary">
                {weeklyActivity(days).map(week => (
                  <li key={week.start}>
                    Semana de {week.start.slice(8, 10)}/{week.start.slice(5, 7)}: {week.active} de{' '}
                    {week.total} {week.total === 1 ? 'dia' : 'dias'} com atividade
                  </li>
                ))}
              </ul>
            </details>
          )}

          {!hasActivity && (
            <div class="empty-inline heatmap-empty p-3 rounded-default bg-surface-ground text-center text-xs text-content-secondary">
              <p>Nenhuma atividade encontrada para este indicador e disciplina.</p>
              <button
                class="btn ghost small mt-2"
                type="button"
                data-delegated-click="focusStudyTimer()"
              >
                Iniciar estudo
              </button>
            </div>
          )}
        </div>
      )}

      {/* Visão 2: Matriz 7 Dias da Semana × 24 Horas do Dia */}
      {!isCalendar && hoursVisual && (
        <div class="space-y-3">
          <div class="w-full overflow-x-auto pb-2">
            <div class="inline-flex flex-col min-w-[580px] space-y-2">
              {/* Cabeçalho com marcadores de hora */}
              <div class="flex items-center pl-10 text-xs font-mono text-content-secondary">
                <div class="grid grid-cols-24 gap-1 w-full">
                  {Array.from({ length: 24 }, (_, h) => {
                    const isMarker = h % 4 === 0;
                    return (
                      <span
                        key={`hour-header-${h}`}
                        class="text-center truncate"
                        title={`${String(h).padStart(2, '0')}:00`}
                      >
                        {isMarker ? `${String(h).padStart(2, '0')}h` : ''}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* 7 Linhas de dias da semana */}
              {hoursVisual.rows.map(row => (
                <div key={`hours-row-${row.weekdayIndex}`} class="flex items-center gap-2">
                  <span class="w-8 text-xs font-mono font-medium text-content-secondary text-right select-none">
                    {row.weekdayName}
                  </span>
                  <div class="grid grid-cols-24 gap-1 flex-1">
                    {row.cells.map(cell => {
                      const tooltip = `${cell.weekdayName} às ${cell.hourLabel}: ${cell.minutes} min estudados (${cell.sessionsCount} ${cell.sessionsCount === 1 ? 'sessão' : 'sessões'})`;
                      return (
                        <div
                          key={`hour-cell-${cell.weekdayIndex}-${cell.hour}`}
                          class={`h-4 rounded-xs heat-${cell.level}`}
                          title={tooltip}
                          aria-label={tooltip}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card de Insights Circadianos */}
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-border-subtle text-xs">
            <div class="p-3 rounded-default bg-surface-subtle border border-border-subtle">
              <span class="text-content-secondary text-xs font-medium block mb-1">
                Horário de Maior Foco
              </span>
              <strong class="text-base font-semibold font-data text-amber">
                {hoursVisual.peakHour !== null
                  ? `${String(hoursVisual.peakHour).padStart(2, '0')}:00`
                  : '—'}
              </strong>
            </div>
            <div class="p-3 rounded-default bg-surface-subtle border border-border-subtle">
              <span class="text-content-secondary text-xs font-medium block mb-1">
                Dia Mais Produtivo
              </span>
              <strong class="text-base font-semibold text-content-primary">
                {hoursVisual.peakWeekday || '—'}
              </strong>
            </div>
            <div class="p-3 rounded-default bg-surface-subtle border border-border-subtle">
              <span class="text-content-secondary text-xs font-medium block mb-1">
                Tempo Total Mapeado
              </span>
              <strong class="text-base font-semibold font-data text-content-primary">
                {formatDecimal(hoursVisual.totalStudyMinutes / 60, 1)}h
              </strong>
            </div>
          </div>
        </div>
      )}

      {/* Detalhamento do Dia Selecionado */}
      {selectedDate && selectedTooltip && (
        <div
          class="heatmap-detail p-3 rounded-default bg-surface-ground border border-border-subtle flex flex-wrap items-center justify-between gap-2 text-xs"
          role="status"
        >
          <span class="text-content-primary font-medium">{selectedTooltip}</span>
          <button
            class="btn ghost small"
            type="button"
            data-delegated-click="viewSelectedHeatmapSessions()"
          >
            Ver sessões deste dia
          </button>
        </div>
      )}

      {/* Rodapé com Legenda de Intensidade */}
      <div class="flex flex-wrap items-center justify-between gap-2 text-xs text-content-secondary pt-2 border-t border-border-subtle">
        <span>
          {metric === 'hours'
            ? 'Cores: abaixo de 50% · 50% a 99% · 100% ou mais da meta diária (sem meta: menos de 1 h · 1 a 2 h · mais de 2 h)'
            : 'Intensidade relativa da atividade selecionada'}
        </span>

        <div class="flex items-center gap-2" aria-hidden="true">
          <span>Menos</span>
          <span class="heatmap-cell heat-0 inline-block" title="Nenhuma atividade" />
          <span class="heatmap-cell heat-1 inline-block" title="Nível 1" />
          <span class="heatmap-cell heat-2 inline-block" title="Nível 2" />
          <span class="heatmap-cell heat-3 inline-block" title="Nível 3" />
          <span class="heatmap-cell heat-4 inline-block" title="Meta atingida" />
          <span>Mais</span>
        </div>
      </div>
    </div>
  );
}
