import { useState } from 'preact/hooks';
import {
  buildQuickStudyProposal,
  type QuickStudyFocusMode,
  type QuickStudyProposal,
  type QuickStudyProposalOptions,
} from '../../domain/quick-study/quick-study-engine.js';
import { Dialog } from '../primitives/dialog.js';
import { Button } from '../primitives/button.js';
import { Badge } from '../primitives/badge.js';

export interface QuickStudyModalProps {
  open: boolean;
  onClose: () => void;
  options: Omit<QuickStudyProposalOptions, 'durationMinutes' | 'focusMode'>;
  onStartQuickStudy: (proposal: QuickStudyProposal) => void;
}

const PRESET_DURATIONS = [15, 30, 45, 60] as const;

export function QuickStudyModal({
  open,
  onClose,
  options,
  onStartQuickStudy,
}: QuickStudyModalProps) {
  const [durationMinutes, setDurationMinutes] = useState<number>(30);
  const [focusMode, setFocusMode] = useState<QuickStudyFocusMode>('priority');

  const proposal = buildQuickStudyProposal({
    ...options,
    durationMinutes,
    focusMode,
  });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Modo Estudo Rápido"
      description="Escolha quanto tempo você tem agora para iniciar uma única sessão guiada."
      maxWidth="lg"
      footer={
        <div class="flex justify-end gap-2 w-full">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            iconLeft="player-play"
            onClick={() => {
              onStartQuickStudy(proposal);
              onClose();
            }}
          >
            Iniciar ({proposal.plannedMinutes} min)
          </Button>
        </div>
      }
    >
      <div class="space-y-4">
        <div class="space-y-1.5">
          <span class="text-xs font-medium text-muted">Quanto tempo você tem?</span>
          <div class="flex flex-wrap gap-2" role="group" aria-label="Duração da sessão rápida">
            {PRESET_DURATIONS.map(mins => (
              <Button
                key={mins}
                variant={durationMinutes === mins ? 'primary' : 'secondary'}
                size="small"
                aria-pressed={durationMinutes === mins}
                onClick={() => setDurationMinutes(mins)}
              >
                <span class="font-data">{mins} min</span>
              </Button>
            ))}
          </div>
        </div>

        <div class="space-y-1.5">
          <span class="text-xs font-medium text-muted">Foco</span>
          <div class="flex flex-wrap gap-2" role="group" aria-label="Foco da sessão">
            {(
              [
                ['priority', 'Prioridade'],
                ['review', 'Revisão'],
                ['questions', 'Questões'],
                ['law', 'Lei seca / Juris'],
                ['resume', 'Retomar'],
              ] as const
            ).map(([mode, label]) => (
              <Button
                key={mode}
                variant={focusMode === mode ? 'tonal' : 'ghost'}
                size="small"
                aria-pressed={focusMode === mode}
                onClick={() => setFocusMode(mode)}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>

        <div class="rounded-default border border-border-subtle bg-surface-subtle p-3 space-y-2">
          <div class="flex items-center justify-between gap-2">
            <span class="text-sm font-semibold text-heading">
              {proposal.subjectName} · {proposal.topicName}
            </span>
            <Badge variant="info">
              <span class="font-data">{proposal.plannedMinutes} min</span>
            </Badge>
          </div>
          <p class="text-xs text-secondary">{proposal.reasoning}</p>
          {proposal.strategy && (
            <ul class="space-y-1 pt-1 border-t border-border-subtle text-xs text-secondary">
              {proposal.strategy.steps.map((step, idx) => (
                <li key={idx} class="flex justify-between">
                  <span>{step.label}</span>
                  <span class="font-medium font-data text-heading">{step.minutes} min</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Dialog>
  );
}
