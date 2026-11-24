import { buildPhaseRoadmapVisual } from '../../domain/planning/planning-visual-models.js';
import { renderPhaseRoadmapTimeline } from '../primitives/charts/charts.js';
import { formatLocalDate } from '../../core/date-utils.js';
import type { StudiedTopicOutsideScope } from '../../domain/exams/exam-scope.js';
import { KNOWN_BANCAS } from '../../domain/questions/bancas.js';

export function renderExamBlueprintConfigView({
  container,
  blueprint,
  escapeHtml,
  escapeAttr,
  formatDatePt,
  today,
  planStartDate = null,
  outsideTopics = [],
  document = globalThis.document,
}: any) {
  const generalWasOpen = container.querySelector('.exam-general-config')?.open || false;

  const roadmapVisual = buildPhaseRoadmapVisual({
    examDate: blueprint?.examDate || null,
    planStartDate,
    today: today || formatLocalDate(new Date()) || '',
  });
  // Sem data da prova, o convite com o campo de data já diz o que fazer: a régua vazia só repetiria o pedido.
  const roadmapHtml = !blueprint?.examDate
    ? ''
    : renderPhaseRoadmapTimeline({
        visual: roadmapVisual,
        label: 'Régua de preparação e fases até a prova',
        className: 'mb-4',
      });

  const undatedCtaHtml =
    blueprint?.preEdital && !blueprint?.examDate
      ? '<p class="context-note"><strong>Pré-edital.</strong> Sem data, o app não cobra prazo nem posiciona as fases. Quando o edital sair, defina a data da prova: o modo pré-edital se encerra sozinho.</p>'
      : !blueprint?.examDate
        ? `<div class="exam-undated-cta"><label for="examUndatedDateInput">Defina a data prevista da prova para destravar as fases até o edital</label><div class="exam-undated-cta__controls"><input type="date" id="examUndatedDateInput" aria-label="Data prevista da prova"><button type="button" class="btn small" data-delegated-click="applyUndatedExamDate()">Definir data da prova</button></div></div>`
        : '';

  container.innerHTML = `${roadmapHtml}${undatedCtaHtml}<h4 class="config-section-title">Configuração da prova</h4><div class="exam-blueprint-main"><label>Data da prova<input type="date" value="${escapeAttr(blueprint.examDate || '')}" data-delegated-change="updateExamBlueprint('examDate',this.value)"></label><label class="exam-pre-edital"><input type="checkbox" ${blueprint.preEdital ? 'checked' : ''} data-delegated-change="updateExamBlueprint('preEdital',this.checked)"> O edital ainda não saiu (pré-edital)</label><label class="exam-target-simple">Meta de acerto (%)<input type="number" min="0" max="100" value="${blueprint.targetScore}" data-delegated-blur="updateExamBlueprint('allTargets',this.value)"><small>Nota que você quer na prova; também é a meta de domínio de cada tópico, que cada disciplina pode ajustar na tabela abaixo.</small></label><label>Tipo de prova<select data-delegated-change="updateExamBlueprint('scoringMode',this.value)"><option value="padrao" ${blueprint.scoringMode === 'certo-errado' ? '' : 'selected'}>Múltipla escolha</option><option value="certo-errado" ${blueprint.scoringMode === 'certo-errado' ? 'selected' : ''}>Certo ou errado (Cebraspe)</option></select><small>Em Certo ou errado, cada erro anula um acerto: a prontidão usa a nota líquida e os simulados novos já vêm nesse tipo.</small></label><label>Mínimo da discursiva (%)<input type="number" min="0" max="100" value="${escapeAttr(blueprint.essayMinPercent ?? '')}" placeholder="Sem mínimo" data-delegated-blur="updateExamBlueprint('essayMinPercent',this.value)"><small>Nota que elimina na discursiva ou redação. O histórico de redações da Agenda avisa quando a última fica abaixo.</small></label><label>Banca da prova<input type="text" list="examBancaOptions" autocomplete="off" value="${escapeAttr(blueprint.banca || '')}" placeholder="Ex.: Cesgranrio" data-delegated-change="updateExamBlueprint('banca',this.value)"><datalist id="examBancaOptions">${KNOWN_BANCAS.map(name => `<option value="${escapeAttr(name)}"></option>`).join('')}</datalist><small>Compara seu acerto nas questões dessa banca com o geral, na aba Questões.</small></label><label>Duração da prova (min)<input type="number" min="1" inputmode="numeric" value="${escapeAttr(blueprint.durationMinutes ?? '')}" placeholder="Ex.: 300" data-delegated-blur="updateExamBlueprint('durationMinutes',this.value)"><small>Com o total de questões, dá o tempo por questão que seu ritmo precisa caber.</small></label></div><fieldset class="active-exams"><legend>Concursos ativos no planejamento</legend>${[
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

  if (outsideTopics.length) {
    const shown = outsideTopics.slice(0, 8);
    const hours = (minutes: number) =>
      minutes >= 60 ? `${Math.round(minutes / 6) / 10}h`.replace('.', ',') : `${minutes} min`;
    container.insertAdjacentHTML(
      'beforeend',
      `<section class="exam-outside-topics context-note" aria-labelledby="examOutsideTopicsTitle"><h4 id="examOutsideTopicsTitle" class="config-section-title">Estudo que ficou fora do edital</h4><p>${outsideTopics.length === 1 ? '1 tópico que você estudou não está' : `${outsideTopics.length} tópicos que você estudou não estão`} no concurso ativo, e esse histórico não conta na Prontidão. Traga para o edital os que tratam do mesmo conteúdo.</p><ul class="upcoming-list">${shown
        .map(
          (row: StudiedTopicOutsideScope) =>
            `<li class="flex flex-wrap items-center gap-2"><span class="min-w-0 flex-1"><strong>${escapeHtml(row.topicName)}</strong> <small class="metadata-text">${escapeHtml(row.subjectName)} · ${[row.minutes ? hours(row.minutes) : '', row.questions ? `${row.questions} questões` : ''].filter(Boolean).join(' · ')}</small></span><button type="button" class="btn ghost small" data-delegated-click="includeTopicInExam('${escapeAttr(row.topicId)}')">Trazer para o edital</button></li>`
        )
        .join(
          ''
        )}</ul>${outsideTopics.length > 1 ? `<button type="button" class="btn small" data-delegated-click="includeTopicInExam('*')">Trazer os ${outsideTopics.length}</button>` : ''}</section>`
    );
  }

  const general = document.createElement('details');
  general.className = 'exam-general-config';
  general.innerHTML = `<summary>Opções gerais da prova · ${escapeHtml(blueprint.examDate ? formatDatePt(blueprint.examDate) : 'sem data')} · meta ${blueprint.masteryTarget}%</summary>`;
  const main = container.querySelector('.exam-blueprint-main');
  main.before(general);
  general.append(main, container.querySelector('.active-exams'));
  general.open = generalWasOpen;
}
