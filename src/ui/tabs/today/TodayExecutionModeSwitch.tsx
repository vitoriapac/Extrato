import { SegmentedControl } from '../../primitives/tabs.js';

export type ExecutionMode = 'agenda' | 'sequence';

export interface TodayExecutionModeSwitchProps {
  value: ExecutionMode;
  onChange: (mode: ExecutionMode) => void;
}

export function TodayExecutionModeSwitch({ value, onChange }: TodayExecutionModeSwitchProps) {
  return (
    <SegmentedControl<ExecutionMode>
      label="Modo de execução"
      size="sm"
      className="today-execution-mode-switch"
      value={value}
      onChange={onChange}
      options={[
        { value: 'sequence', label: 'Ciclo de estudos', id: 'executionSequenceBtn' },
        { value: 'agenda', label: 'Agenda do dia', id: 'executionAgendaBtn' },
      ]}
    />
  );
}
