import type { JSX } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import type { GuidedTourStep } from '../../domain/onboarding/guided-tour-steps.js';
import { Card } from '../primitives/card.js';
import { Button } from '../primitives/button.js';
import { Badge } from '../primitives/badge.js';

export interface SpotlightRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface GuidedTourPopoverProps {
  step: GuidedTourStep;
  currentIndex: number;
  totalSteps: number;
  isFirst: boolean;
  isLast: boolean;
  positionStyle?: Record<string, string>;
  targetRect?: SpotlightRect | null;
  onNext?: () => void;
  onPrev?: () => void;
  onClose?: () => void;
}

export function GuidedTourPopover({
  step,
  currentIndex,
  totalSteps,
  isFirst,
  isLast,
  positionStyle = {},
  targetRect = null,
  onNext,
  onPrev,
  onClose,
}: GuidedTourPopoverProps): JSX.Element {
  const popoverRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (document.activeElement && document.activeElement !== document.body) {
      previousFocusRef.current = document.activeElement as HTMLElement;
    }

    // Auto-focus no botão de próxima ação do tour
    const timer = setTimeout(() => {
      const nextBtn = popoverRef.current?.querySelector<HTMLElement>(
        '[data-guided-tour-next="true"]'
      );
      nextBtn?.focus();
    }, 50);

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose?.();
        return;
      }
      if (e.key === 'Tab') {
        const popover = popoverRef.current;
        if (!popover) return;
        const focusable = popover.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
      if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
        previousFocusRef.current.focus();
      }
    };
  }, [currentIndex, onClose]);

  return (
    <div
      id="guidedTourOverlay"
      className="guided-tour-overlay fixed inset-0 z-[200] pointer-events-none"
      role="region"
      aria-label="Tour guiado pelo aplicativo"
    >
      {/* Dimmed backdrop with spotlight cutout around the target element */}
      <svg
        className="guided-tour-backdrop absolute inset-0 w-full h-full pointer-events-auto"
        width="100%"
        height="100%"
        onClick={onClose}
        aria-hidden="true"
      >
        <defs>
          <mask id="tour-spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {targetRect && (
              <rect
                x={targetRect.left - 6}
                y={targetRect.top - 6}
                width={targetRect.width + 12}
                height={targetRect.height + 12}
                rx="6"
                ry="6"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(11, 20, 35, 0.55)"
          mask="url(#tour-spotlight-mask)"
        />
      </svg>

      <div
        ref={popoverRef}
        id="guidedTourPopover"
        className="guided-tour-popover pointer-events-auto absolute z-[205] max-w-[380px] w-[calc(100vw-24px)] transition-all duration-200"
        style={positionStyle}
        role="dialog"
        aria-modal="true"
        aria-labelledby="guidedTourTitle"
        aria-describedby="guidedTourMessage"
      >
        <Card
          variant="primary"
          className="shadow-xl border-2 border-gold rounded-default p-4 bg-navy text-on-navy"
        >
          <div className="flex flex-col gap-2.5">
            {/* Cabeçalho */}
            <div className="flex items-center justify-between gap-2">
              <Badge variant="warning" className="text-xs font-bold uppercase tracking-wide">
                {step.badgeLabel || `${currentIndex + 1} de ${totalSteps}`}
              </Badge>
              <button
                type="button"
                className="btn-icon p-1 text-on-navy/70 hover:text-on-navy cursor-pointer transition-colors"
                onClick={onClose}
                aria-label="Fechar tour interativo"
                data-guided-tour-close="true"
              >
                ✕
              </button>
            </div>

            {/* Conteúdo */}
            <h3 id="guidedTourTitle" className="text-base font-bold text-on-navy m-0">
              {step.title}
            </h3>
            <p id="guidedTourMessage" className="text-xs text-on-navy/85 leading-relaxed m-0">
              {step.message}
            </p>

            {/* Controles de Navegação */}
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-on-navy/20 mt-1">
              <Button
                variant="ghost"
                size="small"
                onClick={onPrev}
                disabled={isFirst}
                className="text-on-navy hover:bg-white/10 disabled:opacity-30"
                aria-label="Parada anterior"
              >
                ← Anterior
              </Button>

              <div className="flex items-center gap-1.5" aria-hidden="true">
                {Array.from({ length: totalSteps }).map((_, idx) => (
                  <span
                    key={idx}
                    className={`inline-block w-2 h-2 rounded-full transition-colors ${
                      idx === currentIndex ? 'bg-gold' : 'bg-on-navy/30'
                    }`}
                  />
                ))}
              </div>

              <Button
                variant="secondary"
                size="small"
                onClick={onNext}
                className="bg-gold text-navy font-semibold hover:bg-gold/90 border-0"
                data-guided-tour-next="true"
                aria-label={isLast ? 'Concluir tour guiado' : 'Próxima parada'}
              >
                {isLast ? 'Concluir ✓' : 'Próximo →'}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
