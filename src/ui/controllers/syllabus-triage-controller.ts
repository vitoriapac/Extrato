import { h } from 'preact';
import { mountPreact, unmountPreact } from '../preact-mount.js';
import { SyllabusTriageModal } from '../components/SyllabusTriageModal.js';
import { runUndoable } from '../undoable.js';
import type { AppState } from '../../core/types.js';
import type { buildSyllabusTriage } from '../../domain/planning/syllabus-triage.js';

export interface SyllabusTriageControllerContext {
  document: Document;
  getState: () => AppState;
  getTriage: () => ReturnType<typeof buildSyllabusTriage> & {
    reviewBudgetPct: number;
    planMaintenanceMinutes: number;
  };
  nowISO: () => string;
  formatMinutes: (minutes: number) => string;
}

export function createSyllabusTriageController(context: SyllabusTriageControllerContext) {
  const { document, getState } = context;
  let isOpen = false;

  const mount = () => {
    let node = document.getElementById('syllabusTriageModalMount');
    if (!node) {
      node = document.createElement('div');
      node.id = 'syllabusTriageModalMount';
      document.body?.appendChild?.(node);
    }
    return node;
  };

  const outOfStrategy = () =>
    (getState().subjects || []).flatMap(subject =>
      (subject.topics || [])
        .filter(topic => topic.outOfStrategy && !topic.archived)
        .map(topic => ({ topicId: topic.id, topicName: topic.name, subjectName: subject.name }))
    );

  const setFlag = (ids: string[], value: boolean) => {
    const wanted = new Set(ids);
    for (const subject of getState().subjects || [])
      for (const topic of subject.topics || [])
        if (wanted.has(topic.id)) {
          topic.outOfStrategy = value;
          topic.outOfStrategyAt = value ? context.nowISO() : null;
        }
  };

  function render() {
    const container = mount();
    if (!isOpen) {
      unmountPreact(container);
      return;
    }
    mountPreact(
      h(SyllabusTriageModal, {
        open: true,
        onClose: close,
        triage: context.getTriage(),
        outOfStrategy: outOfStrategy(),
        formatMinutes: context.formatMinutes,
        onApply: (ids: string[]) => {
          close();
          runUndoable(
            ids.length === 1
              ? '1 tópico saiu da estratégia.'
              : `${ids.length} tópicos saíram da estratégia.`,
            () => setFlag(ids, true),
            'Triagem desfeita. Os tópicos voltaram ao planejamento.'
          );
        },
        onRestore: (ids: string[]) => {
          close();
          runUndoable(
            'Os tópicos voltaram ao planejamento.',
            () => setFlag(ids, false),
            'Os tópicos saíram da estratégia de novo.'
          );
        },
      }),
      container
    );
  }

  function open() {
    isOpen = true;
    render();
  }

  function close() {
    isOpen = false;
    render();
  }

  return { open, close, isOpen: () => isOpen };
}
