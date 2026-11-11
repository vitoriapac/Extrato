import { Combobox, type ComboboxOption } from '../primitives/select-field.js';

export interface SubjectComboboxProps {
  id: string;
  label: string;
  options: ComboboxOption[];
  value: string;
  onChange: (value: string, option: ComboboxOption | null) => void;
  placeholder: string;
  disabled?: boolean;
  hideLabel?: boolean;
  className?: string;
}

export function SubjectCombobox({
  id,
  label,
  options,
  value,
  onChange,
  placeholder,
  disabled = false,
  hideLabel = true,
  className = '',
}: SubjectComboboxProps) {
  return (
    <Combobox
      id={id}
      label={label}
      hideLabel={hideLabel}
      options={options}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      emptyMessage="Nenhuma disciplina encontrada"
      emptyValueAsPlaceholder
      clearable
      disabled={disabled}
      className={className}
    />
  );
}
