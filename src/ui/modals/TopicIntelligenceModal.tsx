import type { JSX } from 'preact';
import type { TopicIntelligenceSnapshot } from '../../domain/topic-intelligence/topic-intelligence-types.js';
import { Dialog } from '../primitives/dialog.js';
import { Button } from '../primitives/button.js';
import { Badge } from '../primitives/badge.js';
import { Icon } from '../primitives/icon.js';

export interface TopicIntelligenceModalProps {
  open: boolean;
  snapshot: TopicIntelligenceSnapshot | null;
  lastSessionSummary?: string | null;
  errorCount?: number;
  onStartTopic?: (subjectId: string, topicId: string) => void;
  onClose: () => void;
}

const CONFIDENCE_LABELS: Record<string, string> = {
  strong: 'Amostra sólida',
  limited: 'Amostra inicial',
  insufficient: 'Dados insuficientes',
};

export function TopicIntelligenceModal({
  open,
  snapshot,
  lastSessionSummary = null,
  errorCount = 0,
  onStartTopic,
  onClose,
}: TopicIntelligenceModalProps): JSX.Element {
  if (!snapshot) {
    return (
      <Dialog
        id="topicIntelligenceModal"
        open={open}
        onClose={onClose}
        title="Ficha Inteligente do Tópico"
        maxWidth="lg"
      >
        <p class="text-sm text-content-secondary">Selecione um tópico para visualizar os detalhes.</p>
      </Dialog>
    );
  }

  const checklistItems = [
    { label: 'Teoria', done: snapshot.progress.theoryCompleted },
    { label: 'Questões', done: snapshot.progress.questionsCompleted },
    { label: 'Revisão', done: snapshot.progress.reviewCompleted },
  ];

  return (
    <Dialog
      id="topicIntelligenceModal"
      open={open}
      onClose={onClose}
      title={snapshot.topicName}
      description={`${snapshot.subjectName}${snapshot.examLabel ? ` · ${snapshot.examLabel}` : ''}`}
      maxWidth="lg"
    >
      <div class="space-y-4">
        <div class="flex flex-wrap items-center gap-2">
          <Badge variant="info">{snapshot.priority.classification}</Badge>
          <Badge variant="default">
            {CONFIDENCE_LABELS[snapshot.retention.confidence] || 'Dados iniciais'}
          </Badge>
          {snapshot.progress.coveragePercent !== null && (
            <Badge variant="success">Cobertura: {snapshot.progress.coveragePercent}%</Badge>
          )}
        </div>

        {/* Continuidade: ponto de parada + última sessão */}
        <section class="rounded-lg border border-border bg-surface-elevated p-3 space-y-2">
          <h4 class="text-xs font-semibold uppercase tracking-[0.08em] text-content-secondary m-0 flex items-center gap-1.5">
            <Icon name="bookmark" size={14} />
            <span>Continuidade do estudo</span>
          </h4>
          {snapshot.bookmarkLabel ? (
            <p class="text-sm text-content-primary m-0">
              Ponto de parada: <strong>{snapshot.bookmarkLabel}</strong>
            </p>
          ) : (
            <p class="text-xs text-content-secondary m-0">
              Nenhum ponto de parada registrado neste tópico ainda.
            </p>
          )}
          {lastSessionSummary && (
            <p class="text-xs text-content-secondary m-0">{lastSessionSummary}</p>
          )}
          {snapshot.nextAction && (
            <div class="pt-1 flex flex-wrap items-center justify-between gap-2">
              <span class="text-xs text-content-primary">
                Próximo passo: <strong>{snapshot.nextAction.label}</strong>
                {snapshot.nextAction.suggestedMinutes
                  ? ` (${snapshot.nextAction.suggestedMinutes} min)`
                  : ''}
              </span>
              {onStartTopic && (
                <Button
                  type="button"
                  size="small"
                  className="inline-flex items-center gap-1"
                  onClick={() => onStartTopic(snapshot.subjectId, snapshot.topicId)}
                >
                  <Icon name="play" size={13} />
                  <span>Iniciar foco</span>
                </Button>
              )}
            </div>
          )}
        </section>

        {/* Progresso, Desempenho e Erros */}
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div class="rounded-lg border border-border bg-surface p-3 space-y-1.5">
            <div class="text-xs font-semibold uppercase tracking-[0.08em] text-content-secondary">
              Etapas do tópico
            </div>
            <ul class="space-y-1 text-xs text-content-primary m-0 p-0 list-none">
              {checklistItems.map(step => (
                <li key={step.label} class="flex items-center gap-1.5">
                  <Icon
                    name={step.done ? 'check' : 'circle'}
                    size={13}
                    class={step.done ? 'text-success' : 'text-content-tertiary'}
                  />
                  <span>{step.label}</span>
                </li>
              ))}
            </ul>
          </div>

          <div class="rounded-lg border border-border bg-surface p-3 space-y-1">
            <div class="text-xs font-semibold uppercase tracking-[0.08em] text-content-secondary">
              Questões e acertos
            </div>
            <div class="text-lg font-mono tabular-nums font-semibold text-content-primary">
              {snapshot.performance.accuracyPercent !== null
                ? `${snapshot.performance.accuracyPercent}%`
                : '—'}
            </div>
            <div class="text-xs text-content-secondary">
              {snapshot.performance.totalQuestions > 0
                ? `${snapshot.performance.correctCount}/${snapshot.performance.totalQuestions} acertos · ${errorCount} no caderno de erros`
                : `Sem questões registradas · ${errorCount} no caderno de erros`}
            </div>
          </div>

          <div class="rounded-lg border border-border bg-surface p-3 space-y-1">
            <div class="text-xs font-semibold uppercase tracking-[0.08em] text-content-secondary">
              Retenção e revisões
            </div>
            <div class="text-sm font-medium text-content-primary">
              {snapshot.retention.statusLabel}
            </div>
            <div class="text-xs text-content-secondary">
              {snapshot.progress.reviewsCount}{' '}
              {snapshot.progress.reviewsCount === 1 ? 'revisão concluída' : 'revisões concluídas'}
              {snapshot.retention.lastActivityLocalDate
                ? ` · Última em ${snapshot.retention.lastActivityLocalDate}`
                : ''}
            </div>
          </div>
        </div>

        {/* Motivos da prioridade */}
        {snapshot.priority.reasons.length > 0 && (
          <section class="rounded-lg border border-border bg-surface p-3 space-y-1">
            <div class="text-xs font-semibold uppercase tracking-[0.08em] text-content-secondary">
              Por que este tópico importa agora
            </div>
            <ul class="list-disc pl-4 text-xs text-content-primary space-y-0.5 m-0">
              {snapshot.priority.reasons.map(reason => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          </section>
        )}

        {/* Atalhos de prática */}
        {snapshot.practiceLinks && (
          <div class="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
            <div class="flex flex-wrap items-center gap-3 text-xs">
              <span class="text-content-secondary">Praticar em:</span>
              <a
                href={snapshot.practiceLinks.tecUrl}
                target="_blank"
                rel="noopener noreferrer"
                class="text-brand hover:underline"
              >
                TEC Concursos
              </a>
              <a
                href={snapshot.practiceLinks.qcUrl}
                target="_blank"
                rel="noopener noreferrer"
                class="text-brand hover:underline"
              >
                QConcursos
              </a>
              {snapshot.practiceLinks.customUrl && (
                <a
                  href={snapshot.practiceLinks.customUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-brand hover:underline"
                >
                  Material do tópico
                </a>
              )}
            </div>
            <Button type="button" variant="ghost" size="small" onClick={onClose}>
              Fechar
            </Button>
          </div>
        )}
      </div>
    </Dialog>
  );
}
