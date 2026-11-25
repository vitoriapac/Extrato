export interface CebraspeEssayScoreInput {
  contentScore: number;
  maxScore: number;
  linesWritten: number;
  grammarErrors: number;
  errorWeight?: number | null;
}

export interface CebraspeEssayScoreResult {
  contentScore: number;
  maxScore: number;
  linesWritten: number;
  grammarErrors: number;
  errorWeight: number;
  errorsPerLine: number;
  deduction: number;
  netScore: number;
  netPercent: number;
}

/**
 * Calcula a apenação gramatical por linha no critério Cebraspe:
 * Nota Final = max(0, NC − w × (NE / TL)), onde NC é a nota de conteúdo,
 * NE o total de erros gramaticais, TL as linhas escritas e w o peso de apenação (padrão 2).
 */
export function calculateCebraspeEssayScore({
  contentScore,
  maxScore,
  linesWritten,
  grammarErrors,
  errorWeight = 2,
}: CebraspeEssayScoreInput): CebraspeEssayScoreResult {
  const max = Math.max(1, Number(maxScore) || 10);
  const nc = Math.max(0, Math.min(max, Number(contentScore) || 0));
  const tl = Math.max(1, Math.floor(Number(linesWritten) || 0));
  const ne = Math.max(0, Math.floor(Number(grammarErrors) || 0));
  const w =
    errorWeight != null && Number.isFinite(Number(errorWeight)) && Number(errorWeight) > 0
      ? Number(errorWeight)
      : 2;

  const errorsPerLine = ne / tl;
  const rawDeduction = w * errorsPerLine;
  const netScore = Math.max(0, nc - rawDeduction);

  return {
    contentScore: Math.round(nc * 100) / 100,
    maxScore: max,
    linesWritten: tl,
    grammarErrors: ne,
    errorWeight: w,
    errorsPerLine: Math.round(errorsPerLine * 1000) / 1000,
    deduction: Math.round(rawDeduction * 100) / 100,
    netScore: Math.round(netScore * 100) / 100,
    netPercent: Math.round((netScore / max) * 1000) / 10,
  };
}
