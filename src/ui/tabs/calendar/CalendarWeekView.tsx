import type { JSX } from 'preact';
import { useState } from 'preact/hooks';
import {
  computeDailyCalendarLoad,
  getWeekDates,
  sortCalendarItemsForDay,
  type UnifiedCalendarItem,
} from '../../../domain/calendar/calendar-projection.js';
import { formatPlanMinutes } from '../../../core/format-duration.js';
import { parseLocalDate } from '../../../core/date-utils.js';
import { CALENDAR_ACTIVITY_LABELS } from '../../../state/schema.js';
import { Button } from '../../primitives/button.js';
import { Icon } from '../../primitives/icon.js';

export interface CalendarWeekViewProps {
  anchorDate: string;
  today: string;
  selectedDate: string | null;
  items: UnifiedCalendarItem[];
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onTodayWeek: () => void;
  onSelectDate: (date: string) => void;
  onAddForDate: (date: string) => void;
  onEditItem: (id: string) => void;
  onRescheduleItem: (id: string, newDate: string) => void;
}

const WEEKDAY_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export function CalendarWeekView({
  anchorDate,
  today,
  selectedDate,
  items,
  onPrevWeek,
  onNextWeek,
  onTodayWeek,
  onSelectDate,
  onAddForDate,
  onEditItem,
  onRescheduleItem,
}: CalendarWeekViewProps): JSX.Element {
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);
  const weekDates = getWeekDates(anchorDate || today);

  const rangeLabel = (() => {
    if (weekDates.length < 7) return '';
    const first = parseLocalDate(weekDates[0]);
    const last = parseLocalDate(weekDates[6]);
    if (!first || !last) return '';
    const fmt = (d: Date) => d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    return `${fmt(first)} – ${fmt(last)}`;
  })();

  return (
    <div class="chart-card space-y-3" id="calendarWeekCard">
      <div class="calendar-month-toolbar">
        <button
          type="button"
          class="month-nav-btn inline-flex items-center justify-center"
          aria-label="Semana anterior"
          onClick={onPrevWeek}
        >
          <Icon name="chevron-left" size={16} />
        </button>
        <h3 class="m-0 font-serif text-base font-semibold text-content-primary">{rangeLabel}</h3>
        <button
          type="button"
          class="month-nav-btn inline-flex items-center justify-center"
          aria-label="Próxima semana"
          onClick={onNextWeek}
        >
          <Icon name="chevron-right" size={16} />
        </button>
        <Button type="button" variant="ghost" size="small" onClick={onTodayWeek}>
          Hoje
        </Button>
      </div>

      <p class="helper-text helper-text--compact m-0">
        Arraste compromissos entre os dias para reagendar ou clique em + para adicionar.
      </p>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-2">
        {weekDates.map(date => {
          const parsed = parseLocalDate(date);
          const weekday = parsed ? WEEKDAY_SHORT[parsed.getDay()] : '';
          const dayNum = parsed ? parsed.getDate() : date.slice(-2);
          const isToday = date === today;
          const isSelected = date === selectedDate;
          const isDropTarget = dragOverDate === date;
          const dayItems = sortCalendarItemsForDay(items.filter(item => item.date === date));
          const dayLoad = computeDailyCalendarLoad(items, date);

          return (
            <div
              key={date}
              data-calendar-drop-date={date}
              class={`rounded-lg border p-2.5 flex flex-col gap-2 min-h-[140px] transition-colors ${
                isDropTarget
                  ? 'border-brand bg-brand/5'
                  : isSelected
                    ? 'border-brand bg-surface-elevated'
                    : isToday
                      ? 'border-accent bg-surface-elevated'
                      : 'border-border bg-surface'
              }`}
              onDragOver={e => {
                e.preventDefault();
                if (dragOverDate !== date) setDragOverDate(date);
              }}
              onDragLeave={() => {
                if (dragOverDate === date) setDragOverDate(null);
              }}
              onDrop={e => {
                e.preventDefault();
                setDragOverDate(null);
                const draggedId = e.dataTransfer?.getData('text/plain');
                if (draggedId) {
                  onRescheduleItem(draggedId, date);
                }
              }}
            >
              <div class="flex items-center justify-between gap-1">
                <button
                  type="button"
                  onClick={() => onSelectDate(date)}
                  class="inline-flex items-center gap-1.5 text-left text-xs font-semibold text-content-primary hover:underline"
                >
                  <span class="text-content-secondary">{weekday}</span>
                  <span class="font-mono tabular-nums">{dayNum}</span>
                  {dayLoad.totalMinutes > 0 && (
                    <span class="font-mono tabular-nums text-xs font-normal text-content-secondary">
                      · {formatPlanMinutes(dayLoad.totalMinutes)}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  aria-label={`Adicionar atividade em ${date}`}
                  class="inline-flex items-center justify-center rounded-md p-1 text-content-secondary hover:bg-surface-elevated hover:text-content-primary"
                  onClick={() => onAddForDate(date)}
                >
                  <Icon name="plus" size={14} />
                </button>
              </div>

              <div class="space-y-1.5 flex-1">
                {dayItems.length === 0 ? (
                  <p class="text-xs text-content-secondary m-0">Livre</p>
                ) : (
                  dayItems.map(item => {
                    const kindText =
                      item.kind === 'review' ? 'Revisão' : CALENDAR_ACTIVITY_LABELS[item.kind] || 'Tarefa';
                    const isCompleted = item.status === 'Concluído';
                    return (
                      <button
                        key={item.key}
                        type="button"
                        draggable={item.isDraggable}
                        data-calendar-drag-id={item.isDraggable ? item.id : undefined}
                        onDragStart={e => {
                          if (!item.isDraggable || !e.dataTransfer) return;
                          e.dataTransfer.setData('text/plain', item.id);
                          e.dataTransfer.effectAllowed = 'move';
                        }}
                        onClick={() => {
                          if (item.origem === 'Calendário') onEditItem(item.id);
                          else onSelectDate(date);
                        }}
                        class={`w-full text-left rounded-md border px-2 py-1.5 text-xs transition-colors ${
                          item.isEvent
                            ? 'border-accent/50 bg-accent/10 text-content-primary'
                            : isCompleted
                              ? 'border-border bg-surface-elevated/60 text-content-secondary line-through'
                              : 'border-border bg-surface-elevated text-content-primary hover:border-brand/50'
                        }`}
                      >
                        <div class="flex items-center justify-between gap-1 text-xs text-content-secondary">
                          <span>{kindText}</span>
                          {item.startTime && (
                            <span class="font-mono tabular-nums">{item.startTime}</span>
                          )}
                        </div>
                        <div class="font-medium truncate">{item.title}</div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
