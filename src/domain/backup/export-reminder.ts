import { formatLocalDate, parseLocalDate } from '../../core/date-utils.js';
import { localDateFromTimestamp } from '../sessions/study-session.js';

/** After this many days without a downloaded backup the reminder turns to attention. */
export const EXPORT_REMINDER_DAYS = 7;

/** "Último backup exportado há N dias" from lastExportAt (a timestamp) and today (YYYY-MM-DD). */
export function buildExportReminder(lastExportAt: string | null | undefined, today: string) {
  const exportedOn = lastExportAt ? localDateFromTimestamp(lastExportAt) : null;
  const from = parseLocalDate(exportedOn),
    to = parseLocalDate(formatLocalDate(today));
  if (!from || !to)
    return { days: null, stale: true, text: 'Nenhum backup exportado ainda' };
  const days = Math.max(0, Math.round((to.getTime() - from.getTime()) / 86_400_000));
  const when = days === 0 ? 'hoje' : days === 1 ? 'ontem' : `há ${days} dias`;
  return { days, stale: days > EXPORT_REMINDER_DAYS, text: `Último backup exportado ${when}` };
}
