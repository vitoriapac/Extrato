const sections=[
  ['overview','Visão geral'],['subjects','Disciplinas'],['questions','Questões'],['simulations','Simulados'],['exam','Inteligência da prova'],['consistency','Consistência']
];
const pending={
  questions:{title:'Questões',description:'Evolução da precisão, volume e erros. Até a migração, a análise completa está em Questões e Simulados.',tab:'questoes',action:'Abrir Questões e Simulados'},
  simulations:{title:'Simulados',description:'Resultados, comparação por disciplina e calibração. Os registros e gráficos atuais estão em Questões e Simulados.',tab:'questoes',action:'Abrir Questões e Simulados'},
  subjects:{title:'Disciplinas',description:'A evolução por disciplina e tópico será reunida aqui. Consulte os registros atuais por disciplina.',tab:'disciplinas',action:'Abrir Disciplinas'},
  consistency:{title:'Consistência',description:'Histórico de estudo e execução do plano. Consulte o planejamento atual em Metas.',tab:'metas',action:'Abrir Metas'}
};

export function renderPerformancePage({viewState,range,sectionHtml='',activeExamCount=0,escapeHtml,escapeAttr}={}){
  const nav=sections.map(([key,label])=>`<button type="button" class="performance-section-button${viewState.section===key?' active':''}" data-performance-section="${key}" aria-pressed="${viewState.section===key}">${label}</button>`).join('');
  const intro=pending[viewState.section];
  const body=sectionHtml||(viewState.section==='exam'?'<div id="examIntelligenceMount"></div>':viewState.section==='overview'?'<div class="empty-state empty-state--compact" role="status"><strong>Visão geral de Desempenho</strong><p>Selecione um período para acompanhar a preparação. Os registros desta área aparecerão aqui.</p></div>'
    :`<div class="empty-state empty-state--compact" role="status"><strong>${escapeHtml(intro.title)}</strong><p>${escapeHtml(intro.description)}</p><button type="button" class="btn ghost small" data-performance-open="${escapeAttr(intro.tab)}">${escapeHtml(intro.action)}</button></div>`);
  return `<div class="performance-page"><header class="module-heading"><span class="module-heading__eyebrow">Análise</span><h2 class="module-heading__title">Desempenho</h2><p class="module-heading__description">Acompanhe sua evolução, compare períodos e identifique mudanças na sua preparação.</p></header>
    <nav class="performance-section-nav" aria-label="Análises de desempenho">${nav}</nav>
    ${viewState.section==='exam'?'':`<div class="performance-toolbar ui-filter-bar"><label>Período<select class="select-control" id="performancePeriod" data-performance-period><option value="7" ${viewState.period==='7'?'selected':''}>7 dias</option><option value="30" ${viewState.period==='30'?'selected':''}>30 dias</option><option value="90" ${viewState.period==='90'?'selected':''}>90 dias</option><option value="all" ${viewState.period==='all'?'selected':''}>Tudo</option></select></label>
    <label class="performance-compare"><input type="checkbox" id="performanceCompare" data-performance-compare ${viewState.comparePrevious?'checked':''} ${viewState.period==='all'?'disabled':''}> Comparar com período anterior</label></div>`}
    <p class="performance-scope-note">${viewState.section==='exam'?'Histórico de provas · ':escapeHtml(range.label)+' · '}${activeExamCount?'Concurso ativo · '+activeExamCount+' escopo(s)':'Todos os concursos'}${viewState.section==='exam'?'':range.previous?' · comparação: '+escapeHtml(range.previous.start)+' a '+escapeHtml(range.previous.end):''}</p>
    <div id="performanceSectionContent" aria-live="polite">${body}</div></div>`;
}
