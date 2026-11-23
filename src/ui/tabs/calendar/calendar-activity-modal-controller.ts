import { h } from 'preact';
import { mountPreact } from '../../preact-mount.js';
import {
  computeDraftOverloadPreview,
  type UnifiedCalendarItem,
} from '../../../domain/calendar/calendar-projection.js';
import { CalendarActivityModal, type CalendarActivityDraft } from './CalendarActivityModal.js';
import type { CalendarTabControllerContext } from './calendar-tab-controller.js';

export interface CalendarActivityModalDeps {
  ctx: CalendarTabControllerContext;
  getDoc: () => any;
  calendarUiState: unknown;
  calendarController: { create: (payload: any) => unknown } | null;
  canMountPreact: (el: Element | null | undefined) => el is Element;
  activeSubjects: () => any[];
  getUnifiedCalendarItems: () => UnifiedCalendarItem[];
  deleteCalRow: (id: string) => void;
  todayISO: () => string;
  showToast: (msg: string) => void;
  persistAndRender: () => void;
}

/** Modal de criar/editar atividade da Agenda: rascunho, validação do payload e gravação. */
export function createCalendarActivityModalController(deps: CalendarActivityModalDeps) {
  const {
    ctx,
    getDoc,
    calendarUiState,
    calendarController,
    canMountPreact,
    activeSubjects,
    getUnifiedCalendarItems,
    deleteCalRow,
    todayISO,
    showToast,
    persistAndRender,
  } = deps;

  function renderActivityModal() {
    const doc = getDoc();
    const mount = doc?.getElementById('calendarActivityModalMount');
    if (!canMountPreact(mount)) return;
    const ui = calendarUiState as any;
    mountPreact(
      h(CalendarActivityModal, {
        open: Boolean(ui.modalOpen),
        isNew: Boolean(ui.isNew),
        initialDraft: ui.modalDraft || null,
        subjects: activeSubjects(),
        getDayLoadPreview: (draft: CalendarActivityDraft) =>
          computeDraftOverloadPreview(getUnifiedCalendarItems(), draft, ctx.state.metas),
        onSave: saveActivityModal,
        onDelete: (id: string) => {
          ui.modalOpen = false;
          ui.modalDraft = null;
          renderActivityModal();
          deleteCalRow(id);
        },
        onClose: () => {
          ui.modalOpen = false;
          ui.modalDraft = null;
          renderActivityModal();
        },
      }),
      mount
    );
  }

  function openActivityModalForDate(date?: string) {
    const ui = calendarUiState as any;
    const targetDate = date || ui.selectedDate || todayISO();
    ui.isNew = true;
    ui.modalDraft = {
      id: null,
      title: '',
      kind: 'task',
      date: targetDate,
      status: 'Não iniciado',
      startTime: '',
      endTime: '',
      estimatedMinutes: '',
      recurrence: 'none',
      subjectId: '',
      location: '',
      externalUrl: '',
      description: '',
      essayTheme: '',
      essayScore: '',
      essayMaxScore: '',
      essayStatus: 'draft',
      essayContent: '',
      essayStructure: '',
      essayLanguage: '',
    } satisfies CalendarActivityDraft;
    ui.modalOpen = true;
    renderActivityModal();
  }

  function openActivityModalForEdit(id: string) {
    const item = (ctx.state.calendar || []).find(c => c.id === id);
    if (!item) return;
    const ui = calendarUiState as any;
    ui.isNew = false;
    ui.modalDraft = {
      id: item.id,
      title:
        item.title || (item.reviewType && item.reviewType !== '—' ? item.reviewType : '') || '',
      kind: item.kind || (item.reviewType && item.reviewType !== '—' ? 'manual_review' : 'task'),
      date: item.date || todayISO(),
      status: item.status || 'Não iniciado',
      startTime: item.startTime || '',
      endTime: item.endTime || '',
      estimatedMinutes: item.estimatedMinutes ? String(item.estimatedMinutes) : '',
      recurrence: item.recurrence || 'none',
      subjectId: item.subjectId || '',
      location: item.location || '',
      externalUrl: item.externalUrl || '',
      description: item.description || '',
      essayTheme: item.essayTheme || '',
      essayScore: item.essayScore != null ? String(item.essayScore) : '',
      essayMaxScore: item.essayMaxScore != null ? String(item.essayMaxScore) : '',
      essayStatus: item.essayStatus || 'draft',
      essayContent: item.essayContent != null ? String(item.essayContent) : '',
      essayStructure: item.essayStructure != null ? String(item.essayStructure) : '',
      essayLanguage: item.essayLanguage != null ? String(item.essayLanguage) : '',
    } satisfies CalendarActivityDraft;
    ui.modalOpen = true;
    renderActivityModal();
  }

  /** Critério da discursiva: vazio grava null; valores fora de 0–100 são limitados. */
  function criterionPercent(value: string) {
    const n = value.trim() === '' ? NaN : Number(value.replace(',', '.'));
    return Number.isFinite(n) ? Math.min(100, Math.max(0, n)) : null;
  }

  function saveActivityModal(draft: CalendarActivityDraft) {
    const ui = calendarUiState as any;
    const mins = Number(draft.estimatedMinutes);
    const essayScoreNum = draft.essayScore !== '' ? Number(draft.essayScore) : NaN;
    const essayMaxScoreNum = draft.essayMaxScore !== '' ? Number(draft.essayMaxScore) : NaN;
    const payload: Record<string, any> = {
      title: draft.title.trim(),
      kind: draft.kind,
      date: draft.date,
      status: draft.status || 'Não iniciado',
      startTime: draft.startTime || null,
      endTime: draft.endTime || null,
      estimatedMinutes: Number.isFinite(mins) && mins > 0 ? Math.round(mins) : null,
      recurrence: draft.recurrence || 'none',
      subjectId: draft.subjectId || null,
      location: draft.location.trim() || null,
      externalUrl: draft.externalUrl.trim() || null,
      description: draft.description.trim() || null,
      reviewType: draft.kind === 'manual_review' ? draft.title.trim() || 'Revisão livre' : '—',
      ...(draft.kind === 'essay'
        ? {
            essayTheme: draft.essayTheme.trim() || null,
            essayScore: Number.isFinite(essayScoreNum) && essayScoreNum >= 0 ? essayScoreNum : null,
            essayMaxScore:
              Number.isFinite(essayMaxScoreNum) && essayMaxScoreNum > 0 ? essayMaxScoreNum : null,
            essayStatus: draft.essayStatus || 'draft',
            essayContent: criterionPercent(draft.essayContent),
            essayStructure: criterionPercent(draft.essayStructure),
            essayLanguage: criterionPercent(draft.essayLanguage),
          }
        : {}),
    };

    if (ui.isNew || !draft.id) {
      if (ctx.calendarService) {
        ctx.calendarService.create(payload);
      } else if (calendarController) {
        calendarController.create(payload);
      }
      showToast('Atividade adicionada à Agenda.');
    } else {
      if (ctx.calendarService) {
        ctx.calendarService.update(draft.id, payload);
      } else {
        const existing = (ctx.state.calendar || []).find(c => c.id === draft.id);
        if (existing) Object.assign(existing, payload);
      }
      showToast('Atividade atualizada.');
    }

    ui.modalOpen = false;
    ui.modalDraft = null;
    ui.selectedDate = draft.date;
    renderActivityModal();
    persistAndRender();
  }

  return {
    renderActivityModal,
    openActivityModalForDate,
    openActivityModalForEdit,
    saveActivityModal,
  };
}
