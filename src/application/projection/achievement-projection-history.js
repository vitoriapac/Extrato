import {ACHIEVEMENT_PROJECTION_VERSION} from './projection-status.js';

const scope = tags => JSON.stringify([...(tags || [])].sort());
const validPercent = value => value == null || typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100;

export function achievementProjectionHistory(snapshots = [], activeExamTags = [], today = null) {
  return snapshots.filter(item => item?.kind === 'achievement' && scope(item.activeExamTags) === scope(activeExamTags)
    && (!today || item.date <= today)).sort((a, b) => a.date.localeCompare(b.date) || a.issuedAt.localeCompare(b.issuedAt));
}

export function captureAchievementProjection({snapshots, model, simulations = [], date, issuedAt, id, activeExamTags = [],
  inputs = {}}) {
  if (!Array.isArray(snapshots) || !model || model.algorithmVersion !== ACHIEVEMENT_PROJECTION_VERSION || !/^\d{4}-\d{2}-\d{2}$/.test(date || '')) return false;
  const selectedIds = new Set((model.trajectory?.observations || []).map(item => item.id));
  const observed = simulations.filter(item => selectedIds.has(item.id) && item.date <= date && Number(item.total) > 0 && Number(item.correct) >= 0
    && Number(item.correct) <= Number(item.total)).map(item => ({id: item.id, date: item.date,
    correct: Number(item.correct), total: Number(item.total)})).sort((a, b) => a.date.localeCompare(b.date) || String(a.id).localeCompare(String(b.id)));
  const source = {examDate: model.exam.date, targetScore: model.current.targetScore,
    coverage: inputs.coverage == null ? null : Math.max(0,Math.min(100,Number(inputs.coverage))),
    adherence: inputs.adherence == null ? null : Math.max(0,Math.min(100,Number(inputs.adherence))),
    consistency: inputs.consistency ?? null, openHighImpactPriorities: inputs.openHighImpactPriorities ?? 0,
    topicRisks: inputs.topicRisks ?? [],
    simulations: observed};
  const signature = JSON.stringify([scope(activeExamTags), date, ACHIEVEMENT_PROJECTION_VERSION, source]);
  if (snapshots.some(item => item.kind === 'achievement' && item.signature === signature)) return false;
  snapshots.push(structuredClone({kind: 'achievement', id, date, issuedAt, activeExamTags, signature,
    algorithmVersion: ACHIEVEMENT_PROJECTION_VERSION, source, status: model.status, confidence: model.confidence,
    current: model.current, trajectory: model.trajectory, exam: model.exam, projection: model.projection,
    evidence: model.evidence, topicRisks: model.topicRisks, recovery: model.recovery,
    drivers: model.drivers, risks: model.risks, summary: model.summary}));
  return true;
}

export function validAchievementProjectionSnapshot(item) {
  if (item?.kind !== 'achievement' || ![1,ACHIEVEMENT_PROJECTION_VERSION].includes(item.algorithmVersion)
    || !['insufficient_data', 'on_track', 'attention', 'at_risk'].includes(item.status)
    || !['insufficient', 'low', 'moderate'].includes(item.confidence?.level)
    || !Array.isArray(item.confidence.reasons) || !item.confidence.reasons.every(value => typeof value === 'string' && value.length <= 500)
    || !item.source || !validPercent(item.source.targetScore) || !validPercent(item.source.coverage)
    || !validPercent(item.source.adherence) || !Array.isArray(item.source.simulations)
    || !Number.isInteger(item.source.openHighImpactPriorities) || item.source.openHighImpactPriorities < 0
    || item.algorithmVersion >= 2 && (!Array.isArray(item.source.topicRisks)
      || !Array.isArray(item.topicRisks) || item.topicRisks.length !== item.source.topicRisks.length
      || item.topicRisks.length > 1000 || item.topicRisks.some(risk =>
        typeof risk.topicId !== 'string' || typeof risk.subjectId !== 'string'
        || typeof risk.topicName !== 'string' || typeof risk.subjectName !== 'string'
        || !validPercent(risk.examImpact) || !validPercent(risk.mastery))
      || !item.recovery || !['collect_evidence','guidance'].includes(item.recovery.state)
      || !Array.isArray(item.recovery.steps) || item.recovery.steps.length > 4
      || item.recovery.steps.some(step => typeof step !== 'string' || step.length > 500))
    || item.source.consistency != null && (!Number.isInteger(item.source.consistency.days)
      || item.source.consistency.days < 0 || item.source.consistency.days > 7
      || !Number.isInteger(item.source.consistency.target) || item.source.consistency.target < 1
      || item.source.consistency.target > 7)
    || item.source.simulations.length > 5000 || !Array.isArray(item.drivers) || !Array.isArray(item.risks)
    || [...item.drivers, ...item.risks].some(value => typeof value !== 'string' || value.length > 500)
    || typeof item.summary !== 'string' || item.summary.length > 1000) return false;
  const band = item.projection?.calibratedSimulationBand;
  return item.projection?.examDayScore === null && item.projection?.approvalProbability === null
    && (!band || [band.low, band.central, band.high].every(validPercent) && band.low <= band.central && band.central <= band.high)
    && item.current?.targetScore === item.source.targetScore && validPercent(item.current.simulationAccuracy)
    && validPercent(item.current.readiness) && Array.isArray(item.trajectory?.observations)
    && item.trajectory.observations.length <= 12 && item.trajectory.observations.every(point =>
      /^\d{4}-\d{2}-\d{2}$/.test(point.date || '') && validPercent(point.value)
      && Number.isFinite(point.sampleSize) && point.sampleSize > 0)
    && (item.exam?.date === null || /^\d{4}-\d{2}-\d{2}$/.test(item.exam?.date || ''))
    && (item.exam?.daysRemaining === null || Number.isInteger(item.exam.daysRemaining));
}
