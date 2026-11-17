import type { JSX } from 'preact';
import type { DailyCalendarLoad, UnifiedCalendarItem } from '../../../domain/calendar/calendar-projection.js';
import { CALENDAR_ACTIVITY_LABELS } from '../../../state/schema.js';
import { Button } from '../../primitives/button.js';
import { Icon } from '../../primitives/icon.js';

export interface CalendarDayDrawerProps {
  date: string | null;
  formattedDate: string;
  items: UnifiedCalendarItem[];
  load: DailyCalendarLoad;
  availableMinutes?: number;
  onAddForDate: (date: string) => void;
  onEditItem: (id: string) => void;
  onCompleteItem: (item: UnifiedCalendarItem) => void;
  onRescheduleItem: (id: string, newDate: string) => void;
  onStartTimer?: (item: UnifiedCalendarItem) => void;
  onRegisterSimulationResult?: (item: UnifiedCalendarItem) => void;
  onClose: () => void;
}

function kindLabel(kind: UnifiedCalendarItem['kind']): string {
  if (kind === 'review') return 'Revisão espaçada';
  return CALENDAR_ACTIVITY_LABELS[kind] || 'Tarefa';
}

function formatLoadMinutes(minutes: number): string {
  if (minutes <= 0) return '0 min estimados';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (!h) return `${m} min estimados`;
  return m ? `${h}h ${m}min estimados` : `${h}h estimadas`;
}

export function CalendarDayDrawer({
  date,
  formattedDate,
  items,
  load,
  availableMinutes = 0,
  onAddForDate,
  onEditItem,
  onCompleteItem,
  onRescheduleItem,
  onStartTimer,
  onRegisterSimulationResult,
  onClose,
}: CalendarDayDrawerProps): JSX.Element | null {
  if (!date) return null;
  const isOverloaded = availableMinutes > 0 && load.totalMinutes > availableMinutes;

  return (
    <section
      class="mt-4 rounded-xl border border-border bg-surface-elevated p-4 space-y-3"
      aria-label={`Compromissos de ${formattedDate}`}
    >
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h4 class="text-sm font-semibold text-content-primary m-0">
            {formattedDate}
          </h4>
          <p class="text-xs text-content-secondary m-0">
            {items.length} {items.length === 1 ? 'atividade' : 'atividades'} · {formatLoadMinutes(load.totalMinutes)}
            {availableMinutes > 0 ? ` · Disponível: ${formatLoadMinutes(availableMinutes).replace(' estimadas', '').replace(' estimados', '')}` : ''}
          </p>
        </div>
        <div class="flex items-center gap-2">
          <Button
            type="button"
            size="small"
            className="inline-flex items-center gap-1"
            onClick={() => onAddForDate(date)}
          >
            <Icon name="plus" size={14} />
            <span>Adicionar neste dia</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="small"
            aria-label="Fechar detalhes do dia"
            onClick={onClose}
          >
            <Icon name="x" size={14} />
          </Button>
        </div>
      </div>

      {isOverloaded && (
        <div
          role="status"
          class="rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-content-primary"
        >
          Carga estimada acima da sua disponibilidade declarada para este dia da semana. Considere reagendar alguma atividade.
        </div>
      )}

      {load.conflicts.length > 0 && (
        <div
          role="status"
          class="rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-content-primary"
        >
          Conflito de horário detectado entre{' '}
          <strong>{load.conflicts[0].first.title}</strong> e{' '}
          <strong>{load.conflicts[0].second.title}</strong>.
        </div>
      )}

      {items.length === 0 ? (
        <p class="text-xs text-content-secondary py-2 m-0">
          Nenhum compromisso programado para esta data.
        </p>
      ) : (
        <ul class="space-y-2 m-0 p-0 list-none">
          {items.map(item => {
            const isCompleted = item.status === 'Concluído';
            const canEdit = item.origem === 'Calendário';
            return (
              <li
                key={item.key}
                class="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-surface px-3 py-2"
              >
                <div class="min-w-0 flex-1 space-y-0.5">
                  <div class="flex flex-wrap items-center gap-2">
                    <span class="inline-flex items-center rounded-md border border-border bg-surface-elevated px-1.5 py-0.5 text-[11px] font-medium text-content-secondary">
                      {kindLabel(item.kind)}
                    </span>
                    {item.startTime && (
                      <span class="inline-flex items-center gap-1 text-xs text-content-secondary">
                        <Icon name="clock" size={12} />
                        {item.startTime}
                        {item.endTime ? `–${item.endTime}` : ''}
                      </span>
                    )}
                    <strong
                      class={`text-sm font-medium ${isCompleted ? 'line-through text-content-secondary' : 'text-content-primary'}`}
                    >
                      {item.title}
                    </strong>
                  </div>
                  {(item.subject || item.location) && (
                    <div class="text-xs text-content-secondary">
                      {[item.subject, item.location].filter(Boolean).join(' · ')}
                    </div>
                  )}
                </div>

                <div class="flex flex-wrap items-center gap-1.5">
                  {!isCompleted && !item.isEvent && !item.isRecurringInstance && (
                    <Button
                      type="button"
                      size="small"
                      variant="secondary"
                      className="inline-flex items-center gap-1"
                      onClick={() => onCompleteItem(item)}
                    >
                      <Icon name="check" size={13} />
                      <span>Concluir</span>
                    </Button>
                  )}
                  {!isCompleted &&
                    !item.isEvent &&
                    item.kind !== 'mock_exam' &&
                    onStartTimer && (
                      <Button
                        type="button"
                        size="small"
                        variant="ghost"
                        className="inline-flex items-center gap-1"
                        onClick={() => onStartTimer(item)}
                      >
                        <Icon name="clock" size={13} />
                        <span>Iniciar</span>
                      </Button>
                    )}
                  {item.kind === 'mock_exam' &&
                    item.origem === 'Calendário' &&
                    !item.linkedSimulationId &&
                    onRegisterSimulationResult && (
                      <Button
                        type="button"
                        size="small"
                        variant="ghost"
                        onClick={() => onRegisterSimulationResult(item)}
                      >
                        Registrar resultado
                      </Button>
                    )}
                  {canEdit && !item.isRecurringInstance && (
                    <>
                      <Button
                        type="button"
                        size="small"
                        variant="ghost"
                        onClick={() => onEditItem(item.id)}
                      >
                        Editar
                      </Button>
                      <label class="sr-only" for={`reschedule-${item.id}`}>
                        Reagendar data de {item.title}
                      </label>
                      <input
                        id={`reschedule-${item.id}`}
                        type="date"
                        value={item.date}
                        title="Reagendar para outra data"
                        aria-label={`Reagendar data de ${item.title}`}
                        onChange={e => {
                          const nextDate = (e.currentTarget as HTMLInputElement).value;
                          if (nextDate && nextDate !== item.date) {
                            onRescheduleItem(item.id, nextDate);
                          }
                        }}
                        class="rounded border border-border bg-surface px-1.5 py-1 text-xs text-content-secondary"
                      />
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
