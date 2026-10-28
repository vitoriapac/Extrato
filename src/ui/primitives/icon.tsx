import type { JSX } from 'preact';

export type IconName =
  | 'search'
  | 'download'
  | 'upload'
  | 'cloud'
  | 'report'
  | 'play'
  | 'check'
  | 'close'
  | 'chevron-down'
  | 'chevron-right'
  | 'chevron-up'
  | 'calendar'
  | 'timer'
  | 'target'
  | 'sparkles'
  | 'gear'
  | 'trash'
  | 'help'
  | 'link'
  | 'alert';

export type IconProps = JSX.IntrinsicElements['svg'] & {
  name: IconName;
  size?: number | string;
  class?: string;
  'aria-label'?: string;
};

export function Icon({ name, size = 16, class: className = '', 'aria-label': ariaLabel, ...rest }: IconProps) {
  const isAccessible = Boolean(ariaLabel);

  const paths: Record<IconName, JSX.Element> = {
    search: (
      <>
        <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2" fill="none" />
        <line x1="16" y1="16" x2="21" y2="21" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
      </>
    ),
    download: (
      <>
        <path d="M12 3v13m0 0l-4-4m4 4l4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" />
        <path d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none" />
      </>
    ),
    upload: (
      <>
        <path d="M12 16V3m0 0L8 7m4-4l4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" />
        <path d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none" />
      </>
    ),
    cloud: (
      <path
        d="M17.5 19H6.5a4.5 4.5 0 01-1.3-8.8 6 6 0 0111.6-2.2A4.5 4.5 0 0117.5 19z"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        fill="none"
      />
    ),
    report: (
      <>
        <path d="M4 4h16v16H4z" stroke="currentColor" stroke-width="2" fill="none" />
        <line x1="8" y1="9" x2="16" y2="9" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
        <line x1="8" y1="13" x2="16" y2="13" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
        <line x1="8" y1="17" x2="12" y2="17" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
      </>
    ),
    play: (
      <polygon points="6,4 20,12 6,20" fill="currentColor" />
    ),
    check: (
      <polyline points="4,12 9,17 20,6" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none" />
    ),
    close: (
      <>
        <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
        <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
      </>
    ),
    'chevron-down': (
      <polyline points="6,9 12,15 18,9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" />
    ),
    'chevron-right': (
      <polyline points="9,6 15,12 9,18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" />
    ),
    'chevron-up': (
      <polyline points="18,15 12,9 6,15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" />
    ),
    calendar: (
      <>
        <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2" fill="none" />
        <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
        <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
        <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" stroke-width="2" />
      </>
    ),
    timer: (
      <>
        <circle cx="12" cy="13" r="8" stroke="currentColor" stroke-width="2" fill="none" />
        <line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
        <line x1="12" y1="13" x2="15" y2="15" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
        <line x1="10" y1="2" x2="14" y2="2" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
      </>
    ),
    target: (
      <>
        <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2" fill="none" />
        <circle cx="12" cy="12" r="5" stroke="currentColor" stroke-width="2" fill="none" />
        <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      </>
    ),
    sparkles: (
      <path
        d="M12 2l2.4 5.6L20 10l-5.6 2.4L12 18l-2.4-5.6L4 10l5.6-2.4z"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linejoin="round"
        fill="none"
      />
    ),
    gear: (
      <>
        <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2" fill="none" />
        <path
          d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linejoin="round"
          fill="none"
        />
      </>
    ),
    trash: (
      <>
        <polyline points="3,6 5,6 21,6" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none" />
        <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" />
      </>
    ),
    help: (
      <>
        <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2" fill="none" />
        <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none" />
        <line x1="12" y1="17" x2="12.01" y2="17" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
      </>
    ),
    link: (
      <path
        d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        fill="none"
      />
    ),
    alert: (
      <>
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" stroke-width="2" stroke-linejoin="round" fill="none" />
        <line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
        <line x1="12" y1="17" x2="12.01" y2="17" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
      </>
    ),
  };

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      class={`inline-block align-middle shrink-0 ${className}`}
      aria-hidden={isAccessible ? undefined : 'true'}
      aria-label={ariaLabel}
      role={isAccessible ? 'img' : undefined}
      focusable="false"
      {...rest}
    >
      {paths[name] || null}
    </svg>
  );
}
