import { Button } from '../primitives/button.js';
import { Icon } from '../primitives/icon.js';
import type { AchievementNotice } from '../../application/achievements/achievement-notice.js';

export interface AchievementToastProps {
  notice: AchievementNotice;
  onView: () => void;
  onDismiss: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onFocusIn?: () => void;
  onFocusOut?: () => void;
}

/** Aviso de conquista desbloqueada: não bloqueia a tela e é anunciado por leitores de tela. */
export function AchievementToast({
  notice,
  onView,
  onDismiss,
  onMouseEnter,
  onMouseLeave,
  onFocusIn,
  onFocusOut,
}: AchievementToastProps) {
  return (
    <section
      role="region"
      aria-label="Conquistas"
      class="ui-toast-viewport achievement-toast-viewport"
    >
      <div
        id="achievementToast"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        class="ui-toast ui-toast--success achievement-toast"
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onFocusIn={onFocusIn}
        onFocusOut={onFocusOut}
      >
        <span class="achievement-toast__badges" aria-hidden="true">
          {notice.badgeIds.map(id => (
            <img
              key={id}
              src={`assets/achievements/${id}.png`}
              alt=""
              width={40}
              height={40}
              decoding="async"
            />
          ))}
        </span>
        <div class="ui-toast__content">
          <strong class="ui-toast__title">{notice.title}</strong>
          <p class="ui-toast__description">{notice.description}</p>
        </div>
        <div class="ui-toast__actions">
          <Button variant="tertiary" size="small" onClick={onView}>
            Ver conquistas
          </Button>
          <button
            type="button"
            class="ui-toast__dismiss"
            aria-label="Fechar aviso de conquista"
            onClick={onDismiss}
          >
            <Icon name="x" size={14} />
          </button>
        </div>
      </div>
    </section>
  );
}
