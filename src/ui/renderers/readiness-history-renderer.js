export function renderReadinessHistory(items=[],{formatDate,escapeHtml}={}){
  if(!items.length)return '<p class="analytics-note">Salve um fechamento semanal para iniciar o histórico de prontidão deste concurso.</p>';
  const rows=items.slice(-12),width=640,height=152,left=32,right=16,top=12,bottom=27,plotWidth=width-left-right,plotHeight=height-top-bottom;
  const x=index=>left+(rows.length===1?plotWidth/2:index*plotWidth/(rows.length-1)),y=score=>top+plotHeight-(score/100)*plotHeight;
  const points=rows.map((item,index)=>`${x(index)},${y(item.score)}`).join(' ');
  const grid=[0,25,50,75,100].map(value=>`<line class="chart-grid" x1="${left}" y1="${y(value)}" x2="${width-right}" y2="${y(value)}"></line><text x="1" y="${y(value)+3}">${value}</text>`).join('');
  const dots=rows.map((item,index)=>`<circle class="chart-dot" cx="${x(index)}" cy="${y(item.score)}" r="4"><title>${escapeHtml(formatDate(item.date))}: ${item.score}/100 · confiança ${escapeHtml(item.confidenceLabel)}</title></circle>`).join('');
  const first=rows[0],last=rows.at(-1),change=rows.length>1?last.score-first.score:null;
  return `<p class="analytics-note">${rows.length} ${rows.length===1?'fechamento':'fechamentos'} salvos · ${escapeHtml(formatDate(first.date))} a ${escapeHtml(formatDate(last.date))}${change==null?'':` · variação ${change>=0?'+':''}${change} pontos`}. Cada ponto preserva o cálculo e o concurso ativo da data do registro.</p><svg class="progress-chart-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="Evolução do Índice de Prontidão nos fechamentos salvos">${grid}${rows.length>1?`<polyline class="chart-line" points="${points}"></polyline>`:''}${dots}</svg><ol class="simulation-trend-list">${rows.map(item=>`<li>${escapeHtml(formatDate(item.date))}: <strong>${item.score}/100</strong> · confiança ${escapeHtml(item.confidenceLabel)}</li>`).join('')}</ol>`;
}
