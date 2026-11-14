import { READINESS_ON_TRACK_MIN } from '../../domain/analytics/approval-metrics.js';
import { renderRingGauge, renderSparkline } from '../primitives/charts/charts.js';
// Each missing readiness factor links to the action that produces its evidence (F8).
export const READINESS_FACTOR_ACTIONS: Readonly<Record<string, string>> = Object.freeze({
  coverage: 'Cobertura: marcar tópicos estudados',
  mastery: 'Domínio: registrar questões',
  retention: 'Retenção: fazer uma revisão',
  consistency: 'Consistência: estudar hoje',
  simulations: 'Simulados: registrar um simulado',
});

function renderReadinessSub(readiness: Record<string, any>) {
  const missing: string[] = readiness.missingFactors || [];
  const lead =
    readiness.value == null
      ? readiness.availableFactors
        ? 'Ainda sem evidência suficiente'
        : 'Aguardando evidências'
      : `Evidência do índice: ${String(readiness.confidence).toLowerCase()}`;
  if (!missing.length) return `${lead} · ${readiness.availableFactors} de ${readiness.totalFactors} fatores disponíveis`;
  const actions = missing
    .filter(key => READINESS_FACTOR_ACTIONS[key])
    .map(
      key =>
        `<li><button type="button" class="readiness-factor-action" data-delegated-click="unlockReadinessFactor('${key}')">${READINESS_FACTOR_ACTIONS[key]}</button></li>`
    )
    .join('');
  // Without a number the figure already says how many are missing.
  const count = readiness.value == null ? '' : ` · faltam ${missing.length} de ${readiness.totalFactors} fatores`;
  // Folded so the first screen keeps the next action in view; each factor stays one click away.
  return `<span>${lead}${count}</span><details class="readiness-factors"><summary>Como liberar os fatores</summary><ul class="readiness-factor-actions">${actions}</ul></details>`;
}

export function renderHeroHeader(model: Record<string, any>, { document }: any) {
  const readiness = model.readiness,
    stats = model.stats;
  const figure = document.getElementById('balanceFigure');
  // Without a number, the figure says what is missing instead of a blank "—/100" (F8).
  const missing = (readiness.missingFactors || []).length;
  figure.innerHTML =
    readiness.value == null && missing
      ? `<span class="balance-missing">faltam ${missing} de ${readiness.totalFactors} fatores</span>`
      : `${readiness.value ?? '—'}<span>/100</span>`;
  // Amber is reserved for attention: only below the on-track band.
  figure.classList?.toggle('is-on-track', readiness.value != null && readiness.value >= READINESS_ON_TRACK_MIN);
  figure.classList?.toggle('is-empty', readiness.value == null);
  const ring = document.getElementById('balanceRing');
  if (ring)
    ring.innerHTML = renderRingGauge({
      value: readiness.value,
      target: READINESS_ON_TRACK_MIN,
      label: 'Índice de prontidão',
      size: 56,
      showValue: false,
    });
  const trend = document.getElementById('balanceTrend');
  if (trend)
    trend.innerHTML = `${renderSparkline({ values: model.readinessTrend || [], label: 'Prontidão nas últimas 8 semanas', unit: 'pontos' })}<small>8 semanas</small>`;
  document.getElementById('balanceSub').innerHTML = renderReadinessSub(readiness);
  document.getElementById('statSubjects').textContent = stats.subjects;
  document.getElementById('statContent').textContent = stats.contentPercent + '%';
  document.getElementById('statAndamento').textContent = stats.inProgress;
  document.getElementById('statConcluido').textContent = stats.completed;
  document.getElementById('statRevisoes').textContent = stats.upcomingReviews;
  document.getElementById('statStreak').textContent =
    `${model.streak.days} ${model.streak.days === 1 ? 'dia' : 'dias'}`;
}
export function renderCompactHeader(model: Record<string, any>, { document, formatDate }: any) {
  document.getElementById('compactReadiness').textContent =
    model.readiness.value == null ? '—' : model.readiness.value + '/100';
  const exam = document.getElementById('compactExamDate');
  exam.textContent = model.exam.date ? formatDate(model.exam.date) : '';
  exam.hidden = !model.exam.date;
  document.getElementById('compactPlanNumber').textContent = model.plan.number;
  // The streak only shows once there is one; a 0-day flame reads as a reproach, not a nudge.
  const streak = document.getElementById('compactStreak');
  if (streak) {
    const days = Number(model.streak?.days) || 0;
    streak.hidden = days < 1;
    document.getElementById('compactStreakDays').textContent = String(days);
    document.getElementById('compactStreakUnit').textContent = days === 1 ? 'dia' : 'dias';
    const label = document.getElementById('compactStreakLabel');
    if (label) label.textContent = `${days === 1 ? 'dia' : 'dias'} de sequência`;
  }
}
