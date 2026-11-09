import { useState } from 'preact/hooks';
import type { PlanTier } from '../../domain/billing/entitlements.js';
import type { UserRole } from '../../auth/saas-auth-service.js';
import { Badge } from '../primitives/badge.js';
import { Button } from '../primitives/button.js';
import { Dialog } from '../primitives/dialog.js';
import { Icon } from '../primitives/icon.js';

export interface AuthAccountModalProps {
  open: boolean;
  onClose: () => void;
  userEmail?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
  role?: UserRole;
  planTier?: PlanTier;
  subscriptionPeriodEnd?: string | null;
  paymentMethod?: 'pix' | 'card' | null;
  cardBrand?: string | null;
  cardLast4?: string | null;
  autoRenew?: boolean;
  isInGracePeriod?: boolean;
  lastSyncedAt?: string | null;
  onRequestMagicLink: (email: string) => Promise<{ success: boolean; error?: string }>;
  onGoogleLogin?: () => void;
  onClerkSignIn?: () => void;
  onOpenUserProfile?: () => void;
  onOpenAdminPanel?: () => void;
  onSyncNow?: () => void;
  onOpenUpgrade?: () => void;
  onChangePaymentMethod?: () => void;
  onCancelAutoRenew?: () => void;
  onLogout?: () => void;
}

function formatDateBR(isoString?: string | null): string {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return '';
  }
}

