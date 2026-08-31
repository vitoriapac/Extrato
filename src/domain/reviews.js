export const AGENDA_INTERVALS=[
  {dias:1,tipo:'Revisão 24h'},
  {dias:7,tipo:'Revisão 7 dias'},
  {dias:30,tipo:'Revisão 30 dias'}
];

export const DIFFICULTY_INTERVALS={
  'Difícil':[
    {dias:1,tipo:'Revisão 24h'},
    {dias:3,tipo:'Revisão 3 dias'},
    {dias:7,tipo:'Revisão 7 dias'},
    {dias:15,tipo:'Revisão 15 dias'}
  ],
  'Médio':[
    {dias:1,tipo:'Revisão 24h'},
    {dias:7,tipo:'Revisão 7 dias'},
    {dias:30,tipo:'Revisão 30 dias'}
  ],
  'Fácil':[
    {dias:1,tipo:'Revisão 24h'},
    {dias:14,tipo:'Revisão 14 dias'},
    {dias:30,tipo:'Revisão 30 dias'}
  ]
};

export function calculateAdaptiveInterval({baseDays,accuracy=null,volume=0,target=70,trendKey=null,dominantErrorKey=null,reviews=0}){
  const safeBase=Math.max(1,Number(baseDays)||7);
  let factor=1;
  const reasons=[];
  if(volume>=10&&accuracy!==null){
    if(accuracy<50){factor*=0.65;reasons.push('acerto abaixo de 50%')}
    else if(accuracy<target){factor*=0.8;reasons.push('acerto abaixo da meta')}
    else if(accuracy>=target+15){factor*=1.2;reasons.push('bom desempenho')}
  }
  if(trendKey==='down'){factor*=0.8;reasons.push('tendência em queda')}
  else if(trendKey==='up'){factor*=1.1;reasons.push('tendência positiva')}
  if(dominantErrorKey==='esqueci'){factor*=0.8;reasons.push('esquecimento predominante')}
  if(dominantErrorKey==='naoSabia'){factor*=0.85;reasons.push('lacuna de teoria')}
  if(reviews>=3&&volume>=10&&accuracy>=target){factor*=1.1;reasons.push('histórico consistente')}
  const lower=Math.max(1,Math.ceil(safeBase*0.5));
  const upper=Math.min(60,Math.max(lower,Math.floor(safeBase*1.5)));
  return {
    days:Math.max(lower,Math.min(upper,Math.round(safeBase*factor))),
    reason:reasons.length?reasons.join(' · '):'intervalo-base preservado'
  };
}
