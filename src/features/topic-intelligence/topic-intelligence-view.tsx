import type { ComponentChildren } from 'preact';
import type { TopicIntelligenceViewModel } from './topic-intelligence-view-model.js';
import { Dialog } from '../../ui/primitives/dialog.js';
import { Badge } from '../../ui/primitives/badge.js';
import { Button } from '../../ui/primitives/button.js';
import { Icon } from '../../ui/primitives/icon.js';

export interface TopicIntelligenceViewProps {
  open: boolean;
  viewModel: TopicIntelligenceViewModel | null;
  onClose: () => void;
  onExecuteAction?: (action: Record<string, any>) => void;
  onNavigateToQuestions?: (subjectId: string, topicId: string) => void;
  onNavigateToHistory?: (subjectId: string, topicId: string) => void;
  materialsSlot?: ComponentChildren;
}

export function TopicIntelligenceView({
  open,
  viewModel,
  onClose,
  onExecuteAction,
  onNavigateToQuestions,
  onNavigateToHistory,
  materialsSlot,
}: TopicIntelligenceViewProps) {
  if (!viewModel) {
    return (
      <Dialog
        open={open}
        onClose={onClose}
        title="Ficha Inteligente do Tópico"
        maxWidth="lg"
      >
        <p class="text-sm text-secondary">Selecione um tópico para visualizar os detalhes.</p>
      </Dialog>
    );
  }

  const { snapshot } = viewModel;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={snapshot.topicName}
      description={viewModel.headerSubtitle}
      maxWidth="xl"
      footer={
        <div class="flex flex-wrap items-center justify-between gap-2 w-full">
          <div class="flex flex-wrap gap-2">
            {onNavigateToQuestions && (
              <Button
                variant="secondary"
                size="small"
                iconLeft="target"
                onClick={() => onNavigateToQuestions(snapshot.subjectId, snapshot.topicId)}
              >
                Questões
              </Button>
            )}
            {onNavigateToHistory && (
              <Button
                variant="ghost"
                size="small"
                iconLeft="clock"
                onClick={() => onNavigateToHistory(snapshot.subjectId, snapshot.topicId)}
              >
                Histórico
              </Button>
            )}
          </div>
          {snapshot.nextAction && onExecuteAction && (
            <Button
              variant="primary"
              size="default"
              iconLeft="player-play"
              onClick={() => onExecuteAction(snapshot.nextAction!.action)}
            >
              {viewModel.actionButtonLabel}
            </Button>
          )}
        </div>
      }
    >
      <div class="space-y-4">
        <div class="flex flex-wrap items-center gap-2">
          <Badge variant={viewModel.priorityBadgeVariant}>
            {snapshot.priority.classification}
          </Badge>
          <Badge variant={snapshot.retention.confidence === 'insufficient' ? 'insufficient' : 'info'}>
            {snapshot.retention.statusLabel}
          </Badge>
          {snapshot.syllabusReference && (
            <span class="text-xs text-muted">Edital: {snapshot.syllabusReference}</span>
          )}
        </div>

        {snapshot.insufficientData && snapshot.neutralMessage && (
          <div class="rounded-lg border border-border-subtle bg-surface-subtle p-3 text-sm text-secondary flex items-start gap-2">
            <Icon name="alert-circle" size={16} class="shrink-0 mt-0.5 text-muted" />
            <span>{snapshot.neutralMessage}</span>
          </div>
        )}

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div class="rounded-lg border border-border-subtle bg-surface-elevated p-3">
            <div class="text-xs text-muted">Acerto recente</div>
            <div class="text-xl font-semibold text-heading mt-1">{viewModel.accuracyText}</div>
            <div class="text-xs text-secondary mt-0.5">{viewModel.accuracyDetail}</div>
          </div>
          <div class="rounded-lg border border-border-subtle bg-surface-elevated p-3">
            <div class="text-xs text-muted">Última atividade</div>
            <div class="text-xl font-semibold text-heading mt-1">{viewModel.lastActivityText}</div>
            <div class="text-xs text-secondary mt-0.5">{viewModel.lastActivityDetail}</div>
          </div>
          <div class="rounded-lg border border-border-subtle bg-surface-elevated p-3">
            <div class="text-xs text-muted">Cobertura do conteúdo</div>
            <div class="text-xl font-semibold text-heading mt-1">{viewModel.coverageText}</div>
            <div class="text-xs text-secondary mt-0.5">
              {snapshot.progress.reviewsCount} revisões · {snapshot.progress.questionsCount} questões
            </div>
          </div>
        </div>

        {snapshot.bookmarkLabel && (
          <div class="rounded-lg border border-border-subtle bg-surface-subtle p-3 flex items-center gap-2 text-sm text-heading">
            <Icon name="bookmark" size={16} class="shrink-0 text-brand-primary" />
            <span>Ponto de parada: {snapshot.bookmarkLabel}</span>
          </div>
        )}

        {snapshot.priority.reasons.length > 0 && (
          <div class="space-y-1.5">
            <h4 class="text-xs font-semibold uppercase tracking-wide text-muted">
              Fatores da prioridade
            </h4>
            <ul class="list-disc pl-5 space-y-1 text-sm text-secondary">
              {snapshot.priority.reasons.map((reason, idx) => (
                <li key={idx}>{reason}</li>
              ))}
            </ul>
          </div>
        )}

        {snapshot.practiceLinks && (
          <div class="flex flex-wrap items-center gap-2 pt-1">
            <span class="text-xs text-muted">Praticar em:</span>
            {snapshot.practiceLinks.customUrl && (
              <a
                href={snapshot.practiceLinks.customUrl}
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-1 text-xs font-medium text-brand-primary hover:underline"
              >
                <Icon name="external-link" size={14} />
                Caderno personalizado
              </a>
            )}
            <a
              href={snapshot.practiceLinks.tecUrl}
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-1 text-xs font-medium text-brand-primary hover:underline"
            >
              <Icon name="external-link" size={14} />
              TEC Concursos
            </a>
            <a
              href={snapshot.practiceLinks.qcUrl}
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-1 text-xs font-medium text-brand-primary hover:underline"
            >
              <Icon name="external-link" size={14} />
              QConcursos
            </a>
          </div>
        )}

        {materialsSlot}
      </div>
    </Dialog>
  );
}
