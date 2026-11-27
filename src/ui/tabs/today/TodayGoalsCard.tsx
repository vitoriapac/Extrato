import type { JSX } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { BulletBar } from '../../primitives/charts/charts.js';
import { Icon } from '../../primitives/icon.js';

export interface TodayGoalsCardProps {
  /** Metas ainda nos valores iniciais e sem registros: não mostra denominadores que a pessoa não definiu. */
  goalsUnset?: boolean;
  topicosHoje: number;
  metaTopicosHoje: number;
  questoesHoje: number;
  metaQuestoesHoje: number;
  revisoesConcluidasHoje: number;
  totalRevisoesHoje: number;
  tempoHojeSegundos: number;
  tempoHojeFormatado: string;
  metaHorasHoje: number;
  metaHorasFormatado: string;
  pctTempo: number;
  todayDayOfWeek: number;
  paginasHoje?: number;
}

export function TodayGoalsCard({
  goalsUnset = false,
  topicosHoje,
  metaTopicosHoje,
  questoesHoje,
  metaQuestoesHoje,
  revisoesConcluidasHoje,
  totalRevisoesHoje,
  tempoHojeSegundos,
  tempoHojeFormatado,
  metaHorasHoje,
  metaHorasFormatado,
  pctTempo,
  todayDayOfWeek,
  paginasHoje = 0,
}: TodayGoalsCardProps): JSX.Element {
  const tempoMinutos = Math.round(tempoHojeSegundos / 60);
  const metaTempoMinutos = Math.round(metaHorasHoje * 60);
  const [savedGoalFeedback, setSavedGoalFeedback] = useState(false);
  const savedFeedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (savedFeedbackTimerRef.current) clearTimeout(savedFeedbackTimerRef.current);
    };
  }, []);

  const showSavedFeedback = () => {
    setSavedGoalFeedback(true);
    if (savedFeedbackTimerRef.current) clearTimeout(savedFeedbackTimerRef.current);
    savedFeedbackTimerRef.current = setTimeout(() => setSavedGoalFeedback(false), 2000);
  };

  if (goalsUnset)
    return (
      <div class="metas-hoje-grid">
        <div class="meta-hoje-card" role="status">
          <div class="meta-hoje-label">Metas de hoje</div>
          <p>Você ainda não definiu metas. Defina as metas de tópicos, questões e horas para acompanhar o dia.</p>
          <a class="btn tertiary" href="#planejamento/semana">Definir metas</a>
        </div>
      </div>
    );

  return (
    <div class="metas-hoje-grid">
      <div class="meta-hoje-card">
        <div class="meta-hoje-label">Tópicos concluídos hoje</div>
        <div class="meta-hoje-value">
          {topicosHoje} <span>/ {metaTopicosHoje}</span>
        </div>
        <div class="meta-hoje-chart mt-2">
          <BulletBar
            value={topicosHoje}
            target={metaTopicosHoje}
            max={Math.max(metaTopicosHoje, topicosHoje, 3)}
            unit=""
            label="Tópicos concluídos hoje"
          />
        </div>
      </div>

      <div class="meta-hoje-card">
        <div class="meta-hoje-label">Questões resolvidas hoje</div>
        <div class="meta-hoje-value">
          {questoesHoje} <span>/ {metaQuestoesHoje}</span>
        </div>
        <div class="meta-hoje-chart mt-2">
          <BulletBar
            value={questoesHoje}
            target={metaQuestoesHoje}
            max={Math.max(metaQuestoesHoje, questoesHoje, 10)}
            unit=""
            label="Questões resolvidas hoje"
          />
        </div>
      </div>

      <div class="meta-hoje-card">
        <div class="meta-hoje-label">Tarefas e revisões de hoje concluídas</div>
        <div class="meta-hoje-value">
          {revisoesConcluidasHoje} <span>/ {totalRevisoesHoje}</span>
        </div>
        {totalRevisoesHoje === 0 ? <p>Nenhuma revisão prevista para hoje.</p> : <div class="meta-hoje-chart mt-2">
          <BulletBar
            value={revisoesConcluidasHoje}
            target={totalRevisoesHoje}
            max={Math.max(totalRevisoesHoje, revisoesConcluidasHoje, 1)}
            unit=""
            label="Tarefas e revisões de hoje concluídas"
          />
        </div>}
      </div>

      <div class="meta-hoje-card">
        <div class="meta-hoje-label">Tempo estudado hoje</div>
        <div class="meta-hoje-time">
          <div class="meta-hoje-time-main">
            <div class="meta-hoje-time-value">{tempoHojeFormatado}</div>
            <div class="meta-hoje-time-target">
              de {metaHorasFormatado} (meta diária) · {pctTempo}%
            </div>
            {paginasHoje > 0 && (
              <div class="text-xs text-content-secondary mt-1 font-medium font-data">
                {paginasHoje} {paginasHoje === 1 ? 'página lida' : 'páginas lidas'}
              </div>
            )}
          </div>
          <details class="inline-goal-edit">
            <summary class="btn tertiary small cursor-pointer select-none">Ajustar meta</summary>
            <label class="meta-hoje-time-goal mt-2">
              <span>Meta (h)</span>
              <input
                type="number"
                min="0"
                step="0.25"
                value={metaHorasHoje}
                data-delegated-blur={`updateMetaHoursDay(${todayDayOfWeek},this.value)`}
                onBlur={showSavedFeedback}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') (event.currentTarget as HTMLInputElement).blur();
                }}
                title="Ajuste rápido da meta de hoje"
                aria-label="Meta de horas de hoje"
              />
              {savedGoalFeedback && (
                <span class="text-xs text-status-success font-medium" role="status" aria-live="polite">
                  Salvo
                </span>
              )}
            </label>
          </details>
        </div>
        <div class="meta-hoje-chart mt-2">
          <BulletBar
            value={tempoMinutos}
            target={metaTempoMinutos}
            max={Math.max(metaTempoMinutos, tempoMinutos, 60)}
            unit="m"
            label="Tempo estudado hoje"
          />
        </div>
        <div class="mt-2 text-right">
          <a
            href="#planejamento/semana"
            class="text-xs text-ink-soft hover:text-brand dark:hover:text-accent hover:underline inline-flex items-center gap-1 min-h-8 focus-visible:outline-2 focus-visible:outline-accent rounded px-1"
            title="Ajustar disponibilidade e capacidade no Planejamento"
          >
            <span>Ajustar na semana</span>
            <Icon name="arrow-right" size={12} class="shrink-0" />
          </a>
        </div>
      </div>
    </div>
  );
}
