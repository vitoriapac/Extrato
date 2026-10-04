const escape=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const minutes=value=>Math.max(0,Number(value)||0);
export function renderHelpVisual(visual){
  if(!visual)return '';
  const metric=(label,value)=>`<div class="instruction-metric"><strong>${minutes(value)} min</strong><span>${escape(label)}</span></div>`;
  const steps=(items,className)=>`<ol class="${className}">${(items||[]).map((step,index)=>`<li><span class="instruction-step-number" aria-hidden="true">${String(index+1).padStart(2,'0')}</span><strong>${escape(step.title)}</strong><small>${escape(step.detail)}</small></li>`).join('')}</ol>`;
  let content='';
  switch(visual.type){
    case 'flow':content=steps(visual.steps,'instruction-flow');break;
    case 'reviews':content=steps(visual.steps,'instruction-steps');break;
    case 'comparison':content=`<div class="instruction-comparison">${metric('Planejado',visual.planned)}${metric('Realizado',visual.actual)}</div><p class="instruction-legend">O tempo registrado pode ser diferente do previsto.</p>`;break;
    case 'daily':content=`<div class="instruction-comparison">${metric('Planejado',visual.planned)}${metric('Realizado',visual.actual)}</div><p>${minutes(visual.progress)}% de progresso do plano</p><div class="instruction-example-bar" aria-hidden="true"><span style="width:${Math.min(100,minutes(visual.progress))}%"></span></div><p class="instruction-legend">${minutes(visual.completed)} de ${minutes(visual.total)} atividade concluída</p>`;break;
    case 'action':content=`<strong>${escape(visual.subject)}</strong><p>${escape(visual.topic)}</p><p>${escape(visual.activity)} · ${minutes(visual.minutes)} min</p><span class="instruction-action">▶ Iniciar estudo</span><p class="instruction-legend">Representação de uma atividade; não inicia uma sessão.</p>`;break;
    default:return '';
  }
  return `<figure class="instruction-example"><figcaption>Exemplo ilustrativo · ${escape(visual.title)}</figcaption>${content}</figure>`;
}
