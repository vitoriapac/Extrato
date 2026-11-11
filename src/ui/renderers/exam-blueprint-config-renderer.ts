import { formatDecimal } from '../../core/format-number.js';
import { buildPhaseRoadmapVisual } from '../../domain/planning/planning-visual-models.js';
import { renderPhaseRoadmapTimeline } from '../primitives/charts/charts.js';
import { subjectColorOf } from '../../domain/subjects/subject-color.js';

export function renderExamBlueprintConfigView({
  container,
  blueprint,
  subjects,
  escapeHtml,
  escapeAttr,
  formatDatePt,
  EXAM_TAGS,
  EXAM_SOURCES,
  globalAccuracyTarget = 80,
  today,
  document = globalThis.document,
}: any) {
  const generalWasOpen = container.querySelector('.exam-general-config')?.open || false;

  const roadmapVisual = buildPhaseRoadmapVisual({
    examDate: blueprint?.examDate || null,
    today: today || new Date().toISOString().slice(0, 10),
  });
  const roadmapHtml = renderPhaseRoadmapTimeline({
    visual: roadmapVisual,
    label: 'Régua de preparação e fases até a prova',
    className: 'mb-4',
  });

  const rows = subjects
    .map((subject: any) => {
      const colorSlot = subjectColorOf(subject, subjects);
      const config = blueprint.subjects.find((item: any) => item.subjectId === subject.id);
      const priorityLabel = (
        { high: 'Alta', low: 'Baixa', normal: 'Normal' } as Record<string, any>
      )[config?.priority || 'normal'];
      const masteryLabel =
        config?.masteryTarget == null
          ? `Domínio: meta geral de ${blueprint.masteryTarget}%`
          : `Meta de domínio ${config.masteryTarget}%`;
      const questionsLabel =
        config?.expectedQuestions > 0
          ? `${config.expectedQuestions} questões`
          : 'Questões sem meta';
      const weightLabel =
        config?.questionWeight != null
          ? `Peso ${formatDecimal(config.questionWeight)}`
          : 'Peso padrão';
      return `<div class="exam-subject-item"><label class="exam-subject-check"><input type="checkbox" data-exam-subject-select value="${escapeAttr(subject.id)}" aria-label="Selecionar ${escapeAttr(subject.name)}"></label><details class="exam-subject-config"><summary><span class="w-2 h-2 rounded-full inline-block mr-2 subject-bg-${colorSlot}" aria-hidden="true"></span><strong>${escapeHtml(subject.name)}</strong><span>${priorityLabel}</span><span>${masteryLabel}</span><span>${questionsLabel} · ${weightLabel}</span><em>Editar configuração</em></summary><div class="exam-subject-row"><strong>${escapeHtml(subject.name)}</strong><label>Prioridade<select class="select-control" data-delegated-change="updateExamSubject('${escapeAttr(subject.id)}','priority',this.value)"><option value="normal" ${!config || config.priority === 'normal' ? 'selected' : ''}>Normal</option><option value="high" ${config?.priority === 'high' ? 'selected' : ''}>Alta</option><option value="low" ${config?.priority === 'low' ? 'selected' : ''}>Baixa</option></select></label><label>Meta de domínio (%)<input type="number" min="0" max="100" value="${config?.masteryTarget ?? ''}" placeholder="Meta geral: ${blueprint.masteryTarget}%" data-delegated-blur="updateExamSubject('${escapeAttr(subject.id)}','masteryTarget',this.value)">${config?.masteryTarget == null ? `<small class="field-inheritance">${blueprint.masteryTarget}% (geral)</small>` : ''}</label><label>Questões esperadas<input type="number" min="0" step="1" value="${config?.expectedQuestions ?? ''}" placeholder="Não definido" data-delegated-blur="updateExamSubject('${escapeAttr(subject.id)}','expectedQuestions',this.value)"></label><label>Peso por questão<input type="number" min="0.1" step="0.1" value="${config?.questionWeight ?? ''}" placeholder="1" data-delegated-blur="updateExamSubject('${escapeAttr(subject.id)}','questionWeight',this.value)">${config?.sourceRef ? `<small class="field-inheritance">${escapeHtml(EXAM_SOURCES[config.sourceRef]?.label || config.sourceRef)}${config.official ? ' · oficial' : ''}</small>` : ''}</label><label>Meta de acerto (%)<input type="number" min="0" max="100" value="${config?.accuracyTarget ?? ''}" placeholder="Meta geral: ${globalAccuracyTarget}%" name="accuracyTarget"><small>Em branco: ${globalAccuracyTarget}% (geral). Separada da meta de domínio.</small></label></div></details></div>`;
    })
    .join('');

  const undatedCtaHtml = !blueprint?.examDate
    ? `<div class="exam-undated-cta"><label for="examUndatedDateInput">Defina a data prevista da prova para destravar as fases até o edital</label><div class="exam-undated-cta__controls"><input type="date" id="examUndatedDateInput" aria-label="Data prevista da prova"><button type="button" class="btn small" data-delegated-click="applyUndatedExamDate()">Definir data da prova</button></div></div>`
    : '';

  const bulkToolbarHtml = subjects.length
    ? `<div class="exam-subject-bulk"><label><input type="checkbox" data-exam-subject-select-all data-delegated-change="toggleAllExamSubjects(this.checked)"> Selecionar disciplinas</label><label>Prioridade <select class="select-control" data-exam-bulk-priority><option value="">Manter atual</option><option value="normal">Normal</option><option value="high">Alta</option><option value="low">Baixa</option></select></label><label>Meta de domínio (%) <input type="number" min="0" max="100" step="1" data-exam-bulk-mastery placeholder="Manter / geral (${blueprint.masteryTarget}%)"></label><button type="button" class="btn small" data-delegated-click="applyBulkExamSubjectConfig()">Aplicar às selecionadas</button></div>`
    : '';

  container.innerHTML = `${roadmapHtml}${undatedCtaHtml}<h4 class="config-section-title">Configuração da prova</h4><div class="exam-blueprint-main"><label>Data da prova<input type="date" value="${escapeAttr(blueprint.examDate || '')}" data-delegated-change="updateExamBlueprint('examDate',this.value)"></label><label>Nota-alvo (%)<input type="number" min="0" max="100" value="${blueprint.targetScore}" data-delegated-blur="updateExamBlueprint('targetScore',this.value)"></label><label>Meta geral de domínio (%)<input type="number" min="0" max="100" value="${blueprint.masteryTarget}" data-delegated-blur="updateExamBlueprint('masteryTarget',this.value)"></label></div><fieldset class="active-exams"><legend>Concursos ativos no planejamento</legend>${[
    ['bb-escriturario', 'Banco do Brasil — Escriturário'],
    ['caixa-tbn', 'Caixa — TBN'],
    ['caixa-tbn-ti', 'Caixa — TBN TI'],
  ]
    .map(
      ([tag, label]) =>
        `<label><input type="checkbox" data-delegated-change="toggleActiveExamTag('${tag}',this.checked)" ${(blueprint.activeExamTags || []).includes(tag) ? 'checked' : ''}> ${label}</label>`
    )
    .join(
      ''
    )}<small>Somente os concursos marcados influenciam prontidão, prioridade e planejamento. Se nenhum for selecionado, todo o conteúdo continuará elegível.</small></fieldset><h4 class="config-section-title">Configuração por disciplina</h4>${bulkToolbarHtml}<div class="exam-subject-list">${rows || '<p class="diagnosis-empty">Cadastre disciplinas para configurar o peso no edital.</p>'}</div>`;

  const general = document.createElement('details');
  general.className = 'exam-general-config';
  general.innerHTML = `<summary>Opções gerais da prova · ${escapeHtml(blueprint.examDate ? formatDatePt(blueprint.examDate) : 'sem data')} · meta ${blueprint.masteryTarget}%</summary>`;
  const main = container.querySelector('.exam-blueprint-main');
  main.before(general);
  general.append(main, container.querySelector('.active-exams'));
  general.open = generalWasOpen;
  container.querySelectorAll('.exam-subject-config').forEach((details: any, index: any) => {
    const subject = subjects[index];
    if (!subject) return;
    details.dataset.subjectId = subject.id;
    const fields = details.querySelectorAll('.exam-subject-row select,.exam-subject-row input');
    ['priority', 'masteryTarget', 'expectedQuestions', 'questionWeight', 'accuracyTarget'].forEach(
      (name, fieldIndex) => {
        fields[fieldIndex].name = name;
        fields[fieldIndex].removeAttribute('data-delegated-change');
        fields[fieldIndex].removeAttribute('data-delegated-blur');
      }
    );
    const levels = [
      ...new Set(
        (subject.topics || []).map((topic: any) => topic.incidence?.level).filter(Boolean)
      ),
    ];
    const tags = [...new Set((subject.topics || []).flatMap((topic: any) => topic.examTags || []))];
    const summary = document.createElement('span');
    summary.className = 'exam-subject-scope';
    summary.textContent = `Incidência: ${levels.length === 1 ? levels[0] : levels.length ? 'Variável' : 'Não informada'} · Concursos: ${tags.length ? tags.map(tag => (tag === EXAM_TAGS.BB ? 'BB' : tag === EXAM_TAGS.CAIXA ? 'Caixa' : tag === EXAM_TAGS.CAIXA_TI ? 'Caixa TI' : tag)).join(', ') : 'não informados'}`;
    details.querySelector('summary').append(summary);
    const actions = document.createElement('div');
    actions.className = 'exam-subject-actions';
    actions.innerHTML = `<small>Incidência e concursos são configurados por tópico.</small><button class="btn small" type="button" data-delegated-click="saveExamSubjectConfig('${escapeAttr(subject.id)}')">Salvar</button><button class="btn ghost small" type="button" data-delegated-click="cancelExamSubjectConfig()">Cancelar</button>`;
    details.append(actions);
  });
}
