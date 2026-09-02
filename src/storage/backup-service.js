export function serializeBackup(state,{space=2}={}){
  if(!state||typeof state!=='object')throw new TypeError('Estado inválido para backup.');
  return JSON.stringify(state,null,space);
}

export function parseBackupText(raw,{maxBytes=10*1024*1024}={}){
  if(typeof raw!=='string')return {valid:false,message:'O backup precisa ser um arquivo de texto.'};
  if(new TextEncoder().encode(raw).length>maxBytes)return {valid:false,message:'O arquivo excede o limite permitido para importação.'};
  try{return {valid:true,data:JSON.parse(raw)}}catch(error){return {valid:false,message:'Arquivo inválido — não parece um backup deste extrato.'}}
}

export function backupFileName(date,{recovery=false}={}){
  return `${recovery?'recuperacao':'backup'}-extrato-estudos-${date}.json`;
}
