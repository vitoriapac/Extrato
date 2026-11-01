import { READINESS_ON_TRACK_MIN } from '../../domain/analytics/approval-metrics.js';
import { renderRingGauge, renderSparkline } from '../primitives/charts/charts.js';
export function renderHeroHeader(model: Record<string, any>, { document }: any) {
  const readiness = model.readiness,
    stats = model.stats;
  const figure = document.getElementById('balanceFigure');
  figure.innerHTML = `${readiness.value ?? '—'}<span>/100</span>`;
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
  document.getElementById('balanceSub').textContent =
    readiness.value == null
      ? readiness.availableFactors
        ? `Ainda sem evidência suficiente · ${readiness.availableFactors} de ${readiness.totalFactors} fatores disponíveis`
        : 'Aguardando evidências'
      : `Confiança do índice: ${readiness.confidence.toLowerCase()} · ${readiness.availableFactors} de ${readiness.totalFactors} fatores disponíveis`;
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
}
