/**
 * evidence-simulator.ts
 * Cálculo didático da Força da Evidência e Margem de Erro por Amostra (Lei dos Grandes Números).
 */

export interface EvidenceSimulationResult {
  sampleSize: number;
  observedAccuracy: number;
  marginOfErrorPct: number;
  confidenceRange: [number, number];
  evidenceLevel: 'insufficient' | 'emerging' | 'solid' | 'robust';
  levelLabel: string;
  badgeTone: 'danger' | 'warning' | 'info' | 'success';
  explanation: string;
  recommendationDecision: string;
}

/**
 * Simula a confiabilidade estatística de um resultado com base no tamanho da amostra de questões.
 */
export function calculateEvidenceConfidence(
  sampleSize: number,
  observedAccuracy: number = 80
): EvidenceSimulationResult {
  const n = Math.max(1, Math.min(250, Math.round(Number(sampleSize) || 1)));
  const p = Math.max(10, Math.min(100, Math.round(Number(observedAccuracy) || 80))) / 100;

  // Margem de erro estatística aproximada (95% CI)
  const standardError = Math.sqrt((p * (1 - p)) / n);
  const rawMargin = Math.round(1.96 * standardError * 100);
  const marginOfErrorPct = Math.max(3, Math.min(45, rawMargin));

  const minAccuracy = Math.max(0, Math.round(p * 100 - marginOfErrorPct));
  const maxAccuracy = Math.min(100, Math.round(p * 100 + marginOfErrorPct));

  let evidenceLevel: 'insufficient' | 'emerging' | 'solid' | 'robust' = 'insufficient';
  let levelLabel = 'Amostra Insuficiente';
  let badgeTone: 'danger' | 'warning' | 'info' | 'success' = 'danger';
  let explanation =
    'Menos de 10 questões. O resultado tem alta volatilidade e não permite saber se o acerto foi domínio ou sorte.';
  let recommendationDecision =
    'O algoritmo não altera o planejamento nem declara nota zero. Prioriza coleta de evidências.';

  if (n >= 80) {
    evidenceLevel = 'robust';
    levelLabel = 'Evidência Robusta';
    badgeTone = 'success';
    explanation = `Com ${n} questões, a margem de erro cai para ±${marginOfErrorPct}%. O desempenho real tem alta significância estatística.`;
    recommendationDecision =
      'O algoritmo aplica pesos normais, calcula índice de prontidão com máxima confiança e pode sugerir transição para manutenção.';
  } else if (n >= 30) {
    evidenceLevel = 'solid';
    levelLabel = 'Evidência Sólida';
    badgeTone = 'info';
    explanation = `Com ${n} questões, o comportamento do tópico se estabiliza (margem ±${marginOfErrorPct}%).`;
    recommendationDecision =
      'O sistema consolida métricas e permite diagnósticos comparáveis entre semanas.';
  } else if (n >= 10) {
    evidenceLevel = 'emerging';
    levelLabel = 'Em Observação';
    badgeTone = 'warning';
    explanation = `Entre 10 e 29 questões, surge uma tendência preliminar, mas a margem de erro ainda é expressiva (±${marginOfErrorPct}%).`;
    recommendationDecision =
      'O sistema sinaliza alertas moderados, mas evita conclusões definitivas sobre lacunas.';
  }

  return {
    sampleSize: n,
    observedAccuracy: Math.round(p * 100),
    marginOfErrorPct,
    confidenceRange: [minAccuracy, maxAccuracy],
    evidenceLevel,
    levelLabel,
    badgeTone,
    explanation,
    recommendationDecision,
  };
}
