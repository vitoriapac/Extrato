import { h, render } from 'preact';
import { AchievementToast } from '../components/AchievementToast.js';
import type { AchievementNotice } from '../../application/achievements/achievement-notice.js';

export interface AchievementNotifierOptions {
  document: Document;
  /** Abre o painel de conquistas. */
  onView: () => void;
  durationMs?: number;
}

/** Aviso de conquista num ponto de montagem próprio, para não competir com o aviso "Salvo" e o de desfazer. */
export function createAchievementNotifier({
  document,
  onView,
  durationMs = 8000,
}: AchievementNotifierOptions) {
  const mount = document.getElementById('achievementToastMount');
  let timer: ReturnType<typeof setTimeout> | null = null;
  let open = false;

  const clear = () => {
    if (timer) clearTimeout(timer);
    timer = null;
  };
  const hide = () => {
    clear();
    if (!open) return;
    open = false;
    document.removeEventListener('keydown', onKey);
    if (mount) render(null, mount);
  };
  const arm = (ms: number) => {
    clear();
    timer = setTimeout(hide, ms);
  };
  function onKey(event: KeyboardEvent) {
    if (event.key === 'Escape' && !event.defaultPrevented) hide();
  }

  function notify(notice: AchievementNotice | null) {
    if (!mount || !notice) return;
    open = true;
    document.removeEventListener('keydown', onKey);
    document.addEventListener('keydown', onKey);
    render(
      h(AchievementToast, {
        notice,
        onView: () => {
          hide();
          onView();
        },
        onDismiss: hide,
        onMouseEnter: clear,
        onMouseLeave: () => arm(4000),
        onFocusIn: clear,
        onFocusOut: () => arm(4000),
      }),
      mount
    );
    arm(durationMs);
  }

  return { notify, hide, isOpen: () => open };
}
