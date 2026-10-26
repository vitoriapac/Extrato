import type { JSX } from 'preact';
import type { GuidedTourStep } from '../../domain/onboarding/guided-tour-steps.js';
import { Card } from '../primitives/card.js';
import { Button } from '../primitives/button.js';
import { Badge } from '../primitives/badge.js';

export interface GuidedTourPopoverProps {
  step: GuidedTourStep;
  currentIndex: number;
  totalSteps: number;
  isFirst: boolean;
  isLast: boolean;
  positionStyle?: Record<string, string>;
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
  onNext,
  onPrev,
  onClose,
}: GuidedTourPopoverProps): JSX.Element {
  return (
    <div
      id="guidedTourOverlay"
      className="guided-tour-overlay fixed inset-0 z-[200] pointer-events-none"
      role="region"
      aria-label="Tour guiado pelo aplicativo"
    >
      <div
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
          className="shadow-xl border-2 border-gold rounded-lg p-4 bg-navy text-on-navy"
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
