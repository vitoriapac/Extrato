export function createPreferencesController({document,storage,key='bb-premium-theme'}={}){
  if(!document)throw new TypeError('Controlador de preferências requer documento.');
  const current=()=>document.documentElement.getAttribute('data-theme')==='dark'?'dark':'light';
  const sync=()=>{const dark=current()==='dark',icon=document.getElementById('themeToggleIcon'),button=document.getElementById('themeToggleBtn');if(icon)icon.textContent=dark?'☀️':'🌙';if(button)button.setAttribute('aria-label',dark?'Mudar para modo claro':'Mudar para modo escuro');return current()};
  const set=theme=>{const normalized=theme==='dark'?'dark':'light';document.documentElement.setAttribute('data-theme',normalized);try{storage?.setItem(key,normalized)}catch(error){}sync();return normalized};
  return Object.freeze({current,set,toggle:()=>set(current()==='dark'?'light':'dark'),sync});
}
