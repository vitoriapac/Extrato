import { renderDecisionSummary, renderDisclosure } from '../components/analytical-presentation.js';
export function renderPerformanceStory(model: any, escapeHtml?: any) {
  return renderDecisionSummary(model);
}

export function renderPerformanceSummary(story, metrics, note = '') {
  return `<section class="performance-summary" aria-label="Resumo interpretativo">${story}${metrics}${note}</section>`;
}

export function renderPerformanceDetails(title, content) {
  return renderDisclosure({ title, contentHTML: content });
}