export function AuthAccountModal({
  open,
  onClose,
  userEmail,
  displayName,
  avatarUrl,
  role = 'user',
  planTier = 'free',
  subscriptionPeriodEnd,
  paymentMethod = 'pix',
  cardBrand,
  cardLast4,
  autoRenew = false,
  isInGracePeriod = false,
  lastSyncedAt,
  onRequestMagicLink,
  onGoogleLogin,
  onClerkSignIn,
  onOpenUserProfile,
  onOpenAdminPanel,
  onSyncNow,
  onOpenUpgrade,
  onChangePaymentMethod,
  onCancelAutoRenew,
  onLogout,
}: AuthAccountModalProps) {
  const [emailInput, setEmailInput] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [imgError, setImgError] = useState(false);

  const isAuthenticated = Boolean(userEmail);
  const isPaid = planTier === 'pro' || planTier === 'mentor';
  const isAdmin = role === 'admin';
  const expirationFormatted = formatDateBR(subscriptionPeriodEnd);

  async function handleSubmit(e: Event) {
    e.preventDefault();
    setStatusMessage(null);
    setErrorMessage(null);
    setIsSending(true);
    try {
      const result = await onRequestMagicLink(emailInput);
      if (result.success) {
        setStatusMessage(
          'Enviamos um link de acesso para o seu e-mail. Basta clicar nele para conectar e sincronizar seus estudos.'
        );
      } else {
        setErrorMessage(result.error || 'Não foi possível enviar o link de acesso.');
      }
    } finally {
      setIsSending(false);
    }
  }

  const initials = displayName
    ? displayName.slice(0, 2).toUpperCase()
    : userEmail
      ? userEmail.slice(0, 2).toUpperCase()
      : 'EE';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isAuthenticated ? 'Sua Conta & Assinatura' : 'Entrar ou Criar Conta'}
      maxWidth="md"
      aria-label="Gerenciar conta, assinatura e sincronização na nuvem"
    >
      {isAuthenticated ? (
        <div class="flex flex-col gap-4 text-text">
          {/* Card Principal do Usuário */}
          <div class="p-3.5 rounded-default border border-border-default bg-surface-subtle flex items-center justify-between gap-3">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full overflow-hidden bg-surface-card border border-border-default flex items-center justify-center shrink-0">
                {avatarUrl && !imgError ? (
                  <img
                    src={avatarUrl}
                    alt={displayName || userEmail || 'Avatar'}
                    onError={() => setImgError(true)}
                    referrerPolicy="no-referrer"
                    class="w-full h-full object-cover"
                  />
                ) : (
                  <span class="text-xs font-semibold text-text select-none">{initials}</span>
                )}
              </div>
              <div class="flex flex-col gap-0.5">
                <span class="text-xs text-secondary">Conectado como</span>
                <strong class="text-sm font-semibold text-text">
                  {displayName || userEmail}
                </strong>
                {displayName && userEmail && (
                  <span class="text-xs text-secondary">{userEmail}</span>
                )}
                {lastSyncedAt && (
                  <span class="text-xs font-data text-secondary">
                    Última sincronização: {lastSyncedAt}
                  </span>
                )}
              </div>
            </div>
            <div class="flex flex-col items-end gap-1">
              <Badge variant={isPaid ? 'success' : 'default'} icon={isPaid ? 'circle-check' : false}>
                {isPaid ? 'Plano Pro Ativo' : 'Plano Free Local'}
              </Badge>
              {isAdmin && (
                <Badge variant="warning" icon="shield-check">
                  Administrador
                </Badge>
              )}
            </div>
          </div>

          {/* Alerta de Período de Tolerância (Grace Period) */}
          {isInGracePeriod && (
            <div
              role="alert"
              class="p-3 rounded-default border border-amber-border bg-amber-bg text-amber flex items-start gap-2.5 text-xs"
            >
              <Icon name="alert-triangle" size={18} class="shrink-0 mt-0.5" />
              <div class="flex flex-col gap-1">
                <strong class="font-semibold">Período de tolerância ativo (3 dias)</strong>
                <p class="m-0 leading-relaxed">
                  Identificamos uma pendência na renovação do seu cartão. Seus recursos Pro continuam liberados,
                  mas atualize sua forma de pagamento ou quite via PIX para não perder a sincronização na nuvem.
                </p>
                {onChangePaymentMethod && (
                  <button
                    type="button"
                    onClick={onChangePaymentMethod}
                    class="self-start underline font-semibold cursor-pointer bg-transparent border-0 p-0 text-amber hover:opacity-80"
                  >
                    Regularizar pagamento agora
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Painel de Autoatendimento da Assinatura Pro */}
          {isPaid && (
            <div class="p-3.5 rounded-default border border-border-default bg-surface-card flex flex-col gap-3">
              <div class="flex items-center justify-between gap-2 border-b border-border-default pb-2">
                <span class="text-xs font-semibold uppercase tracking-wide text-secondary">
                  Detalhes do Plano Pro
                </span>
                {expirationFormatted && (
                  <span class="text-xs font-data text-secondary">
                    {autoRenew ? `Próxima renovação: ${expirationFormatted}` : `Acesso ativo até: ${expirationFormatted}`}
                  </span>
                )}
              </div>

              <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div class="flex items-center gap-2">
                  <Icon
                    name={paymentMethod === 'card' ? 'credit-card' : 'bolt'}
                    size={16}
                    class="text-accent shrink-0"
                  />
                  <div class="flex flex-col">
                    <span class="text-xs font-medium text-text">
                      {paymentMethod === 'card'
                        ? `Cartão de Crédito ${cardBrand ? cardBrand.toUpperCase() : ''} ${cardLast4 ? `(final •••• ${cardLast4})` : ''}`.trim()
                        : 'PIX Instantâneo Pré-pago'}
                    </span>
                    <span class="text-xs text-secondary">
                      {paymentMethod === 'card'
                        ? autoRenew
                          ? 'Renovação automática ativa'
                          : 'Cancelamento programado para o final do período'
                        : 'Sem renovação automática — renovável a qualquer momento'}
                    </span>
                  </div>
                </div>

                <div class="flex items-center gap-2">
                  {onChangePaymentMethod && (
                    <Button variant="ghost" size="small" onClick={onChangePaymentMethod}>
                      Trocar método
                    </Button>
                  )}
                  {autoRenew && onCancelAutoRenew && (
                    <Button variant="ghost" size="small" onClick={onCancelAutoRenew}>
                      Cancelar renovação
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Barra de Ações Rápidas */}
          <div class="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border-default">
            <div class="flex flex-wrap items-center gap-2">
              {onOpenUserProfile && (
                <Button variant="secondary" size="small" iconLeft="photo" onClick={onOpenUserProfile}>
                  Perfil e Foto (Clerk)
                </Button>
              )}
              {isPaid && onSyncNow && (
                <Button variant="secondary" size="small" iconLeft="refresh" onClick={onSyncNow}>
                  Sincronizar agora
                </Button>
              )}
              {!isPaid && onOpenUpgrade && (
                <Button variant="primary" size="small" iconLeft="bolt" onClick={onOpenUpgrade}>
                  Ativar Plano Pro (Nuvem + Ilimitado)
                </Button>
              )}
              {isAdmin && onOpenAdminPanel && (
                <Button variant="secondary" size="small" iconLeft="shield" onClick={onOpenAdminPanel}>
                  Painel Admin
                </Button>
              )}
            </div>
            {onLogout && (
              <Button variant="ghost" size="small" iconLeft="logout" onClick={onLogout}>
                Sair da conta
              </Button>
            )}
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} class="flex flex-col gap-4 text-text">
          <p class="text-xs text-secondary m-0">
            Seus dados já estão salvos neste navegador. Conecte sua conta para vincular seus estudos
            à nuvem, fazer backup automático e sincronizar entre computador e celular.
          </p>

          {onClerkSignIn && (
            <div class="p-3 rounded-default border border-border-default bg-surface-subtle flex flex-col gap-2">
              <span class="text-xs font-semibold text-text">Acesso Rápido e Seguro</span>
              <Button
                variant="primary"
                onClick={onClerkSignIn}
                iconLeft="login"
                className="w-full"
              >
                Entrar com Clerk (Google, Apple, Senha ou Passkey)
              </Button>
            </div>
          )}

          <div class="relative flex py-1 items-center">
            <div class="flex-grow border-t border-border-default" />
            <span class="flex-shrink mx-3 text-xs text-secondary uppercase font-medium">
              Ou receba um link de acesso por e-mail
            </span>
            <div class="flex-grow border-t border-border-default" />
          </div>

          <div class="flex flex-col gap-1.5">
            <label for="saasAuthEmailInput" class="text-xs font-medium text-text">
              Seu e-mail de estudante
            </label>
            <input
              id="saasAuthEmailInput"
              type="email"
              required
              value={emailInput}
              onInput={e => setEmailInput((e.target as HTMLInputElement).value)}
              placeholder="voce@exemplo.com.br"
              class="min-h-[44px] sm:min-h-[38px] px-3 py-2 text-sm rounded border border-border-default bg-surface-card text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
            />
          </div>

          {statusMessage && (
            <div
              role="status"
              class="p-2.5 rounded bg-green-bg text-green text-xs flex items-start gap-2"
            >
              <Icon name="circle-check" size={16} class="shrink-0 mt-0.5" />
              <span>{statusMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div
              role="alert"
              class="p-2.5 rounded bg-red-bg text-red text-xs flex items-start gap-2"
            >
              <Icon name="alert-circle" size={16} class="shrink-0 mt-0.5" />
              <div class="flex flex-col gap-0.5">
                <span>{errorMessage}</span>
                <span class="text-secondary">
                  Confira o formato do e-mail digitado ou tente entrar com Clerk acima.
                </span>
              </div>
            </div>
          )}

          {/* Aviso de Termos de Uso e LGPD */}
          <p class="text-xs text-muted text-center leading-relaxed m-0">
            Ao entrar ou se cadastrar, você concorda com os{' '}
            <a href="/?legal=terms" target="_blank" rel="noopener noreferrer" class="underline hover:text-text">
              Termos de Uso
            </a>{' '}
            e a{' '}
            <a href="/?legal=privacy" target="_blank" rel="noopener noreferrer" class="underline hover:text-text">
              Política de Privacidade (LGPD)
            </a>
            .
          </p>

          <div class="flex flex-col sm:flex-row items-center justify-end gap-2 pt-2 border-t border-border-default">
            {onGoogleLogin && (
              <Button variant="secondary" onClick={onGoogleLogin} className="w-full sm:w-auto">
                Continuar com Google
              </Button>
            )}
            <Button
              type="submit"
              variant="primary"
              disabled={isSending}
              className="w-full sm:w-auto"
            >
              {isSending ? 'Enviando link...' : 'Receber link de acesso'}
            </Button>
          </div>
        </form>
      )}
    </Dialog>
  );
}
