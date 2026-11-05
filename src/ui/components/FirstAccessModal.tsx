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
}

export function FirstAccessModal({
  open,
  onClose,
  onStartGuidedPlan,
  onStartDemo,
  onExploreManually,
  onOpenSalesLanding,
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

  return (
    <Dialog
      open={open}
      onClose={handleExploreManually}
      title="Boas-vindas ao Extrato de Estudos"
      maxWidth="md"
      className="first-access-welcome-modal"
    >
      <div className="space-y-5 text-sm text-content-primary">
        <header className="space-y-1.5">
          <p className="text-sm text-content-secondary leading-relaxed m-0">
            Seu copiloto de preparação para concursos e exames. Organize seu tempo,
            acompanhe seu índice de prontidão e execute sua rotina diária sem sobrecarga.
          </p>
        </header>

        {/* Opções de Início */}
        <div className="grid grid-cols-1 gap-3.5 pt-1">
          {/* Opção 1: Montar plano guiado (Recomendado) */}
          <article className="relative rounded-default border-2 border-brand/50 bg-brand/5 p-4 transition-colors hover:border-brand flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-full bg-brand/10 text-brand shrink-0 mt-0.5">
                <Icon name="rocket" size={22} class="shrink-0" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-semibold text-content-primary m-0">
                    Montar meu plano guiado
                  </h4>
                  <span className="text-xs font-bold uppercase tracking-wide bg-brand text-white px-2 py-0.5 rounded-full">
                    Recomendado
                  </span>
                </div>
                <p className="text-xs text-content-secondary m-0 leading-relaxed">
                  Assistente rápido em 4 passos: prazo da prova, horas semanais e pacote
                  de matérias pronto para começar hoje.
                </p>
              </div>
            </div>
            <Button
              variant="primary"
              size="small"
              onClick={handleStartPlan}
              aria-label="Iniciar assistente para montar plano guiado"
              className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-1.5 font-medium"
            >
              <span>Começar agora</span>
              <Icon name="arrow-right" size={14} class="shrink-0" />
            </Button>
          </article>

          {/* Opção 2: Demonstração Interativa */}
          <article className="rounded-default border border-border-default bg-surface-card p-4 transition-colors hover:border-border-hover flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-full bg-surface-subtle text-content-secondary shrink-0 mt-0.5">
                <Icon name="player-play" size={20} class="shrink-0" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-semibold text-content-primary m-0">
                  Experimentar demonstração interativa
                </h4>
                <p className="text-xs text-content-secondary m-0 leading-relaxed">
                  Explore o aplicativo com matérias, histórico simulado, radar de lacunas
                  e métricas reais pré-carregadas.
                </p>
              </div>
            </div>
            <Button
              variant="secondary"
              size="small"
              onClick={handleStartDemo}
              aria-label="Explorar demonstração com dados fictícios"
              className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-1.5"
            >
              <span>Explorar demonstração</span>
            </Button>
          </article>
        </div>

        {/* Rodapé: Opção Manual e Página de Apresentação */}
        <footer className="pt-2 border-t border-border-subtle flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleExploreManually}
            className="text-xs text-content-secondary hover:text-content-primary underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-xs"
            aria-label="Configurar manualmente ou explorar livremente"
          >
            Configurar manualmente ou explorar livremente
          </button>
          {onOpenSalesLanding && (
            <button
              type="button"
              onClick={onOpenSalesLanding}
              className="text-xs font-medium text-brand hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-xs"
              aria-label="Ver apresentação completa e planos Free e Pro"
            >
              Ver apresentação e planos (Free / Pro)
            </button>
          )}
        </footer>
      </div>
    </Dialog>
  );
}
