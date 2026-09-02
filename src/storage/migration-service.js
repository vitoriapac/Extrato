export function runStateMigrations(data,{currentVersion,migrations}={}){
  if(!data||typeof data!=='object'||Array.isArray(data))throw new TypeError('Estado inválido para migração.');
  let version=Number(data.schemaVersion||1);
  if(!Number.isInteger(version)||version<1)throw new TypeError('Versão de estado inválida.');
  if(version>currentVersion)throw new RangeError(`Schema ${version} não suportado; máximo ${currentVersion}.`);
  while(version<currentVersion){
    const migrate=migrations[version];
    if(typeof migrate!=='function')throw new Error(`Migração ausente: v${version} para v${version+1}.`);
    data=migrate(data)||data;version+=1;data.schemaVersion=version;
  }
  data.schemaVersion=currentVersion;return data;
}

export function validateBackupEnvelope(data,{currentVersion,arrayFields=[]}={}){
  if(!data||typeof data!=='object'||Array.isArray(data))return {valid:false,message:'O arquivo não contém um objeto de backup válido.'};
  if(!Array.isArray(data.subjects))return {valid:false,message:'O backup não contém uma lista válida de disciplinas.'};
  const version=Number(data.schemaVersion||1);
  if(!Number.isInteger(version)||version<1)return {valid:false,message:'A versão do backup é inválida.'};
  if(version>currentVersion)return {valid:false,message:`Este backup usa a versão ${version}, mas este aplicativo aceita até a versão ${currentVersion}. Abra-o em uma versão mais recente do aplicativo.`};
  const invalidField=arrayFields.find(field=>field in data&&!Array.isArray(data[field]));
  if(invalidField)return {valid:false,message:`O campo "${invalidField}" está em um formato incompatível.`};
  if(data.subjects.some(subject=>!subject||typeof subject!=='object'||('topics' in subject&&!Array.isArray(subject.topics))))return {valid:false,message:'Uma ou mais disciplinas do backup estão em formato incompatível.'};
  if('metas' in data&&(!data.metas||typeof data.metas!=='object'||Array.isArray(data.metas)))return {valid:false,message:'As metas do backup estão em formato incompatível.'};
  return {valid:true,version};
}
