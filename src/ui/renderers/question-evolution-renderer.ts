import { renderChartFrame, renderChartTooltip } from '../chart-components.js';
type FormatDate = (date: string) => string;
const label = (bucket: Record<string, any>, monthly: boolean, formatDate: FormatDate) =>
  monthly
    ? `${bucket.key.slice(5, 7)}/${bucket.key.slice(0, 4)}`
    : formatDate(bucket.key).slice(0, 5);

export function renderQuestionEvolution(
  model: Record<string, any>,
  { formatDate }: { formatDate: FormatDate }
) {
  if (model.state === 'empty')
    return renderChartFrame({
      title: 'Precisão ao longo do tempo',
      emptyMessage: 'Registre questões para acompanhar a evolução do desempenho.',
    });
  const width = Math.max(420, model.buckets.length * 48),
    height = 150,
    left = 24,
    right = 16,
    top = 12,
    bottom = 32;
  // Posição pela data real: uma semana sem questões aparece como lacuna, não é pulada.
  const times: number[] = model.buckets.map((item: any) =>
    Date.parse(model.monthly ? `${item.key}-01` : item.key)
  );
  const span = times.length > 1 ? times[times.length - 1] - times[0] : 0;
  const x = (index: number) =>
    left +
    (model.buckets.length === 1 || !span
      ? 0
      : ((times[index] - times[0]) / span) * (width - left - right));
  // Escala ajustada aos dados (como nos simulados): com 2 ou 3 pontos, 0 a 100 deixaria a linha achatada.
  const values: number[] = model.buckets
    .map((item: any) => item.movingAccuracy)
    .filter((value: unknown): value is number => typeof value === 'number');
  const scaleLow = values.length ? Math.max(0, Math.floor((Math.min(...values) - 5) / 10) * 10) : 0;
  const scaleHigh = values.length
    ? Math.min(100, Math.max(scaleLow + 20, Math.ceil((Math.max(...values) + 5) / 10) * 10))
    : 100;
  const y = (value: number) =>
    top + ((scaleHigh - value) / (scaleHigh - scaleLow)) * (height - top - bottom);
  const segments = [];
  for (let index = 1; index < model.buckets.length; index++) {
    const previous = model.buckets[index - 1].movingAccuracy,
      current = model.buckets[index].movingAccuracy;
    if (previous !== null && current !== null)
      segments.push(
        `<line class="question-evolution-line" x1="${x(index - 1)}" y1="${y(previous)}" x2="${x(index)}" y2="${y(current)}"/>`
      );
  }
  const points = model.buckets
    .map((item: any, index: any) =>
      item.movingAccuracy === null
        ? ''
        : `<circle class="question-evolution-point" cx="${x(index)}" cy="${y(item.movingAccuracy)}" r="4">${renderChartTooltip(label(item, model.monthly, formatDate) + ': média móvel ' + item.movingAccuracy + '% · ' + item.resolved + ' questões')}</circle>`
    )
    .join('');
  const axis = [scaleLow, Math.round((scaleLow + scaleHigh) / 2), scaleHigh]
    .map(
      value =>
        `<line class="question-evolution-grid" x1="${left}" x2="${width - right}" y1="${y(value)}" y2="${y(value)}"/><text x="0" y="${y(value) + 3}">${value}</text>`
    )
    .join('');
  const labels = model.buckets
    .map(
      (item: any, index: any) =>
        `<text x="${x(index)}" y="${height - 6}" text-anchor="middle">${label(item, model.monthly, formatDate)}</text>`
    )
    .join('');
  const chart =
    model.state === 'ready'
      ? `<div class="question-evolution-scroll"><svg aria-hidden="true" focusable="false" viewBox="0 0 ${width} ${height}" style="width:100%;min-width:${width}px;max-width:none;height:auto">${axis}${segments.join('')}${points}${labels}</svg></div>`
      : '<p class="analytics-note">A linha aparece após dois períodos com média móvel sustentada por pelo menos 30 questões.</p>';
  const rows = model.buckets
    .map((item: any) => {
      const correctWidth = (item.correct / item.resolved) * 100;
      return `<li><span>${label(item, model.monthly, formatDate)}</span><div class="question-mix-track" aria-hidden="true"><span style="width:${correctWidth}%"></span></div><strong>${item.correct} acertos · ${item.errors} erros</strong><small>${item.accuracy === null ? 'Amostra pequena' : item.accuracy + '%'} · média móvel ${item.movingAccuracy === null ? 'sem amostra' : item.movingAccuracy + '%'}</small></li>`;
    })
    .join('');
  return renderChartFrame({
    title: 'Precisão ao longo do tempo',
    description:
      'Média móvel ponderada dos três períodos mais recentes. Pontos com menos de 30 questões ficam ausentes.',
    period: model.buckets.length
      ? label(model.buckets[0], model.monthly, formatDate) +
        ' a ' +
        label(model.buckets.at(-1), model.monthly, formatDate)
      : '',
    evidence: model.resolved + ' questões no recorte · ' + model.accuracy + '% de acerto',
    legend: [{ label: 'Precisão média móvel', tone: 'primary' }],
    chart: model.state === 'ready' ? chart : '',
    emptyMessage:
      'São necessários dois períodos com média móvel sustentada por pelo menos 30 questões.',
    records: renderChartFrame({
      title: 'Acertos × erros por período',
      description:
        'Os totais complementam as barras; não é necessário distinguir cores para consultar os resultados.',
      legend: [
        { label: 'Acertos', tone: 'primary' },
        { label: 'Erros', tone: 'error' },
      ],
      chart: '<ol class="question-mix-list">' + rows + '</ol>',
    }),
  });
}
