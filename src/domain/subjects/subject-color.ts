// Subject colors are palette slots (1–8), not hex values, so each theme maps them to its own
// tokens (`--subject-1`…`--subject-8`) and the palette can change without touching saved data.
export const SUBJECT_COLOR_COUNT = 8;

/** Names shown next to the swatch in the editor; color is never the only identifier. */
export const SUBJECT_COLOR_NAMES = [
  'Sálvia',
  'Azul',
  'Índigo',
  'Violeta',
  'Petróleo',
  'Oliva',
  'Ardósia',
  'Ameixa',
] as const;

export const isSubjectColor = (value: unknown): value is number =>
  Number.isInteger(value) && (value as number) >= 1 && (value as number) <= SUBJECT_COLOR_COUNT;

/**
 * Gives every subject without a valid color the least used slot (lowest slot on a tie), in list
 * order. Subjects that already have a valid color keep it. Mutates and returns the list.
 */
export function assignSubjectColors<T extends { color?: unknown }>(subjects: T[] = []) {
  const used = Array.from({ length: SUBJECT_COLOR_COUNT }, () => 0);
  for (const subject of subjects) if (isSubjectColor(subject.color)) used[subject.color - 1]++;
  for (const subject of subjects) {
    if (isSubjectColor(subject.color)) continue;
    const slot = used.indexOf(Math.min(...used));
    (subject as { color?: number }).color = slot + 1;
    used[slot]++;
  }
  return subjects;
}

/** Color slot to render; a subject created since the last load falls back to its list position. */
export function subjectColorOf(subject: { id?: string; color?: unknown }, subjects: Array<{ id?: string }> = []) {
  if (isSubjectColor(subject.color)) return subject.color;
  const index = Math.max(0, subjects.findIndex(item => item.id === subject.id));
  return (index % SUBJECT_COLOR_COUNT) + 1;
}
