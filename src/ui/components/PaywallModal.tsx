import { useState } from 'preact/hooks';
import {
  FREE_TIER_LIMITS,
  PRICING_PLANS,
  type BillingCycle,
  type PaymentMethod,
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
  defaultPaymentMethod?: PaymentMethod;
  onSelectCheckout: (cycle: BillingCycle, paymentMethod?: PaymentMethod, installments?: number) => void;
  onExploreDemo?: () => void;
  isSubmitting?: boolean;
  errorMessage?: string | null;
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
  defaultPaymentMethod = 'pix',
  onSelectCheckout,
  onExploreDemo,
  isSubmitting = false,
  errorMessage = null,
}: PaywallModalProps) {
  const [selectedCycle, setSelectedCycle] = useState<BillingCycle>(defaultCycle);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(defaultPaymentMethod);
  const [selectedInstallments, setSelectedInstallments] = useState<number>(12);

  const selectedPlan = PRICING_PLANS[selectedCycle];
  const isAnnual = selectedCycle === 'annual';
  const isCard = paymentMethod === 'card';

  const installmentOption = isAnnual && isCard
    ? selectedPlan.installments.find(opt => opt.installments === selectedInstallments) || selectedPlan.installments[selectedPlan.installments.length - 1]
    : null;

  function handleCheckout() {
    onSelectCheckout(
      selectedCycle,
      paymentMethod,
      isAnnual && isCard ? selectedInstallments : 1
    );
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Extrato de Estudos Pro — Acelere sua Aprovação"
      maxWidth="lg"
      aria-label="Conhecer o Plano Extrato de Estudos Pro"
    >
      <div class="flex flex-col gap-stack text-text">
        {featureTitle && (
          <div class="p-card rounded-default border border-border-default bg-surface-subtle flex items-start gap-3">
            <span class="inline-flex h-4 items-center shrink-0">
              <Icon name="bolt" size={18} class="text-accent" />
            </span>
            <div class="flex flex-col gap-1">
              <span class="text-xs font-semibold uppercase tracking-wide text-secondary">
                Recurso exclusivo do Plano Pro
              </span>
              <p class="text-sm font-semibold text-text m-0">{featureTitle}</p>
              {featureDescription && (
                <p class="text-xs text-secondary m-0">{featureDescription}</p>
              )}
            </div>
          </div>
        )}

        {/* Seletor de Ciclo de Assinatura */}
        <div
          role="group"
          aria-label="Escolha a periodicidade da assinatura"
          class="grid grid-cols-1 sm:grid-cols-2 gap-3"
        >
          {(['annual', 'monthly'] as const).map(cycle => {
            const plan = PRICING_PLANS[cycle];
            const isSelected = selectedCycle === cycle;
            return (
              <button
                key={plan.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => setSelectedCycle(cycle)}
                class={`text-left p-card rounded-default border transition-colors cursor-pointer flex flex-col justify-between gap-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent ${
                  isSelected
                    ? 'border-border-default border-t-[3px] border-t-accent bg-surface-elevated'
                    : 'border-border-default border-t-[3px] border-t-transparent bg-surface-card hover:bg-surface-subtle'
                }`}
              >
                <div class="flex items-center justify-between gap-2">
                  <span class="text-sm font-semibold text-text">{plan.name}</span>
                  {plan.badgeLabel && (
                    <Badge variant="info" icon="circle-check">
                      {plan.badgeLabel}
                    </Badge>
                  )}
                </div>
                <div class="flex items-baseline gap-1">
                  <span class="text-xl font-semibold font-display text-text">
                    {plan.monthlyEquivalentFormatted}
                  </span>
                  <span class="text-xs font-data text-secondary">/mês</span>
                </div>
                <span class="text-xs font-data text-secondary">{plan.billingNotice}</span>
              </button>
            );
          })}
        </div>

        {/* Seletor de Forma de Pagamento (PIX vs Cartão) */}
        <div class="p-card rounded-default border border-border-default bg-surface-card flex flex-col gap-3">
          <span class="text-xs font-semibold uppercase tracking-wide text-secondary">
            Forma de Pagamento
          </span>

          <div
            role="group"
            aria-label="Forma de pagamento"
            class="grid grid-cols-1 sm:grid-cols-2 gap-3"
          >
            {/* Botão PIX */}
            <button
              type="button"
              aria-pressed={paymentMethod === 'pix'}
              onClick={() => setPaymentMethod('pix')}
              class={`text-left p-3 rounded border cursor-pointer transition-colors flex items-start gap-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent ${
                paymentMethod === 'pix'
                  ? 'border-accent bg-surface-elevated'
                  : 'border-border-default bg-surface-subtle hover:bg-surface-page'
              }`}
            >
              <span class="inline-flex h-4 items-center shrink-0">
                <Icon name="bolt" size={18} class="text-accent" />
              </span>
              <div class="flex flex-col gap-1">
                <span class="text-xs font-semibold text-text">PIX Instantâneo</span>
                <span class="text-xs text-secondary">
                  Liberação imediata via AbacatePay com QR Code e Copia e Cola
                </span>
              </div>
            </button>

            {/* Botão Cartão */}
            <button
              type="button"
              aria-pressed={paymentMethod === 'card'}
              onClick={() => setPaymentMethod('card')}
              class={`text-left p-3 rounded border cursor-pointer transition-colors flex items-start gap-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent ${
                paymentMethod === 'card'
                  ? 'border-accent bg-surface-elevated'
                  : 'border-border-default bg-surface-subtle hover:bg-surface-page'
              }`}
            >
              <span class="inline-flex h-4 items-center shrink-0">
                <Icon name="credit-card" size={18} class="text-accent" />
              </span>
              <div class="flex flex-col gap-1">
                <span class="text-xs font-semibold text-text">Cartão de Crédito</span>
                <span class="text-xs text-secondary">
                  {isAnnual ? 'Em até 12x sem juros (R$ 14,90/mês)' : 'Renovação mensal automática sem interrupção'}
                </span>
              </div>
            </button>
          </div>

          {/* Opções de Parcelamento no Cartão (Plano Anual) */}
          {isCard && isAnnual && (
            <div class="pt-2 border-t border-border-default flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <label for="cardInstallmentsSelect" class="text-xs font-medium text-text">
                Número de parcelas no cartão:
              </label>
              <select
                id="cardInstallmentsSelect"
                value={selectedInstallments}
                onChange={e => setSelectedInstallments(Number((e.target as HTMLSelectElement).value))}
                class="min-h-control px-3 py-1 text-xs rounded border border-border-default bg-surface-page text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
              >
                {selectedPlan.installments.map(opt => (
                  <option key={opt.installments} value={opt.installments}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Destaques do Plano Pro */}
        <div class="rounded-default border border-border-default bg-surface-subtle p-card flex flex-col gap-3">
          <div class="flex flex-wrap items-center justify-between gap-1">
            <span class="text-xs font-semibold uppercase tracking-wide text-secondary">
              O que você desbloqueia no Plano Pro
            </span>
            <span class="text-xs font-data text-secondary">
              Plano Free atual: até {FREE_TIER_LIMITS.maxActiveSubjects} matérias e{' '}
              {FREE_TIER_LIMITS.maxErrorFlashcards} flashcards
            </span>
          </div>
          <ul class="list-none m-0 p-0 flex flex-col gap-2">
            {PRO_HIGHLIGHTS.map(item => (
              <li key={item.label} class="flex items-start gap-2 text-xs">
                <span class="inline-flex h-4 items-center shrink-0">
                  <Icon name="check" size={15} class="text-accent" />
                </span>
                <div>
                  <strong class="text-text font-medium">{item.label}:</strong>{' '}
                  <span class="text-secondary">{item.detail}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {errorMessage && (
          <div
            role="alert"
            class="p-3 rounded bg-red-bg text-red text-xs flex items-start gap-2"
          >
            <span class="inline-flex h-4 items-center shrink-0">
              <Icon name="alert-circle" size={16} />
            </span>
            <div class="flex flex-col gap-1">
              <span>{errorMessage}</span>
              <span class="text-secondary">
                Verifique sua conexão e tente novamente. Seus dados locais permanecem intactos.
              </span>
            </div>
          </div>
        )}

        {/* Aviso de Conformidade Legal e CDC */}
        <p class="text-xs text-muted text-center leading-relaxed m-0">
          Ao prosseguir, você concorda com os{' '}
          <a href="/?legal=terms" target="_blank" rel="noopener noreferrer" class="underline hover:text-text">
            Termos de Uso
          </a>{' '}
          e a{' '}
          <a href="/?legal=privacy" target="_blank" rel="noopener noreferrer" class="underline hover:text-text">
            Política de Privacidade (LGPD)
          </a>
          . Garantia de arrependimento em até 7 dias (Art. 49 do CDC).
        </p>

        <div class="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-border-default">
          <div class="flex items-center gap-2 text-xs text-secondary">
            <Icon name="shield-check" size={16} class="text-accent shrink-0" />
            <span>
              {paymentMethod === 'pix'
                ? 'Liberação instantânea no PIX · Seus dados locais preservados'
                : 'Ambiente seguro tokenizado · Seus dados locais preservados'}
            </span>
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
              onClick={handleCheckout}
            >
              {isSubmitting
                ? 'Processando...'
                : paymentMethod === 'pix'
                  ? `Assinar por ${selectedPlan.priceFormatted} no PIX`
                  : isAnnual && installmentOption
                    ? `Assinar em ${installmentOption.label}`
                    : `Assinar por ${selectedPlan.priceFormatted}/mês no Cartão`}
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
