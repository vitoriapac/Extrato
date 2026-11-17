/**
 * Motor da Central de Materiais por Tópico (MAT-01 a MAT-08).
 *
 * Gerencia referências externas por URL sanitizada (apenas http/https),
 * sem upload binário e sem duplicar a posição de leitura de `TopicBookmark`.
 */

import type { StudyMaterial, StudyMaterialKind } from '../core/types.js';

export const STUDY_MATERIAL_KINDS: readonly StudyMaterialKind[] = Object.freeze([
  'pdf',
  'video',
  'article',
  'questions',
  'other',
]);

export const STUDY_MATERIAL_KIND_LABELS: Record<StudyMaterialKind, string> = Object.freeze({
  pdf: 'PDF / Apostila',
  video: 'Videoaula',
  article: 'Artigo / Resumo',
  questions: 'Caderno de Questões',
  other: 'Outro material',
});

/**
 * Sanitiza e valida URLs de material (MAT-07).
 * Aceita apenas http: e https:, rejeitando javascript:, data:, vbscript: e caracteres de controle.
 */
export function sanitizeMaterialUrl(rawUrl: unknown): string | null {
  if (typeof rawUrl !== 'string') return null;
  const trimmed = rawUrl.replace(/[\u0000-\u001F\u007F]/g, '').trim();
  if (!trimmed || trimmed.length > 2000) return null;

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

function normalizeKind(kind: unknown): StudyMaterialKind {
  return STUDY_MATERIAL_KINDS.includes(kind as StudyMaterialKind)
    ? (kind as StudyMaterialKind)
    : 'other';
}

export function createStudyMaterial({
  id,
  examId = null,
  subjectId,
  topicId = null,
  title,
  kind = 'other',
  url = null,
  isPrimary = false,
  nowISO,
}: {
  id: string;
  examId?: string | null;
  subjectId: string;
  topicId?: string | null;
  title: string;
  kind?: StudyMaterialKind;
  url?: string | null;
  isPrimary?: boolean;
  nowISO: string;
}): StudyMaterial | null {
  const cleanTitle = typeof title === 'string' ? title.replace(/[\u0000-\u001F\u007F]/g, '').trim().slice(0, 160) : '';
  if (!id || !subjectId || !cleanTitle) return null;

  const cleanUrl = url ? sanitizeMaterialUrl(url) : null;
  if (url && !cleanUrl) return null;

  return {
    id,
    examId,
    subjectId,
    topicId,
    title: cleanTitle,
    kind: normalizeKind(kind),
    url: cleanUrl,
    isPrimary: Boolean(isPrimary),
    archived: false,
    createdAt: nowISO,
    updatedAt: nowISO,
  };
}

export function setPrimaryStudyMaterial(
  materials: readonly StudyMaterial[],
  targetId: string,
  nowISO: string
): StudyMaterial[] {
  const target = materials.find(m => m.id === targetId && !m.archived);
  if (!target) return [...materials];

  return materials.map(m => {
    const sameScope = m.subjectId === target.subjectId && (m.topicId || null) === (target.topicId || null);
    if (!sameScope) return m;
    const isPrimary = m.id === targetId;
    if (m.isPrimary === isPrimary) return m;
    return { ...m, isPrimary, updatedAt: nowISO };
  });
}

export function archiveStudyMaterial(
  materials: readonly StudyMaterial[],
  targetId: string,
  nowISO: string
): StudyMaterial[] {
  return materials.map(m =>
    m.id === targetId ? { ...m, archived: true, isPrimary: false, updatedAt: nowISO } : m
  );
}
