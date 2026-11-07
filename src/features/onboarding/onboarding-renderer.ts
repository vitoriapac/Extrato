import { escapeHtml as defaultEscapeHtml } from '../../core/utils.js';
import { renderIconSvg } from '../../ui/primitives/icon.js';
const stepCopy: Record<string, any> = {
  goal: {
    title: 'Qual é o seu objetivo?',
    help: 'Defina a data se já souber. Você também pode continuar sem ela e informar depois.',
    why: 'A data da prova permite distribuir a carga sem concentrar tudo nas últimas semanas.',
    benefits: [
      'calcular o ritmo necessário',
      'medir a urgência de cada tópico',
      'priorizar o que mais impacta a prova',
    ],
    tip: 'Sem uma data, você ainda pode explorar o app. Para criar o primeiro plano, será preciso informar um prazo.',
  },
  availability: {
    title: 'Quanto tempo cabe na sua semana?',
    help: 'Informe horas realistas. Você poderá alterar a disponibilidade depois.',
    why: 'O plano respeita o tempo que realmente cabe na sua rotina, incluindo dias sem estudo.',
    benefits: [
      'limitar a carga diária',
      'reservar espaço para revisões',
      'identificar déficit de capacidade',
    ],
    tip: 'Prefira uma disponibilidade sustentável. Consistência costuma valer mais que uma meta difícil de manter.',
  },
  content: {
    title: 'Quais conteúdos entram no plano?',
    help: 'Importe um edital ou cadastre matérias próprias e indique o nível inicial.',
    why: 'O Extrato de Estudos usa o conteúdo selecionado para comparar domínio, importância e esforço restante.',
    benefits: [
      'gerar prioridades por tópico',
      'evitar duplicidades no edital',
      'adaptar o esforço à sua base',
    ],
    tip: 'Você pode importar apenas parte do edital e completar as disciplinas manualmente depois.',
  },
  plan: {
    title: 'Confira a capacidade e crie o primeiro plano',
    help: 'A prévia não altera seus dados. O plano só será criado após sua confirmação.',
    why: 'Esta é a conferência final entre prazo, capacidade semanal e carga estimada.',
    benefits: [
      'criar atividades para hoje',
      'distribuir teoria, questões e revisão',
      'manter margem para ajustes',
    ],
    tip: 'Nada será salvo no calendário antes da confirmação.',
  },
};
const entryStepLabels: Record<string, any> = {
  goal: 'Objetivo e data',
  availability: 'Disponibilidade',
  content: 'Edital ou matérias',
  plan: 'Prévia e Hoje',
};

export function renderOnboardingEntry(
  model: Record<string, any>,
  { escapeHtml = defaultEscapeHtml }: any = {}
) {
  const steps = model.steps || [],
    next = model.next || steps[0],
    complete = model.completed || 0,
    total = steps.length,
    title = complete ? 'Continue sua configuração' : 'Monte seu plano de estudos';
  const description = complete
    ? `Falta concluir ${escapeHtml(next?.label || 'a configuração inicial')}. Suas escolhas já feitas serão preservadas.`
    : next?.id === 'goal'
      ? 'Escolha a data da prova se já souber. Se ainda não souber, continue sem prazo e explore o app.'
      : `Roteiro de 4 etapas: comece por ${escapeHtml(next?.label || 'seu objetivo')} para transformar o edital em metas diárias na sua rotina.`;
  const progress = total ? Math.round((complete / total) * 100) : 0;
  const stepItems = steps
    .map((step: any, index: any) => {
      const status =
        step.status ||
        (step.skipped
          ? 'skipped'
          :
        (step.complete === true || (step.complete == null && index < complete)
          ? 'complete'
          : step.id === next?.id
            ? 'current'
            : 'pending'));
      return `<li class="${status === 'complete' ? 'is-complete' : status === 'current' ? 'is-next' : ''}"${status === 'current' ? ' aria-current="step"' : ''}><span aria-hidden="true">${status === 'complete' ? '✓' : status === 'skipped' ? '—' : index + 1}</span><div class="onboarding-entry-step-copy"><em>${escapeHtml(step.label || entryStepLabels[step.id] || 'Etapa')}</em><small>${status === 'complete' ? 'Concluída' : status === 'skipped' ? 'Sem data' : status === 'current' ? 'Atual' : 'Pendente'}</small></div></li>`;
    })
    .join('');
  return `<div class="onboarding-entry-copy"><div class="onboarding-entry-main"><span class="onboarding-kicker">CONFIGURAÇÃO INICIAL</span><div class="onboarding-entry-heading"><h3 id="guidedOnboardingEntryTitle">${title}</h3><span class="onboarding-entry-count">${complete} de ${total} etapas</span></div><p>${description}</p><div class="onboarding-entry-progress" role="progressbar" aria-label="Progresso da configuração inicial" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${complete}" aria-valuetext="${complete} de ${total} etapas concluídas"><span style="width:${progress}%"></span></div><ol class="onboarding-entry-steps" aria-label="Etapas da configuração">${stepItems}</ol></div></div><button class="btn ghost onboarding-entry-cta" type="button" data-guided-action="open">${complete ? 'Continuar configuração' : 'Montar meu plano'}${renderIconSvg('arrow-right', { size: 14, className: 'icon-inline icon-inline--end' })}</button>`;
}

