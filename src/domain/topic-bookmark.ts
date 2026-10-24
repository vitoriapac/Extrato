import type { BookmarkResourceType, TopicBookmark } from '../core/types.ts';

export const BOOKMARK_RESOURCE_TYPES: readonly BookmarkResourceType[] = Object.freeze([
  'pdf',
  'video',
  'law',
  'other',
]);

const text = (value: unknown, max: number): string =>
  typeof value === 'string' ? value.trim().slice(0, max) : '';

const unit = (value: unknown): number | null => {
  if (value == null || value === '') return null;
  const number = Number(value);
  return Number.isInteger(number) && number >= 0 ? number : null;
};

/** Ponto de parada do tópico: objeto congelado ou null quando não há posição nem material. */
export function normalizeTopicBookmark(
  raw: unknown,
  { now = () => new Date().toISOString() }: { now?: () => string } = {}
): TopicBookmark | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const source = raw as Record<string, unknown>;
  const resourceType: BookmarkResourceType = BOOKMARK_RESOURCE_TYPES.includes(
    source.resourceType as BookmarkResourceType
  )
    ? (source.resourceType as BookmarkResourceType)
    : 'other';
  const label = text(source.label, 120),
    positionText = text(source.positionText, 60),
    currentUnit = unit(source.currentUnit);
  let totalUnits = unit(source.totalUnits);
  if (totalUnits != null && (currentUnit == null || totalUnits < currentUnit || totalUnits === 0))
    totalUnits = null;
  if (currentUnit == null && !positionText && !label) return null;
  const updatedAt =
    typeof source.updatedAt === 'string' && source.updatedAt ? source.updatedAt : now();
  return Object.freeze({
    resourceType,
    label,
    currentUnit,
    totalUnits,
    positionText,
    updatedAt,
  });
}

export function bookmarkProgress(bookmark: TopicBookmark | null | undefined): number | null {
  return bookmark?.totalUnits && bookmark.totalUnits > 0 && bookmark.currentUnit != null
    ? Math.round((bookmark.currentUnit / bookmark.totalUnits) * 100)
    : null;
}

const UNIT_LABELS: Partial<Record<BookmarkResourceType, string>> = {
  pdf: 'pág.',
  video: 'aula',
};
const TYPE_LABELS: Partial<Record<BookmarkResourceType, string>> = {
  pdf: 'PDF',
  video: 'Videoaula',
  law: 'Lei seca',
};

export function formatBookmarkLabel(bookmark: TopicBookmark | null | undefined): string {
  if (!bookmark) return '';
  const parts: string[] = [];
  if (bookmark.label) parts.push(bookmark.label);
  const typeLabel = TYPE_LABELS[bookmark.resourceType];
  if (typeLabel && !bookmark.label) parts.push(typeLabel);
  if (bookmark.currentUnit != null) {
    const progress = bookmarkProgress(bookmark),
      prefix = UNIT_LABELS[bookmark.resourceType] || '';
    const total = bookmark.totalUnits != null ? ` de ${bookmark.totalUnits}` : '';
    parts.push(
      `${prefix ? prefix + ' ' : ''}${bookmark.currentUnit}${total}${bookmark.resourceType === 'pdf' && progress != null ? ` (${progress}%)` : ''}`
    );
  }
  if (bookmark.positionText) parts.push(bookmark.positionText);
  return parts.join(' · ');
}
