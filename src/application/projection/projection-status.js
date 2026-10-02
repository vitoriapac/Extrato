export const ACHIEVEMENT_PROJECTION_VERSION = 2;

export const PROJECTION_STATUS = Object.freeze({
  insufficient: 'insufficient_data',
  onTrack: 'on_track',
  attention: 'attention',
  atRisk: 'at_risk'
});

export function daysBetweenCalendarDates(today, examDate) {
  const parse = value => {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const [year, month, day] = value.split('-').map(Number);
    const timestamp = Date.UTC(year, month - 1, day);
    const date = new Date(timestamp);
    return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day ? timestamp : null;
  };
  const start = parse(today), end = parse(examDate);
  return start == null || end == null ? null : Math.round((end - start) / 86400000);
}
