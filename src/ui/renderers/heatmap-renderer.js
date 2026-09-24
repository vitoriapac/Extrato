export function renderHeatmap({cells,hasActivity,metric,subjectId,subjects,expanded,onlyActiveDays,defaultWeeks,activityStreak,goalStreak,selectedDate,selectedTooltip,tooltipForSummary,escapeHtml,escapeAttr,pluralize}){
  const cellsHtml=cells.map(summary=>{
    const tooltip=tooltipForSummary(summary);
    return `<button type="button" class="heatmap-cell ${summary.level>0?'heat-'+summary.level:''} ${summary.selected?'selected':''}" title="${escapeAttr(tooltip)}" aria-label="${escapeAttr(tooltip)}" data-delegated-click="selectHeatmapDay('${summary.date}')"></button>`;
  }).join('');
  const subjectOptions=subjects.map(subject=>`<option value="${escapeAttr(subject.id)}" ${subjectId===subject.id?'selected':''}>${escapeHtml(subject.name)}</option>`).join('');
  return `<div class="heatmap-toolbar" aria-label="Período da sequência">
      <select aria-label="Métrica do heatmap" data-delegated-change="setHeatmapFilter('metric',this.value)"><option value="hours" ${metric==='hours'?'selected':''}>Horas</option><option value="questions" ${metric==='questions'?'selected':''}>Questões</option><option value="reviews" ${metric==='reviews'?'selected':''}>Revisões</option><option value="simulations" ${metric==='simulations'?'selected':''}>Simulados</option></select>
      <select aria-label="Disciplina do heatmap" data-delegated-change="setHeatmapFilter('subjectId',this.value)"><option value="">Todas as disciplinas</option>${subjectOptions}</select>
      <span>${expanded?'Período completo':`Últimas ${defaultWeeks} semanas`}</span>
      <button class="btn ghost small" data-delegated-click="toggleStreakExpanded()">${expanded?'Mostrar menos':'Ver período completo'}</button>
      <button class="btn ghost small" aria-pressed="${onlyActiveDays}" data-delegated-click="toggleStreakActiveDays()">${onlyActiveDays?'Mostrar todos os dias':'Apenas dias com atividade'}</button>
    </div>
    <div class="heatmap-grid">${cellsHtml}</div>
    ${hasActivity?'':`<div class="empty-inline heatmap-empty"><p>Nenhuma atividade encontrada para este indicador e disciplina.</p><button class="btn small" data-delegated-click="focusStudyTimer()">Iniciar estudo</button></div>`}
    <div class="heatmap-legend">0%<span class="heatmap-cell"></span><span class="heatmap-cell heat-1"></span><span class="heatmap-cell heat-2"></span><span class="heatmap-cell heat-3"></span>meta atingida</div>
    <div class="heatmap-summary"><span>🔥 Atividade: ${pluralize(activityStreak,'dia')}</span><span>🎯 Meta atingida: ${pluralize(goalStreak,'dia')}</span><span>${metric==='hours'?'Cores: <50% · 50–99% · ≥100% da meta diária':'Intensidade relativa da atividade selecionada'}</span></div>
    ${selectedDate?`<div class="heatmap-detail" role="status">${escapeHtml(selectedTooltip)} <button class="btn ghost small" data-delegated-click="viewSelectedHeatmapSessions()">Ver sessões deste dia</button></div>`:''}`;
}
