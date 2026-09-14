export function createDemoController({document,storage,demoKey,flashKey,isDemo,getState,enterMode,resetMode,exitMode,confirm,reload,activateTab}={}){
  if(!document||!storage||typeof getState!=='function')throw new TypeError('Controlador da demonstração requer documento, armazenamento e estado.');
  const listeners=[];
  const listen=(target,event,handler)=>{if(!target)return;target.addEventListener(event,handler);listeners.push(()=>target.removeEventListener?.(event,handler))};
  const enter=()=>confirm('Explorar a demonstração com 130 dias de estudos, questões, simulados e planejamento? Seus dados atuais não serão alterados.',()=>{enterMode(storage);reload()});
  const reset=()=>confirm('Reiniciar todos os dados fictícios da demonstração?',()=>{resetMode(storage,demoKey);reload()});
  const exit=()=>{exitMode(storage,demoKey);storage.setItem(flashKey,'Demonstração encerrada. Seus dados pessoais foram restaurados.');reload()};
  const sync=()=>{const state=getState(),banner=document.getElementById('demoBanner'),enterButton=document.getElementById('enterDemoBtn'),emptyCta=document.getElementById('demoEmptyCta');if(banner)banner.hidden=!isDemo;if(enterButton)enterButton.hidden=isDemo;if(emptyCta)emptyCta.hidden=isDemo||state.subjects.length>0||state.studySessions.length>0;document.querySelectorAll('[data-demo-protected]').forEach(button=>{button.disabled=isDemo;button.title=isDemo?'Indisponível para proteger seus dados reais.':''})};
  const mount=()=>{const enterButton=document.getElementById('enterDemoBtn');listen(enterButton,'click',enter);listen(document.getElementById('enterDemoEmptyBtn'),'click',()=>enterButton?.click());listen(document.getElementById('resetDemoBtn'),'click',reset);listen(document.getElementById('exitDemoBtn'),'click',exit);document.querySelectorAll('[data-demo-target]').forEach(button=>listen(button,'click',()=>activateTab(button.dataset.demoTarget)));listen(document.getElementById('demoReportShortcut'),'click',()=>document.getElementById('exportReportBtn')?.click());sync();return api};
  const unmount=()=>listeners.splice(0).forEach(remove=>remove());
  const api=Object.freeze({mount,unmount,sync,enter,reset,exit});return api;
}
