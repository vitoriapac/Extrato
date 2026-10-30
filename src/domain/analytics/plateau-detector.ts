/**
 * @fileoverview Detector determinístico de platô de desempenho.
 * Identifica tópicos ou disciplinas onde o estudante mantém alto volume de questões
 * sem evolução na precisão (estagnação em faixa intermediária < 75%).
 */

export interface RollingWindowSample {
  date: string;
  accuracy: number;
  count: number;
}

export interface PlateauDetectionInput {
  topicId: string;
  subjectId: string;
  windowDays?: number; // Padrão: 28 dias
  minQuestions?: number; // Padrão: 60 questões
  rollingWindows?: RollingWindowSample[];
  errorBreakdown?: Record<string, number>;
  questions?: Array<{
    date: string;
    resolved: number;
    correct: number;
    errorBreakdown?: Record<string, number>;
    errorCategory?: string | null;
  }>;
}

export type PlateauPrescribedStrategy =
  'active_recall' | 'statute_deep_dive' | 'prerequisite_review';

export interface PlateauDiagnosticResult {
  hasPlateau: boolean;
  confidence: 'low' | 'medium' | 'high';
  averageAccuracy: number;
  variance: number;
  questionCount: number;
  weeksStagnant: number;
  prescribedAction: {
    strategy: PlateauPrescribedStrategy;
    headline: string;
    rationale: string;
  };
}

const DEFAULT_WINDOW_DAYS = 28;
const DEFAULT_MIN_QUESTIONS = 60;
const MAX_PLATEAU_VARIATION_PTS = 3.5;
const MAX_PLATEAU_ACCURACY_THRESHOLD = 75;

/**
 * Agrupa questões em janelas semanais de 7 dias baseadas nas datas fornecidas.
 */
export function buildWeeklyRollingWindows(
  questions: Array<{ date: string; resolved: number; correct: number }>,
  windowDays: number = DEFAULT_WINDOW_DAYS
): RollingWindowSample[] {
  if (!questions || questions.length === 0) return [];

  // Ordena por data crescente
  const sorted = [...questions]
    .filter(q => q && typeof q.date === 'string' && Number(q.resolved) > 0)
    .sort((a, b) => a.date.localeCompare(b.date));

  if (sorted.length === 0) return [];

  const lastDateStr = sorted[sorted.length - 1].date;
  const lastDate = new Date(lastDateStr + 'T00:00:00Z');

  // Criamos blocos semanais (de 7 dias cada) retrocedendo a partir da última data
  const numWeeks = Math.max(1, Math.floor(windowDays / 7));
  const windows: RollingWindowSample[] = [];

  for (let w = numWeeks - 1; w >= 0; w--) {
    const endDaysOffset = w * 7;
    const startDaysOffset = (w + 1) * 7;

    const windowEnd = new Date(lastDate.getTime() - endDaysOffset * 86400000);
    const windowStart = new Date(lastDate.getTime() - startDaysOffset * 86400000);

    const startIso = windowStart.toISOString().slice(0, 10);
    const endIso = windowEnd.toISOString().slice(0, 10);

    const inWindow = sorted.filter(q => q.date >= startIso && q.date <= endIso);
    const count = inWindow.reduce((acc, q) => acc + (Number(q.resolved) || 0), 0);
    const correct = inWindow.reduce((acc, q) => acc + (Number(q.correct) || 0), 0);
    const accuracy = count > 0 ? Math.round((correct / count) * 1000) / 10 : 0;

    if (count > 0) {
      windows.push({
        date: endIso,
        accuracy,
        count,
      });
    }
  }

  return windows;
}

/**
 * Determina a estratégia pedagógica recomendada com base nos tipos de erros e faixa de acerto.
 */
function prescribePlateauAction(
  averageAccuracy: number,
  errorBreakdown?: Record<string, number>
): {
  strategy: PlateauPrescribedStrategy;
  headline: string;
  rationale: string;
} {
  // Analisa erros literais
  let totalErrors = 0;
  let statuteErrors = 0;

  if (errorBreakdown) {
    for (const [key, count] of Object.entries(errorBreakdown)) {
      const errCount = Number(count) || 0;
      totalErrors += errCount;
      const normalizedKey = key.toLowerCase();
      if (
        normalizedKey.includes('literal') ||
        normalizedKey.includes('lei') ||
        normalizedKey.includes('artigo') ||
        normalizedKey.includes('texto')
      ) {
        statuteErrors += errCount;
      }
    }
  }

  const statuteProportion = totalErrors > 0 ? statuteErrors / totalErrors : 0;

  if (statuteProportion >= 0.35) {
    return {
      strategy: 'statute_deep_dive',
      headline: 'Imersão em Lei Seca e Dispositivos Literais',
      rationale:
        'Seus erros neste tópico decorrem principalmente de pegadinhas textuais e memorização da letra da lei. Substitua a resolução mecânica por leitura ativa dos artigos correlatos.',
    };
  }

  if (averageAccuracy < 60) {
    return {
      strategy: 'prerequisite_review',
      headline: 'Revisão de Fundamentos e Pré-Requisitos',
      rationale:
        'A estagnação em nível inferior a 60% indica lacuna conceitual na base da matéria. Recomendamos revisar tópicos pré-requisitos antes de retomar as questões.',
    };
  }

  return {
    strategy: 'active_recall',
    headline: 'Fixação Ativa com Caderno de Erros',
    rationale:
      'O volume de questões atingiu retornos decrescentes. Isole os conceitos das questões erradas em flashcards para quebra do padrão mecânico de repetição.',
  };
}

