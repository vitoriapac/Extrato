import type { JSX } from 'preact';

export interface PlanExecutionCardProps {
  executionViewHtml: string;
  distributionHtml: string;
  alignmentHtml: string;
}

export function PlanExecutionCard({
  executionViewHtml,
  distributionHtml,
  alignmentHtml,
}: PlanExecutionCardProps): JSX.Element {
  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: executionViewHtml }} />

      <details class="study-distribution" id="studyDistribution">
        <summary>Distribuição entre disciplinas</summary>
        <div dangerouslySetInnerHTML={{ __html: distributionHtml }} />
      </details>

      <details class="study-distribution" id="planImpactAlignment">
        <summary>Plano × impacto na prova</summary>
        <div dangerouslySetInnerHTML={{ __html: alignmentHtml }} />
      </details>
    </>
  );
}
