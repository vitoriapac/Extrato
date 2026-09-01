const clamp=(value,min=0,max=100)=>Math.max(min,Math.min(max,value));

function confidenceLabel(value){
  return value>=0.7?'Alta':value>=0.35?'Média':'Baixa';
}

function dayNumber(date){
  const timestamp=Date.parse(`${date}T00:00:00Z`);
  return Number.isFinite(timestamp)?timestamp/86400000:null;
}

function normalizeObservations(observations){
  return (Array.isArray(observations)?observations:[])
    .map(item=>({date:item?.date,value:Number(item?.value),sampleSize:Number(item?.sampleSize)}))
    .filter(item=>dayNumber(item.date)!==null&&Number.isFinite(item.value)&&item.value>=0&&item.value<=100&&Number.isFinite(item.sampleSize)&&item.sampleSize>0)
    .sort((a,b)=>a.date.localeCompare(b.date));
}

export function buildPerformanceForecast({currentValue=null,currentConfidence=0,targetScore=80,observations=[]}={}){
  const current=currentValue===null||currentValue===undefined?NaN:Number(currentValue),confidence=clamp(Number(currentConfidence)||0,0,1),target=clamp(Number(targetScore)||80);
  const normalized=normalizeObservations(observations);
  const sampleSize=normalized.reduce((sum,item)=>sum+item.sampleSize,0);
  const observationCount=normalized.length;
  const periodStart=normalized[0]?.date||null,periodEnd=normalized.at(-1)?.date||null;
  const spanDays=periodStart&&periodEnd?Math.round(dayNumber(periodEnd)-dayNumber(periodStart)):0;
  const evidence={sampleSize,observationCount,periodStart,periodEnd,spanDays};
  if(!Number.isFinite(current)||current<0||current>100){
    return {available:false,currentBand:null,gap:null,movingAverage:null,forecast30:{available:false,reason:'A faixa atual ainda não possui dados suficientes.'},evidence};
  }
  const margin=Math.max(4,Math.round(18*(1-confidence)));
  const currentBand={central:Math.round(current),low:Math.round(clamp(current-margin)),high:Math.round(clamp(current+margin)),confidence,confidenceLabel:confidenceLabel(confidence)};
  const gap={minimum:Math.max(0,Math.round(target-currentBand.high)),maximum:Math.max(0,Math.round(target-currentBand.low)),target};
  const recent=normalized.slice(-3),recentSample=recent.reduce((sum,item)=>sum+item.sampleSize,0);
  const movingAverage=recentSample?Math.round(recent.reduce((sum,item)=>sum+item.value*item.sampleSize,0)/recentSample):null;
  if(observationCount<4||sampleSize<120||spanDays<21){
    const needs=[];
    if(observationCount<4)needs.push(`${4-observationCount} semana(s) adicional(is)`);
    if(sampleSize<120)needs.push(`${120-sampleSize} questão(ões) adicional(is)`);
    if(spanDays<21)needs.push('ao menos 21 dias de histórico');
    return {available:true,currentBand,gap,movingAverage,forecast30:{available:false,reason:`Aguardando ${needs.join(', ')}.`},evidence};
  }
  const origin=dayNumber(periodStart),points=normalized.map(item=>({x:dayNumber(item.date)-origin,y:item.value,w:item.sampleSize}));
  const weight=points.reduce((sum,item)=>sum+item.w,0);
  const meanX=points.reduce((sum,item)=>sum+item.x*item.w,0)/weight,meanY=points.reduce((sum,item)=>sum+item.y*item.w,0)/weight;
  const denominator=points.reduce((sum,item)=>sum+item.w*(item.x-meanX)**2,0);
  const rawSlope=denominator?points.reduce((sum,item)=>sum+item.w*(item.x-meanX)*(item.y-meanY),0)/denominator:0;
  const forecastConfidence=clamp(Math.min(1,observationCount/8)*.35+Math.min(1,sampleSize/300)*.4+Math.min(1,spanDays/56)*.25);
  const slopePerDay=clamp(rawSlope,-1,1)*(.35+forecastConfidence*.35);
  const projected=clamp(normalized.at(-1).value+slopePerDay*30);
  const forecastMargin=Math.max(margin,Math.round(16*(1-forecastConfidence)));
  const forecast30={available:true,central:Math.round(projected),low:Math.round(clamp(projected-forecastMargin)),high:Math.round(clamp(projected+forecastMargin)),confidence:forecastConfidence,confidenceLabel:confidenceLabel(forecastConfidence),slopePerWeek:Math.round(slopePerDay*70)/10,reason:null};
  return {available:true,currentBand,gap,movingAverage,forecast30,evidence};
}
