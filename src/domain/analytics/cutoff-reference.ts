import { EXAM_PROFILES } from '../exams/exam-profiles.js';
import type { ExamCutoff } from '../../core/types.js';

type Row = Record<string, any>;

export type CutoffModality = 'ampla' | 'cotas' | 'pcd';

export const CUTOFF_MODALITY_LABELS: Readonly<Record<CutoffModality, string>> = Object.freeze({
  ampla: 'Ampla concorrência',
  cotas: 'Cotas raciais',
  pcd: 'PcD',
});

export interface ExtendedExamCutoff extends ExamCutoff {
  modality?: CutoffModality;
  region?: string;
}

export interface CutoffReference {
  readonly kind: 'informed' | 'official' | 'goal';
  readonly text: string;
  readonly modality?: CutoffModality;
  readonly region?: string;
}

const percent = (value: number) => String(Math.round(value * 10) / 10).replace('.', ',');
const positive = (value: unknown) => {
  const number = Number(String(value ?? '').replace(',', '.'));
  return Number.isFinite(number) && number > 0 ? number : null;
};

function normalizeModality(value: unknown): CutoffModality | undefined {
  if (value === 'ampla' || value === 'cotas' || value === 'pcd') return value;
  return undefined;
}

/** Corte válido (nota > 0, nota ≤ máximo, ano plausível) ou null. Máximo ausente vale 100. */
export function normalizeExamCutoff(value: unknown): ExtendedExamCutoff | null {
  if (!value || typeof value !== 'object') return null;
  const source = value as Record<string, unknown>;
  const score = positive(source.score);
  const maxScore = positive(source.maxScore) ?? 100;
  if (score === null || score > maxScore) return null;
  const year = Math.round(Number(source.year));
  const modality = normalizeModality(source.modality);
  const region =
    typeof source.region === 'string' && source.region.trim() ? source.region.trim() : undefined;
  return {
    score,
    maxScore,
    ...(year >= 1990 && year <= 2100 ? { year } : {}),
    ...(modality ? { modality } : {}),
    ...(region ? { region } : {}),
  };
}

/** Corte em % da escala, com uma casa; null sem corte válido. */
export function cutoffPercent(cutoff: unknown): number | null {
  const valid = normalizeExamCutoff(cutoff);
  return valid ? Math.round((valid.score / valid.maxScore) * 1000) / 10 : null;
}

/**
 * Referência de precisão do concurso ativo: o corte informado pelo aluno; sem ele, a nota de
 * corte oficial cadastrada no catálogo (perfis cujo id começa pela tag ativa); sem nenhum, a meta.
 * O app ainda não guarda a praça do aluno: com mais de uma praça no ano mais recente, mostra a faixa.
 */
export function buildCutoffReference({
  activeExamTags = [],
  goalPercent = 80,
  profiles = EXAM_PROFILES as Row,
  informed = null,
  region = null,
}: {
  activeExamTags?: string[];
  goalPercent?: number;
  profiles?: Row;
  informed?: unknown;
  region?: string | null;
} = {}): CutoffReference {
  const own = normalizeExamCutoff(informed);
  if (own) {
    const contextParts = [
      own.modality ? CUTOFF_MODALITY_LABELS[own.modality] : null,
      own.region || null,
    ].filter(Boolean);
    const contextSuffix = contextParts.length ? ` (${contextParts.join(' · ')})` : '';
    return {
      kind: 'informed',
      ...(own.modality ? { modality: own.modality } : {}),
      ...(own.region ? { region: own.region } : {}),
      text: `Nota de corte${own.year ? ` ${own.year}` : ''}${contextSuffix} informada por você: ${percent(cutoffPercent(own)!)}% da escala. A precisão em questões não é a nota da prova: use como referência.`,
    };
  }
  const allEntries: Row[] = Object.entries<Row>(profiles)
    .filter(([id]) => activeExamTags.some(tag => id.startsWith(`${tag}-`)))
    .flatMap(([, profile]) => profile?.cutoffScores || []);
  const normalizedRegion = typeof region === 'string' && region.trim() ? region.trim().toLowerCase() : '';
  const regionEntries = normalizedRegion
    ? allEntries.filter(entry => String(entry.praca || '').toLowerCase().includes(normalizedRegion))
    : [];
  const entries = regionEntries.length ? regionEntries : allEntries;
  if (!entries.length)
    return {
      kind: 'goal',
      text: `Sem nota de corte cadastrada para o concurso ativo: comparado com a sua meta de precisão de ${percent(goalPercent)}%.`,
    };
  const year = Math.max(...entries.map(entry => entry.ano));
  const latest = entries.filter(entry => entry.ano === year);
  const points = latest.map(entry => (entry.score / entry.scale) * 100);
  const low = Math.min(...points);
  const high = Math.max(...points);
  const banca = [...new Set(latest.map(entry => entry.banca))].join(' e ');
  const praca = [...new Set(latest.map(entry => entry.praca))];
  const value =
    low === high
      ? `${percent(low)}% da escala${praca.length === 1 ? `, praça ${praca[0]}` : ''}`
      : `${percent(low)}% a ${percent(high)}% da escala, conforme a praça`;
  return {
    kind: 'official',
    text: `Nota de corte ${year}: ${value} (${banca}). A precisão em questões não é a nota da prova: use como referência.`,
  };
}
