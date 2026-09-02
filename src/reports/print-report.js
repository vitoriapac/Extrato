export function printStrategicReport({document,window,report,render}={}){
  const container=document?.getElementById('strategicPrintReport');
  if(!container||typeof render!=='function'||typeof window?.print!=='function')throw new Error('Ambiente de impressão indisponível.');
  container.innerHTML=render(report);container.dataset.ready='true';
  window.requestAnimationFrame(()=>window.print());return container;
}