export function renderOnboardingProgress(model: Record<string, any>) {
  return model.steps
    .map((step: any, index: any) => {
      const current = step.id === model.current?.id,
        skipped = step.skipped && index < model.currentIndex,
        complete = step.complete && index < model.currentIndex && !step.skipped,
        state = current ? 'step' : 'false';
      return `<span class="${current ? 'is-current' : complete ? 'is-complete' : skipped ? 'is-skipped' : ''}" data-onboarding-step="${step.id}" aria-current="${state}"${skipped ? ' aria-label="Data da prova, sem data"' : ''}><b>${skipped ? '—' : complete ? '✓' : index + 1}</b><em>${step.label}</em></span>`;
    })
    .join('');
}

export function renderOnboardingHelp(
  model: Record<string, any>,
  { escapeHtml = defaultEscapeHtml }: any = {}
) {
  const step = model.current || model.next || model.steps?.[0],
    copy =
      step.id === 'plan' && !model.hasGoal
        ? {
            why: 'O prazo da prova transforma sua rotina e matérias em prioridades semanais.',
            benefits: [
              'manter sua rotina e matérias salvas',
              'explorar o app sem criar um plano',
              'informar a data depois em Planejamento',
            ],
            tip: 'Sem data, o botão final abre o app sem gerar um plano semanal.',
          }
        : stepCopy[step.id] || stepCopy.goal;
  return `<span class="onboarding-kicker">POR QUE ISSO IMPORTA?</span><h3>${escapeHtml(copy.why)}</h3><ul>${copy.benefits.map((item: any) => `<li><span aria-hidden="true">✓</span>${escapeHtml(item)}</li>`).join('')}</ul><div class="onboarding-tip"><strong>Dica</strong><p>${escapeHtml(copy.tip)}</p></div>`;
}

