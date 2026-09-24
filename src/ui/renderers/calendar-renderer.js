export function renderCalendarRead({item,view,mobile,escapeHtml,daysPill,statusClass,today}){if(mobile)return`<tr class="mobile-history-row" data-id="${item.id}"><td colspan="7"><article class="mobile-history-card"><div class="mobile-card-head"><div><div class="mobile-card-date">${escapeHtml(view.date)} · ${escapeHtml(view.week)}</div><div class="mobile-card-title">${escapeHtml(view.subject)}</div><div class="mobile-card-subtitle">${escapeHtml(view.reviewType)}</div></div><button class="btn ghost small" data-delegated-click="editCalendarItem('${item.id}')">Editar</button></div><div class="mobile-card-metrics"><span>${escapeHtml(view.status)}</span><span>${daysPill}</span></div><div class="mobile-card-actions">${view.pending?`<button class="btn small history-primary-action" data-delegated-click="completeCalendarItem('${item.id}')">Concluir</button>`:''}</div></article></td></tr>`;return`<tr class="history-read-row history-desktop-row ${item.date===today?'today':''}" data-id="${item.id}"><td>${escapeHtml(view.date)}</td><td>${escapeHtml(view.week)}</td><td><div class="row-primary">${escapeHtml(view.subject)}</div></td><td><span class="history-status ${statusClass[item.status]||''}">${escapeHtml(view.status)}</span></td><td>${escapeHtml(view.reviewType)}</td><td>${daysPill}</td><td><div class="row-actions">${view.pending?`<button class="btn small" data-delegated-click="completeCalendarItem('${item.id}')">Concluir</button>`:''}<button class="btn ghost small" data-delegated-click="editCalendarItem('${item.id}')">Editar</button></div></td></tr>`}
export function renderCalendarEdit({item,draft,subjectOptions,statusOptions,reviewOptions,escapeAttr}){if(!draft)return'';return`<tr class="row-editing" data-id="${item.id}"><td colspan="7"><div class="inline-edit-form"><label>Data<input type="date" value="${draft.date||''}" data-delegated-change="updateCalendarDraft('date',this.value)"></label><label>Semana<input type="text" value="${escapeAttr(draft.week||'')}" data-delegated-input="updateCalendarDraft('week',this.value)"></label><label>Disciplina<select data-delegated-change="updateCalendarDraft('subjectId',this.value||null)"><option value="">Sem disciplina</option>${subjectOptions}</select></label><label>Status<select data-delegated-change="updateCalendarDraft('status',this.value)">${statusOptions}</select></label><label>Tipo de revisão<select data-delegated-change="updateCalendarDraft('reviewType',this.value)">${reviewOptions}</select></label><div class="inline-edit-actions"><button class="btn ghost small" data-delegated-click="cancelCalendarEdit()">Cancelar</button><button class="btn small" data-delegated-click="saveCalendarEdit()">Salvar alterações</button><button class="btn ghost small" data-delegated-click="deleteCalRow('${item.id}')">Excluir</button></div></div></td></tr>`}

export function renderCalendarIndicators({items=[],today,daysUntil}){
  const total=items.length;
  const overdue=items.filter(item=>item.date&&item.date<today&&item.status!=='Concluído').length;
  const todayCount=items.filter(item=>item.date===today).length;
  const upcoming=items.filter(item=>{const days=daysUntil(item.date);return days!==null&&days>0&&days<=7}).length;
  return `<div class="kpi-cell"><div class="n">${total}</div><div class="l">Itens no total</div></div>
    <div class="kpi-cell ${overdue>0?'warn':''}"><div class="n">${overdue}</div><div class="l">Atrasadas</div></div>
    <div class="kpi-cell ${todayCount>0?'ok':''}"><div class="n">${todayCount}</div><div class="l">Hoje</div></div>
    <div class="kpi-cell"><div class="n">${upcoming}</div><div class="l">Próximos 7 dias</div></div>`;
}

export function renderCalendarMonth({month,events=[],filterSubject='',filterStatus='',today,daysUntil,escapeHtml,escapeAttr,maxEventsPerDay=3}){
  const year=month.getFullYear(),monthIndex=month.getMonth();
  const visibleEvents=events.filter(event=>(!filterSubject||event.subjectId===filterSubject)&&(!filterStatus||event.status===filterStatus));
  const firstDay=new Date(year,monthIndex,1),cursor=new Date(firstDay);
  cursor.setDate(cursor.getDate()-cursor.getDay());
  const title=month.toLocaleDateString('pt-BR',{month:'long',year:'numeric'});
  let html='<div class="month-grid-wrap"><div class="month-grid">'+['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map(day=>`<div class="month-header">${day}</div>`).join('');
  for(let index=0;index<42;index++){
    const iso=`${cursor.getFullYear()}-${String(cursor.getMonth()+1).padStart(2,'0')}-${String(cursor.getDate()).padStart(2,'0')}`;
    const dayEvents=visibleEvents.filter(event=>event.date===iso),isToday=iso===today,outside=cursor.getMonth()!==monthIndex;
    html+=`<div class="month-day ${outside?'outside':''} ${isToday?'today':''}"><div class="day-number">${cursor.getDate()}</div>`;
    dayEvents.slice(0,maxEventsPerDay).forEach(event=>{
      let className='event-futura';
      if(event.status==='Concluído')className='event-concluida';
      else{const days=daysUntil(event.date);if(days!==null&&days<0)className='event-atrasada';else if(days===0)className='event-hoje'}
      const tooltip=`${event.subject||'—'} · ${event.label} (${event.origem})`;
      html+=`<div class="cal-event ${className}" title="${escapeAttr(tooltip)}">${escapeHtml(event.subject||event.label)}</div>`;
    });
    if(dayEvents.length>maxEventsPerDay)html+=`<div class="cal-event-more">+${dayEvents.length-maxEventsPerDay} mais</div>`;
    html+='</div>';cursor.setDate(cursor.getDate()+1);
  }
  return {title:title.charAt(0).toUpperCase()+title.slice(1),html:html+'</div></div>'};
}

export function renderCalendarFilterOptions({subjects=[],monthKeys=[],reviewTypes=[],selectedSubject='',selectedMonth='',selectedType='',escapeHtml,escapeAttr,monthLabel}){
  return {
    subjects:`<option value="">Todas as disciplinas</option>${subjects.map(subject=>`<option value="${escapeAttr(subject.id)}">${escapeHtml(subject.name)}</option>`).join('')}`,
    months:`<option value="">Todos os meses</option>${monthKeys.map(key=>`<option value="${escapeAttr(key)}">${escapeHtml(monthLabel(key))}</option>`).join('')}`,
    types:`<option value="">Todos os tipos de revisão</option>${reviewTypes.filter(type=>type!=='—').map(type=>`<option value="${escapeAttr(type)}">${escapeHtml(type)}</option>`).join('')}`
  };
}

export function renderCalendarRows({rows=[],visible=10,editingId=null,renderReadRow,renderEditRow,renderFooter,escapeHtml}){
  if(!rows.length)return `<tr><td colspan="7"><div class="empty-state" style="border:none;"><p>Nenhum item encontrado com esses filtros.</p><button class="btn" data-delegated-click="addCalRow()">+ Adicionar item</button></div></td></tr>`;
  return rows.slice(0,visible).map(item=>editingId===item.id?renderEditRow(item):renderReadRow(item)).join('')+renderFooter({total:rows.length,visible,showMoreAction:'changeCalendarLimit(10)',showLessAction:visible>10?'resetCalendarLimit()':'',colspan:7,label:'itens'});
}
