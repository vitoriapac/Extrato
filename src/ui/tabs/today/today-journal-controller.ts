import { h } from 'preact';
import { mountPreact } from '../../preact-mount.js';
import type { JournalFormState } from '../../components/TodayStudyAssistantBar.js';
import { TodayJournalSidebarCard } from '../../components/TodayJournalSidebarCard.js';
import { addLocalDays } from '../../../core/date-utils.js';
import {
  buildJournalReviewProposal,
  deleteLearningJournalEntry,
  filterLearningJournalEntries,
  upsertLearningJournalEntry,
} from '../../../domain/journal/learning-journal-engine.js';

export interface TodayJournalDeps {
  doc: any;
  getState: () => any;
  todayISO: () => string;
  nowISO: () => string;
  uid: (prefix?: string) => string;
  scheduleSave: () => void;
  showToast: (msg: string) => void;
  formatDatePt: (date: string) => string;
  addDays?: (iso: string, days: number) => string;
  showConfirm?: (message: string, onConfirm: () => void, onCancel?: () => void, opts?: any) => void;
  createManualReview?: (payload: any) => any;
  persistAndRender?: () => void;
  /** A barra do assistente exibe o diário e precisa redesenhar junto. */
  renderAssistantBar: () => void;
}

const emptyForm = (): JournalFormState => ({
  sessionId: null,
  subjectId: '',
  topicId: '',
  difficultyRating: '',
  energyRating: '',
  tags: [],
  note: '',
  nextStep: '',
});

