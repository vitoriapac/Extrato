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

export type EssayBancaKey = 'Cebraspe' | 'FGV' | 'FCC' | 'Cesgranrio' | 'Padrao';

export interface MultibancaEssayScoreInput {
  banca: EssayBancaKey | string;
  maxScore: number;
  contentScore?: number;
  linesWritten?: number;
  grammarErrors?: number;
  errorWeight?: number | null;
  criteriaScores?: Record<string, number>;
}

export interface MultibancaEssayScoreResult {
  banca: string;
  maxScore: number;
  netScore: number;
  netPercent: number;
  formulaNote: string;
}

const clampScore = (val: unknown, max: number) =>
  Math.max(0, Math.min(max, Number(val) || 0));

/**
 * Calcula a nota de prova discursiva adaptada ao critério de cada banca examinadora
 * (Cebraspe, FGV, FCC, Cesgranrio e padrão linear).
 */
export function calculateMultibancaEssayScore(
  input: MultibancaEssayScoreInput
): MultibancaEssayScoreResult {
  const max = Math.max(1, Number(input.maxScore) || 10);
  const rawBanca = String(input.banca || 'Padrao').trim();
  const key = rawBanca.toLowerCase();

  if (key.includes('cebraspe') || key.includes('cespe')) {
    const res = calculateCebraspeEssayScore({
      contentScore: input.contentScore ?? 0,
      maxScore: max,
      linesWritten: input.linesWritten ?? 30,
      grammarErrors: input.grammarErrors ?? 0,
      errorWeight: input.errorWeight,
    });
    return {
      banca: 'Cebraspe',
      maxScore: max,
      netScore: res.netScore,
      netPercent: res.netPercent,
      formulaNote: `NC (${res.contentScore}) − ${res.errorWeight} × (${res.grammarErrors}/${res.linesWritten} linhas)`,
    };
  }

  const c = input.criteriaScores || {};

  if (key.includes('fcc')) {
    // FCC: Conteúdo (50%), Estrutura (30%), Expressão/Norma (20%) na escala 0..100 ou proporcional
    const conteudo = clampScore(c.conteudo ?? input.contentScore ?? 0, 100);
    const estrutura = clampScore(c.estrutura ?? conteudo, 100);
    const expressao = clampScore(c.expressao ?? conteudo, 100);
    const weightedPct = conteudo * 0.5 + estrutura * 0.3 + expressao * 0.2;
    const netScore = Math.round(((weightedPct / 100) * max) * 100) / 100;
    return {
      banca: 'FCC',
      maxScore: max,
      netScore,
      netPercent: Math.round((netScore / max) * 1000) / 10,
      formulaNote: 'FCC ponderado: Conteúdo 50% + Estrutura 30% + Expressão 20%',
    };
  }

  if (key.includes('fgv')) {
    // FGV: soma direta dos critérios (abordagem do tema, estrutura, coesão, norma culta) limitada a maxScore
    const values = Object.values(c).map(v => Math.max(0, Number(v) || 0));
    const sum = values.length ? values.reduce((a, b) => a + b, 0) : clampScore(input.contentScore, max);
    const netScore = Math.round(Math.min(max, sum) * 100) / 100;
    return {
      banca: 'FGV',
      maxScore: max,
      netScore,
      netPercent: Math.round((netScore / max) * 1000) / 10,
      formulaNote: 'FGV: soma dos critérios de abordagem, estrutura e norma culta',
    };
  }

  if (key.includes('cesgranrio')) {
    // Cesgranrio: média ponderada/direta dos critérios em escala de 0 a maxScore
    const values = Object.values(c).map(v => Math.max(0, Number(v) || 0));
    const total = values.length ? values.reduce((a, b) => a + b, 0) : clampScore(input.contentScore, max);
    const netScore = Math.round(Math.min(max, total) * 100) / 100;
    return {
      banca: 'Cesgranrio',
      maxScore: max,
      netScore,
      netPercent: Math.round((netScore / max) * 1000) / 10,
      formulaNote: 'Cesgranrio: adequação ao tema, argumentação, coesão e norma culta',
    };
  }

  const fallback = Math.round(clampScore(input.contentScore, max) * 100) / 100;
  return {
    banca: rawBanca || 'Padrão',
    maxScore: max,
    netScore: fallback,
    netPercent: Math.round((fallback / max) * 1000) / 10,
    formulaNote: 'Pontuação direta',
  };
}
