import type { JSX } from 'preact';
import type { TopicBookmark } from '../../core/types.js';
import { formatBookmarkLabel } from '../../domain/topic-bookmark.js';
import { Icon } from '../primitives/icon.js';

export interface BookmarkBadgeProps {
  bookmark: TopicBookmark | null | undefined;
  className?: string;
  onClick?: () => void;
  showIcon?: boolean;
}

export function BookmarkBadge({
  bookmark,
  className = '',
  onClick,
  showIcon = true,
}: BookmarkBadgeProps): JSX.Element | null {
  if (!bookmark) return null;
  const label = formatBookmarkLabel(bookmark);
  if (!label) return null;

  const iconName =
    bookmark.resourceType === 'video'
      ? 'video'
      : bookmark.resourceType === 'law'
        ? 'scale'
        : bookmark.resourceType === 'pdf'
          ? 'file-text'
          : 'bookmark';

  return (
    <span
      className={`bookmark-badge inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-data bg-surface-subtle text-primary border border-border-default/80 ${
        onClick ? 'cursor-pointer hover:border-border-emphasis' : ''
      } ${className}`}
      title={`Ponto de parada: ${label}`}
      onClick={onClick}
    >
      {showIcon && <Icon name={iconName} size={13} class="shrink-0" />}
      <span className="truncate max-w-[240px]">{label}</span>
    </span>
  );
}
