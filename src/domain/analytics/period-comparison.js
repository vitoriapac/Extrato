export const PERIOD_COMPARISON_VERSION='1.0.0';
const number=value=>Number.isFinite(Number(value))?Number(value):null;
const compare=(current,previous)=>{const a=number(current),b=number(previous);if(a==null||b==null)return{current:a,previous:b,delta:null,direction:'insufficient'};const delta=Math.round((a-b)*100)/100;return{current:a,previous:b,delta,direction:delta>0?'up':delta<0?'down':'stable'};};
export function buildPeriodComparison({current={},previous={},period={}}={}){const keys=[...new Set([...Object.keys(current),...Object.keys(previous)])];const metrics=Object.fromEntries(keys.map(key=>[key,compare(current[key],previous[key])]));return{algorithmVersion:PERIOD_COMPARISON_VERSION,period,metrics,state:keys.length?'available':'insufficient'};}
