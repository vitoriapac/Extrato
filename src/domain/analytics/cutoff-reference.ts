import { EXAM_PROFILES } from '../exams/exam-catalog.js';

type Row = Record<string, any>;

export interface CutoffReference {
  readonly kind: 'official' | 'goal';
  readonly text: string;
}

const percent = (value: number) => String(Math.round(value * 10) / 10).replace('.', ',');

/**
 * Referência de precisão do concurso ativo: a nota de corte oficial cadastrada no catálogo
 * (perfis cujo id começa pela tag ativa) ou, sem ela, a meta de precisão do aluno.
 * O app ainda não guarda a praça do aluno: com mais de uma praça no ano mais recente, mostra a faixa.
 */
export function buildCutoffReference({
  activeExamTags = [],
  goalPercent = 80,
  profiles = EXAM_PROFILES as Row,
}: {
  activeExamTags?: string[];
  goalPercent?: number;
  profiles?: Row;
} = {}): CutoffReference {
  const entries: Row[] = Object.entries<Row>(profiles)
    .filter(([id]) => activeExamTags.some(tag => id.startsWith(`${tag}-`)))
    .flatMap(([, profile]) => profile?.cutoffScores || []);
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
