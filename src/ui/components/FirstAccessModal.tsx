import { Dialog } from '../primitives/dialog.js';
import { Button } from '../primitives/button.js';
import { Icon } from '../primitives/icon.js';

export interface FirstAccessModalProps {
  open: boolean;
  onClose: () => void;
  onStartGuidedPlan: () => void;
  onStartDemo: () => void;
  onExploreManually?: () => void;
  onOpenSalesLanding?: () => void;
  onPasteSyllabus?: () => void;
}

export function FirstAccessModal({
  open,
  onClose,
  onStartGuidedPlan,
  onStartDemo,
  onExploreManually,
  onPasteSyllabus,
}: FirstAccessModalProps) {
  if (!open) return null;

  const handleStartPlan = () => {
    onClose();
    onStartGuidedPlan();
  };

  const handleStartDemo = () => {
    onClose();
    onStartDemo();
  };

  const handleExploreManually = () => {
    onClose();
    onExploreManually?.();
  };

  const handlePasteSyllabus = () => {
    onClose();
    onPasteSyllabus?.();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Boas-vindas ao Extrato de Estudos"
      maxWidth="md"
      className="first-access-welcome-modal"
    >
      <div className="space-y-6 text-sm text-content-primary">
        <header className="space-y-2">
          <p className="text-sm text-content-secondary leading-relaxed m-0">
            Configure sua prova e disponibilidade em 4 etapas rápidas, ou explore o extrato com
            dados fictícios.
          </p>
        </header>

        {/* Opções de Início em formato de extrato */}
        <ol className="divide-y divide-border-subtle border-y border-border-subtle m-0 p-0 list-none">
          {/* Opção 1: Montar plano guiado */}
          <li className="py-4 flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <span className="font-mono tabular-nums text-xs font-semibold text-content-secondary pt-0.5 shrink-0">
                01
              </span>
              <div className="min-w-0 space-y-1">
                <h4 className="text-base font-semibold text-content-primary m-0">
                  Montar meu plano guiado
                </h4>
                <p className="text-xs text-content-secondary m-0 leading-relaxed">
                  4 lançamentos iniciais: prova e prazo, disponibilidade semanal, edital ou
                  matérias e a prévia do plano antes de salvar.
                </p>
              </div>
            </div>
            <Button
              variant="primary"
              size="small"
              onClick={handleStartPlan}
              aria-label="Iniciar assistente para montar plano guiado"
              className="w-full shrink-0 inline-flex items-center justify-center gap-2 font-medium"
            >
              <span>Começar agora</span>
              <Icon name="arrow-right" size={14} class="shrink-0" />
            </Button>
          </li>

          {/* Opção 2: Demonstração Interativa */}
          <li className="py-4 flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <span className="font-mono tabular-nums text-xs font-semibold text-content-secondary pt-0.5 shrink-0">
                02
              </span>
              <div className="min-w-0 space-y-1">
                <h4 className="text-base font-semibold text-content-primary m-0">
                  Explorar demonstração interativa
                </h4>
                <p className="text-xs text-content-secondary m-0 leading-relaxed">
                  Explore o aplicativo com dados fictícios. Seus registros pessoais permanecem preservados.
                </p>
              </div>
            </div>
            <Button
              variant="tonal"
              size="small"
              onClick={handleStartDemo}
              aria-label="Explorar demonstração com dados fictícios"
              className="w-full shrink-0 inline-flex items-center justify-center gap-2"
            >
              <span>Explorar demonstração</span>
            </Button>
          </li>
        </ol>

        {/* Rodapé: Opção Manual */}
        <footer className="pt-2 border-t border-border-subtle flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleExploreManually}
              className="btn tertiary text-xs"
              aria-label="Configurar manualmente ou explorar livremente"
            >
              Configurar manualmente
            </button>
            {onPasteSyllabus && (
              <button
                type="button"
                onClick={handlePasteSyllabus}
                className="btn tertiary text-xs"
                aria-label="Colar conteúdo do edital em PDF"
              >
                <Icon name="file-text" size={12} class="shrink-0" />
                <span>Colar edital (PDF)</span>
              </button>
            )}
          </div>
        </footer>
      </div>
    </Dialog>
  );
}
