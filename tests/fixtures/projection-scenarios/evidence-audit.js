const dates=['2026-08-20','2026-08-27','2026-09-03','2026-09-10','2026-09-17','2026-09-24'];
export const evidenceSimulations=(scores=[70,72,71,72,73,74])=>scores.map((correct,index)=>({id:'audit-'+index,date:dates[index],correct,total:100,examTags:['bb'],breakdown:[{subjectId:'math',total:100}]}));
export const evidenceAuditScenarios={
 empty:{simulations:[],available:false},
 questionsOnly:{simulations:[],available:false,questions:Array.from({length:1000},(_,id)=>({id,correct:true}))},
 sparse:{simulations:evidenceSimulations().slice(0,2),available:false},
 shortSpan:{simulations:evidenceSimulations().slice(0,3).map((row,index)=>({...row,date:'2026-09-'+(20+index)})),available:false},
 insufficientVolume:{simulations:evidenceSimulations().slice(0,3).map(row=>({...row,total:30,correct:20,breakdown:[{subjectId:'math',total:30}]})),available:false},
 detailed:{simulations:evidenceSimulations(),available:true,confidence:'moderate'},
 unknownComposition:{simulations:evidenceSimulations().map(row=>({...row,breakdown:[]})),available:true,confidence:'low'},
 changedComposition:{simulations:evidenceSimulations().map((row,index)=>index===5?{...row,breakdown:[{subjectId:'portuguese',total:100}]}:row),available:false},
 outlier:{simulations:evidenceSimulations([70,72,71,72,71,98]),available:true,confidence:'moderate',central:72}
};
