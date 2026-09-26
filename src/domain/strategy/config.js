// Shared meanings across strategic views. These are presentation and eligibility
// boundaries; priority scoring keeps its own calibrated factors.
export const STRATEGY_THRESHOLDS=Object.freeze({
  highImpact:70,
  adequateMastery:70,
  sufficientEvidence:.5,
  historicalMinimumExamCount:4
});

export const isHighImpact=value=>value!=null&&Number(value)>=STRATEGY_THRESHOLDS.highImpact;
export const isStrategicGap=item=>isHighImpact(item?.examImpact)&&item?.mastery!=null&&Number(item.mastery)<STRATEGY_THRESHOLDS.adequateMastery;
export const hasAdequateMastery=item=>item?.mastery!=null&&Number(item.mastery)>=STRATEGY_THRESHOLDS.adequateMastery&&Number(item.evidenceStrength)>=STRATEGY_THRESHOLDS.sufficientEvidence;
