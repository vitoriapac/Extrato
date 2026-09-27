import {renderHelpCenter} from './help-renderer.js';

const DESTINATIONS=Object.freeze({
  subjects:{tab:'disciplinas',selector:'#addSubjectBtn'},overview:{tab:'dashboard',selector:'#balanceFigure'},timer:{tab:'dashboard',selector:'#timerSubjectSelect'},
  questions:{tab:'questoes',selector:'#addQuestaoRowBtn'},reviews:{tab:'agenda',selector:'#addAgendaRowBtn'},today:{tab:'hoje',selector:'#panel-hoje'},calendar:{tab:'calendario',selector:'#panel-calendario'},
  planning:{tab:'metas',selector:'#examStudyPlan'},weekly:{tab:'dashboard',selector:'#weeklyCloseDashboard'},diagnosis:{tab:'hoje',selector:'#diagnosisCenter'},
  achievements:{tab:'dashboard',selector:'#badgesGrid'},history:{tab:'dashboard',selector:'#decisionHistoryDashboard'},report:{tab:'instrucoes',selector:'#exportReportBtn'},
  exam:{tab:'metas',selector:'#examIntelligenceOverview'},audit:{tab:'metas',selector:'#examConfigurationAudit'},matrix:{tab:'metas',selector:'#examHistoricalMatrix'},
  backup:{tab:'instrucoes',selector:'#exportBackupBtn'},demo:{tab:'instrucoes',selector:'#enterDemoBtn'}
});
const normalize=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR');

export function createHelpController({document,window,activateTab}){
  const root=document.getElementById('helpCenter');
  if(!root)return {mount:()=>false};
  const applySearch=()=>{
    const query=normalize(root.querySelector('#helpSearch')?.value.trim());
    let matches=0;
    for(const group of root.querySelectorAll('[data-help-group]')){
      let groupMatches=0;
      const categoryMatches=Boolean(query&&normalize(group.querySelector('.help-group-heading')?.textContent).includes(query));
      for(const topic of group.querySelectorAll('[data-help-topic]')){
        const visible=!query||categoryMatches||normalize(topic.textContent).includes(query);
        topic.hidden=!visible;
        if(visible)groupMatches++;
      }
      group.hidden=Boolean(query&&!groupMatches);
      matches+=query?groupMatches:0;
    }
    for(const section of root.querySelectorAll('.help-reference')){
      let sectionMatches=0;
      const headingMatches=Boolean(query&&normalize(section.querySelector('h3')?.textContent).includes(query));
      for(const item of section.querySelectorAll('.help-reference-item')){
        const visible=!query||headingMatches||normalize(item.textContent).includes(query);
        item.hidden=!visible;
        if(visible)sectionMatches++;
      }
      section.hidden=Boolean(query&&!sectionMatches);
      matches+=query?sectionMatches:0;
    }
    const principle=root.querySelector('[data-help-principle]');
    principle.hidden=Boolean(query&&!normalize(principle.textContent).includes(query));
    if(query&&!principle.hidden)matches++;
    root.querySelector('#helpNoResults').hidden=!query||matches>0;
    root.querySelector('#helpSearchStatus').textContent=query?`${matches} ${matches===1?'assunto encontrado':'assuntos encontrados'}.`:'';
  };
  const openCategory=id=>{
    const search=root.querySelector('#helpSearch');
    if(search.value){search.value='';applySearch()}
    const group=[...root.querySelectorAll('[data-help-group]')].find(item=>item.id===id);
    if(!group)return;
    group.scrollIntoView({block:'start',behavior:'smooth'});
    group.focus({preventScroll:true});
  };
  const navigate=key=>{
    const destination=DESTINATIONS[key];
    if(!destination)return;
    activateTab(destination.tab);
    window.requestAnimationFrame(()=>{
      const target=document.querySelector(destination.selector)||document.getElementById(`tab-${destination.tab}`);
      if(!target)return;
      for(let parent=target.closest('details');parent;parent=parent.parentElement?.closest('details'))parent.open=true;
      if(!target.matches('button,input,select,a,summary,[tabindex]'))target.tabIndex=-1;
      target.scrollIntoView({block:'center',behavior:'smooth'});
      target.focus({preventScroll:true});
    });
  };
  const mount=()=>{
    root.innerHTML=renderHelpCenter();
    root.addEventListener('input',event=>{if(event.target.id==='helpSearch')applySearch()});
    root.addEventListener('keydown',event=>{if(event.target.id==='helpSearch'&&event.key==='Escape'){event.target.value='';applySearch();event.preventDefault()}});
    root.addEventListener('click',event=>{
      const category=event.target.closest('[data-help-category]');
      if(category){openCategory(category.dataset.helpCategory);return}
      const action=event.target.closest('[data-help-action]');
      if(action)navigate(action.dataset.helpAction);
    });
    return true;
  };
  return {mount,applySearch,openCategory,navigate};
}