export function renderOnboardingContent(
  model: Record<string, any>,
  {
    escapeHtml = defaultEscapeHtml,
    escapeAttr = escapeHtml,
    formatMinutes = (value: unknown) => `${value} min`,
  }: any = {}
) {
  const step = model.current || model.next || model.steps?.[0],
    copy = stepCopy[step.id] || stepCopy.goal;
  if (step.id === 'goal') {
    const shortcuts = (model.dateShortcuts || [])
      .map((shortcut: any) => {
        const isActive = shortcut.offsetDays === model.activeDateShortcut;
        return `<button type="button" class="btn ghost small guided-shortcut-btn${isActive ? ' is-active' : ''}" data-guided-date-offset="${shortcut.offsetDays}" aria-pressed="${isActive}" aria-label="Definir data para ${escapeAttr(shortcut.label)} (${escapeAttr(shortcut.sublabel)})">${escapeHtml(shortcut.label)} <small>(${escapeHtml(shortcut.sublabel)})</small></button>`;
      })
      .join('');
    const shortcutsGroup = shortcuts
      ? `<div class="guided-date-shortcuts" role="group" aria-label="Atalhos de data da prova"><span class="guided-shortcut-title">Sem edital publicado? Escolha um prazo estimado para começar:</span><div class="guided-shortcut-chips">${shortcuts}</div></div>`
      : '';
    const optionalDate = `<details class="grid gap-3"${model.examDate ? ' open' : ''}><summary class="btn ghost small justify-self-start list-none">${renderIconSvg('plus', { size: 14, className: 'icon-inline icon-inline--start' })}Data da prova (opcional)</summary><label for="guidedExamDate">Data da prova<input id="guidedExamDate" type="date" min="${escapeAttr(model.today)}" value="${escapeAttr(model.examDate || '')}"></label>${shortcutsGroup}</details>`;
    const customExamField =
      model.presetId === 'custom'
        ? `<label for="guidedCustomExamName">Nome do concurso ou exame<input id="guidedCustomExamName" type="text" placeholder="Ex: OAB, Residência Médica, Vestibular..." value="${escapeAttr(model.customExamName || '')}"></label>`
        : '';
    return `<div class="guided-onboarding-panel"><h3>${copy.title}</h3><p>${copy.help}</p><label for="guidedExamPreset">Concurso ou exame<select id="guidedExamPreset" aria-label="Concurso do primeiro acesso"><option value="undecided" ${!model.presetId || model.presetId === 'undecided' ? 'selected' : ''}>Ainda não escolhi um concurso</option>${model.presets.map((item: any) => `<option value="${escapeAttr(item.id)}" ${item.id === model.presetId ? 'selected' : ''}>${escapeHtml(item.name.replace('Tecnologia da Informação', 'TI'))}</option>`).join('')}<option value="custom" ${model.presetId === 'custom' ? 'selected' : ''}>Outro concurso ou exame...</option></select></label>${customExamField}${optionalDate}</div>`;
  }
  if (step.id === 'availability') {
    const presets = (model.availabilityPresets || [])
      .map((preset: any) => {
        const isActive = preset.id === model.activeAvailabilityPreset;
        return `<button type="button" class="btn ghost small guided-preset-btn${isActive ? ' is-active' : ''}" data-guided-availability-preset="${escapeAttr(preset.id)}" aria-pressed="${isActive}" aria-label="Aplicar rotina ${escapeAttr(preset.label)}">${escapeHtml(preset.label)}</button>`;
      })
      .join('');
    const presetsGroup = presets
      ? `<div class="guided-routine-presets" role="group" aria-label="Rotinas sugeridas"><span class="guided-shortcut-title">Rotinas sugeridas em 1 clique:</span><div class="guided-shortcut-chips">${presets}</div></div>`
      : '';
    const sustainabilityCallout = model.routineSustainability?.isExcessive
      ? `<div class="guided-sustainability-callout" data-sustainability="${escapeAttr(model.routineSustainability.statusTag)}"><strong>${renderIconSvg('bulb', { size: 14, className: 'inline-block align-middle mr-1' })}Dica de sustentabilidade (${escapeHtml(model.routineSustainability.statusTag)}):</strong><p>${escapeHtml(model.routineSustainability.feedbackMessage)}</p></div>`
      : '';
    const customizeOpen = model.availableMinutes > 0 && !model.activeAvailabilityPreset;
    return `<div class="guided-onboarding-panel"><h3>${copy.title}</h3><p>${copy.help}</p>${presetsGroup}<details id="guidedAvailabilityDetails" class="grid gap-3 border-t border-border-default pt-3"${customizeOpen ? ' open' : ''}><summary class="cursor-pointer font-medium text-text">Personalizar dias e horários</summary><div class="guided-availability">${model.weekdays.map((item: any) => `<label for="guided-day-${item.day}"><span>${escapeHtml(item.label)}</span><input id="guided-day-${item.day}" type="number" min="0" max="24" step="0.25" value="${item.hours}" data-guided-day="${item.day}" aria-label="Horas disponíveis em ${escapeAttr(item.label)}"><small>h</small></label>`).join('')}</div><button type="button" class="btn ghost small justify-self-start" data-guided-action="rest-sunday" aria-label="Zerar domingo para descanso semanal">${renderIconSvg('sun', { size: 14, className: 'inline-block align-middle mr-1' })}Folga aos domingos</button></details><div class="guided-capacity"><strong>${formatMinutes(model.availableMinutes)}</strong><span>de capacidade semanal</span></div>${sustainabilityCallout}</div>`;
  }
  if (step.id === 'content') {
    const bulkLevels = model.subjects.length
      ? `<div class="guided-bulk-levels" role="group" aria-label="Nivelamento rápido"><span>Aplicar a todas:</span><button type="button" class="btn ghost small" data-guided-bulk-level="Médio">Intermediária (Recomendado)</button><button type="button" class="btn ghost small" data-guided-bulk-level="Difícil">Começar da base</button><button type="button" class="btn ghost small" data-guided-bulk-level="Fácil">Tenho boa base</button></div>`
      : '';
    const starterPacks = model.starterPacks || [];
    const selectedPath = (model.contentPaths || []).find((path: any) => path.primary);
    const recommendedPack = !model.subjects.length && !selectedPath ? starterPacks[0] : null;
    const renderPack = (pack: any) => {
      const subjectsBadges = (pack.subjects || [])
        .map(
          (subject: any) =>
            `<span class="guided-pack-subject-tag text-xs px-1.5 py-0.5 rounded bg-surface-subtle text-content-secondary border border-border-subtle inline-block mr-1 mt-1">${escapeHtml(subject.name)}</span>`
        )
        .join('');
      const subjectsList = subjectsBadges
        ? `<div class="guided-starter-pack-subjects mt-2 flex flex-wrap gap-1" aria-label="Disciplinas inclusas">${subjectsBadges}</div>`
        : '';
      const badgeHtml = pack.badge
        ? `<span class="status-badge status-badge--success">${escapeHtml(pack.badge)}</span>`
        : '';
      return `<button type="button" class="guided-starter-pack-btn" data-guided-starter-pack="${escapeAttr(pack.id)}" aria-label="Adicionar matérias do pacote ${escapeAttr(pack.name)}"><div class="guided-starter-pack-copy"><div class="guided-starter-pack-head"><strong>${escapeHtml(pack.name)}</strong>${badgeHtml}</div><small>${escapeHtml(pack.description)}</small>${subjectsList}</div><span class="guided-starter-pack-cta">Adicionar matérias${renderIconSvg('arrow-right', { size: 14, className: 'icon-inline icon-inline--end' })}</span></button>`;
    };
    const recommendedHtml = selectedPath
      ? `<div class="guided-starter-packs" role="group" aria-label="Ação recomendada"><span class="guided-shortcut-title">Comece pelo edital escolhido</span><div class="study-plan-actions"><button type="button" class="btn" data-guided-action="${escapeAttr(selectedPath.action)}">${escapeHtml(selectedPath.label)}</button></div></div>`
      : recommendedPack
        ? `<div class="guided-starter-packs" role="group" aria-label="Sugestão para começar"><span class="guided-shortcut-title">Sugestão para começar</span><div class="guided-starter-pack-list">${renderPack(recommendedPack)}</div><p class="text-sm text-content-secondary m-0">Esse pacote é geral. Se seu concurso for de outra área, você pode escolher outro caminho.</p></div>`
        : '';
    const alternativePacks = starterPacks.filter((pack: any) => pack !== recommendedPack);
    const alternativePaths = (model.contentPaths || []).filter(
      (path: any) => path !== selectedPath
    );
    const alternativesHtml =
      alternativePacks.length || alternativePaths.length
        ? `<details class="guided-content-alternatives grid gap-3 border-t border-border-default pt-3"><summary class="cursor-pointer font-medium text-text">Escolher outra forma de adicionar conteúdo</summary>${alternativePacks.length ? `<div class="guided-starter-pack-list">${alternativePacks.map(renderPack).join('')}</div>` : ''}${alternativePaths.length ? `<div class="study-plan-actions">${alternativePaths.map((path: any) => `<button type="button" class="btn ghost" data-guided-action="${escapeAttr(path.action)}">${escapeHtml(path.label)}</button>`).join('')}</div>` : ''}</details>`
        : '';
    const levelsHtml = model.subjects.length
      ? `${bulkLevels}<div class="guided-levels"><p><strong>Nível inicial por disciplina</strong></p>${model.subjects.map((subject: any) => `<label for="guided-level-${escapeAttr(subject.id)}"><span>${escapeHtml(subject.name)}</span><select id="guided-level-${escapeAttr(subject.id)}" data-guided-level="${escapeAttr(subject.id)}"><option value="Fácil" ${subject.level === 'Fácil' ? 'selected' : ''}>Tenho boa base</option><option value="Médio" ${subject.level === 'Médio' ? 'selected' : ''}>Base intermediária</option><option value="Difícil" ${subject.level === 'Difícil' ? 'selected' : ''}>Preciso começar pela base</option></select></label>`).join('')}</div>`
      : '<div class="upcoming-empty">Escolha a sugestão ou abra outras formas de adicionar conteúdo.</div>';
    return `<div class="guided-onboarding-panel"><h3>${copy.title}</h3><p>${copy.help}</p>${recommendedHtml}${alternativesHtml}${levelsHtml}</div>`;
  }
  const activities = (model.firstActivities || [])
    .map(
      (item: any) =>
        `<li><span><strong>${escapeHtml(item.subject)}</strong><small>${escapeHtml(item.topic)}</small></span><b>${item.minutes} min</b></li>`
    )
    .join('');
  const feasibilityHtml = model.planFeasibility
    ? `<div class="guided-feasibility-card" data-feasibility="${escapeAttr(model.planFeasibility.status)}"><div class="guided-feasibility-header"><span class="status-badge ${model.planFeasibility.status === 'comfortable' || model.planFeasibility.status === 'balanced' ? 'status-badge--success' : 'status-badge--warning'}">${escapeHtml(model.planFeasibility.badgeText)}</span><p class="guided-feasibility-message">${escapeHtml(model.planFeasibility.verdictMessage)}</p></div></div>`
    : '';
  const flexibilityNote = `<p class="guided-flexibility-note text-xs text-content-secondary mt-2.5 leading-relaxed">${renderIconSvg('info-circle', { size: 14, className: 'inline-block align-middle mr-1' })}<strong>Total flexibilidade:</strong> Você poderá adicionar novas matérias, editar tópicos ou ajustar sua rotina semanal a qualquer momento na aba Disciplinas.</p>`;
  const title = model.hasGoal ? copy.title : 'Sua configuração está pronta para explorar';
  const help = model.hasGoal
    ? copy.help
    : 'Sem data de prova, não dá para calcular o prazo e criar um plano semanal. Você pode abrir o app agora e informar a data depois em Planejamento.';
  const examDate = /^\d{4}-\d{2}-\d{2}$/.test(model.examDate || '') ? model.examDate.split('-').reverse().join('/') : 'Não informada';
  const subjectNames = (model.subjects || []).map((subject: any) => escapeHtml(subject.name)).join(', ');
  return `<div class="guided-onboarding-panel"><h3>${title}</h3><p>${help}</p><p>Prova: <strong>${escapeHtml(examDate)}</strong> · Matérias: ${subjectNames || 'Nenhuma'}</p><div class="study-plan-summary"><div><strong>${formatMinutes(model.availableMinutes)}</strong><span>capacidade semanal</span></div><div><strong>${formatMinutes(model.weeklyPlannedMinutes || 0)}</strong><span>alocado na semana</span></div><div><strong>${model.topicCount}</strong><span>tópicos ativos</span></div><div><strong>${formatMinutes(model.estimatedNeedMinutes)}</strong><span>carga estimada</span></div><div><strong>${model.weeksUntilExam == null ? '—' : model.weeksUntilExam}</strong><span>semanas até a prova</span></div></div>${feasibilityHtml}${activities ? `<section class="onboarding-first-activities" aria-labelledby="onboardingFirstActivitiesTitle"><h5 id="onboardingFirstActivitiesTitle">Distribuição semanal por tópico</h5><ul>${activities}</ul></section>` : ''}${flexibilityNote}${
    model.canCreatePlan
      ? '<p class="confidence-note">Os minutos acima são alocações semanais por tópico. A distribuição diária divide essa carga em atividades conforme a disponibilidade.</p>'
      : model.canConfigurePlan
        ? `<div class="availability-warning"><p>Não há atividade elegível nesta proposta. ${model.planReasons
            .map((reason: any) =>
              escapeHtml(
                typeof reason === 'string' ? reason : reason.message || reason.reason || ''
              )
            )
            .filter(Boolean)
            .join(
              ' · '
            )}</p><div class="study-plan-actions"><button class="btn ghost small" data-guided-action="manual">Revisar tópicos e pré-requisitos</button><button class="btn ghost small" data-guided-action="availability">Ajustar disponibilidade</button></div></div>`
        : model.canExploreWithoutPlan
          ? '<p class="availability-warning">A rotina e as matérias estão prontas. Você poderá criar o plano depois de informar a data da prova em Planejamento.</p>'
          : '<p class="availability-warning">Complete data, disponibilidade e conteúdo antes de criar o plano.</p>'
  }</div>`;
}

