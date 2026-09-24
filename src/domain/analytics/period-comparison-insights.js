export const PERIOD_COMPARISON_INSIGHTS_VERSION = '1.0.0';

const safeCount = value => Math.max(0, Number.isFinite(Number(value)) ? Number(value) : 0);

export function buildPeriodComparisonInsights(comparison, {
  currentQuestionVolume = 0,
  previousQuestionVolume = 0,
  minimumSample = 20
} = {}) {
  const entries = Array.isArray(comparison?.metrics)
    ? comparison.metrics
    : Object.entries(comparison?.metrics || {}).map(([key, metric]) => ({ key, ...metric }));
  const current = safeCount(currentQuestionVolume);
  const previous = safeCount(previousQuestionVolume);
  const sample = Math.min(current, previous);
  const accuracy = entries.find(item => item.key === 'accuracy');
  const confidence = sample >= minimumSample ? 'moderate' : sample > 0 ? 'low' : 'insufficient';
  const confidenceLabel = confidence === 'moderate' ? 'amostra comparável' : confidence === 'low' ? 'amostra pequena' : 'sem amostra comparável';
  const delta = accuracy?.delta ?? null;
  const questionDelta=entries.find(item=>item.key==='questions')?.delta??null;
  const minutesDelta=entries.find(item=>item.key==='minutes')?.delta??null;
  const accuracyMessage = delta == null
    ? 'Acerto sem comparação: são necessárias questões resolvidas nos dois períodos.'
    : `O acerto variou ${delta > 0 ? '+' : ''}${delta} p.p. (${previous} questões no período anterior e ${current} no atual; ${confidenceLabel}).`;
  let combinedMessage=null;
  if(confidence==='moderate'&&delta!=null){
    if(questionDelta>0&&delta>0)combinedMessage='Você aumentou o volume de questões e também a taxa de acerto.';
    else if(minutesDelta>0&&delta<0)combinedMessage='Você estudou mais tempo, mas a taxa de acerto caiu.';
    else if(questionDelta<0&&delta>0)combinedMessage='O volume de questões caiu e a taxa de acerto subiu.';
    else if(questionDelta>0&&delta<0)combinedMessage='Você resolveu mais questões, mas a taxa de acerto caiu.';
  }

  return {
    algorithmVersion: PERIOD_COMPARISON_INSIGHTS_VERSION,
    state: entries.some(item => item.delta != null) ? 'available' : 'insufficient',
    confidence,
    confidenceLabel,
    comparableMetrics: entries.filter(item => item.delta != null).length,
    currentQuestionVolume: current,
    previousQuestionVolume: previous,
    accuracyDelta: delta,
    accuracyMessage,
    combinedMessage,
    combinedState:combinedMessage?'available':confidence==='insufficient'?'insufficient':'not_applicable',
    caveat: 'A variação descreve os registros dos períodos e não demonstra que uma ação causou a mudança.'
  };
}
