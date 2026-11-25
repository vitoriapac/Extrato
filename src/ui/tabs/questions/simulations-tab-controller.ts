import { h } from 'preact';
import { createEditableCollectionController } from '../../controllers/editable-collection-controller.js';
import { createQuestionsController } from './questions-controller.js';
import { cloneRecord } from './questions-tab-controller.js';
import { buildSimulatedRemediationDiagnostic } from '../../../domain/diagnostics/simulated-remediation.js';
import { addDays } from '../../../application/selectors/app-selectors.js';
import { SimulatedRemediationModal } from '../../components/SimulatedRemediationModal.js';
import { mountPreact, unmountPreact } from '../../preact-mount.js';
import { createErrorFlashcard } from '../../../domain/notebook/error-notebook-engine.js';
import { runUndoable } from '../../undoable.js';
import { DEFAULT_PAGE_SIZE } from '../../progressive-list.js';
import { buildSimulationTrendVisual } from '../../../domain/practice/practice-visual-models.js';
import { renderSimulationTrendChart } from '../../primitives/charts/charts.js';
import {
  weightedSimulationScore,
  simulationTotals,
  subjectsBelowMinimum,
  blocksBelowMinimum,
  wrongCount,
  paceAndGuess,
  examMinutesPerQuestion,
} from '../../../domain/exams/simulation-score.js';

