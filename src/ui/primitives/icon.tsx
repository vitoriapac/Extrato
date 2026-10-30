import { h, type JSX } from 'preact';
import { TABLER_ICONS_DATA, type TablerNode } from './tabler-icons-data.js';

export type IconName = keyof typeof TABLER_ICONS_DATA | string;

export type IconProps = Omit<JSX.IntrinsicElements['svg'], 'stroke'> & {
  name: IconName;
  size?: number | string;
  stroke?: number | string;
  class?: string;
  'aria-label'?: string;
};

export function Icon({
  name,
  size = 16,
  stroke = 2,
  class: className = '',
  'aria-label': ariaLabel,
  ...rest
}: IconProps) {
  const isAccessible = Boolean(ariaLabel);
  const nodes: TablerNode[] = TABLER_ICONS_DATA[name] || TABLER_ICONS_DATA['help'] || [];

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
      class={`icon icon-tabler icon-tabler-${name} ${className}`.trim()}
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
    class?: string;
    'aria-label'?: string;
  } = {}
): string {
  const { size = 16, stroke = 2, class: className = '', 'aria-label': ariaLabel } = options;
  const isAccessible = Boolean(ariaLabel);
  const nodes: TablerNode[] = TABLER_ICONS_DATA[name] || TABLER_ICONS_DATA['help'] || [];

  const inner = nodes
    .map(([tag, attrs]) => {
      const attrStr = Object.entries(attrs)
        .map(([k, v]) => `${k}="${v}"`)
        .join(' ');
      return `<${tag} ${attrStr}></${tag}>`;
    })
    .join('');

  const accessibility = isAccessible
    ? `role="img" aria-label="${ariaLabel}"`
    : 'aria-hidden="true"';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icon-tabler-${name} ${className}" ${accessibility}>${inner}</svg>`;
}
