const formatters=new Map();
// pt-BR decimals and thousands (69,4 · 1.750); non-numeric input passes through unchanged.
export function formatDecimal(value,digits=1){
  const number=Number(value);
  if(value==null||value===''||!Number.isFinite(number))return String(value??'');
  if(!formatters.has(digits))formatters.set(digits,new Intl.NumberFormat('pt-BR',{maximumFractionDigits:digits}));
  return formatters.get(digits).format(number);
}
