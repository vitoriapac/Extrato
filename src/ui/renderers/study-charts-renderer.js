export function renderProgressChart({data,formatDate}){
  if(data.length<2)return `<div class="progress-chart-empty">Continue estudando — o gráfico aparece a partir do segundo dia com dados.</div>`;
  const W=640,H=160,padL=30,padR=12,padT=12,padB=22,plotW=W-padL-padR,plotH=H-padT-padB,n=data.length;
  const xFor=index=>padL+(n===1?0:(index/(n-1))*plotW),yFor=pct=>padT+plotH-(pct/100)*plotH;
  const points=data.map((item,index)=>`${xFor(index)},${yFor(item.pct)}`).join(' ');
  const areaPoints=`${padL},${padT+plotH} ${points} ${xFor(n-1)},${padT+plotH}`;
  const gridLines=[0,25,50,75,100].map(value=>`<line class="chart-grid" x1="${padL}" y1="${yFor(value)}" x2="${W-padR}" y2="${yFor(value)}"></line><text x="2" y="${yFor(value)+3}">${value}%</text>`).join('');
  const stepLabels=n<=6?n:6,labelIndexes=Array.from({length:stepLabels},(_,index)=>Math.round(index*(n-1)/(stepLabels-1||1))),uniqueLabelIndexes=[...new Set(labelIndexes)];
  const dateLabels=uniqueLabelIndexes.map(index=>`<text x="${xFor(index)}" y="${H-4}" text-anchor="middle">${formatDate(data[index].date).slice(0,5)}</text>`).join('');
  const dots=data.map((item,index)=>`<circle class="chart-dot" cx="${xFor(index)}" cy="${yFor(item.pct)}" r="3"><title>${formatDate(item.date)}: ${item.pct}%</title></circle>`).join('');
  return `<svg class="progress-chart-svg" viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;">${gridLines}<polygon class="chart-area" points="${areaPoints}"></polygon><polyline class="chart-line" points="${points}"></polyline>${dots}${dateLabels}</svg>`;
}

export function renderStudyHoursChart({data,targetSeconds,formatDate,formatDuration}){
  if(data.reduce((sum,item)=>sum+item.seconds,0)<=0)return `<div class="progress-chart-empty">Registre sessões para visualizar a evolução das horas.</div>`;
  const W=640,H=180,padL=36,padR=12,padT=16,padB=26,plotW=W-padL-padR,plotH=H-padT-padB;
  const maxSeconds=Math.max(targetSeconds,...data.map(item=>item.seconds),3600);
  const xFor=index=>padL+(index/(data.length-1))*plotW,yFor=seconds=>padT+plotH-(seconds/maxSeconds)*plotH;
  const points=data.map((item,index)=>`${xFor(index)},${yFor(item.seconds)}`).join(' '),gridValues=[0,maxSeconds/2,maxSeconds];
  const grid=gridValues.map(seconds=>`<line class="chart-grid" x1="${padL}" y1="${yFor(seconds)}" x2="${W-padR}" y2="${yFor(seconds)}"></line><text x="2" y="${yFor(seconds)+3}">${(seconds/3600).toFixed(seconds%3600?1:0)}h</text>`).join('');
  const labels=[0,4,9,13].map(index=>`<text x="${xFor(index)}" y="${H-5}" text-anchor="middle">${formatDate(data[index].date).slice(0,5)}</text>`).join('');
  const dots=data.map((item,index)=>`<circle class="chart-dot" cx="${xFor(index)}" cy="${yFor(item.seconds)}" r="3"><title>${formatDate(item.date)} · ${formatDuration(item.seconds)}</title></circle>`).join('');
  const targetLine=targetSeconds>0?`<line x1="${padL}" y1="${yFor(targetSeconds)}" x2="${W-padR}" y2="${yFor(targetSeconds)}" stroke="var(--red)" stroke-width="1.5" stroke-dasharray="5 4"><title>Meta diária: ${formatDuration(targetSeconds)}</title></line>`:'';
  return `<svg class="progress-chart-svg" viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;">${grid}${targetLine}<polyline class="chart-line" points="${points}"></polyline>${dots}${labels}</svg>`;
}

export function renderSubjectHoursBars({rows,getSubjectName,formatDuration,escapeHtml,escapeAttr}){
  if(!rows.length)return `<div class="upcoming-empty">Nenhuma sessão registrada.</div>`;
  const total=rows.reduce((sum,row)=>sum+row.seconds,0);
  return rows.map(row=>{
    const name=row.subjectId==='__none'?'Sem disciplina':getSubjectName(row.subjectId),pct=total>0?Math.round((row.seconds/total)*100):0;
    return `<div class="bar-row"><div class="bar-label" title="${escapeAttr(name)}">${escapeHtml(name)}</div><div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div><div class="bar-pct" title="${pct}% do tempo total">${formatDuration(row.seconds)}</div></div>`;
  }).join('');
}
