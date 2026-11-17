import { addLocalDays } from '../../core/date-utils.js';
import type { UnifiedCalendarItem } from './calendar-projection.js';

function escapeIcsText(value: string): string {
  return String(value || '')
    .replace(/\\/g, '\\\\')
    .replace(/\r?\n/g, '\\n')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,');
}

function compactDate(iso: string): string {
  return iso.replace(/-/g, '');
}

function compactTime(hhmm: string): string {
  return `${hhmm.replace(':', '')}00`;
}

export function buildCalendarIcs(
  items: UnifiedCalendarItem[],
  { prodId = '-//Extrato de Estudos//Agenda//PT-BR' }: { prodId?: string } = {}
): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:${prodId}`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  const exportable = items.filter(
    item =>
      item.date &&
      /^\d{4}-\d{2}-\d{2}$/.test(item.date) &&
      item.status !== 'Cancelado' &&
      !item.isRecurringInstance
  );

  for (const item of exportable) {
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${escapeIcsText(item.key || item.id)}@extratoestudos.com.br`);
    if (item.startTime && /^\d{2}:\d{2}$/.test(item.startTime)) {
      const start = `${compactDate(item.date)}T${compactTime(item.startTime)}`;
      const endHhmm =
        item.endTime && /^\d{2}:\d{2}$/.test(item.endTime) ? item.endTime : item.startTime;
      const end = `${compactDate(item.date)}T${compactTime(endHhmm)}`;
      lines.push(`DTSTART:${start}`);
      lines.push(`DTEND:${end}`);
    } else {
      const nextDay = addLocalDays(item.date, 1) || item.date;
      lines.push(`DTSTART;VALUE=DATE:${compactDate(item.date)}`);
      lines.push(`DTEND;VALUE=DATE:${compactDate(nextDay)}`);
    }
    lines.push(`SUMMARY:${escapeIcsText(item.title || item.label || 'Atividade')}`);
    const descParts = [item.subject, item.description, item.externalUrl].filter(Boolean);
    if (descParts.length) {
      lines.push(`DESCRIPTION:${escapeIcsText(descParts.join(' — '))}`);
    }
    if (item.location) {
      lines.push(`LOCATION:${escapeIcsText(item.location)}`);
    }
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}
