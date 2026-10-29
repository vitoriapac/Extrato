import { buildExamConfigurationAudit } from '../../../application/exam-intelligence/build-exam-configuration-audit.js';
import { renderExamConfigurationAudit } from '../../renderers/exam-configuration-audit-renderer.js';
import { buildExamMatrix } from '../../../application/exam-intelligence/build-exam-matrix.js';
import { renderExamMatrix, renderExamOpportunity } from '../../renderers/exam-matrix-renderer.js';
import { renderExamBlueprintConfigView } from '../../renderers/exam-blueprint-config-renderer.js';
import { buildExamDataQuality } from '../../../application/exam-intelligence/build-exam-data-quality.js';
import { renderExamDataQuality } from '../../renderers/exam-data-quality-renderer.js';
import { buildExamIntelligenceViewModel } from '../../../application/exam-intelligence/build-exam-intelligence-view-model.js';
import { renderExamIntelligence } from '../../renderers/exam-intelligence-renderer.js';
import { renderExamClassificationReview } from '../../renderers/exam-classification-review-renderer.js';
import { reviewExamClassification } from '../../../application/exam-intelligence/review-exam-classification.js';
import { buildExamMasteryMatrix } from '../../../domain/analytics/exam-mastery-matrix.js';
import { buildSavedSubjectConfig } from '../../../application/exams/save-subject-config.js';
import { setActiveExamTags } from '../../../application/exams/exam-scope-transition.js';

export interface ExamMatrixControllerContext {
  document: Document;
  window: Window;
  getState: () => any;
  examEvidenceContext: () => { questions: { included: any[] }; [key: string]: any };
  intelligenceCandidates: () => any[];
  examScopedTopics: () => any[];
  activeTopics: () => any[];
  activeSubjects: () => any[];
  currentAchievementProjection: () => { model: any; [key: string]: any };
  nowISO: () => string;
  idGenerator: (prefix?: string) => string;
  escapeHtml: (text: string) => string;
  escapeAttr: (text: string) => string;
  formatDatePt: (date: string) => string;
  showToast: (message: string) => void;
  persistAndRender: () => void;
  captureReadinessBeforeStrategy: (reason: string) => void;
  invalidatePlanPreview: () => void;
  resetRecordListLimits: () => void;
  updateExamBlueprint?: (field: string, value: any) => void;
  getProgressiveLists?: () => any;
  EXAM_TAGS: any;
  EXAM_SOURCES: any;
}

