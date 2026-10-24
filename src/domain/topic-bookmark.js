export const BOOKMARK_RESOURCE_TYPES=Object.freeze(['pdf','video','law','other']);

const text=(value,max)=>typeof value==='string'?value.trim().slice(0,max):'';
const unit=value=>{if(value==null||value==='')return null;const number=Number(value);return Number.isInteger(number)&&number>=0?number:null};

/** Ponto de parada do tópico: objeto congelado ou null quando não há posição nem material. */
export function normalizeTopicBookmark(raw,{now=()=>new Date().toISOString()}={}){
  if(!raw||typeof raw!=='object'||Array.isArray(raw))return null;
  const resourceType=BOOKMARK_RESOURCE_TYPES.includes(raw.resourceType)?raw.resourceType:'other';
  const label=text(raw.label,120),positionText=text(raw.positionText,60),currentUnit=unit(raw.currentUnit);
  let totalUnits=unit(raw.totalUnits);
  if(totalUnits!=null&&(currentUnit==null||totalUnits<currentUnit||totalUnits===0))totalUnits=null;
  if(currentUnit==null&&!positionText&&!label)return null;
  const updatedAt=typeof raw.updatedAt==='string'&&raw.updatedAt?raw.updatedAt:now();
  return Object.freeze({resourceType,label,currentUnit,totalUnits,positionText,updatedAt});
}

export function bookmarkProgress(bookmark){
  return bookmark?.totalUnits>0&&bookmark.currentUnit!=null?Math.round(bookmark.currentUnit/bookmark.totalUnits*100):null;
}

const UNIT_LABELS={pdf:'pág.',video:'aula'};
const TYPE_LABELS={pdf:'PDF',video:'Videoaula',law:'Lei seca'};

export function formatBookmarkLabel(bookmark){
  if(!bookmark)return '';
  const parts=[];
  if(bookmark.label)parts.push(bookmark.label);
  if(TYPE_LABELS[bookmark.resourceType]&&!bookmark.label)parts.push(TYPE_LABELS[bookmark.resourceType]);
  if(bookmark.currentUnit!=null){
    const progress=bookmarkProgress(bookmark),prefix=UNIT_LABELS[bookmark.resourceType]||'';
    const total=bookmark.totalUnits!=null?` de ${bookmark.totalUnits}`:'';
    parts.push(`${prefix?prefix+' ':''}${bookmark.currentUnit}${total}${bookmark.resourceType==='pdf'&&progress!=null?` (${progress}%)`:''}`);
  }
  if(bookmark.positionText)parts.push(bookmark.positionText);
  return parts.join(' · ');
}
