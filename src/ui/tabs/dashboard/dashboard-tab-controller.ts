import { h } from 'preact';
import { render } from 'preact-render-to-string';
import { mountPreact } from '../../preact-mount.js';
import { QuickStatsGrid, type QuickStatsData } from './QuickStatsGrid.js';
import { SubjectProgressList, type SubjectProgressItem } from './SubjectProgressList.js';
import { UpcomingReviewsList, type UpcomingReviewItem } from './UpcomingReviewsList.js';
import { NextActionCard, type NextActionCardProps } from './NextActionCard.js';

export function createDashboardTabController() {
  function renderNextActionCardHtml(props: NextActionCardProps): string {
    return render(h(NextActionCard, props));
  }

  function mountNextActionCard(container: Element, props: NextActionCardProps): void {
    mountPreact(h(NextActionCard, props), container);
  }

  function renderQuickStatsHtml(data: QuickStatsData): string {
    return render(h(QuickStatsGrid, data));
  }

  function mountQuickStats(container: Element, data: QuickStatsData): void {
    mountPreact(h(QuickStatsGrid, data), container);
  }

  function renderProgressBarsHtml(subjects: SubjectProgressItem[]): string {
    return render(h(SubjectProgressList, { subjects }));
  }

  function mountProgressBars(container: Element, subjects: SubjectProgressItem[]): void {
    mountPreact(h(SubjectProgressList, { subjects }), container);
  }

  function renderUpcomingListHtml(items: UpcomingReviewItem[]): string {
    return render(h(UpcomingReviewsList, { items }));
  }

  function mountUpcomingList(container: Element, items: UpcomingReviewItem[]): void {
    mountPreact(h(UpcomingReviewsList, { items }), container);
  }

  return {
    renderNextActionCardHtml,
    mountNextActionCard,
    renderQuickStatsHtml,
    mountQuickStats,
    renderProgressBarsHtml,
    mountProgressBars,
    renderUpcomingListHtml,
    mountUpcomingList,
  };
}
