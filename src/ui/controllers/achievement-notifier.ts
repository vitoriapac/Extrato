import { h } from 'preact';
import { mountPreact, unmountPreact } from '../preact-mount.js';
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
    if (mount) unmountPreact(mount);
  };
  const arm = (ms: number) => {
    clear();
    timer = setTimeout(hide, ms);
  };
  // Esc só vale com o foco dentro do aviso: o resto da página usa Esc para modais e modo foco.
  function onKey(event: KeyboardEvent) {
    const toast = document.getElementById('achievementToast');
    if (event.key === 'Escape' && toast?.contains(event.target as Node)) hide();
  }

  function notify(notice: AchievementNotice | null) {
    if (!mount || !notice) return;
    open = true;
    document.removeEventListener('keydown', onKey);
    document.addEventListener('keydown', onKey);
    mountPreact(
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
