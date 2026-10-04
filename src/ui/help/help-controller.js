import {renderHelpCenter} from './help-renderer.js';
import {normalizeHelpText as normalize,matchesHelpSearch,rankHelpSearch} from './help-search.js';

const DESTINATIONS=Object.freeze({
  adherence:{tab:'desempenho',section:'consistency',selector:'.adherence-summary'},
  subjects:{tab:'disciplinas',selector:'#addSubjectBtn'},overview:{tab:'dashboard',selector:'#balanceFigure'},timer:{tab:'dashboard',selector:'#timerSubjectSelect'},
  questions:{tab:'questoes',selector:'#addQuestaoRowBtn'},reviews:{tab:'agenda',selector:'#addAgendaRowBtn'},today:{tab:'hoje',selector:'#panel-hoje'},calendar:{tab:'calendario',selector:'#panel-calendario'},
  planning:{tab:'metas',selector:'#examStudyPlan'},weekly:{tab:'dashboard',selector:'#weeklyCloseDashboard'},diagnosis:{tab:'hoje',selector:'#diagnosisCenter'},
  achievements:{tab:'dashboard',selector:'#badgesGrid'},history:{tab:'dashboard',selector:'#decisionHistoryDashboard'},report:{tab:'instrucoes',selector:'#exportReportBtn'},
  exam:{tab:'desempenho',section:'exam',selector:'#examIntelligenceOverview'},audit:{tab:'desempenho',section:'exam',selector:'#examConfigurationAudit'},matrix:{tab:'desempenho',section:'exam',selector:'#examHistoricalMatrix'},
  backup:{tab:'instrucoes',selector:'#exportBackupBtn'},demo:{tab:'instrucoes',selector:'#enterDemoBtn'}
});

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
  let activeCategory='guide-start';
  let originalGroups=[],originalTopics=new Map();
  const applySearch=()=>{
    const parents=new Set();
    for(const mark of root.querySelectorAll('[data-help-match]')){
      parents.add(mark.parentNode);
      mark.replaceWith(document.createTextNode(mark.textContent));
    }
    for(const parent of parents)parent.normalize();
    const query=normalize(root.querySelector('#helpSearch')?.value.trim());
    let matches=0;
    const scores=new Map();
    for(const group of root.querySelectorAll('[data-help-group]')){
      let groupMatches=0;
      const categoryMatches=Boolean(query&&normalize(group.querySelector('.help-group-heading')?.textContent).includes(query));
      for(const topic of group.querySelectorAll('[data-help-topic]')){
        const visible=!query||categoryMatches||matchesHelpSearch(topic.textContent+' '+(topic.dataset.helpSearch||''),query);
        topic.hidden=!visible;
        scores.set(topic,query&&visible?rankHelpSearch({title:topic.dataset.helpTitle,keywords:[topic.dataset.helpKeywords||''],paragraphs:[topic.textContent,topic.dataset.helpSearch||'']},query):0);
        if(visible)groupMatches++;
      }
      group.hidden=query?Boolean(!groupMatches):group.id!==activeCategory;
      matches+=query?groupMatches:0;
      const topics=originalTopics.get(group)||[];
      for(const topic of [...topics].sort((a,b)=>query?(scores.get(b)||0)-(scores.get(a)||0):0))group.querySelector('.help-group-body').append(topic);
      scores.set(group,Math.max(0,...topics.map(topic=>scores.get(topic)||0)));
    }
    for(const section of root.querySelectorAll('.help-reference')){
      let sectionMatches=0;
      const headingMatches=Boolean(query&&normalize(section.querySelector('h3')?.textContent).includes(query));
      for(const item of section.querySelectorAll('.help-reference-item')){
        const visible=!query||headingMatches||matchesHelpSearch(item.textContent,query);
        item.hidden=!visible;
        if(visible)sectionMatches++;
      }
      section.hidden=query?Boolean(!sectionMatches):activeCategory!=='guide-safety';
      matches+=query?sectionMatches:0;
    }
    for(const node of [...originalGroups].sort((a,b)=>query?(scores.get(b)||0)-(scores.get(a)||0):0))root.querySelector('#helpGroups').append(node);
    const principle=root.querySelector('[data-help-principle]');
    principle.hidden=query?Boolean(!normalize(principle.textContent).includes(query)):activeCategory!=='guide-workflows';
    if(query&&!principle.hidden)matches++;
    root.querySelector('#helpNoResults').hidden=!query||matches>0;
    root.querySelector('#helpSearchStatus').textContent=query?`${matches} ${matches===1?'assunto encontrado':'assuntos encontrados'}.`:'';
    root.querySelector('#helpSearchClear').hidden=!query;
    if(query){
      for(const section of root.querySelectorAll('[data-help-group]:not([hidden]),[data-help-principle]:not([hidden]),.help-reference:not([hidden])'))highlightMatches(section,query,document,window);
    }
  };
  const openCategory=id=>{
    const search=root.querySelector('#helpSearch');
    if(search.value){search.value='';applySearch()}
    const group=[...root.querySelectorAll('[data-help-group]')].find(item=>item.id===id);
    if(!group)return;
    activeCategory=id;
    applySearch();
    for(const button of root.querySelectorAll('[data-help-category]')){
      if(button.dataset.helpCategory===id)button.setAttribute('aria-current','location');
      else button.removeAttribute('aria-current');
    }
    const reduceMotion=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    group.scrollIntoView({block:'start',behavior:reduceMotion?'auto':'smooth'});
    group.focus({preventScroll:true});
  };
  const openTopic=id=>{
    const topic=[...root.querySelectorAll('[data-help-topic]')].find(item=>item.id===id);
    if(!topic)return false;
    activateTab('instrucoes');
    openCategory(topic.closest('[data-help-group]').id);
    window.requestAnimationFrame(()=>{
      topic.tabIndex=-1;
      topic.scrollIntoView({block:'start',behavior:window.matchMedia?.('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
      topic.focus({preventScroll:true});
    });
    return true;
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
      target.scrollIntoView({block:'center',behavior:window.matchMedia?.('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
      target.focus({preventScroll:true});
    });
  };
  const mount=()=>{
    root.innerHTML=renderHelpCenter();
    originalGroups=[...root.querySelector('#helpGroups').children];
    originalTopics=new Map([...root.querySelectorAll('[data-help-group]')].map(group=>[group,[...group.querySelectorAll('[data-help-topic]')]]));
    activeCategory=root.querySelector('[data-help-category]')?.dataset.helpCategory||'guide-start';
    applySearch();
    document.addEventListener('click',event=>{
      const link=event.target.closest('[data-help-topic-link]');
      if(link&&openTopic(link.dataset.helpTopicLink))event.preventDefault();
    });
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
    return true;
  };
  return {mount,applySearch,openCategory,navigate,openTopic};
}
