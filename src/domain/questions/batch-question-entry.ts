import { normalizeBanca } from './bancas.js';
import type { QuestionRecord } from '../../core/types.js';

export interface BatchQuestionRowInput {
  topicId: string | null;
  topicName?: string;
  resolved: number | string;
  correct: number | string;
  blank?: number | string | null;
  errorCategory?: string | null;
}

export interface BatchQuestionEntryInput {
  date: string;
  subjectId: string;
  banca?: string | null;
  retry?: boolean;
  scoringMode?: 'padrao' | 'certo-errado';
  rows: BatchQuestionRowInput[];
}

export interface BatchQuestionBuildResult {
  ok: boolean;
  error?: string;
  records: Array<Omit<QuestionRecord, 'id' | 'createdAt'>>;
  summary: {
    topicCount: number;
    totalResolved: number;
    totalCorrect: number;
    totalBlank: number;
  };
}

function toNonNegInt(value: unknown): number {
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) return 0;
  return Math.floor(num);
}

/**
 * Valida e constrói múltiplos registros de questões (caderno misto) para uma disciplina.
 * Linhas com `resolved <= 0` são ignoradas; se `correct + blank > resolved`, retorna erro claro.
 */
export function buildBatchQuestionRecords(
  input: BatchQuestionEntryInput
): BatchQuestionBuildResult {
  const subjectId = String(input.subjectId || '').trim();
  const date = String(input.date || '').trim();
  if (!subjectId) {
    return {
      ok: false,
      error: 'Selecione uma disciplina para o lançamento em lote.',
      records: [],
      summary: { topicCount: 0, totalResolved: 0, totalCorrect: 0, totalBlank: 0 },
    };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return {
      ok: false,
      error: 'Informe uma data válida no formato AAAA-MM-DD.',
      records: [],
      summary: { topicCount: 0, totalResolved: 0, totalCorrect: 0, totalBlank: 0 },
    };
  }

  const normalizedBanca = input.banca ? normalizeBanca(input.banca) || String(input.banca).trim() : null;
  const retry = Boolean(input.retry);
  const isCertoErrado = input.scoringMode === 'certo-errado';

  const records: Array<Omit<QuestionRecord, 'id' | 'createdAt'>> = [];
  let totalResolved = 0;
  let totalCorrect = 0;
  let totalBlank = 0;

  for (const row of input.rows || []) {
    const resolved = toNonNegInt(row.resolved);
    if (resolved <= 0) continue;

    const correct = toNonNegInt(row.correct);
    const blank =
      row.blank === null || row.blank === undefined || row.blank === ''
        ? isCertoErrado
          ? 0
          : null
        : toNonNegInt(row.blank);

    const blankVal = blank ?? 0;
    if (correct + blankVal > resolved) {
      const label = row.topicName || 'tópico selecionado';
      return {
        ok: false,
        error: `Em "${label}", acertos (${correct}) + brancas (${blankVal}) excedem o total (${resolved}).`,
        records: [],
        summary: { topicCount: 0, totalResolved: 0, totalCorrect: 0, totalBlank: 0 },
      };
    }

    const errors = Math.max(0, resolved - correct - blankVal);
    const errorCategory = row.errorCategory ? String(row.errorCategory).trim() : null;
    const errorBreakdown: Record<string, number> = {};
    if (errors > 0 && errorCategory) {
      errorBreakdown[errorCategory] = errors;
    }

    records.push({
      date,
      subjectId,
      topicId: row.topicId || null,
      resolved,
      correct,
      blank,
      errorBreakdown,
      errorCategory: errors > 0 ? errorCategory : null,
      banca: normalizedBanca,
      minutes: null,
      retry,
      recommendationId: null,
    });

    totalResolved += resolved;
    totalCorrect += correct;
    totalBlank += blankVal;
  }

  if (!records.length) {
    return {
      ok: false,
      error: 'Preencha ao menos um tópico com quantidade de questões maior que zero.',
      records: [],
      summary: { topicCount: 0, totalResolved: 0, totalCorrect: 0, totalBlank: 0 },
    };
  }

  return {
    ok: true,
    records,
    summary: {
      topicCount: records.length,
      totalResolved,
      totalCorrect,
      totalBlank,
    },
  };
}
