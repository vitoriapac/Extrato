import { useState } from 'preact/hooks';
import type { JSX } from 'preact';
import { Dialog } from '../primitives/dialog.js';
import { Button } from '../primitives/button.js';
import type { SyllabusTriageItem } from '../../domain/planning/syllabus-triage.js';

export interface SyllabusTriageModalProps {
  open: boolean;
  onClose: () => void;
  triage: {
    budgetMinutes: number;
    neededMinutes: number;
    maintenanceMinutes: number;
    reviewBudgetPct: number;
    planMaintenanceMinutes: number;
    coveragePct: number;
    cut: SyllabusTriageItem[];
  };
  outOfStrategy: Array<{ topicId: string; topicName: string; subjectName: string }>;
  onApply: (topicIds: string[]) => void;
  onRestore: (topicIds: string[]) => void;
  formatMinutes: (minutes: number) => string;
}

export function SyllabusTriageModal({
  open,
  onClose,
  triage,
  outOfStrategy,
  onApply,
  onRestore,
  formatMinutes,
}: SyllabusTriageModalProps): JSX.Element | null {
  // The suggestion starts selected; the student unticks what they want to keep.
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(triage.cut.map(item => item.topicId))
  );
  if (!open) return null;
  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };
  const count = selected.size;
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Triagem do edital"
      maxWidth="md"
      className="syllabus-triage-modal"
    >
      <div className="space-y-4 text-sm text-content-primary">
        <p className="m-0">
          Até a prova, reservando {triage.reviewBudgetPct}% do tempo para revisão, sobram{' '}
          <strong>{formatMinutes(triage.budgetMinutes)}</strong> para conteúdo novo; o que falta
          estudar pede <strong>{formatMinutes(triage.neededMinutes)}</strong>. Estudando primeiro o
          que mais pesa por minuto, cabe cerca de <strong>{triage.coveragePct}%</strong> do peso do
          conteúdo pendente.
        </p>
        {triage.planMaintenanceMinutes > triage.maintenanceMinutes && (
          <p className="context-note m-0">
            Pelo plano atual, manter o que você já estudou pediria{' '}
            {formatMinutes(triage.planMaintenanceMinutes)} por semana, mais que os{' '}
            {formatMinutes(triage.maintenanceMinutes)} reservados para revisão. A revisão de Hoje
            prioriza dentro desse teto; o alerta de déficit continua contando essa diferença.
          </p>
        )}
        {triage.cut.length > 0 ? (
          <fieldset className="space-y-2 m-0 p-0 border-0">
            <legend className="font-semibold mb-1">
              Não cabem até a prova ({triage.cut.length}), do menor peso por minuto para o maior
            </legend>
            <p className="text-xs text-content-secondary m-0">
              Os marcados saem do planejamento e das sugestões. Continuam no edital e nos
              indicadores, e você pode trazê-los de volta a qualquer momento.
            </p>
            <ul className="syllabus-triage-list m-0 p-0 list-none max-h-72 overflow-y-auto space-y-1">
              {triage.cut.map(item => (
                <li key={item.topicId}>
                  <label className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      checked={selected.has(item.topicId)}
                      onChange={() => toggle(item.topicId)}
                    />
                    <span>
                      {item.subjectName} · {item.topicName}{' '}
                      <small className="text-content-secondary">
                        {formatMinutes(item.minutes)} · peso {Math.round(item.impact)}
                      </small>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
            <Button variant="primary" disabled={!count} onClick={() => onApply([...selected])}>
              {count === 1
                ? 'Deixar 1 tópico fora da estratégia'
                : `Deixar ${count} tópicos fora da estratégia`}
            </Button>
          </fieldset>
        ) : (
          <p className="m-0">Todo o conteúdo pendente cabe no tempo até a prova.</p>
        )}
        {outOfStrategy.length > 0 && (
          <details className="editorial-disclosure">
            <summary>Fora da estratégia agora ({outOfStrategy.length})</summary>
            <ul className="m-0 pl-4">
              {outOfStrategy.map(item => (
                <li key={item.topicId}>
                  {item.subjectName} · {item.topicName}
                </li>
              ))}
            </ul>
            <Button
              variant="ghost"
              size="small"
              onClick={() => onRestore(outOfStrategy.map(item => item.topicId))}
            >
              Trazer todos de volta
            </Button>
          </details>
        )}
      </div>
    </Dialog>
  );
}
