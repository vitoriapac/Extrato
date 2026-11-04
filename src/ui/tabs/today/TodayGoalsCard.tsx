import type { JSX } from 'preact';
import { BulletBar } from '../../primitives/charts/charts.js';

export interface TodayGoalsCardProps {
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
}

export function TodayGoalsCard({
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
}: TodayGoalsCardProps): JSX.Element {
  const tempoMinutos = Math.round(tempoHojeSegundos / 60);
  const metaTempoMinutos = Math.round(metaHorasHoje * 60);

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
        <div class="meta-hoje-label">Revisões de hoje concluídas</div>
        <div class="meta-hoje-value">
          {revisoesConcluidasHoje} <span>/ {totalRevisoesHoje}</span>
        </div>
        <div class="meta-hoje-chart mt-2">
          <BulletBar
            value={revisoesConcluidasHoje}
            target={totalRevisoesHoje > 0 ? totalRevisoesHoje : 1}
            max={Math.max(totalRevisoesHoje, revisoesConcluidasHoje, 1)}
            unit=""
            label="Revisões de hoje concluídas"
          />
        </div>
      </div>

      <div class="meta-hoje-card">
        <div class="meta-hoje-label">Tempo estudado hoje</div>
        <div class="meta-hoje-time">
          <div class="meta-hoje-time-main">
            <div class="meta-hoje-time-value">{tempoHojeFormatado}</div>
            <div class="meta-hoje-time-target">
              de {metaHorasFormatado} · {pctTempo}%
            </div>
          </div>
          <label class="meta-hoje-time-goal">
            <span>Meta diária</span>
            <input
              type="number"
              min="0"
              step="0.25"
              value={metaHorasHoje}
              data-delegated-blur={`updateMetaHoursDay(${todayDayOfWeek},this.value)`}
              title="Editar a meta de hoje"
              aria-label="Meta de horas de hoje"
            />
          </label>
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
      </div>
    </div>
  );
}
