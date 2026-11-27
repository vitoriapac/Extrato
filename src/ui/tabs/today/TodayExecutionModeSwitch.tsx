import { SegmentedControl } from '../../primitives/tabs.js';
import { Button } from '../../primitives/button.js';
import { Icon } from '../../primitives/icon.js';

export type ExecutionMode = 'agenda' | 'sequence';

export interface TodayExecutionModeSwitchProps {
  value: ExecutionMode;
  onChange: (mode: ExecutionMode) => void;
  dailyFocusMode?: boolean;
  onToggleDailyFocus?: (next: boolean) => void;
}

export function TodayExecutionModeSwitch({
  value,
  onChange,
  dailyFocusMode = false,
  onToggleDailyFocus,
}: TodayExecutionModeSwitchProps) {
  return (
    <div class="flex flex-wrap items-center gap-2">
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
      {onToggleDailyFocus && (
        <Button
          id="dailyFocusToggleBtn"
          type="button"
          variant="ghost"
          size="small"
          className="daily-focus-toggle"
          aria-pressed={dailyFocusMode}
          onClick={() => onToggleDailyFocus(!dailyFocusMode)}
        >
          <Icon name="target" size={14} class="icon-inline" />
          Modo Foco
          {/* Preferência ligada/desligada, como em Preferências: não compete com Iniciar. */}
          <span class="daily-focus-toggle__state">{dailyFocusMode ? 'Ligado' : 'Desligado'}</span>
        </Button>
      )}
    </div>
  );
}
