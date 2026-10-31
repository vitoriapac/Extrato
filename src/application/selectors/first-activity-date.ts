// Where the student's own record begins: the earliest dated session, question set, simulation
// or daily plan. Weeks before it were never lived in the app, so they are neither met nor missed.
export function firstActivityDate(state: Record<string, any> | null | undefined): string | null {
  const dates = ['studySessions', 'questoes', 'simulados', 'dailyPlans']
    .flatMap(key => (Array.isArray(state?.[key]) ? state[key] : []))
    .map((item: any) => String(item?.date ?? '').slice(0, 10))
    .filter(date => /^\d{4}-\d{2}-\d{2}$/.test(date))
    .sort();
  return dates[0] ?? null;
}
