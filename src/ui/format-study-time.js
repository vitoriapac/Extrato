export function formatStudyMinutes(value){
 if(value==null||value===''||!Number.isFinite(Number(value)))return '—';
 const rounded=Math.round(Math.abs(Number(value))),hours=Math.floor(rounded/60),minutes=rounded%60,sign=Number(value)<0?'−':'';
 return sign+(hours?hours+' h'+(minutes?' '+minutes+' min':''):minutes+' min');
}
export function formatStudyMinuteDelta(value){return value==null?'Sem base comparável':(Number(value)>0?'+':'')+formatStudyMinutes(value)}
