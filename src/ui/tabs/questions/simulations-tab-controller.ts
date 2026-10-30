import { h } from 'preact';
import { createEditableCollectionController } from '../../controllers/editable-collection-controller.js';
import { createQuestionsController } from './questions-controller.js';
import { calcAcertoPct, cloneRecord } from './questions-tab-controller.js';
import { buildSimulatedRemediationDiagnostic } from '../../../domain/diagnostics/simulated-remediation.js';
import { SimulatedRemediationModal } from '../../components/SimulatedRemediationModal.js';
import { mountPreact, unmountPreact } from '../../preact-mount.js';
import { createErrorFlashcard } from '../../../domain/notebook/error-notebook-engine.js';

export interface SimulationsTabControllerContext {
  document: Document;
  window?: Window;
  state: any;
  listViewState: {
    questionsVisible: number;
    simulationsVisible: number;
    [key: string]: any;
  };
  LIST_VIEW_STEPS: {
    questions: number;
    simulations: number;
    [key: string]: any;
  };
  simulationService: any;
  questionEditController?: any;
  openQuestionErrorIds?: Set<string>;
  errorCategories?: Record<string, { icon: string; label: string }>;
  persistAndRender: () => void;
  showToast: (msg: string) => void;
  showConfirm: (msg: string, onConfirm: () => void) => void;
  formatDatePt: (dateStr: string) => string;
  activeSubjects: () => any[];
  subjectsForSelection?: (selectedId?: string | null) => any[];
  topicsForSelection?: (subjectId?: string | null, selectedTopicId?: string | null) => any[];
  renderListViewFooter?: (
    total: number,
    visible: number,
    step: number,
    moreAction: string,
    lessAction: string,
    colSpan: number,
    label: string
  ) => string;
  isMobileLayout?: () => boolean;
  uid?: (prefix: string) => string;
  todayISO?: () => string;
  escapeHtml?: (s: string) => string;
  escapeAttr?: (s: string) => string;
}

