export const DEFAULT_LIST_VISIBLE_ITEMS = 5;

export function createProgressiveList({items=[],initialLimit=DEFAULT_LIST_VISIBLE_ITEMS,sort}={}){
  const ordered=sort?[...items].sort(sort):[...items];
  const limit=Math.max(1,Math.floor(initialLimit)||DEFAULT_LIST_VISIBLE_ITEMS);
  let expanded=false;
  return {
    get items(){return ordered},
    get totalItems(){return ordered.length},
    get visibleItems(){return expanded?ordered:ordered.slice(0,limit)},
    get hiddenItems(){return expanded?0:Math.max(0,ordered.length-limit)},
    get expanded(){return expanded},
    initialLimit:limit,
    expand(){expanded=ordered.length>limit},
    collapse(){expanded=false},
    reset(){expanded=false},
    toggle(){expanded?this.collapse():this.expand()}
  };
}

// Explicit opt-in: charts, matrices, navigation and achievements are excluded.
const LISTS=[
  ['#gapMapDashboard',':scope > .data-row'],
  ['#decisionHistoryDashboard',':scope > .data-row'],
  ['#alertasInteligentesList',':scope > .alerta-item'],
  ['.exam-intelligence-list',':scope > li'],
  ['.exam-configuration-audit > ul',':scope > li'],
  ['.diagnosis-summary > section',':scope > article'],
  ['.simulation-trend-list',':scope > li'],
  ['.performance-topic-analysis',':scope > li'],
  ['.weekly-decision-results',':scope > li'],
  ['#planExecutionResults .execution-distribution tbody',':scope > tr'],
  ['#historicoMetasContainer tbody',':scope > tr'],
  ['.adaptive-history > ol',':scope > li'],
  ['.weekly-focus-history > ol',':scope > li'],
  ['.study-plan-details',':scope > .study-plan-topic']
];

export function mountProgressiveLists({document,window}){
  const states=new Map();
  let sequence=0,scheduled=false,pendingFocus=null;
  const sync=()=>{
    scheduled=false;
    states.forEach((state,id)=>{if(!state.root.isConnected)states.delete(id)});
    document.querySelectorAll('[data-progressive-legacy]').forEach(button=>{
      const root=button.closest('tbody')||button.closest('.list-summary-footer')?.previousElementSibling;
      if(root){if(!root.id)root.id=`progressive-list-${++sequence}`;button.setAttribute('aria-controls',root.id)}
    });
    LISTS.forEach(([selector,itemSelector])=>document.querySelectorAll(selector).forEach(root=>{
      const items=[...root.querySelectorAll(itemSelector)];
      if(!root.id)root.id=`progressive-list-${++sequence}`;
      let state=states.get(root.id);
      if(!state||state.root!==root||state.items.length!==items.length||state.items.some((item,index)=>item!==items[index])){
        const expanded=state?.model.expanded&&state.root===root;
        state={root,items,model:createProgressiveList({items})};
        if(expanded)state.model.expand();
        states.set(root.id,state);
      }
      items.forEach((item,index)=>{item.classList.add('progressive-list-item');const hidden=!state.model.expanded&&index>=state.model.initialLimit;if(item.hidden!==hidden)item.hidden=hidden});
      const anchor=root.tagName==='TBODY'?root.closest('table'):root;
      let button=anchor.nextElementSibling;
      if(!button?.matches('[data-progressive-toggle]'))button=null;
      if(items.length<=state.model.initialLimit){button?.remove();return}
      if(!button){button=document.createElement('button');button.type='button';button.className='progressive-list-toggle';button.dataset.progressiveToggle=root.id;anchor.after(button)}
      button.setAttribute('aria-controls',root.id);
      button.setAttribute('aria-expanded',String(state.model.expanded));
      const text=state.model.expanded?'Mostrar menos ↑':`Mostrar mais · +${state.model.hiddenItems} ↓`;
      if(button.textContent!==text)button.textContent=text;
    }));
    if(pendingFocus){
      const {id,collapse}=pendingFocus;pendingFocus=null;
      const button=[...document.querySelectorAll('[data-progressive-legacy]')].find(item=>item.getAttribute('aria-controls')===id);
      if(button){button.focus({preventScroll:true});const rect=button.getBoundingClientRect();if(collapse&&(rect.top<0||rect.bottom>window.innerHeight))button.scrollIntoView({block:'nearest',behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'})}
    }
  };
  const schedule=()=>{if(!scheduled){scheduled=true;window.queueMicrotask(sync)}};
  const reset=()=>{states.forEach(state=>state.model.reset());schedule()};
  const click=event=>{
    const legacy=event.target.closest('[data-progressive-legacy]');
    if(legacy){pendingFocus={id:legacy.getAttribute('aria-controls'),collapse:legacy.getAttribute('aria-expanded')==='true'};schedule();return}
    const action=event.target.closest('[data-delegated-click]')?.dataset.delegatedClick||'';
    if(/^(toggleActiveExamTag|setSubjectExamFilter|clearSessionHistoryFilters)/.test(action))reset();
    const button=event.target.closest('[data-progressive-toggle]');
    if(!button)return;
    const state=states.get(button.dataset.progressiveToggle);
    if(!state)return;
    state.model.toggle();sync();button.focus({preventScroll:true});
    const rect=button.getBoundingClientRect();
    if(!state.model.expanded&&(rect.top<0||rect.bottom>window.innerHeight))button.scrollIntoView({block:'nearest',behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
  };
  const filter=event=>{if(event.target.matches('input[type="search"],select,input[type="date"]'))reset()};
  const observer=new window.MutationObserver(schedule);
  observer.observe(document.body,{childList:true,subtree:true});
  document.addEventListener('click',click);
  document.addEventListener('input',filter);
  document.addEventListener('change',filter);
  sync();
  return {reset,destroy(){observer.disconnect();document.removeEventListener('click',click);document.removeEventListener('input',filter);document.removeEventListener('change',filter);states.clear()}};
}
