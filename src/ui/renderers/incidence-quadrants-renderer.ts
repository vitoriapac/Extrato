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

export function renderIncidenceQuadrants(rows: any[] = []) {
  const groups = [
    { key: 'reinforce', label: 'Alta incidência · desenvolver domínio' },
    { key: 'maintain', label: 'Alta incidência · manter domínio' },
    { key: 'evaluate', label: 'Menor incidência · avaliar necessidade' },
    { key: 'monitor', label: 'Menor incidência · acompanhar' },
    { key: 'insufficient', label: 'Evidência insuficiente para posicionar' },
  ];
  const classified = rows.map(row => ({
    ...row,
    quadrant:
      row.mastery == null ||
      row.presencePercent == null ||
      !['moderate', 'high'].includes(row.confidence)
        ? 'insufficient'
        : row.presencePercent >= 50
          ? row.mastery >= 70
            ? 'maintain'
            : 'reinforce'
          : row.mastery >= 70
            ? 'monitor'
            : 'evaluate',
  }));
  const item = (row: any) =>
    `<li><button type="button" class="exam-matrix-topic" data-exam-matrix-topic="${escape(row.topicId)}">${escape(row.subjectName)} — ${escape(row.name)}</button><p>Presença ${row.presencePercent ?? '—'}% · domínio ${row.mastery == null ? 'sem dados' : Math.round(row.mastery)} · confiança ${escape(row.confidenceLabel)} · prioridade existente ${row.priority == null ? 'sem dados' : Math.round(row.priority)}</p></li>`;
  const list = (items: any[]) => `<ul>${items.map(item).join('')}</ul>`;
  // Cinco por grupo, o resto sob "Mostrar mais"; a ordem é a escolhida no filtro "Ordenar por".
  const visibleItems = 5;
  const records = groups
    .map(group => {
      const items = classified.filter(row => row.quadrant === group.key);
      if (!items.length)
        return `<section class="incidence-quadrant"><h5>${group.label} (0)</h5><p>Nenhum tópico neste grupo.</p></section>`;
      // Sem evidência o grupo não orienta decisão: fica fechado, só com a contagem à vista.
      if (group.key === 'insufficient' && items.length > visibleItems)
        return `<section class="incidence-quadrant"><details class="performance-more"><summary>${group.label} (${items.length})</summary>${list(items)}</details></section>`;
      const rest = items.slice(visibleItems);
      return `<section class="incidence-quadrant"><h5>${group.label} (${items.length})</h5>${list(items.slice(0, visibleItems))}${rest.length ? `<details class="performance-more"><summary>Mostrar mais · +${rest.length}</summary>${list(rest)}</details>` : ''}</section>`;
    })
    .join('');
  return renderChartFrame({
    title: 'Incidência × Domínio',
    description:
      'Presença em pelo menos 50% das provas e domínio de pelo menos 70/100 delimitam os quadrantes. São referências de leitura; a recomendação continua usando a prioridade existente.',
    evidence:
      'Só confiança moderada ou alta permite posicionar. Baixa confiança e ausência de domínio ficam separados.',
    emptyMessage: `Os ${classified.length} tópicos ainda não têm confiança moderada ou alta para serem posicionados. A lista abaixo mostra cada grupo.`,
    records: `<div class="incidence-quadrants">${records}</div>`,
  });
}
