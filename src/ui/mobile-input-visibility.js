const NON_TEXT_INPUT_TYPES=new Set(['button','checkbox','color','file','hidden','image','radio','range','reset','submit']);

function isKeyboardField(element){
  if(!element||element.disabled||element.readOnly)return false;
  if(element.isContentEditable)return true;
  if(element.tagName==='TEXTAREA'||element.tagName==='SELECT')return true;
  if(element.tagName!=='INPUT')return false;
  return !NON_TEXT_INPUT_TYPES.has(String(element.type||'text').toLowerCase());
}

export function registerMobileInputVisibility({window,document,mediaQuery='(max-width:760px)',margin=16}={}){
  if(!window||!document)return Object.freeze({destroy(){}});
  const media=window.matchMedia?.(mediaQuery)||{matches:window.innerWidth<=760,addEventListener(){},removeEventListener(){}};
  const viewport=window.visualViewport;
  let focused=null,frame=null,frameIsAnimation=false,destroyed=false;
  const cancelFrame=()=>{
    if(frame==null)return;
    if(frameIsAnimation)window.cancelAnimationFrame?.(frame);else window.clearTimeout(frame);
    frame=null;
  };
  const reveal=()=>{
    frame=null;
    const target=focused;
    if(destroyed||!media.matches||!target||document.activeElement!==target||!target.isConnected)return;
    const styles=window.getComputedStyle?.(document.documentElement),stickyHeight=parseFloat(styles?.getPropertyValue('--sticky-stack-height'))||0,overviewHeight=parseFloat(styles?.getPropertyValue('--overview-nav-height'))||0;
    const viewportTop=viewport?.offsetTop||0,rect=target.getBoundingClientRect(),bottom=viewportTop+(viewport?.height||window.innerHeight)-margin;
    const top=Math.min(viewportTop+Math.max(margin,stickyHeight+overviewHeight+12),Math.max(viewportTop+margin,bottom-rect.height));
    if(rect.top>=top&&rect.bottom<=bottom)return;
    target.scrollIntoView?.({block:rect.top<top?'start':'center',inline:'nearest',behavior:'auto'});
  };
  const schedule=()=>{
    if(destroyed)return;
    cancelFrame();
    if(typeof window.requestAnimationFrame==='function'){
      frameIsAnimation=true;frame=window.requestAnimationFrame(reveal);
    }else{
      frameIsAnimation=false;frame=window.setTimeout(reveal,0);
    }
  };
  const onFocusIn=event=>{
    focused=isKeyboardField(event.target)?event.target:null;
    if(focused)schedule();
  };
  const onFocusOut=()=>window.setTimeout(()=>{
    if(destroyed)return;
    if(!isKeyboardField(document.activeElement))focused=null;
    else{focused=document.activeElement;schedule()}
  },0);
  const onViewportChange=()=>{if(focused)schedule()};
  const onMediaChange=()=>{if(!media.matches){focused=null;cancelFrame()}else if(isKeyboardField(document.activeElement)){focused=document.activeElement;schedule()}};
  document.addEventListener('focusin',onFocusIn);
  document.addEventListener('focusout',onFocusOut);
  viewport?.addEventListener('resize',onViewportChange);
  window.addEventListener('resize',onViewportChange);
  media.addEventListener?.('change',onMediaChange);
  return Object.freeze({destroy(){
    destroyed=true;cancelFrame();document.removeEventListener('focusin',onFocusIn);document.removeEventListener('focusout',onFocusOut);
    viewport?.removeEventListener('resize',onViewportChange);
    window.removeEventListener('resize',onViewportChange);media.removeEventListener?.('change',onMediaChange);focused=null;
  }});
}
