export function countActiveFilters(filters,defaults={}){
  return Object.entries(filters||{}).reduce((total,[key,value])=>{
    const baseline=Object.prototype.hasOwnProperty.call(defaults,key)?defaults[key]:'';
    return total+(value!==baseline&&value!==''&&value!=null?1:0);
  },0);
}

export function filterPanelLabel(count){
  return count>0?`Filtros (${count} ${count===1?'ativo':'ativos'})`:'Filtros';
}
