import type { ComponentChildren, JSX } from 'preact';
import { useId, useRef, useState } from 'preact/hooks';
import { Icon, type IconName } from './icon.js';

export type RovingOrientation = 'horizontal' | 'vertical';

/**
 * Calcula o próximo índice habilitado para navegação por teclado (`role="tablist"` ou `role="group"`).
 */
export function getRovingTabIndex(
  currentIndex: number,
  key: string,
  totalCount: number,
  orientation: RovingOrientation = 'horizontal',
  isDisabled: (index: number) => boolean = () => false
): number | null {
  if (totalCount <= 0) return null;

  const prevKey = orientation === 'horizontal' ? 'ArrowLeft' : 'ArrowUp';
  const nextKey = orientation === 'horizontal' ? 'ArrowRight' : 'ArrowDown';

  let step = 0;
  let start = currentIndex;

  if (key === nextKey) {
    step = 1;
    start = (currentIndex + 1) % totalCount;
  } else if (key === prevKey) {
    step = -1;
    start = (currentIndex - 1 + totalCount) % totalCount;
  } else if (key === 'Home') {
    step = 1;
    start = 0;
  } else if (key === 'End') {
    step = -1;
    start = totalCount - 1;
  } else {
    return null;
  }

  for (let offset = 0; offset < totalCount; offset += 1) {
    const candidate = (start + offset * step + totalCount * totalCount) % totalCount;
    if (!isDisabled(candidate)) {
      return candidate;
    }
  }

  return null;
}

export interface TabItem {
  id: string;
  label: string;
  icon?: IconName;
  badge?: string | number;
  disabled?: boolean;
  panel?: ComponentChildren;
}

export type TabsProps = Omit<JSX.IntrinsicElements['div'], 'onChange'> & {
  items: TabItem[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (id: string) => void;
  label: string;
  variant?: 'underline' | 'contained';
  keepMounted?: boolean;
  className?: string;
  listClassName?: string;
  panelClassName?: string;
};

export function Tabs({
  items,
  value,
  defaultValue,
  onValueChange,
  label,
  variant = 'underline',
  keepMounted = false,
  className = '',
  listClassName = '',
  panelClassName = '',
  ...rest
}: TabsProps) {
  const generatedId = useId();
  const firstEnabledId = items.find(item => !item.disabled)?.id ?? items[0]?.id ?? '';
  const [internalValue, setInternalValue] = useState<string>(defaultValue ?? firstEnabledId);
  const activeId = value !== undefined ? value : internalValue;
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const hasPanels = items.some(item => item.panel !== undefined);

  const selectTab = (id: string) => {
    if (value === undefined) {
      setInternalValue(id);
    }
    onValueChange?.(id);
  };

  const handleKeyDown = (index: number, event: KeyboardEvent) => {
    const nextIndex = getRovingTabIndex(index, event.key, items.length, 'horizontal', idx =>
      Boolean(items[idx]?.disabled)
    );
    if (nextIndex === null) return;
    event.preventDefault();
    const nextItem = items[nextIndex];
    if (!nextItem) return;
    selectTab(nextItem.id);
    tabRefs.current[nextIndex]?.focus();
  };

  const rootClass = ['ui-tabs', className].filter(Boolean).join(' ');
  const listClass = [
    'ui-tabs__list',
    variant === 'contained' ? 'ui-tabs__list--contained' : '',
    listClassName,
  ]
    .filter(Boolean)
    .join(' ');
  const panelBaseClass = ['ui-tabs__panel', panelClassName].filter(Boolean).join(' ');

  return (
    <div class={rootClass} {...rest}>
      <div role="tablist" aria-label={label} class={listClass}>
        {items.map((item, index) => {
          const isSelected = item.id === activeId;
          const tabId = `${generatedId}-tab-${item.id}`;
          const panelId = `${generatedId}-panel-${item.id}`;
          const controlsPanel =
            hasPanels && (isSelected || keepMounted) && item.panel !== undefined
              ? panelId
              : undefined;

          return (
            <button
              key={item.id}
              ref={el => {
                tabRefs.current[index] = el;
              }}
              type="button"
              role="tab"
              id={tabId}
              aria-selected={isSelected ? 'true' : 'false'}
              aria-controls={controlsPanel}
              tabIndex={isSelected ? 0 : -1}
              disabled={item.disabled}
              class="ui-tabs__tab"
              onClick={() => selectTab(item.id)}
              onKeyDown={event => handleKeyDown(index, event)}
            >
              {item.icon && <Icon name={item.icon} size={15} class="shrink-0" />}
              <span>{item.label}</span>
              {item.badge !== undefined && <span class="ui-tabs__badge">{item.badge}</span>}
            </button>
          );
        })}
      </div>

      {hasPanels &&
        items.map(item => {
          if (item.panel === undefined) return null;
          const isSelected = item.id === activeId;
          if (!keepMounted && !isSelected) return null;
          const tabId = `${generatedId}-tab-${item.id}`;
          const panelId = `${generatedId}-panel-${item.id}`;

          return (
            <div
              key={item.id}
              role="tabpanel"
              id={panelId}
              aria-labelledby={tabId}
              tabIndex={0}
              hidden={!isSelected}
              class={panelBaseClass}
            >
              {item.panel}
            </div>
          );
        })}
    </div>
  );
}

export interface SegmentedOption<T extends string = string> {
  value: T;
  label: string;
  icon?: IconName;
  disabled?: boolean;
}

export type SegmentedControlProps<T extends string = string> = Omit<
  JSX.IntrinsicElements['div'],
  'onChange'
> & {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  size?: 'sm' | 'md';
  fullWidth?: boolean;
  className?: string;
};

export function SegmentedControl<T extends string = string>({
  options,
  value,
  onChange,
  label,
  size = 'md',
  fullWidth = false,
  className = '',
  ...rest
}: SegmentedControlProps<T>) {
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const handleKeyDown = (index: number, event: KeyboardEvent) => {
    const nextIndex = getRovingTabIndex(index, event.key, options.length, 'horizontal', idx =>
      Boolean(options[idx]?.disabled)
    );
    if (nextIndex === null) return;
    event.preventDefault();
    const nextOption = options[nextIndex];
    if (!nextOption) return;
    onChange(nextOption.value);
    buttonRefs.current[nextIndex]?.focus();
  };

  const rootClass = [
    'ui-segmented',
    size === 'sm' ? 'ui-segmented--sm' : '',
    fullWidth ? 'ui-segmented--full' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div role="group" aria-label={label} class={rootClass} {...rest}>
      {options.map((option, index) => {
        const isPressed = option.value === value;
        return (
          <button
            key={option.value}
            ref={el => {
              buttonRefs.current[index] = el;
            }}
            type="button"
            aria-pressed={isPressed ? 'true' : 'false'}
            disabled={option.disabled}
            class="ui-segmented__item"
            onClick={() => onChange(option.value)}
            onKeyDown={event => handleKeyDown(index, event)}
          >
            {option.icon && <Icon name={option.icon} size={14} class="shrink-0" />}
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
