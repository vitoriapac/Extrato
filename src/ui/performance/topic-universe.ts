/**
 * Linha-chave dos universos de tópicos: os números de Diagnóstico e de Resultados das provas saem todos daqui,
 * para o aluno ver como 305, 296 e 194 se relacionam em vez de somar de cabeça.
 */
export interface TopicUniverse {
  /** Tópicos ativos no edital do concurso ativo. */
  inScope: number;
  /** Tópicos do edital ainda não concluídos. */
  remaining?: number | null;
  /** Tópicos do edital com algum sinal de diagnóstico (os que entram na fila). */
  withSignal?: number | null;
  /** Tópicos do edital com questões no histórico da banca. */
  mapped?: number | null;
  /** Tópicos com sinal que aparecem em "Próxima ação", acima da lista. */
  inNextAction?: number | null;
  /** Tópicos já sob controle (manutenção ou recuperação consistente): o que está firme. */
  controlled?: number | null;
}

export const countRemainingTopics = (topics: Array<Record<string, any>>) =>
  topics.filter(topic => topic.status !== 'Concluído').length;

const topics = (count: number) => `${count} ${count === 1 ? 'tópico' : 'tópicos'}`;

export function renderTopicUniverse(universe: TopicUniverse): string {
  const { inScope, remaining, withSignal, mapped, inNextAction, controlled } = universe;
  if (!Number.isFinite(inScope) || inScope <= 0) return '';
  const parts = [`${topics(inScope)} no edital`];
  if (remaining != null) parts.push(`${remaining} por concluir`);
  if (withSignal != null) parts.push(`${withSignal} com sinal de diagnóstico`);
  if (controlled) parts.push(`${controlled} já sob controle`);
  if (mapped != null) parts.push(`${mapped} mapeados ao histórico da banca`);
  const notes: string[] = [];
  if (withSignal != null && withSignal < inScope)
    notes.push(`${inScope - withSignal} sem sinal ainda não entram na lista`);
  if (inNextAction) notes.push(`${inNextAction} aparece na Sugestão do diagnóstico, acima da lista`);
  if (mapped != null && mapped < inScope)
    notes.push(`${inScope - mapped} sem questão no histórico da banca`);
  return `<p class="analytics-note performance-universe" data-topic-universe>${parts.join(' · ')}${notes.length ? ` (${notes.join('; ')})` : ''}.</p>`;
}
