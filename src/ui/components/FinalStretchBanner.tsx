import type { FinalStretchBanner as FinalStretchBannerModel } from '../../domain/planning/final-stretch-policy.js';
import { Icon } from '../primitives/icon.js';

export interface FinalStretchBannerProps {
  banner: FinalStretchBannerModel;
  onOpenWhatIf?: () => void;
}

export function FinalStretchBanner({ banner, onOpenWhatIf }: FinalStretchBannerProps) {
  if (!banner.active) return null;

  const isCritical = banner.urgency === 'critical';

  return (
    <aside
      class={`mb-4 p-4 rounded-default border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-content-primary ${
        isCritical ? 'bg-red-bg border-red/60' : 'bg-amber-bg border-amber/60'
      }`}
      role="region"
      aria-label="Aviso de Modo Reta Final"
    >
      <div class="space-y-1">
        <div class="flex items-center gap-2">
          <Icon name="flame" size={16} class="shrink-0" />
          <span class="font-semibold text-sm tracking-wide">{banner.badge}</span>
          <span class="text-xs px-2 py-1 rounded-full font-semibold bg-surface-card/70">
            {banner.daysToExam === 0 ? 'Prova Hoje!' : `Faltam ${banner.daysToExam} dias`}
          </span>
        </div>
        <p class="text-xs leading-relaxed max-w-2xl">{banner.message}</p>
      </div>

      {onOpenWhatIf && (
        <button
          type="button"
          class="shrink-0 inline-flex items-center gap-2 px-3 py-2 min-h-control rounded text-xs font-semibold bg-surface-card text-primary border border-border-default hover:border-primary transition-colors"
          onClick={onOpenWhatIf}
        >
          <Icon name="crystal-ball" size={14} class="shrink-0" />
          <span>Simular "E se?"</span>
        </button>
      )}
    </aside>
  );
}
