import {renderHelpCenter} from './help-renderer.js';

const DESTINATIONS=Object.freeze({
  subjects:{tab:'disciplinas',selector:'#addSubjectBtn'},overview:{tab:'dashboard',selector:'#balanceFigure'},timer:{tab:'dashboard',selector:'#timerSubjectSelect'},
  questions:{tab:'questoes',selector:'#addQuestaoRowBtn'},reviews:{tab:'agenda',selector:'#addAgendaRowBtn'},today:{tab:'hoje',selector:'#panel-hoje'},calendar:{tab:'calendario',selector:'#panel-calendario'},
  planning:{tab:'metas',selector:'#examStudyPlan'},weekly:{tab:'dashboard',selector:'#weeklyCloseDashboard'},diagnosis:{tab:'hoje',selector:'#diagnosisCenter'},
  achievements:{tab:'dashboard',selector:'#badgesGrid'},history:{tab:'dashboard',selector:'#decisionHistoryDashboard'},report:{tab:'instrucoes',selector:'#exportReportBtn'},
  exam:{tab:'desempenho',section:'exam',selector:'#examIntelligenceOverview'},audit:{tab:'desempenho',section:'exam',selector:'#examConfigurationAudit'},matrix:{tab:'desempenho',section:'exam',selector:'#examHistoricalMatrix'},
  backup:{tab:'instrucoes',selector:'#exportBackupBtn'},demo:{tab:'instrucoes',selector:'#enterDemoBtn'}
});
const normalize=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR');

function highlightMatches(scope,query,document,window){
  const walker=document.createTreeWalker(scope,window.NodeFilter.SHOW_TEXT);
  const nodes=[];
  for(let node=walker.nextNode();node;node=walker.nextNode()){
    if(node.parentElement?.closest('[hidden]'))continue;
    if(normalize(node.nodeValue).includes(query))nodes.push(node);
  }
  for(const node of nodes){
    const value=node.nodeValue;
    let folded='',offset=0;
    const positions=[];
    for(const char of value){
      const part=normalize(char);
      for(let index=0;index<part.length;index++)positions.push([offset,offset+char.length]);
      folded+=part;
      offset+=char.length;
    }
    const fragment=document.createDocumentFragment();
    let cursor=0,match=folded.indexOf(query);
    while(match!==-1){
      const start=positions[match][0],end=positions[match+query.length-1][1];
      fragment.append(document.createTextNode(value.slice(cursor,start)));
      const mark=document.createElement('mark');
      mark.className='help-match';
      mark.dataset.helpMatch='';
      mark.textContent=value.slice(start,end);
      fragment.append(mark);
      cursor=end;
      match=folded.indexOf(query,match+query.length);
    }
    fragment.append(document.createTextNode(value.slice(cursor)));
    node.replaceWith(fragment);
  }
}

export function createHelpController({document,window,activateTab}){
  const root=document.getElementById('helpCenter');
  if(!root)return {mount:()=>false};
  let scheduleActive=()=>{};
  const applySearch=()=>{
    const parents=new Set();
    for(const mark of root.querySelectorAll('[data-help-match]')){
      parents.add(mark.parentNode);
      mark.replaceWith(document.createTextNode(mark.textContent));
    }
    for(const parent of parents)parent.normalize();
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
    root.querySelector('#helpSearchClear').hidden=!query;
    if(query){
      for(const section of root.querySelectorAll('[data-help-group]:not([hidden]),[data-help-principle]:not([hidden]),.help-reference:not([hidden])'))highlightMatches(section,query,document,window);
    }
    scheduleActive();
  };
  const openCategory=id=>{
    const search=root.querySelector('#helpSearch');
    if(search.value){search.value='';applySearch()}
    const group=[...root.querySelectorAll('[data-help-group]')].find(item=>item.id===id);
    if(!group)return;
    for(const button of root.querySelectorAll('[data-help-category]')){
      if(button.dataset.helpCategory===id)button.setAttribute('aria-current','location');
      else button.removeAttribute('aria-current');
    }
    const reduceMotion=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    group.scrollIntoView({block:'start',behavior:reduceMotion?'auto':'smooth'});
    group.focus({preventScroll:true});
  };
  const navigate=key=>{
    const destination=DESTINATIONS[key];
    if(!destination)return;
    activateTab(destination.tab);
    if(destination.section)document.querySelector(`[data-performance-section="${destination.section}"]`)?.click();
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
    const categoryNav=root.querySelector('.help-category-nav');
    const categoryButtons=[...categoryNav.querySelectorAll('[data-help-category]')];
    const updateActive=()=>{
      if(!root.closest('.panel')?.classList.contains('active'))return;
      const groups=[...root.querySelectorAll('[data-help-group]:not([hidden])')];
      if(!groups.length)return;
      const threshold=(document.querySelector('.sticky-shell')?.getBoundingClientRect().bottom||0)+categoryNav.getBoundingClientRect().height+24;
      let active=groups[0].id;
      for(const group of groups){if(group.getBoundingClientRect().top<=threshold)active=group.id}
      for(const button of categoryButtons){
        if(button.dataset.helpCategory===active)button.setAttribute('aria-current','location');
        else button.removeAttribute('aria-current');
      }
      const activeButton=categoryButtons.find(button=>button.dataset.helpCategory===active);
      if(activeButton){
        const navBox=categoryNav.getBoundingClientRect(),buttonBox=activeButton.getBoundingClientRect();
        if(buttonBox.left<navBox.left||buttonBox.right>navBox.right){
          const left=buttonBox.left-navBox.left-(navBox.width-buttonBox.width)/2;
          const reduceMotion=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
          categoryNav.scrollBy({left,behavior:reduceMotion?'auto':'smooth'});
        }
      }
    };
    let activeQueued=false;
    scheduleActive=()=>{
      if(activeQueued)return;
      activeQueued=true;
      window.requestAnimationFrame(()=>{activeQueued=false;updateActive()});
    };
    const syncHelpNavHeight=()=>{
      const height=Math.ceil(categoryNav.getBoundingClientRect().height);
      if(height)root.style.setProperty('--help-nav-height',`${height}px`);
    };
    syncHelpNavHeight();
    if('ResizeObserver' in window)new window.ResizeObserver(syncHelpNavHeight).observe(categoryNav);
    window.addEventListener('resize',syncHelpNavHeight,{passive:true});
    window.addEventListener('resize',scheduleActive,{passive:true});
    window.addEventListener('scroll',scheduleActive,{passive:true});
    root.addEventListener('input',event=>{if(event.target.id==='helpSearch')applySearch()});
    root.addEventListener('keydown',event=>{if(event.target.id==='helpSearch'&&event.key==='Escape'){event.target.value='';applySearch();event.preventDefault()}});
    root.addEventListener('click',event=>{
      const category=event.target.closest('[data-help-category]');
      if(category){openCategory(category.dataset.helpCategory);return}
      if(event.target.closest('#helpSearchClear')){
        const search=root.querySelector('#helpSearch');
        search.value='';applySearch();search.focus();return;
      }
      const action=event.target.closest('[data-help-action]');
      if(action)navigate(action.dataset.helpAction);
    });
    scheduleActive();
    return true;
  };
  return {mount,applySearch,openCategory,navigate};
}
