import type { ComponentChildren, JSX } from 'preact';
import { useEffect, useId, useMemo, useRef, useState } from 'preact/hooks';
import { Icon } from './icon.js';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export type SelectFieldProps = Omit<JSX.IntrinsicElements['select'], 'size' | 'role'> & {
  label: string;
  hideLabel?: boolean;
  inline?: boolean;
  options?: SelectOption[];
  placeholder?: string;
  hint?: string;
  error?: string;
  size?: 'default' | 'compact';
  fullWidth?: boolean;
  className?: string;
  selectClassName?: string;
  children?: ComponentChildren;
};

export function SelectField({
  label,
  hideLabel = false,
  inline = false,
  options,
  placeholder,
  hint,
  error,
  size = 'default',
  fullWidth = false,
  id,
  className = '',
  selectClassName = '',
  children,
  ...rest
}: SelectFieldProps) {
  const generatedId = useId();
  const selectId = id || generatedId;
  const hintId = `${selectId}-hint`;
  const errorId = `${selectId}-error`;
  const describedBy =
    [hint ? hintId : '', error ? errorId : ''].filter(Boolean).join(' ') || undefined;

  const rootClass = [
    'ui-select-field',
    inline ? 'ui-select-field--inline' : '',
    fullWidth ? 'w-full' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');
  const controlClass = [
    'select-control ui-select-field__control',
    size === 'compact' ? 'select-control--compact ui-select-field__control--compact' : '',
    fullWidth ? 'select-control--wide' : '',
    selectClassName,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div class={rootClass}>
      <label for={selectId} class={hideLabel ? 'sr-only' : 'ui-select-field__label'}>
        {label}
      </label>
      <select
        id={selectId}
        class={controlClass}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={describedBy}
        {...rest}
      >
        {placeholder !== undefined && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options
          ? options.map(opt => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))
          : children}
      </select>
      {hint && (
        <p id={hintId} class="ui-field__hint">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} class="ui-field__error" role="alert">
          <Icon name="alert-circle" size={14} class="shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}

export interface ComboboxOption {
  value: string;
  label: string;
  detail?: string;
  disabled?: boolean;
}

/**
 * Normaliza termo de busca removendo acentos e espaços redundantes.
 */
export function normalizeComboboxQuery(text: string): string {
  return String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

/**
 * Filtra opções do Combobox comparando rótulo e detalhe sem sensibilidade a acento/caixa.
 */
export function filterComboboxOptions(options: ComboboxOption[], query: string): ComboboxOption[] {
  const normalized = normalizeComboboxQuery(query);
  if (!normalized) return options;
  return options.filter(option => {
    const haystack = `${normalizeComboboxQuery(option.label)} ${normalizeComboboxQuery(option.detail || '')}`;
    return haystack.includes(normalized);
  });
}

export interface ComboboxProps {
  label: string;
  hideLabel?: boolean;
  options: ComboboxOption[];
  value?: string;
  onChange?: (value: string, option: ComboboxOption | null) => void;
  placeholder?: string;
  emptyMessage?: string;
  emptyValueAsPlaceholder?: boolean;
  clearable?: boolean;
  disabled?: boolean;
  error?: string;
  hint?: string;
  id?: string;
  defaultOpen?: boolean;
  className?: string;
}

export function Combobox({
  label,
  hideLabel = false,
  options,
  value = '',
  onChange,
  placeholder = 'Buscar...',
  emptyMessage = 'Nenhuma opção encontrada',
  emptyValueAsPlaceholder = false,
  clearable = true,
  disabled = false,
  error,
  hint,
  id,
  defaultOpen = false,
  className = '',
}: ComboboxProps) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const listboxId = `${inputId}-listbox`;
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;
  const selectedOption = options.find(opt => opt.value === value) || null;

  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [query, setQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const didMouseSelectRef = useRef(false);

  const filtered = useMemo(
    () => (isTyping ? filterComboboxOptions(options, query) : options),
    [options, isTyping, query]
  );

  const displayText = isTyping
    ? query
    : emptyValueAsPlaceholder && !value
      ? ''
      : selectedOption?.label || '';

  useEffect(() => {
    if (!isOpen) {
      didMouseSelectRef.current = false;
      return undefined;
    }
    if (typeof document === 'undefined') return undefined;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (rootRef.current && target && !rootRef.current.contains(target)) {
        setIsOpen(false);
        setIsTyping(false);
        setActiveIndex(-1);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [isOpen]);

  const selectOption = (option: ComboboxOption) => {
    if (option.disabled) return;
    onChange?.(option.value, option);
    setQuery(option.label);
    setIsTyping(false);
    setIsOpen(false);
    setActiveIndex(-1);
  };

  const findNextEnabledIndex = (fromIndex: number, step: 1 | -1): number => {
    if (filtered.length === 0) return -1;
    const start = fromIndex < 0 ? (step > 0 ? 0 : filtered.length - 1) : fromIndex + step;
    for (let offset = 0; offset < filtered.length; offset += 1) {
      const idx = (start + offset * step + filtered.length * filtered.length) % filtered.length;
      if (!filtered[idx]?.disabled) return idx;
    }
    return -1;
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (disabled) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        setActiveIndex(findNextEnabledIndex(-1, 1));
      } else {
        setActiveIndex(findNextEnabledIndex(activeIndex, 1));
      }
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        setActiveIndex(findNextEnabledIndex(-1, -1));
      } else {
        setActiveIndex(findNextEnabledIndex(activeIndex, -1));
      }
    } else if (event.key === 'Enter' && isOpen) {
      const activeOption = filtered[activeIndex];
      if (activeOption && !activeOption.disabled) {
        event.preventDefault();
        selectOption(activeOption);
      }
    } else if (event.key === 'Escape' && isOpen) {
      event.preventDefault();
      event.stopPropagation();
      setIsOpen(false);
      setIsTyping(false);
      setActiveIndex(-1);
    }
  };

  const activeDescendantId =
    isOpen && activeIndex >= 0 && filtered[activeIndex]
      ? `${listboxId}-opt-${activeIndex}`
      : undefined;

  const describedBy =
    [hint ? hintId : '', error ? errorId : ''].filter(Boolean).join(' ') || undefined;
  const rootClass = ['ui-combobox', className].filter(Boolean).join(' ');

  return (
    <div ref={rootRef} class={rootClass}>
      <label for={inputId} class={hideLabel ? 'sr-only' : 'ui-combobox__label'}>
        {label}
      </label>

      <div class="ui-combobox__control">
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          role="combobox"
          autocomplete="off"
          disabled={disabled}
          value={displayText}
          data-selected-value={value}
          placeholder={placeholder}
          aria-autocomplete="list"
          aria-expanded={isOpen ? 'true' : 'false'}
          aria-controls={isOpen ? listboxId : undefined}
          aria-activedescendant={activeDescendantId}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={describedBy}
          class="ui-combobox__input"
          onFocus={() => {
            if (!disabled) setIsOpen(true);
          }}
          onClick={() => {
            if (!disabled && !isOpen) setIsOpen(true);
          }}
          onInput={event => {
            setIsTyping(true);
            setQuery((event.target as HTMLInputElement).value);
            setIsOpen(true);
            setActiveIndex(0);
          }}
          onKeyDown={handleKeyDown}
        />

        <div class="ui-combobox__actions">
          {clearable && Boolean(value || (isTyping && query)) && !disabled && (
            <button
              type="button"
              class="ui-combobox__icon-btn"
              aria-label="Limpar seleção"
              onClick={() => {
                onChange?.('', null);
                setQuery('');
                setIsTyping(false);
                setActiveIndex(-1);
                inputRef.current?.focus();
              }}
            >
              <Icon name="x" size={14} />
            </button>
          )}
          <button
            type="button"
            tabIndex={-1}
            disabled={disabled}
            class="ui-combobox__icon-btn"
            aria-label={isOpen ? 'Recolher opções' : 'Abrir opções'}
            onClick={() => {
              if (disabled) return;
              const nextOpen = !isOpen;
              setIsOpen(nextOpen);
              if (nextOpen) {
                inputRef.current?.focus();
              }
            }}
          >
            <Icon name={isOpen ? 'chevron-up' : 'chevron-down'} size={15} />
          </button>
        </div>

        {isOpen && (
          <ul id={listboxId} role="listbox" aria-label={label} class="ui-combobox__listbox">
            {filtered.length === 0 ? (
              <li class="ui-combobox__empty" role="presentation">
                {emptyMessage}
              </li>
            ) : (
              filtered.map((option, index) => {
                const isSelected = option.value === value;
                const isActive = index === activeIndex;
                return (
                  <li
                    key={option.value}
                    id={`${listboxId}-opt-${index}`}
                    role="option"
                    data-option-value={option.value}
                    aria-selected={isSelected ? 'true' : 'false'}
                    aria-disabled={option.disabled ? 'true' : undefined}
                    class={['ui-combobox__option', isActive ? 'ui-combobox__option--active' : '']
                      .filter(Boolean)
                      .join(' ')}
                    onMouseDown={event => {
                      event.preventDefault();
                      didMouseSelectRef.current = true;
                      selectOption(option);
                    }}
                    onClick={() => {
                      if (didMouseSelectRef.current) {
                        didMouseSelectRef.current = false;
                        return;
                      }
                      selectOption(option);
                    }}
                  >
                    <span class="flex flex-col min-w-0">
                      <span class="truncate">{option.label}</span>
                      {option.detail && (
                        <span class="text-xs font-data text-secondary">{option.detail}</span>
                      )}
                    </span>
                    {isSelected && <Icon name="check" size={14} class="shrink-0 text-accent" />}
                  </li>
                );
              })
            )}
          </ul>
        )}
      </div>

      {hint && (
        <p id={hintId} class="ui-field__hint">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} class="ui-field__error" role="alert">
          <Icon name="alert-circle" size={14} class="shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}
