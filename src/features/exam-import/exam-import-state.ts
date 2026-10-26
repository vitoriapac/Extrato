type Row = Record<string, any>;
export interface ExamImportState {
  step: number;
  presetId: string | null;
  subjectIds: Set<string>;
  topicIds: Set<string>;
  query: string;
  previousFocus: HTMLElement | null;
}

export function createExamImportState(preset: Row | null | undefined): ExamImportState {
  const state: ExamImportState = {
    step: 1,
    presetId: preset?.id || null,
    subjectIds: new Set<string>(),
    topicIds: new Set<string>(),
    query: '',
    previousFocus: null,
  };
  syncExamImportSelection(state, preset);
  return state;
}
export function syncExamImportSelection(state: ExamImportState, preset: Row | null | undefined) {
  state.subjectIds = new Set((preset?.subjects || []).map((item: any) => item.id));
  state.topicIds = new Set(
    (preset?.subjects || []).flatMap((item: any) =>
      (item.topics || []).map((topic: any) => `${item.id}:${topic.id}`)
    )
  );
  return state;
}
export function resetExamImportState(
  state: ExamImportState,
  preset: Row | null | undefined,
  previousFocus: HTMLElement | null = null
) {
  Object.assign(state, { step: 1, presetId: preset?.id || null, query: '', previousFocus });
  return syncExamImportSelection(state, preset);
}
