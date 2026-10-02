import {buildCalibratedScoreProjection} from '../../domain/forecasts/calibrated-score-projection.js';
import {buildPerformanceForecast} from '../../domain/forecasts/performance-forecast.js';
import {resolveExamPhase} from '../../domain/planning/adaptive-planning.js';
import {buildProjectionConfidence} from './build-projection-confidence.js';
import {buildProjectionExplanation} from './build-projection-explanation.js';
import {buildProjectionRecovery} from './build-projection-recovery.js';
import {ACHIEVEMENT_PROJECTION_VERSION, PROJECTION_STATUS, daysBetweenCalendarDates} from './projection-status.js';

const percent = value => value == null || value === '' || !Number.isFinite(Number(value)) ? null : Math.max(0, Math.min(100, Number(value)));

// This model evaluates measured simulation performance. It does not estimate approval odds
// or extrapolate the 30-day forecast to an arbitrary exam date.
export function buildAchievementProjection({today, examDate, targetScore = 80, simulations = [], readiness = null,
  coverage = null, adherence = null, consistency = null, openHighImpactPriorities = 0, topicRisks = []} = {}) {
  const daysRemaining = daysBetweenCalendarDates(today, examDate);
  const target = percent(targetScore) ?? 80;
  const calibrated = buildCalibratedScoreProjection({simulations, today, target});
  const forecast = buildPerformanceForecast({currentValue: calibrated.available ? calibrated.central : null,
    currentConfidence: calibrated.confidence === 'moderate' ? .55 : .25,
    targetScore: target, observations: calibrated.observations || []});
  const confidence = buildProjectionConfidence(calibrated, forecast);
  const normalizedCoverage = percent(coverage), normalizedAdherence = percent(adherence);
  const phase = resolveExamPhase(daysRemaining);
  let status = PROJECTION_STATUS.insufficient;
  if (daysRemaining != null && daysRemaining >= 0 && calibrated.available) {
    const lowCoverage = normalizedCoverage != null && normalizedCoverage < 50;
    const weakExecution = normalizedAdherence != null && normalizedAdherence < 60;
    const highImpactGaps = Number(openHighImpactPriorities) > 0;
    const deteriorating = forecast.forecast30.available && forecast.forecast30.slopePerWeek < 0;
    const measuredGap = target - calibrated.central;
    const nearExam = phase.state === 'final_review' || phase.state === 'final_stretch' && daysRemaining <= 14;
    const strongCurrent = calibrated.low >= target;
    const improvingTowardTarget = forecast.forecast30.available && forecast.forecast30.slopePerWeek > 0
      && forecast.forecast30.central >= target && daysRemaining >= 30;
    if ((nearExam && measuredGap >= 5) || (measuredGap >= 8 && (deteriorating || weakExecution))) status = PROJECTION_STATUS.atRisk;
    else if (confidence.level === 'moderate' && normalizedCoverage >= 50 && normalizedAdherence >= 60
      && !lowCoverage && !weakExecution && !highImpactGaps && (strongCurrent || improvingTowardTarget)) status = PROJECTION_STATUS.onTrack;
    else status = PROJECTION_STATUS.attention;
  }
  const explanation = buildProjectionExplanation({status, calibrated, forecast, coverage: normalizedCoverage,
    adherence: normalizedAdherence, consistency, openHighImpactPriorities, target, daysRemaining});
  const exam={date:examDate||null,daysRemaining,phase:phase.state};
  const current={simulationAccuracy:calibrated.available?calibrated.central:null,targetScore:target,readiness:readiness?.value??null};
  const recovery=buildProjectionRecovery({status,current,exam,coverage:normalizedCoverage,adherence:normalizedAdherence,topicRisks});
  return {
    algorithmVersion: ACHIEVEMENT_PROJECTION_VERSION, status, confidence, current,
    trajectory: {observations: calibrated.observations || [], direction: !forecast.forecast30.available ? 'insufficient_data' :
      forecast.forecast30.slopePerWeek > 0 ? 'improving' : forecast.forecast30.slopePerWeek < 0 ? 'deteriorating' : 'stable',
      forecast30: forecast.forecast30},
    exam,
    projection: {examDayScore: null, approvalProbability: null, calibratedSimulationBand: calibrated.available ?
      {low: calibrated.low, central: calibrated.central, high: calibrated.high} : null},
    evidence: calibrated.evidence, topicRisks, recovery, ...explanation
  };
}
