import { useState } from 'preact/hooks';
import type { PlanTier } from '../../domain/billing/entitlements.js';
import { Badge } from '../primitives/badge.js';
import { Button } from '../primitives/button.js';
import { Dialog } from '../primitives/dialog.js';
import { Icon } from '../primitives/icon.js';

export interface AuthAccountModalProps {
  open: boolean;
  onClose: () => void;
  userEmail?: string | null;
  planTier?: PlanTier;
  lastSyncedAt?: string | null;
  onRequestMagicLink: (email: string) => Promise<{ success: boolean; error?: string }>;
  onGoogleLogin?: () => void;
  onSyncNow?: () => void;
  onOpenUpgrade?: () => void;
  onLogout?: () => void;
}

export function AuthAccountModal({
  open,
  onClose,
  userEmail,
  planTier = 'free',
  lastSyncedAt,
  onRequestMagicLink,
  onGoogleLogin,
  onSyncNow,
  onOpenUpgrade,
  onLogout,
}: AuthAccountModalProps) {
  const [emailInput, setEmailInput] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  const isAuthenticated = Boolean(userEmail);
  const isPaid = planTier === 'pro' || planTier === 'mentor';

  async function handleSubmit(e: Event) {
    e.preventDefault();
    setStatusMessage(null);
    setErrorMessage(null);
    setIsSending(true);
    try {
      const result = await onRequestMagicLink(emailInput);
      if (result.success) {
        setStatusMessage(
          'Enviamos um link de acesso mágico para o seu e-mail. Basta clicar nele para conectar e sincronizar seus estudos.'
        );
      } else {
        setErrorMessage(result.error || 'Não foi possível enviar o link de acesso.');
      }
    } finally {
      setIsSending(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isAuthenticated ? 'Sua Conta & Sincronização' : 'Entrar ou Criar Conta'}
      maxWidth="md"
      aria-label="Gerenciar conta e sincronização na nuvem"
    >
      {isAuthenticated ? (
        <div class="flex flex-col gap-4 text-text">
          <div class="p-3.5 rounded-default border border-border-default bg-surface-subtle flex items-center justify-between gap-3">
            <div class="flex flex-col gap-0.5">
              <span class="text-xs text-secondary">Conectado como</span>
              <strong class="text-sm font-semibold text-text">{userEmail}</strong>
              {lastSyncedAt && (
                <span class="text-xs font-data text-secondary">
                  Última sincronização: {lastSyncedAt}
                </span>
              )}
            </div>
            <Badge variant={isPaid ? 'success' : 'default'} icon={isPaid ? 'circle-check' : false}>
              {isPaid ? 'Plano Pro Ativo' : 'Plano Free Local'}
            </Badge>
          </div>

          <div class="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border-default">
            <div class="flex items-center gap-2">
              {isPaid && onSyncNow && (
                <Button variant="secondary" iconLeft="refresh" onClick={onSyncNow}>
                  Sincronizar agora
                </Button>
              )}
              {!isPaid && onOpenUpgrade && (
                <Button variant="primary" iconLeft="bolt" onClick={onOpenUpgrade}>
                  Ativar Plano Pro (Nuvem + Ilimitado)
                </Button>
              )}
            </div>
            {onLogout && (
              <Button variant="ghost" size="small" onClick={onLogout}>
                Sair da conta
              </Button>
            )}
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} class="flex flex-col gap-4 text-text">
          <p class="text-xs text-secondary m-0">
            Seus dados já estão salvos neste navegador. Conecte seu e-mail para vincular sua
            assinatura Pro e manter todo o histórico sincronizado entre computador e celular.
          </p>

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
                  Confira o formato do e-mail digitado ou tente entrar com Google abaixo.
                </span>
              </div>
            </div>
          )}

          <div class="flex flex-col sm:flex-row items-center justify-end gap-2 pt-2 border-t border-border-default">
            {onGoogleLogin && (
              <Button variant="secondary" onClick={onGoogleLogin} className="w-full sm:w-auto">
                Continuar com Google
              </Button>
            )}
            <Button
              type="submit"
              variant="primary"
              iconLeft="mail"
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