/** Estado, ações e render do Diário de Aprendizagem na aba Hoje. */
export function createTodayJournalController(deps: TodayJournalDeps) {
  const { doc, getState, todayISO, nowISO, uid, scheduleSave, showToast, formatDatePt } = deps;

  const filters = { subjectId: '', tag: '', query: '' };
  let formOpen = false;
  let form: JournalFormState = emptyForm();

  function render(): void {
    if (!doc || typeof globalThis.document === 'undefined') return;
    const rhythmSlot = doc.getElementById('todayWeeklyRhythmSlot');
    const sideCol =
      (rhythmSlot?.parentNode as HTMLElement | null) ||
      (doc.querySelector('#todaySub-hoje .today-layout-grid__side') as HTMLElement | null);
    if (!sideCol || sideCol.ownerDocument !== globalThis.document) return;

    let mount = doc.getElementById('todayJournalSidebarMount') as Element | null;
    if (!mount) {
      const created = doc.createElement('div') as HTMLElement;
      created.id = 'todayJournalSidebarMount';
      if (rhythmSlot && rhythmSlot.parentNode === sideCol) {
        sideCol.insertBefore(created, rhythmSlot.nextSibling);
      } else {
        sideCol.appendChild(created);
      }
      mount = created;
    }
    if (!mount || mount.ownerDocument !== globalThis.document) return;

    const state = getState();
    const allEntries = state?.learningJournal || [];
    mountPreact(
      h(TodayJournalSidebarCard, {
        subjects: state?.subjects || [],
        entries: filterEntries(allEntries),
        totalEntriesCount: allEntries.length,
        filters: { ...filters },
        form: { ...form },
        formOpen,
        onToggleForm: open => {
          formOpen = open;
          render();
        },
        onChangeFilter: changeFilter,
        onChangeForm: changeForm,
        onSaveEntry: saveEntry,
        onDeleteEntry: deleteEntry,
        onCreateReviewFromEntry: createReviewFromEntry,
      }),
      mount
    );
  }

  function filterEntries(entries: any[]) {
    return filterLearningJournalEntries(entries, {
      subjectId: filters.subjectId || null,
      tag: filters.tag || null,
      query: filters.query || null,
    });
  }

  function refreshAll(): void {
    deps.renderAssistantBar();
    render();
  }

  function changeFilter(patch: Partial<{ subjectId: string; tag: string; query: string }>): void {
    Object.assign(filters, patch);
    refreshAll();
  }

  function changeForm(patch: Partial<JournalFormState>): void {
    Object.assign(form, patch);
    refreshAll();
  }

  function saveEntry(): void {
    const state = getState();
    const subjects = state?.subjects || [];
    if (!form.note.trim() && !form.tags.length && !form.nextStep.trim()) {
      showToast('Escreva uma observação ou selecione uma etiqueta antes de salvar.');
      return;
    }
    const sub = subjects.find((s: any) => s.id === form.subjectId);
    const top = sub?.topics?.find((t: any) => t.id === form.topicId);
    const res = upsertLearningJournalEntry(
      state.learningJournal || [],
      {
        examId: state.examBlueprint?.activeExamTags?.[0] || null,
        sessionId: form.sessionId,
        subjectId: form.subjectId || null,
        subjectNameSnapshot: sub?.name || '',
        topicId: form.topicId || null,
        topicNameSnapshot: top?.name || '',
        localDate: todayISO(),
        difficultyRating: form.difficultyRating || null,
        energyRating: form.energyRating || null,
        tags: form.tags,
        note: form.note,
        nextStep: form.nextStep,
      },
      { nowISO, todayISO, idGenerator: uid }
    );
    state.learningJournal = res.entries;
    form = emptyForm();
    formOpen = false;
    scheduleSave();
    showToast(
      res.updated ? 'Anotação da sessão atualizada no diário.' : 'Anotação salva no Diário.'
    );
    refreshAll();
  }

  function deleteEntry(entryId: string): void {
    const remove = () => {
      const state = getState();
      state.learningJournal = deleteLearningJournalEntry(state.learningJournal || [], entryId);
      scheduleSave();
      showToast('Anotação removida do Diário.');
      refreshAll();
    };
    if (deps.showConfirm) {
      deps.showConfirm('Remover esta anotação do Diário de Aprendizagem?', remove, undefined, {
        confirmLabel: 'Remover anotação',
      });
    } else {
      remove();
    }
  }

  function createReviewFromEntry(entry: any): void {
    const proposal = buildJournalReviewProposal(entry, {
      todayISO,
      addDays: (iso, d) => deps.addDays?.(iso, d) || addLocalDays(iso, d) || iso,
    });
    if (!proposal || !deps.createManualReview) return;
    const create = () => {
      deps.createManualReview?.({
        topicId: proposal.topicId,
        subjectId: proposal.subjectId,
        date: proposal.scheduledDate,
        tipo: proposal.tipo,
      });
      deps.persistAndRender?.();
      showToast(`Revisão agendada para ${formatDatePt(proposal.scheduledDate)}.`);
    };
    if (deps.showConfirm) {
      deps.showConfirm(
        `Criar tarefa de revisão (${proposal.tipo}) para "${proposal.topicName}" em ${formatDatePt(proposal.scheduledDate)}?`,
        create,
        undefined,
        { confirmLabel: 'Confirmar revisão' }
      );
    } else {
      create();
    }
  }

  /** Abre o formulário; com sessionId, pré-preenche com a anotação existente ou com a sessão. */
  function openForm(sessionId?: string): void {
    formOpen = true;
    if (!sessionId) return;
    const state = getState();
    const session = (state.studySessions || []).find((s: any) => s.id === sessionId);
    const existing = (state.learningJournal || []).find((e: any) => e.sessionId === sessionId);
    form = {
      sessionId,
      subjectId: existing?.subjectId || session?.subjectId || '',
      topicId: existing?.topicId || session?.topicId || '',
      difficultyRating: existing?.difficultyRating || '',
      energyRating: existing?.energyRating || '',
      tags: existing?.tags ? [...existing.tags] : [],
      note: existing?.note || '',
      nextStep: existing?.nextStep || '',
    };
  }

  return {
    render,
    filters,
    getForm: () => form,
    filterEntries,
    openForm,
    changeFilter,
    changeForm,
    saveEntry,
    deleteEntry,
    createReviewFromEntry,
  };
}
