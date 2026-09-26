import {STRATEGY_THRESHOLDS} from '../strategy/config.js';
export const EXAM_INTELLIGENCE_VERSION=1;

export const EXAM_INTELLIGENCE_CONFIG=Object.freeze({
  minimumHistoricalExams:STRATEGY_THRESHOLDS.historicalMinimumExamCount,
  maximumHistoricalAdjustment:15,
  historicalAdjustmentFactor:.35,
  minimumAdaptiveImpact:50,
  minimumAdaptiveNeed:25,
  transferMinimumMinutes:15,
  transferMaximumMinutes:40,
  cooldownDays:14
});
