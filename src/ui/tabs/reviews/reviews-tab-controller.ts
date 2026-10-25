import { h } from 'preact';
import { render } from 'preact-render-to-string';
import { ReviewsTable, type ReviewItem } from './ReviewsTable.js';

export interface ReviewsTabControllerContext {
  state: {
    reviewAgenda: ReviewItem[];
  };
  filters: {
    subjectId: string;
    status: string;
    month: string;
    type: string;
  };
  entitySubjectId: (item: any) => string | null;
  todayISO: () => string;
  monthKey: (date?: string) => string;
  DIFFICULTY_WEIGHT: Record<string, number>;
  getTopicDifficulty: (topicId?: string | null) => string;
  agendaUiState: {
    editingId: string | null;
    completedExpanded: boolean;
    upcomingVisible: number;
    completedVisible: number;
  };
  renderAgendaReadRow: (item: ReviewItem) => string;
  renderAgendaEditRow: (item: ReviewItem) => string;
  renderGroupHeader: (opts: any) => string;
  renderCollectionFooter: (opts: any) => string;
}

export function createReviewsTabController(ctx: ReviewsTabControllerContext) {
  function getFilteredAndSortedReviews(): ReviewItem[] {
    const today = ctx.todayISO();
    const { subjectId, status, month, type } = ctx.filters;

    return (ctx.state.reviewAgenda || [])
      .filter(a => !subjectId || ctx.entitySubjectId(a) === subjectId)
      .filter(a =>
        !status
          ? true
          : status === 'Atrasadas'
            ? Boolean(a.date && a.date < today && a.status !== 'Concluído')
            : a.status === status
      )
      .filter(a => !month || ctx.monthKey(a.date) === month)
      .filter(a => !type || a.tipo === type)
      .sort((a, b) => {
        const dateCompare = (a.date || '').localeCompare(b.date || '');
        if (dateCompare !== 0) return dateCompare;
        const wA = ctx.DIFFICULTY_WEIGHT[ctx.getTopicDifficulty(a.topicId || a.topicRef)] || 2;
        const wB = ctx.DIFFICULTY_WEIGHT[ctx.getTopicDifficulty(b.topicId || b.topicRef)] || 2;
        return wB - wA;
      });
  }

  function getGroupedReviews(rows: ReviewItem[]) {
    const today = ctx.todayISO();
    return {
      overdue: rows.filter(item => item.status !== 'Concluído' && item.date && item.date < today),
      today: rows.filter(item => item.status !== 'Concluído' && item.date === today),
      upcoming: rows.filter(
        item => item.status !== 'Concluído' && (!item.date || item.date > today)
      ),
      completed: rows
        .filter(item => item.status === 'Concluído')
        .sort((a, b) =>
          String(b.completedAt || b.date || '').localeCompare(String(a.completedAt || a.date || ''))
        ),
    };
  }

  function renderHtml(): string {
    const rows = getFilteredAndSortedReviews();
    const groups = getGroupedReviews(rows);

    return render(
      h(ReviewsTable, {
        groups,
        totalCount: rows.length,
        editingId: ctx.agendaUiState.editingId,
        completedExpanded: ctx.agendaUiState.completedExpanded,
        upcomingVisibleLimit: ctx.agendaUiState.upcomingVisible,
        completedVisibleLimit: ctx.agendaUiState.completedVisible,
        renderReadRow: ctx.renderAgendaReadRow,
        renderEditRow: ctx.renderAgendaEditRow,
        renderGroupHeader: ctx.renderGroupHeader,
        renderFooter: ctx.renderCollectionFooter,
      })
    );
  }

  return {
    getFilteredAndSortedReviews,
    getGroupedReviews,
    renderHtml,
  };
}
