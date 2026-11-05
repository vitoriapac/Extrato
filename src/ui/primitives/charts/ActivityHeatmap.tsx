import type { JSX } from 'preact';
import { Icon } from '../icon.js';
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
}: ActivityHeatmapProps): JSX.Element {
  const isCalendar = mode === 'calendar';

  return (
    <div
      class={`activity-heatmap-container space-y-3.5 p-4 rounded-xl bg-surface-elevated border border-border-default shadow-xs ${className}`}
      role="region"
      aria-label="Mapa de calor de consistência e hábitos de estudo"
    >
      {/* Topo com seletor de modo e atalhos rápidos */}
      <div class="flex flex-wrap items-center justify-between gap-3 text-xs border-b border-border-subtle pb-3">
        {/* Seletor de Modo (Calendário vs Horários do Dia) */}
        <div class="inline-flex items-center p-0.5 rounded-lg bg-surface-sunken border border-border-subtle" role="tablist" aria-label="Visualização do heatmap">
          <button
            type="button"
            role="tab"
            aria-selected={isCalendar}
            data-delegated-click="setHeatmapMode('calendar')"
            class={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md font-medium text-xs transition-all ${
              isCalendar
                ? 'bg-surface-elevated text-content-primary shadow-xs font-semibold'
                : 'text-content-secondary hover:text-content-primary'
            }`}
          >
            <Icon name="calendar" size={13} stroke={2} />
            Calendário contínuo
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={!isCalendar}
            data-delegated-click="setHeatmapMode('hours')"
            class={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md font-medium text-xs transition-all ${
              !isCalendar
                ? 'bg-surface-elevated text-content-primary shadow-xs font-semibold'
                : 'text-content-secondary hover:text-content-primary'
            }`}
          >
            <Icon name="clock" size={13} stroke={2} />
            Horários do dia (24h)
          </button>
        </div>

        {/* Resumo de Streaks */}
        <div class="flex items-center gap-3 text-xs text-content-secondary">
          <span class="inline-flex items-center gap-1.5">
            <Icon name="flame" size={14} class="text-warning-emphasis" />
            Atividade: <strong class="font-bold text-content-primary">{activityStreak} {activityStreak === 1 ? 'dia' : 'dias'}</strong>
          </span>
          <span class="inline-flex items-center gap-1.5">
            <Icon name="target" size={14} class="text-success-emphasis" />
            Meta: <strong class="font-bold text-content-primary">{goalStreak} {goalStreak === 1 ? 'dia' : 'dias'}</strong>
          </span>
        </div>
      </div>

      {/* Visão 1: Calendário Contínuo Estilo GitHub / EasyUI */}
      {isCalendar && calendarVisual && (
        <div class="space-y-2">
          <div class="w-full overflow-x-auto pb-2">
            <div class="inline-flex flex-col min-w-[580px]">
              {/* Linha com os rótulos de meses */}
              <div class="relative h-4 mb-1 pl-8 text-[10px] text-content-secondary font-mono">
                {calendarVisual.monthLabels.map(m => (
                  <span
                    key={`month-${m.label}-${m.weekIndex}`}
                    class="absolute"
                    style={{ left: `${32 + m.weekIndex * 17}px` }}
                  >
                    {m.label}
                  </span>
                ))}
              </div>

              {/* Grade de 7 dias com rótulos à esquerda */}
              <div class="flex items-start gap-2">
                {/* Rótulos dos dias da semana (Seg, Qua, Sex) */}
                <div class="flex flex-col justify-between h-[116px] text-[10px] text-content-secondary font-mono select-none pt-0.5">
                  <span class="h-3.5 leading-none">Seg</span>
                  <span class="h-3.5 leading-none">Qua</span>
                  <span class="h-3.5 leading-none">Sex</span>
                </div>

                {/* Grid de células do calendário */}
                <div
                  class="heatmap-grid"
                  role="grid"
                  aria-label="Grade de consistência diária de estudos"
                >
                  {calendarVisual.days.map(day => (
                    <button
                      key={`day-${day.date}`}
                      type="button"
                      role="gridcell"
                      class={`heatmap-cell heat-${day.level} ${day.selected ? 'selected' : ''}`}
                      title={day.tooltip}
                      aria-label={day.tooltip}
                      data-delegated-click={`selectHeatmapDay('${day.date}')`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {!hasActivity && (
            <div class="empty-inline heatmap-empty p-3 rounded-lg bg-surface-ground text-center text-xs text-content-secondary">
              <p>Nenhuma atividade encontrada para este indicador e disciplina.</p>
              <button
                class="btn ghost small mt-1.5"
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
            <div class="inline-flex flex-col min-w-[580px] space-y-1.5">
              {/* Cabeçalho com marcadores de hora */}
              <div class="flex items-center pl-10 text-[10px] font-mono text-content-secondary">
                <div class="grid grid-cols-24 gap-[3px] w-full">
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
                  <span class="w-8 text-[11px] font-mono font-medium text-content-secondary text-right select-none">
                    {row.weekdayName}
                  </span>
                  <div class="grid grid-cols-24 gap-[3px] flex-1">
                    {row.cells.map(cell => {
                      const tooltip = `${cell.weekdayName} às ${cell.hourLabel}: ${cell.minutes} min estudados (${cell.sessionsCount} ${cell.sessionsCount === 1 ? 'sessão' : 'sessões'})`;
                      return (
                        <div
                          key={`hour-cell-${cell.weekdayIndex}-${cell.hour}`}
                          class={`h-3.5 rounded-[2.5px] transition-all hover:scale-125 hover:z-10 cursor-pointer heat-${cell.level}`}
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
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-border-subtle text-xs">
            <div class="p-2.5 rounded-lg bg-surface-ground border border-border-subtle">
              <span class="text-content-secondary text-[11px] block">Horário de Maior Foco</span>
              <strong class="text-sm font-mono text-content-primary">
                {hoursVisual.peakHour !== null ? `${String(hoursVisual.peakHour).padStart(2, '0')}:00` : '—'}
              </strong>
            </div>
            <div class="p-2.5 rounded-lg bg-surface-ground border border-border-subtle">
              <span class="text-content-secondary text-[11px] block">Dia Mais Produtivo</span>
              <strong class="text-sm font-medium text-content-primary">
                {hoursVisual.peakWeekday || '—'}
              </strong>
            </div>
            <div class="p-2.5 rounded-lg bg-surface-ground border border-border-subtle">
              <span class="text-content-secondary text-[11px] block">Tempo Total Mapeado</span>
              <strong class="text-sm font-mono text-content-primary">
                {Math.round((hoursVisual.totalStudyMinutes / 60) * 10) / 10}h
              </strong>
            </div>
          </div>
        </div>
      )}

      {/* Detalhamento do Dia Selecionado */}
      {selectedDate && selectedTooltip && (
        <div class="heatmap-detail p-3 rounded-lg bg-surface-ground border border-border-subtle flex flex-wrap items-center justify-between gap-2 text-xs" role="status">
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
      <div class="flex flex-wrap items-center justify-between gap-2 text-[11px] text-content-secondary pt-2 border-t border-border-subtle">
        <span>
          {metric === 'hours'
            ? 'Cores: <25% · 25–50% · 50–75% · ≥100% da meta diária'
            : 'Intensidade relativa da atividade selecionada'}
        </span>

        <div class="flex items-center gap-1.5" aria-hidden="true">
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
