export function labelDynamicControls(root=document){
  root.querySelectorAll('input:not([type="hidden"]),select,textarea').forEach(control=>{
    const hasLabel=control.getAttribute('aria-label')||control.getAttribute('aria-labelledby')||control.closest('label')||(control.id&&document.querySelector(`label[for="${CSS.escape(control.id)}"]`));
    if(hasLabel)return;
    const cell=control.closest('td');
    const table=cell?.closest('table');
    const index=cell?[...cell.parentElement.children].indexOf(cell):-1;
    const heading=index>=0?table?.querySelectorAll('thead th')?.[index]?.textContent?.trim():'';
    const fallback=control.placeholder||({date:'Data',number:'Valor',url:'Link',search:'Busca'}[control.type])||'Campo';
    control.setAttribute('aria-label',heading||fallback);
  });
}

export function trapModalTab(event,modals){
  if(event.key!=='Tab')return false;
  const modal=modals.find(item=>item?.classList.contains('show'));
  if(!modal)return false;
  const selector='button:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),a[href],[tabindex]:not([tabindex="-1"])';
  const focusable=[...modal.querySelectorAll(selector)].filter(item=>!item.hidden&&item.offsetParent!==null);
  if(!focusable.length)return false;
  const first=focusable[0],last=focusable[focusable.length-1];
  if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();return true;}
  if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();return true;}
  return false;
}
