import { buildDailyExecutionModel } from '../../application/daily-execution/build-daily-execution-model.js';
export function createDailyExecutionController({
  getContext,
  getNextBestAction,
  onStart,
  onResume,
  getTimer = (): Record<string, any> | null => null,
}: any = {}) {
  const build = (nextBestAction = getNextBestAction()) =>
    buildDailyExecutionModel({ ...getContext(), nextBestAction });
  const start = (id: string) => {
    const item = build().items?.find(row => row.id === id && row.remainingSeconds > 0);
    if (!item) return { state: 'unavailable' };
    const timer = getTimer();
    if (timer?.active) {
      if (timer.planItemId === id) {
        onResume();
        return { state: 'resumed' };
      }
      return { state: 'blocked' };
    }
    onStart(id);
    return { state: 'started' };
  };
  return Object.freeze({ build, start });
}

export function watchDailyExecutionDate({ document, window, getToday, onChange }: any = {}) {
  let date = getToday();
  const check = () => {
    const current = getToday();
    if (current !== date) {
      date = current;
      onChange();
    }
  };
  document.addEventListener('visibilitychange', check);
  window.addEventListener('focus', check);
  const interval = window.setInterval(check, 60_000);
  return () => {
    window.clearInterval(interval);
    document.removeEventListener('visibilitychange', check);
    window.removeEventListener('focus', check);
  };
}
