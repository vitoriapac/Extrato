import { buildPhaseRoadmapVisual } from '../../domain/planning/planning-visual-models.js';
import { renderPhaseRoadmapTimeline } from '../primitives/charts/charts.js';

export function renderExamBlueprintConfigView({
  container,
  blueprint,
  escapeHtml,
  escapeAttr,
  formatDatePt,
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

  const undatedCtaHtml = !blueprint?.examDate
    ? `<div class="exam-undated-cta"><label for="examUndatedDateInput">Defina a data prevista da prova para destravar as fases até o edital</label><div class="exam-undated-cta__controls"><input type="date" id="examUndatedDateInput" aria-label="Data prevista da prova"><button type="button" class="btn small" data-delegated-click="applyUndatedExamDate()">Definir data da prova</button></div></div>`
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
    )}<small>Somente os concursos marcados influenciam prontidão, prioridade e planejamento. Se nenhum for selecionado, todo o conteúdo continuará elegível.</small></fieldset><p class="analytics-note">Prioridade, peso, questões na prova e metas de cada disciplina ficam na tabela “Metas por disciplina”, logo abaixo.</p>`;

  const general = document.createElement('details');
  general.className = 'exam-general-config';
  general.innerHTML = `<summary>Opções gerais da prova · ${escapeHtml(blueprint.examDate ? formatDatePt(blueprint.examDate) : 'sem data')} · meta ${blueprint.masteryTarget}%</summary>`;
  const main = container.querySelector('.exam-blueprint-main');
  main.before(general);
  general.append(main, container.querySelector('.active-exams'));
  general.open = generalWasOpen;
}
