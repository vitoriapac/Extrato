export function renderSimulationRead({item,view,mobile,expanded,escapeHtml,breakdownHtml=''}){
  const hasBreakdown=Boolean(item.breakdown?.length);
  const details=`<button class="btn ghost small ${hasBreakdown?'has-notes':''}" data-delegated-click="toggleBreakdown('${item.id}')">${expanded?'Ocultar detalhes':'Ver desempenho'}</button>`;
  if(mobile)return `<tr class="mobile-history-row" data-id="${item.id}"><td colspan="7"><article class="mobile-history-card"><div class="mobile-card-head"><div><div class="mobile-card-date">${escapeHtml(view.date)}</div><div class="mobile-card-title">${escapeHtml(view.name)}</div></div><button class="btn ghost small" data-delegated-click="editSimulation('${item.id}')">Editar</button></div><div class="mobile-card-metrics"><span>${view.correct} / ${view.total}</span><strong>Nota ${view.score}%</strong>${details}</div></article></td></tr>${expanded?breakdownHtml:''}`;
  return `<tr class="history-read-row history-desktop-row" data-id="${item.id}"><td>${escapeHtml(view.date)}</td><td><div class="row-primary">${escapeHtml(view.name)}</div></td><td class="number-cell">${view.correct}</td><td class="number-cell">${view.total}</td><td class="number-cell">${view.score}%</td><td>${details}</td><td><button class="btn ghost small" data-delegated-click="editSimulation('${item.id}')">Editar</button></td></tr>${expanded?breakdownHtml:''}`;
}

export function renderSimulationBreakdown({item,subjectOptions,subjectIdOf,escapeHtml,escapeAttr}){
  const rows=(item.breakdown||[]).map(row=>{
    const total=Number(row.total)||0,correct=Number(row.correct)||0,subjectId=subjectIdOf(row),accuracy=total?Math.round(correct/total*100):null;
    return `<div class="breakdown-line"><label class="breakdown-subject"><span>Disciplina</span><select class="select-control" data-delegated-change="updateBreakdownRow('${item.id}','${row.id}','subjectId',this.value)"><option value="">Selecione</option>${subjectOptions(subjectId).map(subject=>`<option value="${escapeAttr(subject.id)}" ${subject.id===subjectId?'selected':''}>${escapeHtml(subject.name)}</option>`).join('')}</select></label><label><span>Acertos</span><input type="number" min="0" max="${total||999}" value="${correct}" placeholder="0" data-delegated-blur="updateBreakdownRow('${item.id}','${row.id}','correct',this.value)"></label><label><span>Questões</span><input type="number" min="0" value="${total}" placeholder="0" data-delegated-blur="updateBreakdownRow('${item.id}','${row.id}','total',this.value)"></label><div class="breakdown-result"><span>Aproveitamento</span><strong>${accuracy==null?'—':accuracy+'%'}</strong></div><button class="icon-btn" aria-label="Excluir disciplina do simulado" data-delegated-click="deleteBreakdownRow('${item.id}','${row.id}')">✕</button></div>`;
  }).join('');
  return `<tr class="breakdown-row"><td colspan="7"><div class="breakdown-box"><strong class="breakdown-title">Desempenho por disciplina</strong><div class="breakdown-list">${rows}</div><button class="btn ghost small breakdown-add-btn" data-delegated-click="addBreakdownRow('${item.id}')">+ Adicionar disciplina</button></div></td></tr>`;
}

export function renderSimulationEdit({item,draft,escapeAttr}){
  const hasBreakdown=Boolean(draft.breakdown?.length);
  return `<tr class="row-editing" data-id="${item.id}"><td colspan="7"><div class="inline-edit-form"><label>Data<input type="date" value="${draft.date||''}" data-delegated-change="updateSimulationDraft('date',this.value)"></label><label>Nome<input type="text" value="${escapeAttr(draft.nome||'')}" data-delegated-input="updateSimulationDraft('nome',this.value)"></label><label>Acertos<input type="number" min="0" value="${Number(draft.correct)||0}" ${hasBreakdown?'disabled':''} data-delegated-input="updateSimulationDraft('correct',this.value)"></label><label>Total<input type="number" min="0" value="${Number(draft.total)||0}" ${hasBreakdown?'disabled':''} data-delegated-input="updateSimulationDraft('total',this.value)"></label><div class="inline-edit-actions"><button class="btn ghost small" data-delegated-click="cancelSimulationEdit()">Cancelar</button><button class="btn small" data-delegated-click="saveSimulationEdit()">Salvar alterações</button><button class="btn ghost small" data-delegated-click="deleteSimuladoRow('${item.id}')">Excluir</button></div></div></td></tr>`;
}

