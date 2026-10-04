import {renderAdherenceTargetSetting} from './adherence-target-renderer.js';

export function renderGoals(model,{adherenceTarget,escapeHtml}={}){
  const card=item=>{
    const unit=item.id==='accuracy'?'%':item.id==='studyDays'?' dias':'';
    const remaining=Math.round((item.remaining??0)*10)/10;
    return `<article class="meta-card"><div class="meta-info"><div class="meta-name">${escapeHtml(item.label)}</div><div class="meta-formula">${escapeHtml(item.description)}</div></div><div class="meta-progress-block"><div class="meta-progress-track"><div class="meta-progress-fill ${item.state==='achieved'?'over':''}" style="width:${item.progressClamped}%"></div></div><div class="meta-progress-label"><span>${item.measured?item.current+unit:'Sem dados'} / ${item.target??'—'}${unit}</span><span>${item.progress==null?'Aguardando registros':item.progress+'%'}</span></div></div><label class="meta-inputs">Meta: <input type="number" min="${item.id==='studyDays'?1:0}" ${item.id==='accuracy'?'max="100"':item.id==='studyDays'?'max="7"':''} step="1" value="${item.target??0}" aria-label="${escapeHtml(item.label)}" data-delegated-blur="updateMeta('${item.key}', this.value)">${unit}</label><small class="result-goal-status">${item.state==='achieved'?'Meta atingida':item.remaining==null?'Aguardando registros':`Faltam ${remaining}${item.id==='accuracy'?' p.p.':unit} para atingir a meta`}</small></article>`;
  };
  const group=(key,title,description,ids,extra='')=>`<section class="goal-group goal-group--${key}" aria-labelledby="goalGroup-${key}"><header class="module-heading module-heading--compact"><h4 class="module-heading__title" id="goalGroup-${key}">${title}</h4><p class="module-heading__description">${description}</p></header>${ids.map(id=>model.items.find(item=>item.id===id)).filter(Boolean).map(card).join('')}${extra}</section>`;
  return group('volume','Volume','Tópicos, questões e simulados. Disponibilidade em horas é configurada separadamente.',['weeklyTopics','monthlyTopics','questions','simulations'],'<a class="btn ghost small" href="#metasCapacity">Configurar disponibilidade em horas</a>')+
    group('routine','Rotina','Consistência e crédito compatível ao planejamento.',['studyDays'],renderAdherenceTargetSetting(adherenceTarget))+
    group('outcome','Resultado','Metas de acerto em questões e simulados. Não representam probabilidade de aprovação.',['accuracy'],'<a class="btn ghost small" href="#subjectAccuracyGoals">Personalizar metas por disciplina</a>');
}
