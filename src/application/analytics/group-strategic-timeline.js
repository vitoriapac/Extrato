import {addLocalDays,parseLocalDate} from '../../core/date-utils.js';

const localLabel=date=>new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'short'}).format(parseLocalDate(date));
export function groupStrategicTimeline(rows,{groupBy='week'}={}){
  const selected=['week','month','phase'].includes(groupBy)?groupBy:'week';
  const groups=new Map();
  for(const item of rows){
    let key,label;
    if(selected==='month'){
      key=item.date.slice(0,7);label=new Intl.DateTimeFormat('pt-BR',{month:'long',year:'numeric'}).format(parseLocalDate(`${key}-01`));
    }else if(selected==='phase'){
      key=item.phase||'Fase não registrada';label=key;
    }else{
      const day=parseLocalDate(item.date)?.getDay()??1;
      key=addLocalDays(item.date,-((day+6)%7));label=`Semana ${localLabel(key)}–${localLabel(addLocalDays(key,6))}`;
    }
    if(!groups.has(key))groups.set(key,{key,label,rows:[]});
    groups.get(key).rows.push(item);
  }
  return {groupBy:selected,groups:[...groups.values()]};
}
