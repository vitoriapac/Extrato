import type { JSX } from 'preact';
import {
  ESSAY_CRITERIA,
  type EssayEvolutionSummary,
} from '../../../domain/calendar/calendar-projection.js';
import { Button } from '../../primitives/button.js';
import { Badge } from '../../primitives/badge.js';
import { Icon } from '../../primitives/icon.js';

export interface EssayEvolutionCardProps {
  summary: EssayEvolutionSummary;
  formatDatePt: (date: string) => string;
  onEditEssay: (id: string) => void;
}

const ESSAY_KIND_LABEL: Record<string, string> = {
  questao_discursiva: 'Questão discursiva',
  estudo_caso: 'Estudo de caso',
  peca_tecnica: 'Peça técnica',
};

const ESSAY_STATUS_BADGE: Record<
  'draft' | 'written' | 'graded',
  { label: string; variant: 'default' | 'info' | 'success' }
> = {
  draft: { label: 'A fazer', variant: 'default' },
  written: { label: 'Entregue', variant: 'info' },
  graded: { label: 'Corrigida', variant: 'success' },
};

export function EssayEvolutionCard({
  summary,
  formatDatePt,
  onEditEssay,
}: EssayEvolutionCardProps): JSX.Element | null {
  if (summary.totalCount === 0) return null;

  return (
    <section
      class="chart-card mt-4 space-y-3"
      aria-labelledby="essayEvolutionHeading"
      id="essayEvolutionCard"
    >
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 id="essayEvolutionHeading" class="m-0 flex items-center gap-2">
            <Icon name="file-text" size={16} class="text-brand" />
            <span>Redação e discursiva</span>
          </h3>
          <p class="text-xs font-mono tabular-nums text-content-secondary m-0 mt-0.5">
            {summary.totalCount}{' '}
            {summary.totalCount === 1 ? 'redação registrada' : 'redações registradas'}
            {summary.gradedCount > 0 ? ` · ${summary.gradedCount} com nota` : ''}
            {summary.averagePercent !== null ? ` · Média: ${summary.averagePercent}%` : ''}
            {summary.latestScoreLabel ? ` · Última nota: ${summary.latestScoreLabel}` : ''}
          </p>
        </div>
      </div>

      {summary.latestBelowMinimum && (
        <p class="text-sm m-0" role="alert">
          <Badge variant="danger">Abaixo do mínimo</Badge> A última nota ficou abaixo do mínimo
          eliminatório de {summary.minimumPercent}%. Na prova, isso elimina mesmo com boa nota nas
          objetivas.
        </p>
      )}

      {ESSAY_CRITERIA.some(({ key }) => summary.criteriaAverages[key] !== null) && (
        <div class="text-xs text-content-secondary">
          <span>Média por critério: </span>
          {ESSAY_CRITERIA.filter(({ key }) => summary.criteriaAverages[key] !== null)
            .map(({ key, label }) => `${label} ${summary.criteriaAverages[key]}%`)
            .join(' · ')}
          {summary.weakestCriterion && (
            <p class="m-0 mt-1 text-content-primary">
              Onde mais perde ponto: <strong>{summary.weakestCriterion.label}</strong> (
              {summary.weakestCriterion.average}%). Priorize esse critério na próxima correção.
            </p>
          )}
        </div>
      )}

      <ul class="upcoming-list">
        {summary.entries.slice(0, 8).map(entry => {
          const badge = ESSAY_STATUS_BADGE[entry.essayStatus];
          const scoreText =
            entry.essayScore !== null
              ? `${entry.essayScore}${entry.essayMaxScore ? `/${entry.essayMaxScore}` : ''}${
                  entry.normalizedPercent !== null ? ` (${entry.normalizedPercent}%)` : ''
                }`
              : null;
          return (
            <li key={entry.id} class="flex flex-wrap items-center gap-2">
              <span class="upcoming-date">{formatDatePt(entry.date)}</span>
              <span class="min-w-0 flex-1">
                <strong>{entry.title}</strong>
                {entry.essayKind && ESSAY_KIND_LABEL[entry.essayKind] && (
                  <span class="ml-1.5 text-xs text-content-secondary">
                    · {ESSAY_KIND_LABEL[entry.essayKind]}
                  </span>
                )}
                {entry.essayScoringMode === 'cebraspe_linhas' && entry.errorsPerLine !== null && (
                  <span class="ml-1.5 text-xs text-content-secondary">
                    (Cebraspe · {entry.errorsPerLine} erros/linha)
                  </span>
                )}
                {entry.essayTheme && (
                  <span class="block text-xs text-content-secondary truncate">
                    Tema: {entry.essayTheme}
                  </span>
                )}
              </span>
              <Badge variant={badge.variant}>{badge.label}</Badge>
              {scoreText && (
                <span class="font-mono tabular-nums text-xs font-semibold text-content-primary">
                  {scoreText}
                </span>
              )}
              <Button
                type="button"
                variant="ghost"
                size="small"
                onClick={() => onEditEssay(entry.id)}
              >
                {entry.essayScore !== null ? 'Editar' : 'Lançar nota'}
              </Button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
