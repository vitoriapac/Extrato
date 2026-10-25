import { h } from 'preact';
import { render } from 'preact-render-to-string';
import { QuickStatsGrid, type QuickStatsData } from './QuickStatsGrid.js';
import { SubjectProgressList, type SubjectProgressItem } from './SubjectProgressList.js';
import { UpcomingReviewsList, type UpcomingReviewItem } from './UpcomingReviewsList.js';

export function createDashboardTabController() {
  function renderQuickStatsHtml(data: QuickStatsData): string {
    return render(h(QuickStatsGrid, data));
  }

  function renderProgressBarsHtml(subjects: SubjectProgressItem[]): string {
    return render(h(SubjectProgressList, { subjects }));
  }

  function renderUpcomingListHtml(items: UpcomingReviewItem[]): string {
    return render(h(UpcomingReviewsList, { items }));
  }

  return {
    renderQuickStatsHtml,
    renderProgressBarsHtml,
    renderUpcomingListHtml,
  };
}