export function createExamMatrixController(ctx: ExamMatrixControllerContext) {
  const examMatrixFilters: Record<string, any> = {
    scope: 'active',
    board: 'all',
    year: 'all',
    role: 'all',
    subject: 'all',
    search: '',
    sort: 'incidence',
    mode: 'quadrants',
  };
  let selectedExamMatrixTopicId: string | null = null;

  let examClassificationFilter = 'all';
  let examClassificationPage = 0;
  let examClassificationPreviousFocus: HTMLElement | null = null;

  function renderHistoricalExamMatrix() {
    const container = ctx.document.getElementById('examHistoricalMatrix');
    if (!container) return;
    const advancedWasOpen = container.querySelector<HTMLDetailsElement>(
      '.exam-matrix-more-filters'
    )?.open;

    const personal = new Map<string, { total: number; correct: number }>();
    for (const record of ctx.examEvidenceContext().questions.included) {
      const entry = personal.get(record.topicId) || { total: 0, correct: 0 };
      entry.total += Math.max(0, Number(record.resolved) || 0);
      entry.correct += Math.max(
        0,
        Math.min(Number(record.resolved) || 0, Number(record.correct) || 0)
      );
      personal.set(record.topicId, entry);
    }

    const metricsByTopic = Object.fromEntries(
      ctx.intelligenceCandidates().map((item: any) => {
        const data = personal.get(item.topicId);
        return [
          item.topicId,
          {
            mastery: item.mastery,
            retention: item.retention,
            trend: item.trend,
            priority: item.score,
            personalQuestionCount: data?.total || 0,
            personalAccuracy: data?.total ? Math.round((data.correct / data.total) * 100) : null,
          },
        ];
      })
    );

    const auditMatchesScope =
      examMatrixFilters.scope === 'active' &&
      ['board', 'year', 'role'].every(key => examMatrixFilters[key] === 'all');
    const state = ctx.getState();
    const auditByTopic = auditMatchesScope
      ? Object.fromEntries(
          buildExamConfigurationAudit({
            topics: ctx.examScopedTopics(),
            blueprint: state.examBlueprint,
            exams: state.exams,
            examQuestions: state.examQuestions,
          }).rows.map((row: any) => [row.topicId, row])
        )
      : {};

    const model = buildExamMatrix({
      topics: ctx.activeTopics(),
      exams: state.exams,
      examQuestions: state.examQuestions,
      activeExamTags: state.examBlueprint?.activeExamTags || [],
      filters: examMatrixFilters,
      metricsByTopic,
      auditByTopic,
    });

    if (!model.rows.some((row: any) => row.topicId === selectedExamMatrixTopicId))
      selectedExamMatrixTopicId = null;

    container.innerHTML = renderExamMatrix(model, { selectedTopicId: selectedExamMatrixTopicId });
    const opportunity = ctx.document.getElementById('examOpportunity');
    if (opportunity) opportunity.innerHTML = renderExamOpportunity(model);

    const advanced = container.querySelector<HTMLDetailsElement>('.exam-matrix-more-filters');
    if (advanced)
      advanced.open = advancedWasOpen ?? !ctx.window.matchMedia?.('(max-width:600px)')?.matches;

    for (const [key, value] of Object.entries(examMatrixFilters)) {
      const select = container.querySelector<HTMLSelectElement>(
        `[data-exam-matrix-filter="${key}"]`
      );
      if (select && [...select.options].some(option => option.value === String(value)))
        select.value = String(value);
    }
  }

  function renderExamIntelligenceSection() {
    const state = ctx.getState();
    const quality = ctx.document.getElementById('examDataQuality');
    const qualityModel = buildExamDataQuality({
      exams: state.exams,
      examQuestions: state.examQuestions,
      topics: ctx.examScopedTopics(),
      blueprint: state.examBlueprint,
    });
    if (quality) quality.innerHTML = renderExamDataQuality(qualityModel);

    const overview = ctx.document.getElementById('examIntelligenceOverview');
    if (overview) {
      overview.hidden = !qualityModel.examCount;
      overview.innerHTML = qualityModel.examCount
        ? `<strong>${qualityModel.examCount} ${qualityModel.examCount === 1 ? 'prova' : 'provas'} · ${qualityModel.questionCount} questões</strong><span>${qualityModel.completeExamCount} completas · ${qualityModel.mappedTopics} tópicos mapeados · confiança ${qualityModel.confidence === 'high' ? 'alta' : qualityModel.confidence === 'moderate' ? 'moderada' : qualityModel.confidence === 'low' ? 'baixa' : 'limitada'}</span>`
        : '';
    }

    const audit = ctx.document.getElementById('examConfigurationAudit');
    if (audit)
      audit.innerHTML = renderExamConfigurationAudit(
        buildExamConfigurationAudit({
          topics: ctx.examScopedTopics(),
          blueprint: state.examBlueprint,
          exams: state.exams,
          examQuestions: state.examQuestions,
        })
      );

    const evidence = ctx.document.getElementById('examIntelligenceSummary');
    if (evidence)
      evidence.innerHTML = renderExamIntelligence(
        buildExamIntelligenceViewModel({
          topics: ctx.examScopedTopics(),
          blueprint: state.examBlueprint,
          exams: state.exams,
          examQuestions: state.examQuestions,
        }),
        { projection: ctx.currentAchievementProjection().model }
      );

    renderHistoricalExamMatrix();
  }

  function topicExamMetricForActiveScope(topic: Record<string, any>) {
    const state = ctx.getState();
    const active = state.examBlueprint?.activeExamTags || [];
    const entries = Object.entries(topic.examMetrics || {}).filter(
      ([profile]) => !active.length || active.some((tag: string) => profile.startsWith(tag))
    );
    return (entries[0]?.[1] as Record<string, any>) || null;
  }

  function renderExamMasteryMatrix() {
    const el = ctx.document.getElementById('examMasteryMatrix');
    if (!el) return;
    const candidates = ctx.intelligenceCandidates();
    const metrics = Object.fromEntries(
      candidates.map((c: any) => [
        c.topicId,
        {
          coverage: c.coverage,
          mastery: { value: c.mastery, confidence: c.evidenceStrength },
          retention: { value: c.retention },
          trend: c.trend,
          priority: { value: c.score },
        },
      ])
    );
    const state = ctx.getState();
    const rows = buildExamMasteryMatrix({
      subjects: state.subjects,
      blueprint: state.examBlueprint,
      metricsByTopic: metrics,
      activeExamTags: state.examBlueprint?.activeExamTags || [],
    });

    el.innerHTML = rows.length
      ? `<div class="mastery-matrix"><div class="mastery-matrix-head"><span>Disciplina</span><span>Cobertura</span><span>Domínio</span><span>Retenção</span><span>Gap</span></div>${rows
          .sort((a: any, b: any) => (b.gap ?? -999) - (a.gap ?? -999))
          .map(
            (row: any) =>
              `<details><summary><strong>${ctx.escapeHtml(row.name)}</strong><span data-label="Cobertura">${row.coverage ?? '—'}%</span><span data-label="Domínio">${row.mastery ?? '—'}%</span><span data-label="Retenção">${row.retention ?? '—'}%</span><span data-label="Gap">${row.gap == null ? '—' : (row.gap > 0 ? '-' : '') + Math.abs(row.gap) + ' pts'}</span></summary>${row.topics
                .map((t: any) => {
                  const metric = topicExamMetricForActiveScope(t);
                  const meta = [
                    metric?.questionWeight != null ? metric.questionWeight + ' pt/questão' : null,
                    t.incidence?.level ? 'incidência ' + t.incidence.level.toLowerCase() : null,
                  ]
                    .filter(Boolean)
                    .join(' · ');
                  return `<div class="mastery-topic"><span>${ctx.escapeHtml(t.name)}${meta ? `<small>${ctx.escapeHtml(meta)} · estimativa por tópico</small>` : ''}</span><span data-label="Cobertura">${t.coverage}%</span><span data-label="Domínio">${t.mastery ?? '—'}%</span><span data-label="Retenção">${t.retention ?? '—'}%</span><span data-label="Estado">${ctx.escapeHtml(t.state)}</span></div>`;
                })
                .join('')}</details>`
          )
          .join('')}</div>`
      : '<div class="upcoming-empty">Cadastre disciplinas e tópicos para montar a matriz.</div>';
  }

  function renderExamBlueprintConfig() {
    const container = ctx.document.getElementById('examBlueprintConfig');
    if (!container) return;
    const state = ctx.getState();
    renderExamBlueprintConfigView({
      container,
      blueprint: state.examBlueprint,
      subjects: ctx.activeSubjects(),
      escapeHtml: ctx.escapeHtml,
      escapeAttr: ctx.escapeAttr,
      formatDatePt: ctx.formatDatePt,
      EXAM_TAGS: ctx.EXAM_TAGS,
      EXAM_SOURCES: ctx.EXAM_SOURCES,
      globalAccuracyTarget: state.metas?.metaAprovacao,
      document: ctx.document,
    });
    renderExamIntelligenceSection();
    renderExamMasteryMatrix();
  }

  function updateExamClassificationReview() {
    const content = ctx.document.getElementById('examClassificationContent');
    if (!content) return;
    const state = ctx.getState();
    content.innerHTML = renderExamClassificationReview({
      exams: state.exams,
      examQuestions: state.examQuestions,
      subjects: state.subjects,
      activeExamTags: state.examBlueprint?.activeExamTags || [],
      filter: examClassificationFilter,
      page: examClassificationPage,
    });
  }

  function closeExamClassificationReview() {
    const overlay = ctx.document.getElementById('examClassificationOverlay');
    overlay?.classList.remove('show');
    (examClassificationPreviousFocus?.isConnected
      ? examClassificationPreviousFocus
      : ctx.document.getElementById('openExamClassificationReview')
    )?.focus();
    examClassificationPreviousFocus = null;
  }

  function saveExamSubjectConfig(subjectId: string) {
    const details = [
      ...ctx.document.querySelectorAll<HTMLElement>('#examBlueprintConfig .exam-subject-config'),
    ].find(item => item.dataset.subjectId === subjectId);
    if (!details) return;

    const read = (name: string) =>
      details.querySelector<HTMLInputElement>(`[name="${name}"]`)?.value ?? '';

    const state = ctx.getState();
    const existing = state.examBlueprint?.subjects?.find(
      (item: any) => item.subjectId === subjectId
    );
    const config = buildSavedSubjectConfig(subjectId, existing, {
      priority: read('priority'),
      masteryTarget: read('masteryTarget'),
      expectedQuestions: read('expectedQuestions'),
      questionWeight: read('questionWeight'),
      accuracyTarget: read('accuracyTarget'),
    });

    if (!config) {
      ctx.showToast('Revise a meta, a quantidade de questões e o peso antes de salvar.');
      return;
    }

    if (
      !existing ||
      [
        'priority',
        'masteryTarget',
        'accuracyTarget',
        'expectedQuestions',
        'questionWeight',
        'official',
        'sourceRef',
      ].some(
        key =>
          JSON.stringify((existing as Record<string, any>)[key]) !==
          JSON.stringify((config as Record<string, any>)[key])
      )
    ) {
      ctx.captureReadinessBeforeStrategy(
        'Antes de alterar a configuração estratégica da disciplina'
      );
    }

    if (existing) Object.assign(existing, config);
    else state.examBlueprint.subjects.push(config);

    state.examBlueprint.configuredAt = ctx.nowISO();
    ctx.invalidatePlanPreview();
    ctx.persistAndRender();
    ctx.showToast('Configuração da disciplina salva.');
  }

  function cancelExamSubjectConfig() {
    renderExamBlueprintConfig();
  }

  function toggleActiveExamTag(tag: string, checked: boolean) {
    ctx.getProgressiveLists?.()?.reset?.();
    ctx.resetRecordListLimits();

    const valid = ['bb-escriturario', 'caixa-tbn', 'caixa-tbn-ti'];
    if (!valid.includes(tag)) return;

    const state = ctx.getState();
    const values = new Set(state.examBlueprint?.activeExamTags || []);
    checked ? values.add(tag) : values.delete(tag);

    if (
      JSON.stringify([...values].sort()) !==
      JSON.stringify([...(state.examBlueprint?.activeExamTags || [])].sort())
    ) {
      ctx.captureReadinessBeforeStrategy('Antes de alterar o concurso ativo');
    }

    if (setActiveExamTags(state, [...values] as string[], { configuredAt: ctx.nowISO() })) {
      ctx.invalidatePlanPreview();
      ctx.persistAndRender();
    }
  }

  function bindEvents() {
    const historicalMatrix = ctx.document.getElementById('examHistoricalMatrix');
    historicalMatrix?.addEventListener('change', event => {
      const key = (event.target as HTMLElement)?.dataset?.examMatrixFilter;
      if (!['scope', 'board', 'year', 'role', 'subject', 'sort'].includes(key!)) return;
      examMatrixFilters[key!] = (event.target as HTMLInputElement).value;
      if (key === 'scope') {
        examMatrixFilters.board = 'all';
        examMatrixFilters.year = 'all';
        examMatrixFilters.role = 'all';
      }
      selectedExamMatrixTopicId = null;
      renderHistoricalExamMatrix();
    });

    historicalMatrix?.addEventListener('input', event => {
      if (!(event.target as HTMLElement).matches('[data-exam-matrix-search]')) return;
      examMatrixFilters.search = (event.target as HTMLInputElement).value;
      const start = (event.target as HTMLInputElement).selectionStart;
      renderHistoricalExamMatrix();
      const search = ctx.document.querySelector<HTMLInputElement>(
        '#examHistoricalMatrix [data-exam-matrix-search]'
      );
      search?.focus();
      if (start != null) search?.setSelectionRange(start, start);
    });

    historicalMatrix?.addEventListener('click', event => {
      const mode = (event.target as HTMLElement)?.closest?.<HTMLElement>('[data-exam-matrix-mode]');
      if (mode) {
        examMatrixFilters.mode = mode.dataset.examMatrixMode;
        examMatrixFilters.sort = examMatrixFilters.mode === 'priorities' ? 'gap' : 'incidence';
        renderHistoricalExamMatrix();
        ctx.document
          .querySelector<HTMLElement>(
            `#examHistoricalMatrix [data-exam-matrix-mode="${examMatrixFilters.mode}"]`
          )
          ?.focus();
        return;
      }
      const button = (event.target as HTMLElement)?.closest?.<HTMLElement>(
        '[data-exam-matrix-topic]'
      );
      if (!button) return;
      selectedExamMatrixTopicId = button.dataset.examMatrixTopic || null;
      renderHistoricalExamMatrix();
      ctx.document
        .querySelector('#examHistoricalMatrix .exam-matrix-detail')
        ?.scrollIntoView?.({ block: 'nearest' });
    });

    ctx.document.getElementById('examConfigurationAudit')?.addEventListener('click', event => {
      const topic = (event.target as HTMLElement).closest<HTMLElement>('[data-audit-topic]');
      if (!topic) return;
      selectedExamMatrixTopicId = topic.dataset.auditTopic || null;
      examMatrixFilters.scope = 'active';
      examMatrixFilters.board = 'all';
      examMatrixFilters.year = 'all';
      examMatrixFilters.role = 'all';
      renderHistoricalExamMatrix();
      ctx.document
        .querySelector('#examHistoricalMatrix .exam-matrix-detail')
        ?.scrollIntoView?.({ block: 'nearest' });
    });

    const overlay = ctx.document.getElementById('examClassificationOverlay');
    ctx.document.getElementById('examDataQuality')?.addEventListener('click', event => {
      if (!(event.target as HTMLElement).closest('#openExamClassificationReview')) return;
      examClassificationPreviousFocus = ctx.document.activeElement as HTMLElement;
      examClassificationFilter = 'all';
      examClassificationPage = 0;
      updateExamClassificationReview();
      overlay?.classList.add('show');
      ctx.document.getElementById('examClassificationFilter')?.focus();
    });

    ctx.document
      .getElementById('examClassificationClose')
      ?.addEventListener('click', closeExamClassificationReview);

    overlay?.addEventListener('click', event => {
      if (event.target === overlay) {
        closeExamClassificationReview();
        return;
      }
      const pageButton = (event.target as HTMLElement).closest<HTMLElement>('[data-review-page]');
      if (pageButton) {
        examClassificationPage = Number(pageButton.dataset.reviewPage) || 0;
        updateExamClassificationReview();
        ctx.document.getElementById('examClassificationFilter')?.focus();
        return;
      }
      const button = (event.target as HTMLElement).closest('[data-review-save]');
      if (!button) return;
      const row = button.closest<HTMLElement>('[data-review-exam]');
      const topicId = row?.querySelector<HTMLInputElement>('[data-review-topic]')?.value;
      const confidence = Number(
        row?.querySelector<HTMLInputElement>('[data-review-confidence]')?.value
      );
      const state = ctx.getState();
      try {
        const result = reviewExamClassification(state, {
          examId: row?.dataset.reviewExam,
          questionNumber: Number(row?.dataset.reviewNumber),
          topicId,
          confidence,
          now: ctx.nowISO(),
          idGenerator: ctx.idGenerator,
        });
        state.exams = result.exams;
        state.examQuestions = result.examQuestions;
        ctx.invalidatePlanPreview();
        ctx.persistAndRender();
        updateExamClassificationReview();
        ctx.document.getElementById('examClassificationFilter')?.focus();
        ctx.showToast(
          'Classificação atualizada. Próximas recomendações usarão a evidência corrigida.'
        );
      } catch (error: any) {
        ctx.showToast(error.message || 'Não foi possível revisar a classificação.');
      }
    });

    overlay?.addEventListener('change', event => {
      if ((event.target as HTMLElement).id === 'examClassificationFilter') {
        examClassificationFilter = (event.target as HTMLInputElement).value;
        examClassificationPage = 0;
        updateExamClassificationReview();
        ctx.document.getElementById('examClassificationFilter')?.focus();
      }
    });

    overlay?.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeExamClassificationReview();
      }
    });

    ctx.document
      .getElementById('examDateInput')
      ?.addEventListener('change', function (this: HTMLInputElement) {
        ctx.updateExamBlueprint?.('examDate', this.value);
      });
  }

  return {
    renderHistoricalExamMatrix,
    renderExamIntelligenceSection,
    renderExamMasteryMatrix,
    renderExamBlueprintConfig,
    updateExamClassificationReview,
    closeExamClassificationReview,
    saveExamSubjectConfig,
    cancelExamSubjectConfig,
    toggleActiveExamTag,
    bindEvents,
    getFilters: () => ({ ...examMatrixFilters }),
    getSelectedTopicId: () => selectedExamMatrixTopicId,
  };
}