const BLOCKED_REASONS: Record<string, any> = {
  goal: 'Informe a data da prova para continuar.',
  availability: 'Defina horas em pelo menos um dia para continuar.',
  content: 'Escolha um edital, importe um arquivo ou cadastre matérias para ver a prévia.',
  plan: 'Revise a prévia: ainda não há atividades elegíveis para criar o plano.',
};
// A disabled primary action always says why, next to the button and through aria-describedby.
export function onboardingBlockedReason(model: Record<string, any>) {
  const id = model.current?.id || 'goal',
    ready =
      id === 'content'
        ? model.hasContent
        : id === 'plan'
          ? model.canCreatePlan || model.canExploreWithoutPlan
          : model.canAdvance;
  return id === 'content' && model.manualDraftError ? model.manualDraftError : ready ? '' : BLOCKED_REASONS[id] || '';
}
export function renderOnboardingActions(model: Record<string, any>) {
  const reason = onboardingBlockedReason(model),
    hint = reason ? `<p class="guided-action-hint" id="guidedActionHint">${reason}</p>` : '',
    described = reason ? ' aria-describedby="guidedActionHint"' : '';
  return hint + renderOnboardingButtons(model).replace(/ disabled>/, ` disabled${described}>`);
}
function renderOnboardingButtons(model: Record<string, any>) {
  const id = model.current?.id || 'goal',
    previous =
      model.currentIndex > 0
        ? '<button class="btn ghost" data-guided-action="back">← Voltar</button>'
        : '<button class="btn ghost" data-guided-action="cancel">Cancelar</button>';
  if (id === 'content')
    return `${previous}<button class="btn" data-guided-action="next" ${model.hasContent ? '' : 'disabled'}>Ver prévia${renderIconSvg('arrow-right', { size: 14, className: 'icon-inline icon-inline--end' })}</button>`;
  if (id === 'plan' && model.canExploreWithoutPlan)
    return `${previous}<button class="btn" data-guided-action="explore-no-plan">Explorar o app sem criar plano</button>`;
  if (id === 'plan')
    return `${previous}<button class="btn" data-guided-action="create-plan" ${model.canCreatePlan ? '' : 'disabled'}>Confirmar e criar meu plano</button>`;
  const nextLabel = id === 'goal' && !model.hasGoal ? 'Continuar sem data' : 'Continuar';
  return `${previous}<button class="btn" data-guided-action="next" ${model.canAdvance ? '' : 'disabled'}>${nextLabel}${renderIconSvg('arrow-right', { size: 14, className: 'icon-inline icon-inline--end' })}</button>`;
}


