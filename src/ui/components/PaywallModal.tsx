import { useState } from 'preact/hooks';
import {
  FREE_TIER_LIMITS,
  PRICING_PLANS,
  type BillingCycle,
} from '../../domain/billing/entitlements.js';
import { Badge } from '../primitives/badge.js';
import { Button } from '../primitives/button.js';
import { Dialog } from '../primitives/dialog.js';
import { Icon } from '../primitives/icon.js';

export interface PaywallModalProps {
  open: boolean;
  onClose: () => void;
  featureTitle?: string;
  featureDescription?: string;
  defaultCycle?: BillingCycle;
  onSelectCheckout: (cycle: BillingCycle) => void;
  onExploreDemo?: () => void;
  isSubmitting?: boolean;
}

const PRO_HIGHLIGHTS: ReadonlyArray<{ label: string; detail: string }> = [
  {
    label: 'Sincronização automática na nuvem',
    detail: 'Estude no computador e revise no celular sem perder nenhum segundo.',
  },
  {
    label: 'Disciplinas, editais e flashcards ilimitados',
    detail: 'Desbloqueie editais completos acima de 8 matérias e caderno de erros sem teto.',
  },
  {
    label: 'Simulador de Cenários "E se?" & Modo Reta Final',
    detail: 'Projete impacto de horas extras e priorização na prontidão sem alterar seus dados.',
  },
  {
    label: 'Importador de Edital (PDF) e Questões em CSV',
    detail: 'Estruture editais da Cebraspe/FGV/FCC e importe baterias do QConcursos/Tec.',
  },
  {
    label: 'Análise Cronobiológica, Detector de Platô e Relatório PDF A4',
    detail: 'Cruze foco e energia por turno e exporte seu dossiê estratégico completo.',
  },
];

export function PaywallModal({
  open,
  onClose,
  featureTitle,
  featureDescription,
  defaultCycle = 'annual',
  onSelectCheckout,
  onExploreDemo,
  isSubmitting = false,
}: PaywallModalProps) {
  const [selectedCycle, setSelectedCycle] = useState<BillingCycle>(defaultCycle);
  const selectedPlan = PRICING_PLANS[selectedCycle];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="StudyTrack Pro — Acelere sua Aprovação"
      maxWidth="lg"
      aria-label="Conhecer o Plano StudyTrack Pro"
    >
      <div class="flex flex-col gap-4">
        {featureTitle && (
          <div class="p-3 rounded border border-border-default bg-surface-subtle flex items-start gap-2.5">
            <Icon name="Sparkles" size={18} class="text-brand shrink-0 mt-0.5" />
            <div class="flex flex-col gap-0.5">
              <span class="text-xs font-semibold uppercase tracking-wide text-secondary">
                Recurso exclusivo do Plano Pro
              </span>
              <p class="text-sm font-semibold text-primary m-0">{featureTitle}</p>
              {featureDescription && (
                <p class="text-xs text-secondary m-0">{featureDescription}</p>
              )}
            </div>
          </div>
        )}

        <div
          role="radiogroup"
          aria-label="Escolha o ciclo de assinatura"
          class="grid grid-cols-1 sm:grid-cols-2 gap-3"
        >
          {(['annual', 'monthly'] as const).map(cycle => {
            const plan = PRICING_PLANS[cycle];
            const isSelected = selectedCycle === cycle;
            return (
              <button
                key={plan.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => setSelectedCycle(cycle)}
                class={`text-left p-3.5 rounded border transition-colors cursor-pointer flex flex-col justify-between gap-2 ${
                  isSelected
                    ? 'border-brand bg-surface-elevated shadow-sm'
                    : 'border-border-default bg-surface-card hover:bg-surface-subtle'
                }`}
              >
                <div class="flex items-center justify-between gap-2">
                  <span class="text-sm font-semibold text-primary">{plan.name}</span>
                  {plan.badgeLabel && (
                    <Badge variant="success" icon="circle-check">
                      {plan.badgeLabel}
                    </Badge>
                  )}
                </div>
                <div class="flex items-baseline gap-1">
                  <span class="text-xl font-bold font-display text-primary">
                    {plan.monthlyEquivalentFormatted}
                  </span>
                  <span class="text-xs text-secondary">/mês</span>
                </div>
                <span class="text-xs text-secondary">{plan.billingNotice}</span>
              </button>
            );
          })}
        </div>

        <div class="rounded border border-border-default bg-surface-subtle p-3.5 flex flex-col gap-2.5">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold uppercase tracking-wide text-secondary">
              O que você desbloqueia no Plano Pro
            </span>
            <span class="text-xs text-secondary">
              Plano Free atual: até {FREE_TIER_LIMITS.maxActiveSubjects} matérias e{' '}
              {FREE_TIER_LIMITS.maxErrorFlashcards} flashcards
            </span>
          </div>
          <ul class="list-none m-0 p-0 flex flex-col gap-2">
            {PRO_HIGHLIGHTS.map(item => (
              <li key={item.label} class="flex items-start gap-2 text-xs">
                <Icon name="check" size={15} class="text-green shrink-0 mt-0.5" />
                <div>
                  <strong class="text-primary font-medium">{item.label}:</strong>{' '}
                  <span class="text-secondary">{item.detail}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div class="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-border-default">
          <div class="flex items-center gap-1.5 text-xs text-secondary">
            <Icon name="shield-check" size={16} class="text-green shrink-0" />
            <span>Liberação instantânea via PIX (AbacatePay) · Seus dados locais preservados</span>
          </div>
          <div class="flex items-center gap-2 w-full sm:w-auto justify-end">
            {onExploreDemo && (
              <Button variant="secondary" size="default" onClick={onExploreDemo}>
                Testar na Demo (140d)
              </Button>
            )}
            <Button
              variant="primary"
              size="default"
              iconLeft="bolt"
              disabled={isSubmitting}
              onClick={() => onSelectCheckout(selectedCycle)}
            >
              {isSubmitting
                ? 'Gerando PIX...'
                : `Assinar por ${selectedPlan.priceFormatted} no PIX`}
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
