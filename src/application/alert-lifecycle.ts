import type { AlertState } from '../core/types.ts';

type Row = Record<string, any>;
const severityOrder: Record<string, number> = { high: 3, medium: 2, low: 1, ok: 0 };
export function reconcileAlerts(alerts: Row[] = [], states: AlertState[] = [], today: string) {
  const activeIds = new Set(alerts.map(item => item.id)),
    stateMap = new Map(states.map(item => [item.alertId, item]));
  alerts.forEach(alert => {
    const current: AlertState = stateMap.get(alert.id) || {
      alertId: alert.id,
      dismissedUntil: null,
      resolvedAt: null,
    };
    current.resolvedAt = null;
    stateMap.set(alert.id, current);
  });
  stateMap.forEach((state, id) => {
    if (!activeIds.has(id) && !state.resolvedAt) state.resolvedAt = today;
  });
  const nextStates = [...stateMap.values()];
  const eligible = alerts
    .filter(alert => {
      const state = stateMap.get(alert.id);
      return !state?.dismissedUntil || state.dismissedUntil < today;
    })
    .sort((a, b) => (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0));
  const seenTopics = new Set<string>(),
    ranked: Row[] = [];
  for (const alert of eligible) {
    if (alert.topicId && seenTopics.has(alert.topicId)) continue;
    if (alert.topicId) seenTopics.add(alert.topicId);
    ranked.push(alert);
  }
  return { visible: ranked.slice(0, 3), additional: ranked.slice(3), states: nextStates };
}

export function dismissAlert(
  states: AlertState[] = [],
  alertId: string,
  today: string,
  addDays: (date: string, days: number) => string,
  days = 7
) {
  const next = states.map(item => ({ ...item }));
  let state = next.find(item => item.alertId === alertId);
  if (!state) {
    state = { alertId, resolvedAt: null, dismissedUntil: null };
    next.push(state);
  }
  state.dismissedUntil = addDays(today, days);
  return next;
}
