import { SegmentedControl } from '../../primitives/tabs.js';

export type CalendarMobileView = 'month' | 'week' | 'agenda';

export interface CalendarViewSwitchProps {
  value: CalendarMobileView;
  onChange: (view: CalendarMobileView) => void;
}

export function CalendarViewSwitch({ value, onChange }: CalendarViewSwitchProps) {
  return (
    <SegmentedControl<CalendarMobileView>
      label="Visualização das tarefas"
      size="sm"
      className="calendar-view-switch"
      value={value}
      onChange={onChange}
      options={[
        {
          value: 'month',
          label: 'Mês',
          className: 'calendar-view-btn',
          buttonProps: { 'data-calendar-view': 'month' },
        },
        {
          value: 'week',
          label: 'Semana',
          className: 'calendar-view-btn',
          buttonProps: { 'data-calendar-view': 'week' },
        },
        {
          value: 'agenda',
          label: 'Lista',
          className: 'calendar-view-btn',
          buttonProps: { 'data-calendar-view': 'agenda' },
        },
      ]}
    />
  );
}
