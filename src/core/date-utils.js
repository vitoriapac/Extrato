const ISO_DATE=/^\d{4}-\d{2}-\d{2}$/;

export function parseLocalDate(value){
  if(value instanceof Date) return new Date(value.getTime());
  if(typeof value!=='string'||!ISO_DATE.test(value)) return null;
  const [year,month,day]=value.split('-').map(Number);
  const date=new Date(year,month-1,day,12,0,0,0);
  return date.getFullYear()===year&&date.getMonth()===month-1&&date.getDate()===day?date:null;
}

export function formatLocalDate(value){
  const date=parseLocalDate(value);
  if(!date) return null;
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}

export function addLocalDays(value,amount){
  const date=parseLocalDate(value);
  if(!date) return null;
  date.setDate(date.getDate()+Number(amount||0));
  return formatLocalDate(date);
}

export function startOfLocalDay(value){
  const date=parseLocalDate(value);
  return date?new Date(date.getFullYear(),date.getMonth(),date.getDate(),0,0,0,0):null;
}

export function endOfLocalDay(value){
  const date=parseLocalDate(value);
  return date?new Date(date.getFullYear(),date.getMonth(),date.getDate(),23,59,59,999):null;
}

export function localDateRange(start,end){
  const first=parseLocalDate(start),last=parseLocalDate(end);
  if(!first||!last||first>last) return [];
  const result=[];for(let date=new Date(first);date<=last;date.setDate(date.getDate()+1)) result.push(formatLocalDate(date));
  return result;
}
