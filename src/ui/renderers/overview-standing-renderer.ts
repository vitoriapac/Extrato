import type { OverviewStanding } from '../../application/analytics/build-overview-standing.js';

const defaultEscape = (value: unknown) =>
  String(value ?? '').replace(
    /[&<>"']/g,
    (char: string) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[char] as string
  );

type Options = { escapeHtml?: (value: unknown) => string; formatDate?: (iso: string) => string };

const STATUS_TEXT = {
  below: 'abaixo da meta',
  overlap: 'a faixa inclui a meta',
  above: 'acima da meta',
};

function renderTrajectory(
  model: NonNullable<OverviewStanding['trajectory']>,
  { formatDate = (iso: string) => iso }: Options
) {
  const obs = model.observations;
  // A escala acompanha os valores (com folga) para a curva não ficar achatada entre 0 e 100.
  const values = [...obs.map(item => item.value), model.low, model.high, model.target];
  const lo = Math.max(0, Math.floor((Math.min(...values) - 8) / 10) * 10);
  const hi = Math.min(100, Math.ceil((Math.max(...values) + 8) / 10) * 10);
  const y = (value: number) => 8 + ((hi - Math.max(lo, Math.min(hi, value))) / (hi - lo || 1)) * 96;
  const t0 = Date.parse(`${obs[0].date}T12:00:00Z`);
  const span = Date.parse(`${obs[obs.length - 1].date}T12:00:00Z`) - t0;
  const x = (date: string) =>
    span > 0 ? 30 + ((Date.parse(`${date}T12:00:00Z`) - t0) / span) * 182 : 120;
  const points = obs.map(item => `${x(item.date).toFixed(1)},${y(item.value).toFixed(1)}`);
  const dots = obs
    .map(
      item =>
        `<circle class="ovs-dot" cx="${x(item.date).toFixed(1)}" cy="${y(item.value).toFixed(1)}" r="2.8"><title>${formatDate(item.date)}: ${Math.round(item.value)}%</title></circle>`
    )
    .join('');
  const label = `Simulados de ${formatDate(obs[0].date)} a ${formatDate(obs[obs.length - 1].date)}, estimativa de ${model.low} a ${model.high} contra a meta de ${model.target}`;
  const svg = `<svg viewBox="0 0 260 124" role="img" aria-label="${label}" class="ovs-chart">
    <line class="ovs-target" x1="28" x2="254" y1="${y(model.target)}" y2="${y(model.target)}"/>
    <text class="ovs-axis ovs-axis--target" x="30" y="${Math.max(12, y(model.target) - 4)}">meta ${model.target}</text>
    <text class="ovs-axis" x="24" y="${y(hi) + 4}" text-anchor="end">${hi}</text><text class="ovs-axis" x="24" y="${y(lo) + 4}" text-anchor="end">${lo}</text>
    <rect class="ovs-band" x="224" width="30" y="${y(model.high)}" height="${Math.max(2, y(model.low) - y(model.high))}"/>
    <line class="ovs-central" x1="224" x2="254" y1="${y(model.central)}" y2="${y(model.central)}"/>
    <polyline class="ovs-line" points="${points.join(' ')}"/>${dots}
    <text class="ovs-axis" x="28" y="120">${formatDate(obs[0].date)}</text>
    <text class="ovs-axis" x="254" y="120" text-anchor="end">${formatDate(obs[obs.length - 1].date)}</text>
  </svg>`;
  const confidence = model.confidenceLabel ? ` Confiança ${model.confidenceLabel.toLowerCase()}.` : '';
  return `<article class="chart-card overview-standing__card" aria-labelledby="ovsTrajectoryTitle"><h3 class="module-heading__title" id="ovsTrajectoryTitle">Trajetória nos simulados</h3>${svg}<p class="overview-standing__note">Estimativa de ${model.low} a ${model.high}: ${STATUS_TEXT[model.status] || ''} de ${model.target}.${confidence}</p></article>`;
}

function renderMatrix(model: OverviewStanding['matrix'], { escapeHtml = defaultEscape }: Options) {
  if (!model.positioned)
    return `<article class="chart-card overview-standing__card" aria-labelledby="ovsMatrixTitle"><h3 class="module-heading__title" id="ovsMatrixTitle">Prova × você</h3><p class="overview-standing__note">${
      model.total
        ? `Nenhum dos ${model.total} tópicos tem evidência suficiente para ser posicionado. Registre questões para ver onde a prova cobra mais do que você domina.`
        : 'Sem tópicos no concurso ativo. Configure o concurso para cruzar a prova com o seu domínio.'
    }</p></article>`;
  const px = (mastery: number) => 26 + Math.max(0, Math.min(100, mastery)) * 2.24;
  const py = (presence: number) => 104 - Math.max(0, Math.min(100, presence)) * 0.98;
  const plain = model.dots
    .filter(dot => !dot.rank)
    .map(
      dot =>
        `<circle class="ovs-point" cx="${px(dot.mastery).toFixed(1)}" cy="${py(dot.presencePercent).toFixed(1)}" r="2.8"/>`
    )
    .join('');
  const ranked = model.dots
    .filter(dot => dot.rank)
    .map(
      dot =>
        `<g><circle class="ovs-rank" cx="${px(dot.mastery).toFixed(1)}" cy="${py(dot.presencePercent).toFixed(1)}" r="9"/><text class="ovs-rank-label" x="${px(dot.mastery).toFixed(1)}" y="${(py(dot.presencePercent) + 4).toFixed(1)}" text-anchor="middle">${dot.rank}</text></g>`
    )
    .join('');
  const svg = `<svg viewBox="0 0 260 124" role="img" aria-label="Incidência na prova contra o seu domínio: ${model.positioned} tópicos posicionados, ${model.priority.length} de alta incidência e baixo domínio" class="ovs-chart">
    <rect class="ovs-zone" x="26" y="6" width="${(px(70) - 26).toFixed(1)}" height="${(py(50) - 6).toFixed(1)}"/>
    <rect class="ovs-frame" x="26" y="6" width="224" height="98"/>
    <line class="ovs-cut" x1="${px(70).toFixed(1)}" x2="${px(70).toFixed(1)}" y1="6" y2="104"/>
    <line class="ovs-cut" x1="26" x2="250" y1="${py(50).toFixed(1)}" y2="${py(50).toFixed(1)}"/>
    ${plain}${ranked}
    <text class="ovs-axis" x="12" y="55" text-anchor="middle" transform="rotate(-90 12 55)">na prova ↑</text>
    <text class="ovs-axis" x="250" y="120" text-anchor="end">seu domínio →</text>
  </svg>`;
  const list = model.priority.length
    ? `<ol class="overview-standing__list">${model.priority
        .map(
          item =>
            `<li><span class="overview-standing__rank" aria-hidden="true">${item.rank}</span><span><strong>${escapeHtml(item.name)}</strong> <small>${escapeHtml(item.subjectName)} · em ${item.presencePercent}% das provas · domínio ${item.mastery}</small></span></li>`
        )
        .join('')}</ol>`
    : '<p class="overview-standing__note">Nenhum tópico combina alta incidência com baixo domínio.</p>';
  return `<article class="chart-card overview-standing__card" aria-labelledby="ovsMatrixTitle"><h3 class="module-heading__title" id="ovsMatrixTitle">Prova × você</h3>${svg}${list}</article>`;
}

export function renderOverviewEvidence(model: OverviewStanding['evidence']) {
  if (!model) return '';
  const segments = Array.from(
    { length: model.total },
    (_, index) => `<i class="overview-standing__segment${index < model.available ? ' is-on' : ''}"></i>`
  ).join('');
  const missing = model.missing.length
    ? `Faltam ${model.missing.join(', ')} para o índice ganhar confiança.`
    : 'Todos os fatores do índice têm evidência.';
  return `<article class="chart-card overview-standing__card" aria-labelledby="ovsEvidenceTitle"><h3 class="module-heading__title" id="ovsEvidenceTitle">Qualidade da evidência</h3><div class="overview-standing__meter" role="img" aria-label="${model.available} de ${model.total} fatores com evidência">${segments}</div><p class="overview-standing__note"><strong>${model.available} de ${model.total} fatores.</strong> ${missing}</p></article>`;
}

export function renderOverviewStanding(model: OverviewStanding, options: Options = {}) {
  return [
    model.trajectory ? renderTrajectory(model.trajectory, options) : '',
    renderMatrix(model.matrix, options),
  ].join('');
}
