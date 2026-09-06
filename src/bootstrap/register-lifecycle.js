export function registerApplicationLifecycle({window,onBeforeUnload,onResponsiveChange,mediaQuery='(max-width:760px)'}={}){
  if(!window)throw new TypeError('Ciclo de vida requer janela.');const media=window.matchMedia(mediaQuery),beforeUnload=()=>onBeforeUnload?.(),responsive=event=>onResponsiveChange?.(event);window.addEventListener('beforeunload',beforeUnload);media.addEventListener('change',responsive);return Object.freeze({media,destroy:()=>{window.removeEventListener('beforeunload',beforeUnload);media.removeEventListener('change',responsive)}});
}