/**
 * Executa o diagnóstico determinístico de platô de desempenho.
 */
export function detectTopicPlateau(input: PlateauDetectionInput): PlateauDiagnosticResult {
  const minQuestions = input.minQuestions ?? DEFAULT_MIN_QUESTIONS;

  let windows: RollingWindowSample[] = [];

  if (input.rollingWindows && input.rollingWindows.length > 0) {
    windows = input.rollingWindows;
  } else if (input.questions && input.questions.length > 0) {
    windows = buildWeeklyRollingWindows(input.questions, input.windowDays ?? DEFAULT_WINDOW_DAYS);
  }

  const totalQuestions = windows.reduce((acc, w) => acc + (w.count || 0), 0);

  // Amostra mínima: pelo menos minQuestions e pelo menos 3 janelas ativas
  if (totalQuestions < minQuestions || windows.length < 3) {
    return {
      hasPlateau: false,
      confidence: 'low',
      averageAccuracy:
        windows.length > 0
          ? Math.round((windows.reduce((acc, w) => acc + w.accuracy, 0) / windows.length) * 10) / 10
          : 0,
      variance: 0,
      questionCount: totalQuestions,
      weeksStagnant: 0,
      prescribedAction: {
        strategy: 'active_recall',
        headline: 'Volume Insuficiente para Diagnóstico',
        rationale: `Necessário pelo menos ${minQuestions} questões divididas em no mínimo 3 períodos para confirmação de platô.`,
      },
    };
  }

  const accuracies = windows.map(w => w.accuracy);
  const minAcc = Math.min(...accuracies);
  const maxAcc = Math.max(...accuracies);
  const spread = Math.round((maxAcc - minAcc) * 10) / 10;

  const avgAcc =
    Math.round((accuracies.reduce((sum, val) => sum + val, 0) / accuracies.length) * 10) / 10;

  // Cálculo da variância populacional
  const variance =
    Math.round(
      (accuracies.reduce((sum, val) => sum + Math.pow(val - avgAcc, 2), 0) / accuracies.length) *
        100
    ) / 100;

  // Critérios de platô:
  // 1. Precisão média abaixo do limiar de domínio (< 75%)
  // 2. Variação entre períodos menor que 3.5 pontos percentuais (estagnação)
  const isStagnant = spread < MAX_PLATEAU_VARIATION_PTS;
  const isBelowTarget = avgAcc < MAX_PLATEAU_ACCURACY_THRESHOLD;
  const hasPlateau = isStagnant && isBelowTarget;

  // Determina confiança
  let confidence: 'low' | 'medium' | 'high' = 'low';
  if (totalQuestions >= 100 && windows.length >= 4) {
    confidence = 'high';
  } else if (totalQuestions >= 75 || windows.length >= 3) {
    confidence = 'medium';
  }

  // Coleta consolidada de erros
  const errorBreakdown = input.errorBreakdown || {};
  if (input.questions) {
    for (const q of input.questions) {
      if (q.errorBreakdown) {
        for (const [k, v] of Object.entries(q.errorBreakdown)) {
          errorBreakdown[k] = (errorBreakdown[k] || 0) + (Number(v) || 0);
        }
      }
      if (q.errorCategory) {
        errorBreakdown[q.errorCategory] = (errorBreakdown[q.errorCategory] || 0) + 1;
      }
    }
  }

  const prescribedAction = hasPlateau
    ? prescribePlateauAction(avgAcc, errorBreakdown)
    : {
        strategy: 'active_recall' as const,
        headline:
          avgAcc >= MAX_PLATEAU_ACCURACY_THRESHOLD
            ? 'Domínio Consolidado'
            : 'Desempenho em Evolução Ativa',
        rationale:
          avgAcc >= MAX_PLATEAU_ACCURACY_THRESHOLD
            ? 'Precisão sustentada acima de 75%. Mantenha manutenções periódicas de revisão.'
            : 'A precisão apresenta oscilação e amplitude de aprendizado ativa, sem estagnação identificada.',
      };

  return {
    hasPlateau,
    confidence: hasPlateau ? confidence : 'low',
    averageAccuracy: avgAcc,
    variance,
    questionCount: totalQuestions,
    weeksStagnant: hasPlateau ? windows.length : 0,
    prescribedAction,
  };
}

/**
 * Avalia múltiplos tópicos e retorna apenas os que apresentam platô ativo, ordenados por volume.
 */
export function detectAllPlateaus(
  inputs: PlateauDetectionInput[]
): Array<PlateauDiagnosticResult & { topicId: string; subjectId: string }> {
  return inputs
    .map(input => ({
      topicId: input.topicId,
      subjectId: input.subjectId,
      ...detectTopicPlateau(input),
    }))
    .filter(res => res.hasPlateau)
    .sort((a, b) => b.questionCount - a.questionCount);
}
