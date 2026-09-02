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
  const upper=Math.min(60,Math.max(1,Math.floor(safeBase*1.5)));
  const lower=Math.min(upper,Math.max(1,Math.ceil(safeBase*0.5)));
  return {
    days:Math.max(lower,Math.min(upper,Math.round(safeBase*factor))),
    reason:reasons.length?reasons.join(' · '):'intervalo-base preservado'
  };
}

export const REVIEW_RATINGS=Object.freeze({
  again:{label:'Errei',quality:1},hard:{label:'Difícil',quality:3},good:{label:'Bom',quality:4},easy:{label:'Fácil',quality:5}
});

export function createAdaptiveReviewState(source={}){
  source=source||{};
  return {
    easinessFactor:Math.max(1.3,Number(source.easinessFactor)||2.5),
    repetitions:Math.max(0,Math.floor(Number(source.repetitions)||0)),
    intervalDays:Math.max(0,Math.floor(Number(source.intervalDays)||0)),
    lastReviewDate:source.lastReviewDate||null,nextReviewDate:source.nextReviewDate||null,
    lastRating:REVIEW_RATINGS[source.lastRating]?source.lastRating:null,
    algorithmVersion:Math.max(1,Number(source.algorithmVersion)||2)
  };
}

function addLocalDays(iso,days){
  const [year,month,day]=String(iso).split('-').map(Number),date=new Date(year,month-1,day);date.setDate(date.getDate()+days);
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}

export function applyAdaptiveReviewRating(source,rating,{reviewDate,algorithmVersion=2}={}){
  if(!REVIEW_RATINGS[rating])throw new Error('Avaliação de revisão inválida.');
  const state=createAdaptiveReviewState(source),quality=REVIEW_RATINGS[rating].quality;
  let repetitions=state.repetitions,intervalDays=state.intervalDays;
  if(quality<3){repetitions=0;intervalDays=1}
  else{
    repetitions+=1;
    if(repetitions===1)intervalDays=rating==='easy'?4:1;
    else if(repetitions===2)intervalDays=rating==='hard'?4:rating==='easy'?8:6;
    else intervalDays=Math.max(1,Math.round(intervalDays*state.easinessFactor*(rating==='hard'?.8:rating==='easy'?1.3:1)));
  }
  const easinessFactor=Math.max(1.3,state.easinessFactor+(0.1-(5-quality)*(0.08+(5-quality)*0.02)));
  return {easinessFactor:Math.round(easinessFactor*100)/100,repetitions,intervalDays:Math.min(365,intervalDays),lastReviewDate:reviewDate,nextReviewDate:addLocalDays(reviewDate,Math.min(365,intervalDays)),lastRating:rating,algorithmVersion};
}
