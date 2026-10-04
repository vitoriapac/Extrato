export const SUSTAINABILITY_POLICY=Object.freeze({version:1,defaultHistoryWeeks:4,historyWindows:Object.freeze([4,8,12]),
  minimumComparableWeeks:3,confirmedComparableWeeks:4,minimumClassifiedCoverage:80,
  adherencePolicyVersion:1,priorityPolicyVersion:1,percentScale:100,rangeRoundingMinutes:30,
  aggregation:'planned-minute-weighted',rangeMethod:'interquartile',capacityToleranceMinutes:0,
  timeAdherence:Object.freeze({sustainable:85,mismatch:75}),
  priorityAdherence:Object.freeze({preserved:80,low:65}),
  minimumRepeatedWeeks:3,variabilityCoefficient:0.35,anomalyDeviationPoints:30});
