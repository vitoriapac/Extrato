import type { JSX } from 'preact';
import { Icon } from '../../primitives/icon.js';

export interface ReviewItem {
  id: string;
  date?: string;
  subjectId?: string | null;
  topicId?: string | null;
  topicRef?: string | null;
  status: string;
  tipo?: string | null;
  completedAt?: string | null;
  difficulty?: string | null;
}

export interface ReviewsTableProps {
  groups: {
    overdue: ReviewItem[];
    today: ReviewItem[];
    upcoming: ReviewItem[];
    completed: ReviewItem[];
  };
  totalCount: number;
  editingId?: string | null;
  completedExpanded?: boolean;
  upcomingVisibleLimit: number;
  completedVisibleLimit: number;
  renderReadRow: (item: ReviewItem) => string;
  renderEditRow: (item: ReviewItem) => string;
  renderGroupHeader: (opts: {
    title: string;
    count: number;
    tone: string;
    expanded?: boolean;
    toggleAction?: string;
  }) => string;
  renderFooter?: (opts: {
    total: number;
    visible: number;
    showMoreAction: string;
    showLessAction: string;
    colspan: number;
    label: string;
  }) => string;
}

export function ReviewsTable({
  groups,
  totalCount,
  editingId,
  completedExpanded = false,
  upcomingVisibleLimit,
  completedVisibleLimit,
  renderReadRow,
  renderEditRow,
  renderGroupHeader,
  renderFooter,
}: ReviewsTableProps): JSX.Element {
  if (totalCount === 0) {
    return (
      <tr>
        <td colSpan={8}>
          <div class="empty-state" style={{ border: 'none' }}>
            <p class="font-medium text-content-primary m-0">Nenhuma revisão encontrada com esses filtros.</p>
            <p class="text-xs text-content-secondary max-w-md mx-auto leading-relaxed mt-1 mb-3">
              As revisões são agendadas automaticamente pelo sistema (curva de retenção espaçada: 24h, 7 dias, 30 dias) conforme você conclui tópicos na aba Hoje ou Disciplinas.
            </p>
            <div class="empty-state-actions">
              <button
                type="button"
                class="btn ghost small"
                data-delegated-click="gerarAgendaAutomatica()"
              >
                <Icon name="refresh" size={14} class="icon-inline" />
                Gerar a partir dos concluídos
              </button>
              <button type="button" class="btn ghost small inline-flex items-center gap-1.5" data-delegated-click="addAgendaRow()">
                <Icon name="plus" size={14} class="icon-inline" />
                <span>Adicionar manualmente</span>
              </button>
            </div>
          </div>
        </td>
      </tr>
    );
  }

  const renderRow = (item: ReviewItem) => {
    const html = editingId === item.id ? renderEditRow(item) : renderReadRow(item);
    return <tbody key={item.id} dangerouslySetInnerHTML={{ __html: html }} />;
  };

  return (
    <>
      {groups.today.length > 0 && (
        <>
          <tr
            dangerouslySetInnerHTML={{
              __html: renderGroupHeader({
                title: 'Hoje',
                count: groups.today.length,
                tone: 'today',
              }),
            }}
          />
          {groups.today.map(renderRow)}
        </>
      )}
      {groups.today.length === 0 && (
        <tr><td colSpan={8} class="text-content-secondary">Nenhuma revisão pendente para hoje.</td></tr>
      )}

      {groups.overdue.length > 0 && (
        <>
          <tr
            dangerouslySetInnerHTML={{
              __html: renderGroupHeader({
                title: 'Atrasadas',
                count: groups.overdue.length,
                tone: 'overdue',
              }),
            }}
          />
          {groups.overdue.map(renderRow)}
        </>
      )}

      {groups.upcoming.length > 0 && (
        <>
          <tr
            dangerouslySetInnerHTML={{
              __html: renderGroupHeader({
                title: 'Próximas revisões',
                count: groups.upcoming.length,
                tone: 'upcoming',
              }),
            }}
          />
          {groups.upcoming.slice(0, upcomingVisibleLimit).map(renderRow)}
          {renderFooter && (
            <tr
              dangerouslySetInnerHTML={{
                __html: renderFooter({
                  total: groups.upcoming.length,
                  visible: upcomingVisibleLimit,
                  showMoreAction: "changeAgendaLimit('upcoming',5)",
                  showLessAction: upcomingVisibleLimit > 5 ? "resetAgendaLimit('upcoming')" : '',
                  colspan: 8,
                  label: 'revisões',
                }),
              }}
            />
          )}
        </>
      )}

      {groups.completed.length > 0 && (
        <>
          <tr
            dangerouslySetInnerHTML={{
              __html: renderGroupHeader({
                title: 'Histórico de revisões concluídas',
                count: groups.completed.length,
                tone: 'completed',
                expanded: completedExpanded,
                toggleAction: 'toggleCompletedReviews()',
              }),
            }}
          />
          {completedExpanded && (
            <>
              {groups.completed.slice(0, completedVisibleLimit).map(renderRow)}
              {renderFooter && groups.completed.length > 5 && (
                <tr
                  dangerouslySetInnerHTML={{
                    __html: renderFooter({
                      total: groups.completed.length,
                      visible: completedVisibleLimit,
                      showMoreAction: "changeAgendaLimit('completed',5)",
                      showLessAction:
                        completedVisibleLimit > 5 ? "resetAgendaLimit('completed')" : '',
                      colspan: 8,
                      label: 'revisões concluídas',
                    }),
                  }}
                />
              )}
            </>
          )}
        </>
      )}
    </>
  );
}
