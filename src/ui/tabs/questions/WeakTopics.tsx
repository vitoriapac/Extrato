import type { WeakTopic } from './question-weak-topics.js';

export function WeakTopics({ topics, formatDate }: { topics: WeakTopic[]; formatDate: (iso: string) => string }) {
  return (
    <section class="weak-topics" aria-label="Onde vale insistir">
      <h3 class="module-heading__title">Onde vale insistir</h3>
      {topics.length > 0 && <p class="analytics-note">Tópicos com pelo menos 30 questões aparecem primeiro; amostras menores são provisórias.</p>}
      {topics.length === 0 ? <p class="analytics-note">Registre questões com tópico para ver onde o acerto está mais baixo.</p> : (
        <ol class="weak-topics__list">
          {topics.map(topic => {
            const period = topic.periodStart && topic.periodEnd
              ? topic.periodStart === topic.periodEnd ? formatDate(topic.periodStart) : `${formatDate(topic.periodStart)} a ${formatDate(topic.periodEnd)}`
              : 'Período não informado';
            return <li key={topic.topicId} class="weak-topics__item">
              <span class="weak-topics__name">{topic.name}{topic.subjectName && <> <small>{topic.subjectName}</small></>}</span>
              <span class="weak-topics__acc weak-topics__num">{String(topic.accuracy).replace('.', ',')}%</span>
              <span class="weak-topics__meta"><span class="weak-topics__num">{topic.sampleSize}</span> questões · <span class="weak-topics__num">{period}</span>{topic.insufficient && <> · <strong class="weak-topics__flag">Evidência insuficiente · Amostra a ampliar</strong></>}</span>
            </li>;
          })}
        </ol>
      )}
    </section>
  );
}
