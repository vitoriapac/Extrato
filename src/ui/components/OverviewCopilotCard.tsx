import type { JSX } from 'preact';
import { useState } from 'preact/hooks';
import type {
  CopilotAnswer,
  CopilotQuestionKey,
  CopilotViewModel,
} from '../../application/copilot/study-copilot-service.js';
import { Badge } from '../primitives/badge.js';
import { Button } from '../primitives/button.js';
import { Card } from '../primitives/card.js';
import { Icon } from '../primitives/icon.js';

export interface OverviewCopilotCardProps {
  copilot: CopilotViewModel;
  selectedQuestion: CopilotQuestionKey;
  onSelectQuestion: (key: CopilotQuestionKey) => void;
  onExecuteAnswer: (answer: CopilotAnswer) => void;
  onQuickStudy30?: () => void;
}

const PRIMARY_COPILOT_KEYS = new Set<CopilotQuestionKey>([
  'what_now',
  'why_this',
  'quick_30',
  'week_status',
]);

export function OverviewCopilotCard(props: OverviewCopilotCardProps): JSX.Element {
  const { copilot, selectedQuestion } = props;
  const [showAllQuestions, setShowAllQuestions] = useState(false);
  const activeAnswer = copilot.answers[selectedQuestion] || copilot.answers.what_now;

  const primaryQuestions = copilot.questionsList.filter(item => PRIMARY_COPILOT_KEYS.has(item.key));
  const secondaryQuestions = copilot.questionsList.filter(item => !PRIMARY_COPILOT_KEYS.has(item.key));
  const visibleQuestions = showAllQuestions
    ? copilot.questionsList
    : [
        ...primaryQuestions,
        ...secondaryQuestions.filter(item => item.key === selectedQuestion),
      ];

  return (
    <Card
      as="section"
      variant="default"
      className="mb-6 space-y-4 min-w-0"
      aria-labelledby="overviewCopilotTitle"
      data-overview-copilot="true"
    >
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div class="flex flex-wrap items-center gap-2 min-w-0">
          <Icon name="compass" size={16} class="icon-inline text-accent shrink-0" />
          <h2 id="overviewCopilotTitle" class="module-heading__title m-0 text-content-primary">
            Leitura do Extrato
          </h2>
          <Badge variant="info" icon={false}>
            {copilot.confidence.label}
          </Badge>
        </div>
      </div>

      <p class="m-0 text-xs text-content-secondary">
        Leitura diagnóstica · <strong class="text-content-primary">{copilot.title}</strong>
      </p>

      <div class="flex flex-wrap items-center gap-2" role="group" aria-label="Perguntas da Leitura do Extrato na Visão Geral">
        {visibleQuestions.map(item => {
          const isSelected = selectedQuestion === item.key;
          return (
            <Button
              key={item.key}
              variant={isSelected ? 'tonal' : 'secondary'}
              size="small"
              aria-pressed={isSelected}
              onClick={() => props.onSelectQuestion(item.key)}
            >
              {item.question}
            </Button>
          );
        })}

        {secondaryQuestions.length > 0 && (
          <Button
            variant="tertiary"
            size="small"
            aria-expanded={showAllQuestions}
            onClick={() => setShowAllQuestions(prev => !prev)}
          >
            {showAllQuestions ? 'Menos perguntas' : `Mais perguntas (${secondaryQuestions.length})`}
          </Button>
        )}
      </div>

      <div class="pt-4 border-t border-border-subtle border-l-3 border-l-accent pl-4 space-y-2 text-xs">
        <strong class="text-sm text-content-primary block">{activeAnswer.headline}</strong>
        <p class="m-0 text-content-primary leading-relaxed">{activeAnswer.body}</p>
        {activeAnswer.evidenceSummary && (
          <p class="m-0 text-content-secondary font-data">{activeAnswer.evidenceSummary}</p>
        )}
        {activeAnswer.limitations.length > 0 && (
          <p class="m-0 text-content-secondary">
            <Icon name="bulb" size={12} class="icon-inline" /> {activeAnswer.limitations[0]}
          </p>
        )}
        {activeAnswer.actionLabel && activeAnswer.actionKind !== 'none' && (
          <div class="pt-1">
            <Button
              variant="secondary"
              size="small"
              onClick={() => props.onExecuteAnswer(activeAnswer)}
            >
              <span>{activeAnswer.actionLabel}</span>
              <Icon name="chevron-right" size={13} class="icon-inline" />
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
