import {renderChartFrame,renderChartTooltip} from '../chart-components.js';
const label=(bucket,monthly,formatDate)=>monthly?`${bucket.key.slice(5,7)}/${bucket.key.slice(0,4)}`:formatDate(bucket.key).slice(0,5);

export function renderQuestionEvolution(model,{formatDate}){
  if(model.state==='empty')return renderChartFrame({title:'Precisão ao longo do tempo',emptyMessage:'Registre questões para acompanhar a evolução do desempenho.'});
  const width=Math.max(420,model.buckets.length*48),height=150,left=24,right=16,top=12,bottom=32;
  const x=index=>left+(model.buckets.length===1?0:index/(model.buckets.length-1)*(width-left-right));
  const y=value=>top+(100-value)/100*(height-top-bottom);
  const segments=[];
  for(let index=1;index<model.buckets.length;index++){
    const previous=model.buckets[index-1].movingAccuracy,current=model.buckets[index].movingAccuracy;
    if(previous!==null&&current!==null)segments.push(`<line class="question-evolution-line" x1="${x(index-1)}" y1="${y(previous)}" x2="${x(index)}" y2="${y(current)}"/>`);
  }
  const points=model.buckets.map((item,index)=>item.movingAccuracy===null?'':`<circle class="question-evolution-point" cx="${x(index)}" cy="${y(item.movingAccuracy)}" r="4">${renderChartTooltip(label(item,model.monthly,formatDate)+": média móvel "+item.movingAccuracy+"% · "+item.resolved+" questões")}</circle>`).join('');
  const axis=[0,50,100].map(value=>`<line class="question-evolution-grid" x1="${left}" x2="${width-right}" y1="${y(value)}" y2="${y(value)}"/><text x="0" y="${y(value)+3}">${value}</text>`).join('');
  const labels=model.buckets.map((item,index)=>`<text x="${x(index)}" y="${height-6}" text-anchor="middle">${label(item,model.monthly,formatDate)}</text>`).join('');
  const chart=model.state==='ready'?`<div class="question-evolution-scroll"><svg aria-hidden="true" focusable="false" viewBox="0 0 ${width} ${height}" style="width:${width}px;max-width:none;height:auto">${axis}${segments.join('')}${points}${labels}</svg></div>`:'<p class="analytics-note">A linha aparece após dois períodos com média móvel sustentada por pelo menos 30 questões.</p>';
  const rows=model.buckets.map(item=>{
    const correctWidth=item.correct/item.resolved*100;
    return `<li><span>${label(item,model.monthly,formatDate)}</span><div class="question-mix-track" aria-hidden="true"><span style="width:${correctWidth}%"></span></div><strong>${item.correct} acertos · ${item.errors} erros</strong><small>${item.accuracy===null?'Amostra pequena':item.accuracy+'%'} · média móvel ${item.movingAccuracy===null?'sem amostra':item.movingAccuracy+'%'}</small></li>`;
  }).join('');
  return renderChartFrame({title:'Precisão ao longo do tempo',description:'Média móvel ponderada dos três períodos mais recentes. Pontos com menos de 30 questões ficam ausentes.',period:model.buckets.length?label(model.buckets[0],model.monthly,formatDate)+' a '+label(model.buckets.at(-1),model.monthly,formatDate):'',evidence:model.resolved+' questões no recorte · '+model.accuracy+'% de acerto',legend:[{label:'Precisão média móvel',tone:'primary'}],chart:model.state==='ready'?chart:'',emptyMessage:'São necessários dois períodos com média móvel sustentada por pelo menos 30 questões.',records:renderChartFrame({title:'Acertos × erros por período',description:'Os totais complementam as barras; não é necessário distinguir cores para consultar os resultados.',legend:[{label:'Acertos',tone:'primary'},{label:'Erros',tone:'secondary'}],chart:'<ol class="question-mix-list">'+rows+'</ol>'})});
}
