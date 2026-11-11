import type { JSX } from 'preact';
import { Button } from '../../primitives/button.js';
import { Icon } from '../../primitives/icon.js';

export interface TodayAgendaItem {
  id: string;
  title: string;
  subtitle?: string;
  badge?: string;
  actionText?: string;
  actionClick?: string;
}

export interface TodayAgendaSectionsProps {
  tasks: TodayAgendaItem[];
  overdueReviews: TodayAgendaItem[];
  plannedSimulations: TodayAgendaItem[];
  goalsHtml: string;
  onOpenRecoveryMission?: () => void;
}

export function TodayAgendaSections({
  tasks,
  overdueReviews,
  plannedSimulations,
  goalsHtml,
  onOpenRecoveryMission,
}: TodayAgendaSectionsProps): JSX.Element {
  const renderList = (items: TodayAgendaItem[], emptyMsg: string) => {
    if (items.length === 0) {
      return <li class="upcoming-empty">{emptyMsg}</li>;
    }
    return items.map(item => (
      <li key={item.id} class="upcoming-item">
        <div class="upcoming-item-content">
          <strong>{item.title}</strong>
          {item.subtitle && <span>{item.subtitle}</span>}
        </div>
        {item.badge && <span class="upcoming-badge">{item.badge}</span>}
        {item.actionText && item.actionClick && (
          <button type="button" class="btn ghost small" data-delegated-click={item.actionClick}>
            {item.actionText}
          </button>
        )}
      </li>
    ));
  };

  return (
    <div class="today-agenda-grid">
      <section>
        <h4>Tarefas</h4>
        <ul class="upcoming-list" id="hojeTarefasHoje">
          {renderList(tasks, 'Nenhuma tarefa agendada para hoje.')}
        </ul>
      </section>

      <section>
        <div class="flex items-center justify-between gap-2 mb-2">
          <h4 class="m-0">Revisões atrasadas</h4>
          {onOpenRecoveryMission && overdueReviews.length > 0 && (
            <Button
              variant="secondary"
              size="small"
              className="inline-flex items-center gap-2 text-xs text-heading font-medium hover:border-border-hover"
              onClick={onOpenRecoveryMission}
              aria-label="Abrir missão de recuperação de revisões atrasadas"
            >
              <Icon name="bolt" size={14} class="shrink-0" />
              <span>Resgatar Atrasos</span>
            </Button>
          )}
        </div>
        <ul class="upcoming-list" id="hojeAtrasadas">
          {renderList(overdueReviews, 'Nenhuma revisão atrasada pendente.')}
        </ul>
      </section>

      <section>
        <h4>Simulados planejados</h4>
        <ul class="upcoming-list" id="hojeSimuladosPlanejados">
          {renderList(plannedSimulations, 'Nenhum simulado planejado para hoje.')}
        </ul>
      </section>

      <section>
        <h4>Metas</h4>
        <div id="hojeMetas" dangerouslySetInnerHTML={{ __html: goalsHtml }} />
      </section>
    </div>
  );
}
