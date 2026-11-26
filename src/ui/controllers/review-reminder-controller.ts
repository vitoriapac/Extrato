import { buildReminderDigest } from '../../domain/reviews/review-reminder.js';
import { renderIconSvg } from '../primitives/icon.js';
import type { AppState } from '../../core/types.js';

const KEY = 'studytrack.reviewReminder';
// Must match service-worker.template.js.
const TAG = 'extrato-review-reminder';
const CACHE = 'extrato-reminder';
const TWELVE_HOURS = 12 * 60 * 60 * 1000;

interface PeriodicSync {
  register: (tag: string, options: { minInterval: number }) => Promise<void>;
  unregister: (tag: string) => Promise<void>;
}
type ReminderRegistration = ServiceWorkerRegistration & { periodicSync?: PeriodicSync };

/**
 * Daily review reminder, local only: Periodic Background Sync wakes the service worker, which reads
 * a digest of due dates kept in Cache Storage. Off by default; Chrome/Edge with the app installed.
 */
export function createReviewReminderController({
  document,
  window,
  storage,
  getState,
  showToast,
}: {
  document: Document;
  window: Window;
  storage: Pick<Storage, 'getItem' | 'setItem'> | null;
  getState: () => AppState;
  showToast: (message: string) => void;
}) {
  const nav = window.navigator;
  const supported = () =>
    'Notification' in window && 'serviceWorker' in nav && 'PeriodicSyncManager' in window;
  const isOn = () => {
    try {
      return storage?.getItem(KEY) === 'on';
    } catch {
      return false;
    }
  };
  const save = (on: boolean) => {
    try {
      storage?.setItem(KEY, on ? 'on' : 'off');
    } catch {
      // Modo privado: vale só nesta sessão.
    }
  };

  function sync() {
    const button = document.getElementById('reviewReminderToggleBtn');
    if (!button) return;
    const on = isOn();
    const state = !supported() ? 'Indisponível' : on ? 'Ligado' : 'Desligado';
    button.innerHTML = `${renderIconSvg('clock', { size: 16 })}<span class="theme-toggle-label">Lembrete</span><span class="pref-state">${state}</span>`;
    button.setAttribute('aria-pressed', String(on));
    button.setAttribute(
      'title',
      supported()
        ? 'Uma notificação por dia quando houver revisão vencida'
        : 'Precisa do app instalado no Chrome ou no Edge'
    );
  }

  async function writeDigest() {
    if (!isOn() || !supported()) return;
    try {
      const registration = await nav.serviceWorker.ready;
      const state = getState();
      const digest = buildReminderDigest({
        reviews: state.reviewAgenda || [],
        flashcards: state.errorFlashcards || [],
      });
      const cache = await window.caches.open(CACHE);
      await cache.put(
        new URL('__reminder-digest', registration.scope).href,
        new Response(JSON.stringify(digest), { headers: { 'content-type': 'application/json' } })
      );
    } catch {
      // Sem cache disponível o lembrete apenas não dispara; nada a perder.
    }
  }

  async function enable() {
    if (!supported()) {
      showToast('O lembrete precisa do app instalado no Chrome ou no Edge.');
      return;
    }
    if ((await Notification.requestPermission()) !== 'granted') {
      showToast('Sem permissão de notificação, o lembrete continua desligado.');
      return;
    }
    try {
      const registration = (await nav.serviceWorker.ready) as ReminderRegistration;
      await registration.periodicSync!.register(TAG, { minInterval: TWELVE_HOURS });
    } catch {
      showToast('Instale o app pelo Chrome ou pelo Edge para receber o lembrete diário.');
      return;
    }
    save(true);
    sync();
    await writeDigest();
    showToast('Lembrete ligado: no máximo uma notificação por dia, quando houver revisão vencida.');
  }

  async function disable() {
    save(false);
    sync();
    try {
      const registration = (await nav.serviceWorker.ready) as ReminderRegistration;
      await registration.periodicSync?.unregister(TAG);
    } catch {
      // Já estava sem registro.
    }
    showToast('Lembrete desligado.');
  }

  function init() {
    sync();
    document
      .getElementById('reviewReminderToggleBtn')
      ?.addEventListener('click', () => void (isOn() ? disable() : enable()));
    // The digest is refreshed whenever the student leaves the app, so the reminder sees the latest dates.
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') void writeDigest();
    });
    void writeDigest();
  }

  return { init, sync, writeDigest, isOn };
}