export function createSimulationsTabController(ctx: SimulationsTabControllerContext) {
  const openBreakdownIds = new Set<string>();

  const uid =
    ctx.uid ||
    ((prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`);
  const todayISO = ctx.todayISO || (() => new Date().toISOString().slice(0, 10));
  const escapeHtml =
    ctx.escapeHtml ||
    ((str: string) =>
      String(str || '').replace(
        /[&<>"']/g,
        c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] || c
      ));
  const escapeAttr =
    ctx.escapeAttr ||
    ((str: string) =>
      String(str || '').replace(
        /[&<>"']/g,
        c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] || c
      ));

  function simuladoEffectiveCounts(sim: Record<string, any>) {
    if (sim.breakdown && sim.breakdown.length > 0) {
      const correct = sim.breakdown.reduce((s: number, b: any) => s + (Number(b.correct) || 0), 0);
      const total = sim.breakdown.reduce((s: number, b: any) => s + (Number(b.total) || 0), 0);
      return { correct, total };
    }
    return { correct: Number(sim.correct) || 0, total: Number(sim.total) || 0 };
  }

  function simuladoNota(sim: Record<string, any>) {
    const { correct, total } = simuladoEffectiveCounts(sim);
    return calcAcertoPct(correct, total);
  }

  function simulationViewModel(sim: Record<string, any>) {
    const counts = simuladoEffectiveCounts(sim);
    return {
      date: sim.date ? ctx.formatDatePt(sim.date) : 'Sem data',
      name: sim.nome || 'Simulado sem nome',
      correct: counts.correct,
      total: counts.total,
      score: simuladoNota(sim),
    };
  }

  const simulationEditController = createEditableCollectionController({
    service: ctx.simulationService,
    clone: cloneRecord,
    render: renderSimulados,
    normalize: (draft: Record<string, any>) => {
      draft.total = Math.max(0, Math.floor(Number(draft.total) || 0));
      draft.correct = Math.max(0, Math.min(Math.floor(Number(draft.correct) || 0), draft.total));
      return draft;
    },
    onSaved: () => {
      ctx.persistAndRender();
      ctx.showToast('Simulado atualizado.');
    },
  });

  function toggleBreakdown(simuladoId: string): void {
    if (openBreakdownIds.has(simuladoId)) {
      openBreakdownIds.delete(simuladoId);
    } else {
      openBreakdownIds.add(simuladoId);
    }
    renderSimulados();
  }

  function addBreakdownRow(simuladoId: string): void {
    const sim = (ctx.state.simulados || []).find((s: any) => s.id === simuladoId);
    if (!sim) return;
    if (!sim.breakdown) sim.breakdown = [];
    sim.breakdown.push({
      id: uid('breakdown'),
      subjectId: ctx.activeSubjects()[0]?.id || null,
      correct: 0,
      total: 0,
    });
    ctx.persistAndRender();
  }

  function updateBreakdownRow(
    simuladoId: string,
    breakdownId: string,
    field: string,
    value: any
  ): void {
    const sim = (ctx.state.simulados || []).find((s: any) => s.id === simuladoId);
    if (!sim) return;
    const b = (sim.breakdown || []).find((x: any) => x.id === breakdownId);
    if (!b) return;
    b[field] = field === 'correct' || field === 'total' ? Number(value) || 0 : value;
    b.total = Math.max(0, Number(b.total) || 0);
    if ((Number(b.correct) || 0) > b.total) {
      ctx.showToast('Os acertos foram limitados ao total de questões.');
    }
    b.correct = Math.max(0, Math.min(Number(b.correct) || 0, b.total));
    ctx.persistAndRender();
  }

  function deleteBreakdownRow(simuladoId: string, breakdownId: string): void {
    const sim = (ctx.state.simulados || []).find((s: any) => s.id === simuladoId);
    if (!sim) return;
    sim.breakdown = (sim.breakdown || []).filter((x: any) => x.id !== breakdownId);
    ctx.persistAndRender();
  }

  function editSimulation(id: string): void {
    simulationEditController.begin(id);
  }

  function cancelSimulationEdit(): void {
    simulationEditController.cancel();
  }

  function updateSimulationDraft(field: string, value: any): void {
    simulationEditController.update(
      field,
      field === 'correct' || field === 'total' ? Math.max(0, Math.floor(Number(value) || 0)) : value
    );
  }

  function saveSimulationEdit(): void {
    if (!simulationEditController.save()) cancelSimulationEdit();
  }

  function renderSimulados(): void {
    const body = ctx.document.getElementById('simuladosBody');
    if (!body) return;

    const controller = createQuestionsController({
      state: ctx.state,
      listViewState: ctx.listViewState,
      questionEditController: ctx.questionEditController || {
        state: { editingId: null, draft: null },
      },
      simulationEditController,
      openQuestionErrorIds: ctx.openQuestionErrorIds || new Set(),
      openBreakdownIds,
      errorCategories: ctx.errorCategories || {},
      isMobileLayout: ctx.isMobileLayout,
      questionViewModel: () => ({}) as any,
      questionCategorizedErrors: () => 0,
      simulationViewModel,
      renderListViewFooter: ctx.renderListViewFooter,
      LIST_VIEW_STEPS: ctx.LIST_VIEW_STEPS,
      getSubjectOptionsHtml: subjectId =>
        (ctx.subjectsForSelection ? ctx.subjectsForSelection(subjectId) : [])
          .map(
            (s: any) =>
              `<option value="${escapeAttr(s.id)}" ${s.id === subjectId ? 'selected' : ''}>${escapeHtml(s.name)}</option>`
          )
          .join(''),
      getTopicOptionsHtml: (subjectId, topicId) =>
        (ctx.topicsForSelection ? ctx.topicsForSelection(subjectId, topicId) : [])
          .map(
            (t: any) =>
              `<option value="${escapeAttr(t.id)}" ${t.id === topicId ? 'selected' : ''}>${escapeHtml(t.name)}</option>`
          )
          .join(''),
    });

    body.innerHTML = controller.renderSimulationsHtml();
  }

  function addSimuladoRow() {
    ctx.listViewState.simulationsVisible = ctx.LIST_VIEW_STEPS.simulations;
    const sim = ctx.simulationService.create({
      date: todayISO(),
      nome: '',
      correct: 0,
      total: 0,
      breakdown: [],
    });
    simulationEditController.begin(sim.id, { isNew: true });
    return sim;
  }

  function deleteSimuladoRow(id: string): void {
    ctx.showConfirm('Excluir este simulado?', () => {
      ctx.simulationService.remove(id);
      openBreakdownIds.delete(id);
      simulationEditController.reset();
      ctx.persistAndRender();
      ctx.showToast('Simulado excluído.');
    });
  }

  function bindEvents(): void {
    ctx.document
      .getElementById('addSimuladoRowBtn')
      ?.addEventListener('click', () => addSimuladoRow());
  }

  return {
    bindEvents,
    openBreakdownIds,
    simulationEditController,
    simuladoEffectiveCounts,
    simuladoNota,
    simulationViewModel,
    toggleBreakdown,
    addBreakdownRow,
    updateBreakdownRow,
    deleteBreakdownRow,
    editSimulation,
    cancelSimulationEdit,
    updateSimulationDraft,
    saveSimulationEdit,
    renderSimulados,
    addSimuladoRow,
    deleteSimuladoRow,
    openSimulatedRemediation,
  };

  function openSimulatedRemediation(simId: string): void {
    const sim = (ctx.state.simulados || []).find((s: any) => s.id === simId);
    if (!sim) return;

    const subjectsMap = new Map((ctx.activeSubjects() || []).map((s: any) => [s.id, s]));
    const diagnostic = buildSimulatedRemediationDiagnostic({
      simulation: sim,
      historicalSimulations: ctx.state.simulados || [],
      passingScorePercent: ctx.state.metas?.acertoAlvo ?? 75,
      weeklyAvailableHours: 20,
      subjectsMap,
    });

    let mount = ctx.document.getElementById('simulatedRemediationMount');
    if (!mount) {
      mount = ctx.document.createElement('div');
      mount.id = 'simulatedRemediationMount';
      ctx.document.body.appendChild(mount);
    }

    const close = () => {
      if (mount) unmountPreact(mount);
    };

    mountPreact(
      h(SimulatedRemediationModal, {
        open: true,
        onClose: close,
        diagnostic,
        onApplyRemediationPlan: plan => {
          ctx.showToast(
            `Plano de remediação de 7 dias criado (${plan.bleedAllocationHours}h focadas nas vulnerabilidades).`
          );
          ctx.persistAndRender();
        },
        onGenerateErrorCards: drafts => {
          if (!Array.isArray(ctx.state.errorFlashcards)) {
            ctx.state.errorFlashcards = [];
          }
          let added = 0;
          for (const draft of drafts) {
            const card = createErrorFlashcard({
              topicId: draft.topicId,
              subjectId: draft.subjectId,
              statementSummary: draft.statementSummary,
              bancaTrap: draft.bancaTrap,
              correctConcept: draft.correctConcept,
              errorCategory: draft.errorCategory,
              todayDate: todayISO(),
            });
            ctx.state.errorFlashcards.push(card);
            added++;
          }
          ctx.persistAndRender();
          ctx.showToast(`${added} rascunhos criados no Caderno de Erros.`);
        },
      }),
      mount
    );
  }
}
