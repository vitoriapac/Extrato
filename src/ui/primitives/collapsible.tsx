import { createContext, type ComponentChildren } from 'preact';
import { useContext, useId, useState } from 'preact/hooks';
import { Icon, type IconName } from './icon.js';

export type CollapsibleGroupType = 'single' | 'multiple';
export type CollapsibleDensity = 'compact' | 'balanced' | 'spacious';
export type CollapsibleChevronPosition = 'start' | 'end';

function normalizeExpandedValue(value: string | string[] | undefined): string[] {
  if (value === undefined) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  return value ? [value] : [];
}

/**
 * Calcula o próximo conjunto de IDs expandidos para um `CollapsibleGroup`.
 */
export function toggleCollapsibleGroupValue(
  currentIds: string[],
  itemId: string,
  type: CollapsibleGroupType = 'single',
  allowEmpty = true
): string[] {
  const isAlreadyOpen = currentIds.includes(itemId);
  if (type === 'multiple') {
    return isAlreadyOpen ? currentIds.filter(id => id !== itemId) : [...currentIds, itemId];
  }
  if (isAlreadyOpen) {
    return allowEmpty ? [] : [itemId];
  }
  return [itemId];
}

export interface UseCollapsibleOptions {
  open?: boolean;
  defaultOpen?: boolean;
  disabled?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function useCollapsible({
  open: controlledOpen,
  defaultOpen = false,
  disabled = false,
  onOpenChange,
}: UseCollapsibleOptions = {}) {
  const generatedId = useId();
  const triggerId = `${generatedId}-trigger`;
  const panelId = `${generatedId}-panel`;
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;

  const setOpen = (next: boolean) => {
    if (disabled) return;
    if (controlledOpen === undefined) {
      setInternalOpen(next);
    }
    onOpenChange?.(next);
  };

  const toggle = () => setOpen(!isOpen);

  return {
    isOpen,
    setOpen,
    toggle,
    triggerProps: {
      id: triggerId,
      type: 'button' as const,
      disabled,
      'aria-expanded': isOpen ? ('true' as const) : ('false' as const),
      'aria-controls': isOpen ? panelId : undefined,
      onClick: toggle,
    },
    panelProps: {
      id: panelId,
      role: 'region' as const,
      'aria-labelledby': triggerId,
      hidden: !isOpen,
    },
  };
}

interface CollapsibleGroupContextValue {
  expandedIds: string[];
  toggleItem: (id: string) => void;
  density: CollapsibleDensity;
  hasDividers: boolean;
  chevronPosition: CollapsibleChevronPosition;
}

const CollapsibleGroupContext = createContext<CollapsibleGroupContextValue | null>(null);

export interface CollapsibleGroupProps {
  type?: CollapsibleGroupType;
  value?: string | string[];
  defaultValue?: string | string[];
  onChange?: (value: string | string[]) => void;
  density?: CollapsibleDensity;
  hasDividers?: boolean;
  chevronPosition?: CollapsibleChevronPosition;
  collapsible?: boolean;
  className?: string;
  children?: ComponentChildren;
}

export function CollapsibleGroup({
  type = 'single',
  value: controlledValue,
  defaultValue,
  onChange,
  density = 'balanced',
  hasDividers = true,
  chevronPosition = 'end',
  collapsible = true,
  className = '',
  children,
}: CollapsibleGroupProps) {
  const [internalIds, setInternalIds] = useState<string[]>(() =>
    normalizeExpandedValue(defaultValue)
  );
  const expandedIds =
    controlledValue !== undefined ? normalizeExpandedValue(controlledValue) : internalIds;

  const toggleItem = (itemId: string) => {
    const nextIds = toggleCollapsibleGroupValue(expandedIds, itemId, type, collapsible);
    if (controlledValue === undefined) {
      setInternalIds(nextIds);
    }
    onChange?.(type === 'multiple' ? nextIds : (nextIds[0] ?? ''));
  };

  const groupClass = [
    'ui-collapsible-group',
    `ui-collapsible-group--${density}`,
    hasDividers ? 'ui-collapsible-group--dividers' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <CollapsibleGroupContext.Provider
      value={{
        expandedIds,
        toggleItem,
        density,
        hasDividers,
        chevronPosition,
      }}
    >
      <div class={groupClass}>{children}</div>
    </CollapsibleGroupContext.Provider>
  );
}

export interface CollapsibleProps {
  id?: string;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  title?: ComponentChildren;
  subtitle?: string;
  badge?: ComponentChildren;
  icon?: IconName;
  disabled?: boolean;
  chevronPosition?: CollapsibleChevronPosition;
  density?: CollapsibleDensity;
  keepMounted?: boolean;
  className?: string;
  children?: ComponentChildren;
}

export function Collapsible({
  id,
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  title,
  subtitle = '',
  badge,
  icon,
  disabled = false,
  chevronPosition: localChevronPosition,
  density: localDensity,
  keepMounted = false,
  className = '',
  children,
}: CollapsibleProps) {
  const groupCtx = useContext(CollapsibleGroupContext);
  const autoId = useId();
  const itemId = id || autoId;
  const triggerId = `${autoId}-trigger`;
  const panelId = `${autoId}-panel`;

  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isGrouped = Boolean(groupCtx && id);
  const isOpen = isGrouped
    ? groupCtx!.expandedIds.includes(itemId)
    : controlledOpen !== undefined
      ? controlledOpen
      : internalOpen;

  const density = localDensity ?? groupCtx?.density ?? 'balanced';
  const chevronPosition = localChevronPosition ?? groupCtx?.chevronPosition ?? 'end';

  const handleToggle = () => {
    if (disabled) return;
    const next = !isOpen;
    if (isGrouped) {
      groupCtx!.toggleItem(itemId);
      onOpenChange?.(next);
      return;
    }
    if (controlledOpen === undefined) {
      setInternalOpen(next);
    }
    onOpenChange?.(next);
  };

  const chevronIcon = (
    <Icon
      name="chevron-down"
      size={16}
      class={['ui-collapsible__chevron shrink-0', isOpen ? 'ui-collapsible__chevron--open' : '']
        .filter(Boolean)
        .join(' ')}
    />
  );

  const rootClass = [
    'ui-collapsible',
    `ui-collapsible--${density}`,
    isOpen ? 'ui-collapsible--open' : '',
    disabled ? 'ui-collapsible--disabled' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const shouldRenderPanel = keepMounted || isOpen;

  return (
    <div class={rootClass} data-open={isOpen ? 'true' : 'false'}>
      <button
        id={triggerId}
        type="button"
        disabled={disabled}
        aria-expanded={isOpen ? 'true' : 'false'}
        aria-controls={shouldRenderPanel ? panelId : undefined}
        class="ui-collapsible__trigger"
        onClick={handleToggle}
      >
        {chevronPosition === 'start' && chevronIcon}
        {icon && <Icon name={icon} size={16} class="ui-collapsible__icon shrink-0" />}
        <span class="ui-collapsible__heading">
          <span class="ui-collapsible__title-row">
            <span class="ui-collapsible__title">{title}</span>
            {badge}
          </span>
          {subtitle && <span class="ui-collapsible__subtitle">{subtitle}</span>}
        </span>
        {chevronPosition === 'end' && chevronIcon}
      </button>

      {shouldRenderPanel && (
        <div
          id={panelId}
          role="region"
          aria-labelledby={triggerId}
          hidden={keepMounted && !isOpen ? true : undefined}
          class="ui-collapsible__panel"
        >
          <div class="ui-collapsible__body">{children}</div>
        </div>
      )}
    </div>
  );
}
