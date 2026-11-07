export type LedgerLineProps = {
  label: string;
  value: string;
  hint?: string;
  tone?: 'neutral' | 'negative' | 'positive';
  total?: boolean;
};

/** Linha de razão: rótulo, guia pontilhada decorativa e valor em texto (cor nunca é o único indicador). */
export function LedgerLine({ label, value, hint, tone = 'neutral', total = false }: LedgerLineProps) {
  const cls = ['ledger-line', total && 'ledger-line--total', tone !== 'neutral' && `is-${tone}`]
    .filter(Boolean)
    .join(' ');
  return (
    <div class={cls}>
      <span class="ledger-line__label">
        {label}
        {hint && <small>{hint}</small>}
      </span>
      <span class="ledger-line__lead" aria-hidden="true" />
      <span class="ledger-line__value">{value}</span>
    </div>
  );
}
