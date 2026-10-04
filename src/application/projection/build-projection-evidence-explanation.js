export function buildProjectionEvidenceExplanation(model){
  const evidence=model?.evidence||{},band=model?.projection?.calibratedSimulationBand;
  const facts=[
    {label:'Simulados comparáveis',value:evidence.observationCount??0},
    {label:'Questões nos simulados',value:evidence.sampleSize??0},
    {label:'Amplitude do histórico em dias',value:evidence.spanDays??0},
    {label:'Registros válidos fora do grupo utilizado',value:evidence.excludedCount??0}
  ];
  return {facts,bandMeaning:band?'A faixa resume o desempenho recente em simulados comparáveis; não é uma nota prevista no dia da prova.':'Sem amostra suficiente, não há faixa de desempenho.',
    method:'O centro usa a mediana dos três últimos simulados comparáveis. A margem é conservadora e considera dispersão e erros retrospectivos; não é um intervalo estatístico de confiança.',
    confidenceMeaning:'A confiança considera composição, histórico e calibração. Volume de estudo não acrescenta pontos à nota nem eleva a confiança. O modelo atual oferece no máximo confiança moderada.',
    trendMeaning:'A tendência de 30 dias é separada da faixa atual e não é extrapolada para a data da prova.'};
}
