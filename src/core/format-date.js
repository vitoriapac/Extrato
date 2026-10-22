// Visible dates use DD/MM/AAAA; machine values (datetime, inputs, keys) keep ISO and must not go through here.
export function formatDateBR(value){
  const match=/^(\d{4})-(\d{2})-(\d{2})/.exec(String(value??''));
  return match?`${match[3]}/${match[2]}/${match[1]}`:String(value??'');
}
export function formatPeriodBR(start,end){
  return `${formatDateBR(start)} a ${formatDateBR(end)}`;
}