export function renderSimulationTrendChart({items=[],scoreFor,formatDate,escapeHtml}){
  const width=640,height=160,padLeft=30,padRight=12,padTop=12,padBottom=26;
  const plotWidth=width-padLeft-padRight,plotHeight=height-padTop-padBottom,count=items.length;
  const xFor=index=>padLeft+(count===1?0:index/(count-1)*plotWidth);
  const yFor=score=>padTop+plotHeight-(score/100)*plotHeight;
  const scores=items.map(scoreFor),points=scores.map((score,index)=>`${xFor(index)},${yFor(score)}`).join(' ');
  const grid=[0,25,50,75,100].map(value=>`<line class="chart-grid" x1="${padLeft}" y1="${yFor(value)}" x2="${width-padRight}" y2="${yFor(value)}"></line><text x="2" y="${yFor(value)+3}">${value}%</text>`).join('');
  const dots=items.map((item,index)=>`<circle class="chart-dot" cx="${xFor(index)}" cy="${yFor(scores[index])}" r="3"><title>${escapeHtml(item.nome||'Simulado')} (${formatDate(item.date)}): ${scores[index]}%</title></circle>`).join('');
  const labels=items.map((item,index)=>`<text x="${xFor(index)}" y="${height-6}" text-anchor="middle">${index+1}</text>`).join('');
  return `<svg class="progress-chart-svg" viewBox="0 0 ${width} ${height}" style="width:100%;height:auto;">${grid}<polyline class="chart-line" points="${points}"></polyline>${dots}${labels}</svg>`;
}

export function renderSubjectPerformanceRows({items=[],escapeHtml}){
  const rows=items.map(({performance,trend})=>{
    const color=trend.key==='up'?'var(--green)':trend.key==='down'?'var(--red)':'var(--ink-soft)';
    const comparison=trend.key==='insufficient'?'Amostra insuficiente':`${trend.previousAccuracy}% → ${trend.recentAccuracy}% (${trend.delta>=0?'+':''}${trend.delta} p.p.)`;
    return `<tr><td>${escapeHtml(performance.subject)}</td><td style="text-align:right;">${performance.acerto}%</td><td style="text-align:right;">${performance.total}</td><td style="text-align:right;color:${color};font-weight:600;">${trend.icon} ${escapeHtml(trend.label)}<small class="trend-comparison">${escapeHtml(comparison)}</small></td></tr>`;
  }).join('');
  const weak=items.map(item=>item.performance).filter(item=>item.acerto<70&&item.total>=5);
  const alerts=weak.map(item=>`<div class="desempenho-alerta">🔴 ${escapeHtml(item.subject)} precisa de atenção.</div>`).join('');
  return `<table class="weekly-history-table" style="margin-bottom:${weak.length?'12px':'0'};"><thead><tr><th>Disciplina</th><th style="text-align:right;">Acerto</th><th style="text-align:right;">Questões</th><th style="text-align:right;">Tendência · 4 semanas × 4 anteriores</th></tr></thead><tbody>${rows}</tbody></table>${alerts}`;
}

export function renderSimulationRows({items=[],visible=5,editingId=null,renderReadRow,renderEditRow,renderFooter}){
  if(!items.length)return `<tr><td colspan="7"><div class="empty-state" style="border:none;"><p>Nenhum simulado registrado ainda.</p><button class="btn small" data-delegated-click="addSimuladoRow()">+ Registrar simulado</button></div></td></tr>`;
  const visibleItems=items.slice(0,visible);
  return visibleItems.map(item=>editingId===item.id?renderEditRow(item):renderReadRow(item)).join('')+renderFooter(items.length,visible,5,
    "changeListLimit('simulations',LIST_VIEW_STEPS.simulations,renderSimulados)",
    "changeListLimit('simulations',-listViewState.simulationsVisible,renderSimulados)",7,'simulados');
}
