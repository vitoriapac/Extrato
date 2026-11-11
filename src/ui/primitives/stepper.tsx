import {
  cloneElement,
  createContext,
  isValidElement,
  toChildArray,
  type ComponentChildren,
  type VNode,
} from 'preact';
import { useContext } from 'preact/hooks';
import { Icon, type IconName } from './icon.js';

export type StepperOrientation = 'horizontal' | 'vertical';
export type StepIndicatorMode = 'auto' | 'number' | 'none';
export type StepProgressState = 'completed' | 'current' | 'upcoming' | 'disabled';
export type StepStatus = 'default' | 'warning' | 'error';

/**
 * Deriva o estado progressivo de uma etapa a partir de `activeStep` (base 0).
 */
export function resolveStepState(
  index: number,
  activeStep: number,
  disabled = false
): StepProgressState {
  if (disabled) return 'disabled';
  if (index < activeStep) return 'completed';
  if (index === activeStep) return 'current';
  return 'upcoming';
}

interface StepperContextValue {
  activeStep: number;
  orientation: StepperOrientation;
  indicator: StepIndicatorMode;
  linear: boolean;
  totalSteps: number;
  onStepSelect?: (index: number) => void;
}

const StepperContext = createContext<StepperContextValue | null>(null);

export interface StepperProps {
  activeStep: number;
  orientation?: StepperOrientation;
  indicator?: StepIndicatorMode;
  linear?: boolean;
  showProgressBar?: boolean;
  compactSummary?: boolean;
  label?: string;
  onStepSelect?: (index: number) => void;
  className?: string;
  children?: ComponentChildren;
}

export function Stepper({
  activeStep,
  orientation = 'horizontal',
  indicator = 'auto',
  linear = true,
  showProgressBar = false,
  compactSummary = false,
  label = 'Progresso das etapas',
  onStepSelect,
  className = '',
  children,
}: StepperProps) {
  const stepNodes: VNode<StepProps>[] = [];
  for (const child of toChildArray(children)) {
    if (isValidElement(child) && child.type === Step) {
      stepNodes.push(child as VNode<StepProps>);
    }
  }

  const totalSteps = stepNodes.length;
  const clampedActive = totalSteps > 0 ? Math.max(0, Math.min(activeStep, totalSteps)) : 0;
  const activeNode = stepNodes[Math.min(clampedActive, Math.max(0, totalSteps - 1))];
  const progressPercent =
    totalSteps > 0 ? Math.round((Math.min(clampedActive + 1, totalSteps) / totalSteps) * 100) : 0;

  const ctxValue: StepperContextValue = {
    activeStep: clampedActive,
    orientation,
    indicator,
    linear,
    totalSteps,
    onStepSelect,
  };

  return (
    <StepperContext.Provider value={ctxValue}>
      <div
        class={[
          'ui-stepper-frame',
          orientation === 'vertical'
            ? 'ui-stepper-frame--vertical'
            : 'ui-stepper-frame--horizontal',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {compactSummary && totalSteps > 0 && activeNode && (
          <div class="ui-stepper__summary" aria-live="polite">
            <span class="ui-stepper__summary-count">
              Passo {Math.min(clampedActive + 1, totalSteps)} de {totalSteps}
            </span>
            <strong class="ui-stepper__summary-title">{activeNode.props.title}</strong>
          </div>
        )}

        {showProgressBar && totalSteps > 0 && (
          <div
            class="ui-stepper__progress"
            role="progressbar"
            aria-label={label}
            aria-valuenow={progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div class="ui-stepper__progress-fill" style={{ width: `${progressPercent}%` }} />
          </div>
        )}

        <ol
          aria-label={label}
          class={[
            'ui-stepper',
            orientation === 'vertical' ? 'ui-stepper--vertical' : 'ui-stepper--horizontal',
          ].join(' ')}
        >
          {stepNodes.map((node, index) =>
            cloneElement(node, {
              key: node.key ?? index,
              stepIndex: index,
            })
          )}
        </ol>
      </div>
    </StepperContext.Provider>
  );
}

export interface StepProps {
  title: string;
  description?: string;
  status?: StepStatus;
  disabled?: boolean;
  optionalLabel?: string;
  indicator?: StepIndicatorMode | ComponentChildren;
  icon?: IconName;
  stepIndex?: number;
  className?: string;
  children?: ComponentChildren;
}

export function Step({
  title,
  description = '',
  status = 'default',
  disabled = false,
  optionalLabel = '',
  indicator: stepIndicator,
  icon,
  stepIndex = 0,
  className = '',
  children,
}: StepProps) {
  const ctx = useContext(StepperContext);
  const activeStep = ctx?.activeStep ?? 0;
  const orientation = ctx?.orientation ?? 'horizontal';
  const totalSteps = ctx?.totalSteps ?? 1;
  const resolvedIndicatorMode = stepIndicator ?? ctx?.indicator ?? 'auto';
  const progressState = resolveStepState(stepIndex, activeStep, disabled);

  const isLast = stepIndex >= totalSteps - 1;
  const isClickable = Boolean(
    ctx?.onStepSelect && !disabled && (!ctx.linear || stepIndex <= activeStep)
  );

  const renderIndicatorContent = () => {
    if (resolvedIndicatorMode === 'none') return null;

    if (resolvedIndicatorMode !== 'auto' && resolvedIndicatorMode !== 'number') {
      return resolvedIndicatorMode;
    }

    if (status === 'error') {
      return <Icon name="alert-circle" size={14} />;
    }

    if (status === 'warning') {
      return <Icon name="alert-triangle" size={14} />;
    }

    if (icon) {
      return <Icon name={icon} size={14} />;
    }

    if (resolvedIndicatorMode === 'auto' && progressState === 'completed') {
      return <Icon name="check" size={14} />;
    }

    return <span class="ui-step__number">{stepIndex + 1}</span>;
  };

  const indicatorNode =
    resolvedIndicatorMode === 'none' ? null : (
      <span class="ui-step__indicator" aria-hidden="true">
        {renderIndicatorContent()}
      </span>
    );

  const labelsNode = (
    <span class="ui-step__labels">
      <span class="ui-step__title-row">
        <span class="ui-step__title">{title}</span>
        {optionalLabel && <span class="ui-step__optional">{optionalLabel}</span>}
      </span>
      {description && <span class="ui-step__description">{description}</span>}
    </span>
  );

  const itemClass = [
    'ui-step',
    `ui-step--${progressState}`,
    status !== 'default' ? `ui-step--status-${status}` : '',
    isClickable ? 'ui-step--clickable' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <li
      class={itemClass}
      data-step-state={progressState}
      data-step-status={status}
      aria-current={progressState === 'current' ? 'step' : undefined}
    >
      <div class="ui-step__row">
        {isClickable ? (
          <button
            type="button"
            class="ui-step__trigger"
            onClick={() => ctx?.onStepSelect?.(stepIndex)}
          >
            {indicatorNode}
            {labelsNode}
          </button>
        ) : (
          <div class="ui-step__trigger ui-step__trigger--static">
            {indicatorNode}
            {labelsNode}
          </div>
        )}
        {!isLast && (
          <span
            class={[
              'ui-step__connector',
              orientation === 'vertical'
                ? 'ui-step__connector--vertical'
                : 'ui-step__connector--horizontal',
              progressState === 'completed' ? 'ui-step__connector--done' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            aria-hidden="true"
          />
        )}
      </div>

      {children !== undefined && (
        <div
          class={[
            'ui-step__content',
            resolvedIndicatorMode === 'none' ? 'ui-step__content--flush' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {children}
        </div>
      )}
    </li>
  );
}
