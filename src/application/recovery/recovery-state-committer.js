import {pickPersistentState} from '../../state/state-boundaries.js';

const revision=state=>{const value=pickPersistentState(state);delete value.updatedAt;delete value.lastBackupAt;return JSON.stringify(value)};

// A single serialized state contains plan, decision and snapshot. Publication follows durable success.
export function createRecoveryStateCommitter({getState,publish,persist,runExclusive=task=>task(),clock,onCommitted=()=>{}}={}){
  return ({before,after})=>runExclusive(async()=>{
    const baseline=revision(before),rejected=(reasonCode,reason)=>({status:'rejected',reasonCode,reason});
    if(revision(getState())!==baseline)return rejected('state_changed','Os dados mudaram. Atualize a proposta antes de confirmar.');
    const next=structuredClone(after);next.lastBackupAt=getState().lastBackupAt;next.updatedAt=clock.nowISO();
    let saved=false;try{saved=await persist(JSON.stringify(pickPersistentState(next)))}catch(error){/* Publish nothing on storage failure. */}
    if(!saved)return rejected('storage_failure','Não foi possível salvar a operação. O planejamento em memória foi preservado.');
    if(revision(getState())!==baseline){
      let restored=false;try{restored=await persist(JSON.stringify(pickPersistentState(getState())))}catch(error){/* Report failed restoration explicitly. */}
      return rejected(restored?'state_changed':'storage_restore_failure',restored?'Os dados mudaram durante a gravação. A operação foi cancelada.':'Os dados mudaram e a gravação não pôde ser restaurada. Exporte um backup dos dados atuais.');
    }
    publish(next);onCommitted(next);return {status:'committed'};
  });
}
