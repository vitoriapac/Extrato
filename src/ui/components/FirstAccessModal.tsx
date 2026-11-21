import { Dialog } from '../primitives/dialog.js';
import { Badge } from '../primitives/badge.js';
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
  onOpenSalesLanding,
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
      onClose={handleExploreManually}
      title="Boas-vindas ao Extrato de Estudos"
      maxWidth="md"
      className="first-access-welcome-modal"
    >
      <div className="space-y-6 text-sm text-content-primary">
        <header className="space-y-2">
          <p className="text-sm text-content-secondary leading-relaxed m-0">
            Seu copiloto de preparação para concursos e exames. Organize seu tempo,
            acompanhe seu índice de prontidão e execute sua rotina diária sem sobrecarga.
          </p>
        </header>

        {/* Opções de Início */}
        <div className="grid grid-cols-1 gap-4 pt-1">
          {/* Opção 1: Montar plano guiado */}
          <article className="relative rounded-default border border-border-emphasis bg-surface-card p-card transition-colors hover:border-border-hover flex flex-col items-stretch gap-4">
            <div className="flex min-w-0 flex-1 items-start gap-4">
              <div className="p-4 rounded-default bg-surface-subtle text-accent shrink-0">
                <Icon name="compass" size={20} class="shrink-0" />
              </div>
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <h4 className="text-base font-semibold text-content-primary m-0">
                    Montar meu plano guiado
                  </h4>
                  <Badge variant="info" icon={false}>
                    Recomendado
                  </Badge>
                </div>
                <p className="text-xs text-content-secondary m-0 leading-relaxed">
                  Assistente rápido em 4 passos: prazo da prova, horas semanais, edital ou
                  matérias e a prévia do plano para começar hoje.
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
          </article>

          {/* Opção 2: Demonstração Interativa */}
          <article className="rounded-default border border-border-default bg-surface-card p-card transition-colors hover:border-border-hover flex flex-col items-stretch gap-4">
            <div className="flex min-w-0 flex-1 items-start gap-4">
              <div className="p-3 rounded-default bg-surface-subtle text-content-secondary shrink-0">
                <Icon name="player-play" size={20} class="shrink-0" />
              </div>
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
              variant="secondary"
              size="small"
              onClick={handleStartDemo}
              aria-label="Explorar demonstração com dados fictícios"
              className="w-full shrink-0 inline-flex items-center justify-center gap-2"
            >
              <span>Explorar demonstração</span>
            </Button>
          </article>
        </div>

        {/* Rodapé: Opção Manual e Página de Apresentação */}
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
          {onOpenSalesLanding && (
            <button
              type="button"
              onClick={onOpenSalesLanding}
              className="btn tertiary text-xs"
              aria-label="Ver apresentação e recursos do aplicativo"
            >
              Ver apresentação e recursos
            </button>
          )}
        </footer>
      </div>
    </Dialog>
  );
}
