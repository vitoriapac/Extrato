import { renderChartFrame } from '../chart-components.js';
const escape = (value: unknown) =>
  String(value ?? '').replace(
    /[&<>"']/g,
    (char: string) =>
      (
        ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }) as Record<
          string,
          string
        >
      )[char]
  );

/** Mediana da incidência entre tópicos com evidência suficiente (limitada a 10–50%), evitando quadrantes vazios em bancas dispersas. */
export function computeIncidenceThreshold(rows: any[] = []): number {
  const values = rows
    .filter(
      row =>
        row.mastery != null &&
        row.presencePercent != null &&
        ['moderate', 'high'].includes(row.confidence)
    )
    .map(row => Number(row.presencePercent))
    .filter(Number.isFinite)
    .sort((a, b) => a - b);
  if (!values.length) return 50;
  const mid = Math.floor(values.length / 2);
  const median = values.length % 2 ? values[mid] : (values[mid - 1] + values[mid]) / 2;
  return Math.max(10, Math.min(50, Math.round(median)));
}

export function renderIncidenceQuadrants(rows: any[] = []) {
  const threshold = computeIncidenceThreshold(rows);
  const groups = [
    { key: 'reinforce', label: 'Alta incidência · desenvolver domínio' },
    { key: 'maintain', label: 'Alta incidência · manter domínio' },
    { key: 'evaluate', label: 'Menor incidência · avaliar necessidade' },
    { key: 'monitor', label: 'Menor incidência · acompanhar' },
    { key: 'insufficient', label: 'Sem evidência suficiente para posicionar' },
  ];
  const classified = rows.map(row => ({
    ...row,
    quadrant:
      row.mastery == null ||
      row.presencePercent == null ||
      !['moderate', 'high'].includes(row.confidence)
        ? 'insufficient'
        : row.presencePercent >= threshold
          ? row.mastery >= 70
            ? 'maintain'
            : 'reinforce'
          : row.mastery >= 70
            ? 'monitor'
            : 'evaluate',
  }));
  const positioned = classified.filter(row => row.quadrant !== 'insufficient').length;
  const item = (row: any) =>
    `<li><button type="button" class="exam-matrix-topic" data-exam-matrix-topic="${escape(row.topicId)}">${escape(row.subjectName)} — ${escape(row.name)}</button><p>Incidência ${row.presencePercent ?? '—'}% · domínio ${row.mastery == null ? 'sem dados' : `${Math.round(row.mastery)}/100`} · base histórica ${escape(row.confidenceLabel)} · prioridade existente ${row.priority == null ? 'sem dados' : Math.round(row.priority)}</p></li>`;
  const list = (items: any[]) => `<ul>${items.map(item).join('')}</ul>`;
  // Cinco por grupo, o resto sob "Mostrar mais"; a ordem é a escolhida no filtro "Ordenar por".
  const visibleItems = 5;
  const MORE_ITEMS = 10;
  const emptyGroups: string[] = [];
  const records = groups
    .map(group => {
      const items = classified.filter(row => row.quadrant === group.key);
      if (!items.length) {
        emptyGroups.push(group.label);
        return '';
      }
      const diagnosisLink = (text: string) =>
        `<p class="analytics-note incidence-quadrant__rest">${text} <button type="button" class="btn ghost small" data-performance-jump="diagnosis">Abrir o Diagnóstico</button></p>`;
      // Sem evidência o grupo não orienta decisão: só a contagem e o caminho para o Diagnóstico, sem despejar a lista.
      if (group.key === 'insufficient')
        return `<section class="incidence-quadrant"><h5>${group.label} (${items.length})</h5>${diagnosisLink(`${items.length} ${items.length === 1 ? 'tópico ainda não tem' : 'tópicos ainda não têm'} domínio medido e base histórica média ou alta para entrar nos quadrantes; todos estão no Diagnóstico, com a ação de coletar evidência.`)}</section>`;
      // Cinco à vista, mais ${MORE_ITEMS} sob "Mostrar mais"; o que passar disso fica no Diagnóstico.
      const rest = items.slice(visibleItems);
      const more = rest.slice(0, MORE_ITEMS);
      const beyond = rest.length - more.length;
      return `<section class="incidence-quadrant"><h5>${group.label} (${items.length})</h5>${list(items.slice(0, visibleItems))}${more.length ? `<details class="performance-more"><summary>Mostrar mais · +${more.length}</summary><template data-lazy>${list(more)}</template></details>` : ''}${beyond > 0 ? diagnosisLink(`Mais ${beyond} ${beyond === 1 ? 'tópico' : 'tópicos'} neste grupo, na ordem escolhida em "Ordenar por".`) : ''}</section>`;
    })
    .join('');
  // Grupos vazios viram uma linha só, em vez de uma seção com título e aviso cada.
  const emptyNote = emptyGroups.length
    ? `<p class="analytics-note">Sem tópicos em: ${emptyGroups.map(escape).join('; ')}.</p>`
    : '';
  return renderChartFrame({
    title: 'Incidência × domínio',
    description:
      `Corte em ${threshold}% de incidência (mediana observada) e 70/100 de domínio.`,
    evidence:
      'Somente tópicos com evidência média ou alta entram nos quadrantes.',
    emptyTitle: positioned ? 'Sem gráfico: os grupos estão na lista abaixo' : undefined,
    emptyMessage: positioned
      ? `${positioned} de ${classified.length} tópicos têm evidência média ou alta e aparecem na lista abaixo; os demais seguem em "Sem evidência suficiente para posicionar".`
      : `Os ${classified.length} tópicos ainda não têm evidência média ou alta para entrar nos quadrantes. Veja a lista abaixo.`,
    records: `<div class="incidence-quadrants">${records}</div>${emptyNote}`,
  });
}
