import { h, type JSX } from 'preact';
import { LUCIDE_ICONS_DATA, type LucideNode } from './lucide-icons-data.js';

export type IconName = keyof typeof LUCIDE_ICONS_DATA | string;

export type IconProps = Omit<JSX.IntrinsicElements['svg'], 'stroke'> & {
  name: IconName;
  size?: number | string;
  stroke?: number | string;
  class?: string;
  'aria-label'?: string;
};

function escapeSvgAttr(value: string | number): string {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

export function Icon({
  name,
  size = 16,
  stroke = 1.5,
  class: className = '',
  'aria-label': ariaLabel,
  ...rest
}: IconProps) {
  const isAccessible = Boolean(ariaLabel);
  const nodes: LucideNode[] = LUCIDE_ICONS_DATA[name] || LUCIDE_ICONS_DATA['help'] || [];

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width={stroke}
      stroke-linecap="round"
      stroke-linejoin="round"
      class={`icon icon-lucide icon-lucide-${name} ${className}`.trim()}
      aria-hidden={!isAccessible ? 'true' : undefined}
      role={isAccessible ? 'img' : undefined}
      aria-label={ariaLabel}
      {...rest}
    >
      {nodes.map(([tag, attrs], idx) => h(tag, { key: idx, ...attrs }))}
    </svg>
  );
}

export function renderIconSvg(
  name: IconName,
  options: {
    size?: number | string;
    stroke?: number | string;
    strokeWidth?: number | string;
    class?: string;
    className?: string;
    'aria-label'?: string;
  } = {}
): string {
  const {
    size = 16,
    stroke = options.strokeWidth ?? 1.5,
    class: classProp,
    className: classNameProp,
    'aria-label': ariaLabel,
  } = options;
  const className = classProp || classNameProp || '';
  const isAccessible = Boolean(ariaLabel);
  const nodes: LucideNode[] = LUCIDE_ICONS_DATA[name] || LUCIDE_ICONS_DATA['help'] || [];

  const inner = nodes
    .map(([tag, attrs]) => {
      const attrStr = Object.entries(attrs)
        .map(([k, v]) => `${k}="${escapeSvgAttr(v)}"`)
        .join(' ');
      return `<${tag} ${attrStr}></${tag}>`;
    })
    .join('');

  const accessibility = isAccessible
    ? `role="img" aria-label="${escapeSvgAttr(ariaLabel!)}"`
    : 'aria-hidden="true"';

  const classAttr = escapeSvgAttr(`icon icon-lucide icon-lucide-${name} ${className}`.trim());

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${escapeSvgAttr(size)}" height="${escapeSvgAttr(size)}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${escapeSvgAttr(stroke)}" stroke-linecap="round" stroke-linejoin="round" class="${classAttr}" ${accessibility}>${inner}</svg>`;
}