export interface SimulationsTabControllerContext {
  document: Document;
  window?: Window;
  state: any;
  listViewState: {
    questionsPage: number;
    simulationsPage: number;
    [key: string]: any;
  };
  simulationService: any;
  calendarService?: any;
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
    return weightedSimulationScore(sim, ctx.state?.examBlueprint?.subjects);
  }

  function simulationViewModel(sim: Record<string, any>) {
    const totals = simulationTotals(sim);
    const names = new Map<string, string>(
      (ctx.activeSubjects() || []).map((s: { id: string; name: string }) => [s.id, s.name])
    );
    const subjectMisses = subjectsBelowMinimum(sim, ctx.state?.examBlueprint?.subjects).map(item => ({
      ...item,
      name: names.get(item.subjectId) || 'Disciplina removida',
    }));
    const blockMisses = blocksBelowMinimum(
      sim,
      ctx.state?.examBlueprint?.blocks,
      ctx.state?.examBlueprint?.subjects
    ).map(item => ({
      subjectId: `block:${item.blockId}`,
      name: `Bloco ${item.blockName}`,
      score: item.score,
      minimum: item.minimum,
    }));
    return {
      date: sim.date ? ctx.formatDatePt(sim.date) : 'Sem data',
      name: sim.nome || 'Simulado sem nome',
      correct: totals.correct,
      total: totals.total,
      score: simuladoNota(sim),
      scoring: sim.scoring === 'certo-errado' ? ('certo-errado' as const) : undefined,
      blank: totals.total - totals.correct - totals.wrong,
      pace: paceAndGuess(sim, examMinutesPerQuestion(ctx.state?.examBlueprint)),
      belowMinimum: [...subjectMisses, ...blockMisses],
    };
  }

  const simulationEditController = createEditableCollectionController({
    service: ctx.simulationService,
    clone: cloneRecord,
    render: renderSimulados,
    normalize: (draft: Record<string, any>) => {
      draft.total = Math.max(0, Math.floor(Number(draft.total) || 0));
      draft.correct = Math.max(0, Math.min(Math.floor(Number(draft.correct) || 0), draft.total));
      // Valores explícitos (não delete): a gravação mescla o rascunho com o registro atual.
      draft.scoring = draft.scoring === 'certo-errado' ? 'certo-errado' : undefined;
      // Erradas vazias: nenhuma em branco. Com valor, limitadas ao que sobra depois dos acertos.
      draft.wrong = draft.wrong == null || draft.wrong === '' ? null : wrongCount(draft);
      // Tempo e chutes são opcionais: vazio grava null; os chutes ficam limitados às respondidas.
      const optional = (value: unknown) =>
        value == null || value === '' ? null : Math.max(0, Math.floor(Number(value) || 0));
      draft.durationMinutes = optional(draft.durationMinutes);
      const pace = paceAndGuess(draft);
      draft.guessed = optional(draft.guessed) == null ? null : pace.guessed;
      draft.guessedCorrect =
        draft.guessed == null || optional(draft.guessedCorrect) == null
          ? null
          : pace.guessedCorrect;
      return draft;
    },
    onSaved: (saved: Record<string, any>) => {
      const { total } = simuladoEffectiveCounts(saved || {});
      let completedLinkedAgendaItem = false;
      if (saved?.id && total > 0) {
        const linkedItems = (ctx.state?.calendar || []).filter(
          (item: any) => item.linkedSimulationId === saved.id && item.status !== 'Concluído'
        );
        for (const item of linkedItems) {
          if (ctx.calendarService?.update) {
            ctx.calendarService.update(item.id, { status: 'Concluído' });
          } else {
            item.status = 'Concluído';
          }
          completedLinkedAgendaItem = true;
        }
      }
      ctx.persistAndRender();
      ctx.showToast(
        total > 0 ? 'Simulado atualizado e diagnóstico disponível.' : 'Simulado atualizado.'
      );
      if (
        completedLinkedAgendaItem &&
        saved?.id &&
        typeof ctx.document?.createElement === 'function'
      ) {
        openSimulatedRemediation(saved.id);
      }
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
    if (field === 'wrong' && String(value).trim() === '') b.wrong = null;
    else b[field] = ['correct', 'total', 'wrong'].includes(field) ? Number(value) || 0 : value;
    b.total = Math.max(0, Number(b.total) || 0);
    if ((Number(b.correct) || 0) > b.total) {
      ctx.showToast('Os acertos foram limitados ao total de questões.');
    }
    b.correct = Math.max(0, Math.min(Number(b.correct) || 0, b.total));
    if (b.wrong != null) b.wrong = wrongCount(b);
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
      ['wrong', 'durationMinutes', 'guessed', 'guessedCorrect'].includes(field) &&
        String(value).trim() === ''
        ? null
        : ['correct', 'total', 'wrong', 'durationMinutes', 'guessed', 'guessedCorrect'].includes(
              field
            )
          ? Math.max(0, Math.floor(Number(value) || 0))
          : field === 'scoring'
            ? value === true || value === 'certo-errado'
              ? 'certo-errado'
              : 'padrao'
            : value
    );
    // O campo Erradas só aparece em Certo ou errado: redesenha ao trocar o tipo.
    if (field === 'scoring') renderSimulados();
  }

  function saveSimulationEdit(): void {
    if (!simulationEditController.save()) cancelSimulationEdit();
  }

  function renderSimulados(): void {
    const body = ctx.document.getElementById('simuladosBody');
    if (!body) return;
    const editingBreakdowns = new Set(
      Array.from(body.querySelectorAll?.('.simulation-breakdown-edit[open]') || [])
        .map(details => details.closest('tr')?.previousElementSibling?.getAttribute('data-id'))
        .filter(Boolean)
    );

    const evolutionSlot = ctx.document.getElementById('simuladosEvolutionSlot');
    if (evolutionSlot) {
      const simulations = ctx.state?.simulados || [];
      const targetScore = Number(ctx.state?.metas?.metaAprovacao) || 80;
      const trendVisual = buildSimulationTrendVisual({
        simulations,
        targetScore,
      });

      if (trendVisual.simulations.length >= 2) {
        evolutionSlot.innerHTML = renderSimulationTrendChart({ visual: trendVisual });
        evolutionSlot.hidden = false;
      } else {
        evolutionSlot.innerHTML = '';
        evolutionSlot.hidden = true;
      }
    }

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
    body.querySelectorAll?.('.breakdown-row').forEach(row => {
      const id = row.previousElementSibling?.getAttribute('data-id');
      if (id && editingBreakdowns.has(id)) row.querySelector('details')?.setAttribute('open', '');
    });
  }

  function addSimuladoRow() {
    const sim = ctx.simulationService.create({
      date: todayISO(),
      nome: '',
      correct: 0,
      total: 0,
      breakdown: [],
      ...(ctx.state?.examBlueprint?.scoringMode === 'certo-errado'
        ? { scoring: 'certo-errado' }
        : {}),
    });
    // A linha nova entra em edição na página em que a ordenação por data a colocar.
    const index = [...(ctx.state.simulados || [])]
      .sort((a: any, b: any) => (b.date || '').localeCompare(a.date || ''))
      .findIndex((s: any) => s.id === sim.id);
    ctx.listViewState.simulationsPage = Math.floor(Math.max(0, index) / DEFAULT_PAGE_SIZE) + 1;
    simulationEditController.begin(sim.id, { isNew: true });
    return sim;
  }

  function deleteSimuladoRow(id: string): void {
    runUndoable('Simulado excluído.', () => {
      ctx.simulationService.remove(id);
      openBreakdownIds.delete(id);
      simulationEditController.reset();
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
    const blueprint = ctx.state.examBlueprint;
    const metas = ctx.state.metas || {};
    const weeklyHours =
      Object.values(metas.horasPorDia || {}).reduce(
        (sum: number, h) => sum + (Number(h) || 0),
        0
      ) ||
      (Number(metas.horasDiarias) || 0) * 7 ||
      20;
    const diagnostic = buildSimulatedRemediationDiagnostic({
      simulation: sim,
      historicalSimulations: ctx.state.simulados || [],
      // Mesma meta de nota da Prontidão: a do edital, quando configurado.
      passingScorePercent: blueprint?.configuredAt
        ? blueprint.targetScore
        : (metas.metaAprovacao ?? null),
      weeklyAvailableHours: weeklyHours,
      blueprintSubjects: blueprint?.subjects || [],
      blocks: blueprint?.blocks || [],
      subjectsMap,
      examMinutesPerQuestion: examMinutesPerQuestion(blueprint),
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

    const correctionTitle = `Corrigir os erros do simulado ${diagnostic.simulationName}`;
    const correctionExists = () =>
      (ctx.state.calendar || []).some(
        (item: { kind?: string; title?: string }) =>
          item?.kind === 'task' && item.title === correctionTitle
      );
    mountPreact(
      h(SimulatedRemediationModal, {
        open: true,
        onClose: close,
        diagnostic,
        correctionScheduled: correctionExists(),
        onScheduleErrorCorrection: () => {
          if (correctionExists()) return false;
          const errors = Math.max(0, diagnostic.totalQuestions - diagnostic.correctQuestions);
          const payload = {
            kind: 'task',
            title: correctionTitle,
            date: addDays(todayISO(), 1),
            status: 'Não iniciado',
            // Cerca de 3 minutos por erro, entre meia hora e duas horas.
            estimatedMinutes: Math.min(120, Math.max(30, errors * 3)),
            subjectId: null,
            description: `${errors} questões a corrigir: refaça sem olhar o gabarito, leia o comentário e classifique o erro na aba Questões.`,
            recurrence: 'none',
            reviewType: '—',
          };
          if (ctx.calendarService?.create) ctx.calendarService.create(payload);
          else (ctx.state.calendar ||= []).push({ id: uid('cal'), ...payload });
          ctx.persistAndRender();
          ctx.showToast('Correção dos erros agendada para amanhã.');
          return true;
        },
        onApplyRemediationPlan: plan => {
          // Uma tarefa de estudo por dia, a partir de amanhã.
          plan.dailySchedule.forEach(item => {
            const payload = {
              kind: 'task',
              title: item.focusHeadline,
              date: addDays(todayISO(), item.day),
              status: 'Não iniciado',
              estimatedMinutes: item.allocatedMinutes,
              subjectId: item.subjectId,
              description: `Raio-X de ${diagnostic.simulationName}`,
              recurrence: 'none',
              reviewType: '—',
            };
            if (ctx.calendarService?.create) ctx.calendarService.create(payload);
            else (ctx.state.calendar ||= []).push({ id: uid('cal'), ...payload });
          });
          ctx.persistAndRender();
          ctx.showToast(
            `${plan.dailySchedule.length} tarefas de estudo na Agenda, a partir de amanhã.`
          );
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
