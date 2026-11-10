import { cloneElement, isValidElement, type ComponentChildren, type VNode } from 'preact';
import { useId, useState } from 'preact/hooks';

export type TooltipPlacement = 'top' | 'bottom';
export type TooltipAlign = 'center' | 'start' | 'end';

export interface TooltipProps {
  content: ComponentChildren;
  children: ComponentChildren;
  placement?: TooltipPlacement;
  align?: TooltipAlign;
  defaultOpen?: boolean;
  className?: string;
  tooltipClassName?: string;
}

export function Tooltip({
  content,
  children,
  placement = 'top',
  align = 'center',
  defaultOpen = false,
  className = '',
  tooltipClassName = '',
}: TooltipProps) {
  const tooltipId = useId();
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const rootClass = ['ui-tooltip', className].filter(Boolean).join(' ');
  const alignClass = align === 'center' ? '' : `ui-tooltip__bubble--${align}`;
  const bubbleClass = [
    'ui-tooltip__bubble',
    `ui-tooltip__bubble--${placement}`,
    alignClass,
    tooltipClassName,
  ]
    .filter(Boolean)
    .join(' ');

  let triggerNode: ComponentChildren = children;
  if (isValidElement(children)) {
    const vnode = children as VNode<Record<string, unknown>>;
    const existing =
      typeof vnode.props?.['aria-describedby'] === 'string'
        ? String(vnode.props['aria-describedby'])
        : '';
    const mergedDescribedBy = isOpen
      ? [existing, tooltipId].filter(Boolean).join(' ')
      : existing || undefined;
    triggerNode = cloneElement(vnode, {
      'aria-describedby': mergedDescribedBy,
    });
  }

  return (
    <span
      class={rootClass}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
      onFocusCapture={() => setIsOpen(true)}
      onBlurCapture={() => setIsOpen(false)}
      onKeyDown={event => {
        if (event.key === 'Escape' && isOpen) {
          setIsOpen(false);
        }
      }}
    >
      {triggerNode}
      {isOpen && (
        <span id={tooltipId} role="tooltip" class={bubbleClass}>
          {content}
        </span>
      )}
    </span>
  );
}
