function asDate(value){
  const date=value instanceof Date?new Date(value.getTime()):new Date(value);
  if(Number.isNaN(date.getTime())) throw new TypeError('O relógio retornou uma data inválida.');
  return date;
}

export function createClock({now=()=>new Date()}={}){
  if(typeof now!=='function') throw new TypeError('O relógio precisa receber uma função now.');
  const current=()=>asDate(now());
  return Object.freeze({
    now:current,
    nowISO:()=>current().toISOString(),
    today:()=>{
      const date=current();
      const year=date.getFullYear(),month=String(date.getMonth()+1).padStart(2,'0'),day=String(date.getDate()).padStart(2,'0');
      return `${year}-${month}-${day}`;
    },
    timestamp:()=>current().getTime()
  });
}
