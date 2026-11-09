import { useState, useRef, useEffect } from 'preact/hooks';
import type { CachedUserProfile, UserRole } from '../../auth/saas-auth-service.js';
import type { PlanTier } from '../../domain/billing/entitlements.js';
import { Badge } from '../primitives/badge.js';
import { Icon } from '../primitives/icon.js';

export interface ClerkUserAvatarButtonProps {
  profile?: CachedUserProfile | null;
  onOpenSignIn?: () => void;
  onOpenUserProfile?: () => void;
  onOpenSubscription?: () => void;
  onOpenAdminPanel?: () => void;
  onSignOut?: () => void;
  className?: string;
}

function getInitials(name?: string, email?: string): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  }
  if (email && email.includes('@')) {
    const userPart = email.split('@')[0];
    return userPart.slice(0, 2).toUpperCase();
  }
  return 'EE';
}

function getTierBadgeLabel(tier?: PlanTier, role?: UserRole): { label: string; variant: 'default' | 'success' | 'warning' | 'info' } {
  if (role === 'admin') {
    return { label: 'ADMIN', variant: 'warning' };
  }
  if (tier === 'mentor') {
    return { label: 'MENTOR', variant: 'info' };
  }
  if (tier === 'pro') {
    return { label: 'PRO', variant: 'success' };
  }
  return { label: 'FREE', variant: 'default' };
}

export function ClerkUserAvatarButton({
  profile,
  onOpenSignIn,
  onOpenUserProfile,
  onOpenSubscription,
  onOpenAdminPanel,
  onSignOut,
  className = '',
}: ClerkUserAvatarButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [imgError, setImgError] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isAuthenticated = Boolean(profile?.userId && profile?.email);
  const initials = getInitials(profile?.displayName, profile?.email);
  const { label: badgeLabel, variant: badgeVariant } = getTierBadgeLabel(profile?.planTier, profile?.role);

  // Fecha o dropdown ao clicar fora ou pressionar Escape
  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  if (!isAuthenticated) {
    return (
      <button
        type="button"
        onClick={() => {
          if (onOpenSignIn) onOpenSignIn();
        }}
        aria-label="Entrar ou criar conta no Extrato de Estudos"
        class={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium cursor-pointer transition-colors bg-surface-subtle hover:bg-surface-elevated text-text border border-border-default focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent ${className}`.trim()}
      >
        <Icon name="user-circle" size={16} class="text-secondary" />
        <span>Entrar</span>
      </button>
    );
  }

  return (
    <div ref={menuRef} class={`relative inline-block ${className}`.trim()}>
      {/* Botão de Disparo do Avatar */}
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={`Menu de conta de ${profile?.displayName || profile?.email || 'estudante'}`}
        class="inline-flex items-center gap-2 p-1 rounded cursor-pointer transition-colors hover:bg-surface-subtle border border-transparent hover:border-border-default focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
      >
        <div class="relative w-8 h-8 rounded-full overflow-hidden bg-surface-subtle border border-border-default flex items-center justify-center shrink-0">
          {profile?.avatarUrl && !imgError ? (
            <img
              src={profile.avatarUrl}
              alt={profile.displayName || profile.email}
              onError={() => setImgError(true)}
              referrerPolicy="no-referrer"
              class="w-full h-full object-cover"
            />
          ) : (
            <span class="text-xs font-semibold text-text select-none">
              {initials}
            </span>
          )}
          {profile?.planTier === 'pro' && (
            <span
              class="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-accent ring-2 ring-surface-card"
              aria-hidden="true"
            />
          )}
        </div>

        <div class="hidden sm:flex flex-col items-start text-left leading-tight">
          <span class="text-xs font-medium text-text max-w-[120px] truncate">
            {profile?.displayName || profile?.email}
          </span>
          <span class="text-[10px] font-semibold tracking-wider text-secondary">
            {badgeLabel}
          </span>
        </div>

        <Icon
          name="chevron-down"
          size={14}
          class={`text-secondary transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Menu Rápido Dropdown */}
      {isOpen && (
        <div
          role="menu"
          aria-label="Opções do usuário"
          class="absolute right-0 mt-1.5 w-64 rounded-default border border-border-default bg-surface-card shadow-lg z-50 p-1 flex flex-col gap-1 text-text"
        >
          {/* Cabeçalho do Perfil */}
          <div class="p-3 border-b border-border-default flex items-center gap-2.5">
            <div class="w-10 h-10 rounded-full overflow-hidden bg-surface-subtle border border-border-default flex items-center justify-center shrink-0">
              {profile?.avatarUrl && !imgError ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.displayName || profile.email}
                  referrerPolicy="no-referrer"
                  class="w-full h-full object-cover"
                />
              ) : (
                <span class="text-sm font-semibold text-text select-none">
                  {initials}
                </span>
              )}
            </div>
            <div class="flex flex-col min-w-0 flex-1">
              <span class="text-xs font-semibold text-text truncate">
                {profile?.displayName || 'Estudante'}
              </span>
              <span class="text-[11px] text-secondary truncate">
                {profile?.email}
              </span>
              <div class="mt-1">
                <Badge variant={badgeVariant}>
                  {badgeLabel === 'ADMIN' ? 'Administrador' : badgeLabel === 'PRO' ? 'Plano Pro Ativo' : 'Plano Free Local'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Itens do Menu */}
          <div class="flex flex-col py-1">
            {onOpenUserProfile && (
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setIsOpen(false);
                  onOpenUserProfile();
                }}
                class="w-full text-left px-3 py-2 text-xs text-text hover:bg-surface-subtle rounded flex items-center gap-2.5 cursor-pointer bg-transparent border-0 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
              >
                <Icon name="photo" size={16} class="text-secondary shrink-0" />
                <span>Gerenciar Perfil e Foto</span>
              </button>
            )}

            {onOpenUserProfile && (
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setIsOpen(false);
                  onOpenUserProfile();
                }}
                class="w-full text-left px-3 py-2 text-xs text-text hover:bg-surface-subtle rounded flex items-center gap-2.5 cursor-pointer bg-transparent border-0 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
              >
                <Icon name="devices" size={16} class="text-secondary shrink-0" />
                <span>Dispositivos e Sessões</span>
              </button>
            )}

            {onOpenSubscription && (
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setIsOpen(false);
                  onOpenSubscription();
                }}
                class="w-full text-left px-3 py-2 text-xs text-text hover:bg-surface-subtle rounded flex items-center gap-2.5 cursor-pointer bg-transparent border-0 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
              >
                <Icon name="bolt" size={16} class="text-accent shrink-0" />
                <span>Minha Assinatura</span>
              </button>
            )}

            {profile?.role === 'admin' && onOpenAdminPanel && (
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setIsOpen(false);
                  onOpenAdminPanel();
                }}
                class="w-full text-left px-3 py-2 text-xs font-semibold text-accent hover:bg-surface-subtle rounded flex items-center gap-2.5 cursor-pointer bg-transparent border-0 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
              >
                <Icon name="shield-check" size={16} class="text-accent shrink-0" />
                <span>Painel Administrativo</span>
              </button>
            )}
          </div>

          {/* Sair da Conta */}
          {onSignOut && (
            <div class="pt-1 border-t border-border-default">
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setIsOpen(false);
                  onSignOut();
                }}
                class="w-full text-left px-3 py-2 text-xs text-secondary hover:text-text hover:bg-surface-subtle rounded flex items-center gap-2.5 cursor-pointer bg-transparent border-0 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
              >
                <Icon name="logout" size={16} class="text-secondary shrink-0" />
                <span>Sair da conta</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
