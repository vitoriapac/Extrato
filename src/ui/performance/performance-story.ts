import { renderDecisionSummary, renderDisclosure } from '../components/analytical-presentation.js';
export function renderPerformanceStory(model: any) {
  return renderDecisionSummary(model);
}

export function renderPerformanceSummary(story: string, metrics: string, note = '') {
  return `<section class="performance-summary" aria-label="Resumo interpretativo">${story}${metrics}${note}</section>`;
}

export function renderPerformanceDetails(title: string, content: string) {
  return renderDisclosure({ title, contentHTML: content });
}
