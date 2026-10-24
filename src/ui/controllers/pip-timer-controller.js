// Tab title while a session exists: the timer stays readable from any other tab or window.
export function formatTimerTitle({started=false,running=false,time='',subjectName='',baseTitle}){
  if(!started)return baseTitle;
  return `${running?'▶':'⏸'} ${time}${subjectName?` · ${subjectName}`:''} — StudyTrack`;
}

// A visible floating window is proof the person is still studying, so the "tab left hidden" check must not fire.
export const shouldMarkHidden=({isRunning,pipOpen})=>Boolean(isRunning&&!pipOpen);

export function buildTimerMiniView({running=false,seconds=0,targetMinutes=null,subjectName='',topicName='',bookmarkLabel='',stepLabel='',formatTime,formatMinutes=minutes=>`${minutes} min`}){
  const target=Number(targetMinutes)>0?Number(targetMinutes):null;
  return Object.freeze({
    title:[subjectName||'Sessão livre',topicName].filter(Boolean).join(' — '),
    bookmark:bookmarkLabel?`Continuar de: ${bookmarkLabel}`:'',
    time:formatTime(seconds),
    target:target?`Meta de ${formatMinutes(target)}`:'',
    progress:target?Math.min(100,Math.round(seconds/(target*60)*100)):null,
    step:stepLabel,
    running,
    toggleLabel:running?'Pausar':'Retomar'
  });
}

export const PIP_FINISH_NOTICE='Volte à aba do StudyTrack para registrar a sessão.';

export function createPipTimerController({pictureInPicture=globalThis.documentPictureInPicture,getView,onToggle,onFinish,copyStyles=()=>{},noticeMs=2000}={}){
  if(typeof getView!=='function'||typeof onToggle!=='function'||typeof onFinish!=='function')throw new TypeError('Janela flutuante requer getView, onToggle e onFinish.');
  const supported=typeof pictureInPicture?.requestWindow==='function';
  let pipWindow=null,pending=null,nodes=null,tick=null;

  function cleanup(){if(tick!=null)pipWindow?.clearInterval(tick);tick=null;pipWindow=null;nodes=null}
  function build(doc){
    const el=(tag,className,text='')=>{const node=doc.createElement(tag);node.className=className;node.textContent=text;return node};
    const root=el('div','pip-timer'),actions=el('div','pip-timer__actions');
    nodes={title:el('p','pip-timer__title'),bookmark:el('p','pip-timer__bookmark'),time:el('strong','pip-timer__time'),target:el('p','pip-timer__target'),progress:el('progress','pip-timer__progress'),step:el('p','pip-timer__step'),toggle:el('button','btn','Pausar'),finish:el('button','btn ghost','Concluir'),notice:el('p','pip-timer__notice',PIP_FINISH_NOTICE)};
    nodes.progress.max=100;nodes.notice.hidden=true;
    nodes.toggle.type=nodes.finish.type='button';
    nodes.toggle.addEventListener('click',()=>onToggle());
    nodes.finish.addEventListener('click',finish);
    actions.append(nodes.toggle,nodes.finish);
    root.append(nodes.title,nodes.bookmark,nodes.time,nodes.target,nodes.progress,nodes.step,actions,nodes.notice);
    doc.body.append(root);
  }
  function render(){
    if(!nodes)return;
    const view=getView();
    nodes.title.textContent=view.title;
    for(const key of ['bookmark','target','step']){nodes[key].textContent=view[key];nodes[key].hidden=!view[key]}
    nodes.time.textContent=view.time;
    nodes.progress.hidden=view.progress==null;if(view.progress!=null)nodes.progress.value=view.progress;
    nodes.toggle.textContent=view.toggleLabel;
  }
  // The browser may not bring the opener tab forward, so the window says where to go before it closes.
  function finish(){
    if(!pipWindow)return;
    nodes.notice.hidden=false;nodes.toggle.disabled=nodes.finish.disabled=true;
    onFinish();
    const current=pipWindow;current.setTimeout(()=>{if(pipWindow===current)close()},noticeMs);
  }
  async function open(){
    if(!supported)return null;
    if(pipWindow){pipWindow.focus?.();return pipWindow}
    if(pending)return pending;
    pending=(async()=>{
      try{
        const opened=await pictureInPicture.requestWindow({width:320,height:200});
        pipWindow=opened;
        copyStyles(opened.document);
        build(opened.document);
        opened.addEventListener('pagehide',()=>{if(pipWindow===opened)cleanup()});
        tick=opened.setInterval(render,1000);
        render();
        return opened;
      }finally{pending=null}
    })();
    return pending;
  }
  function close(){const current=pipWindow;cleanup();current?.close()}
  return Object.freeze({supported,open,close,render,isOpen:()=>Boolean(pipWindow)});
}
