export const HEATMAP_METRICS=Object.freeze(['hours','questions','reviews','simulations']);

export function heatmapMetricValue(summary,metric){
  if(metric==='questions')return Number(summary.questions)||0;
  if(metric==='reviews')return Number(summary.reviews)||0;
  if(metric==='simulations')return Number(summary.simulations)||0;
  return Number(summary.seconds)||0;
}

export function heatmapMetricLevel(summary,metric){
  const value=heatmapMetricValue(summary,metric);if(value<=0)return 0;
  if(metric==='hours'){
    if(summary.targetSeconds>0)return summary.goalPct<50?1:summary.goalPct<100?2:3;
    return value<3600?1:value<7200?2:3;
  }
  const limits=metric==='questions'?[20,50]:metric==='reviews'?[1,2]:[1,2];
  return value<=limits[0]?1:value<=limits[1]?2:3;
}
