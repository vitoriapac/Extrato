const dates=['2026-08-06','2026-08-13','2026-08-20','2026-08-27','2026-09-03','2026-09-10','2026-09-17','2026-09-24'];
const simulations=(scores,examTags=['bb'])=>scores.map((score,index)=>({id:`sim-${index}`,date:dates[index],correct:score,total:100,
  breakdown:[{subjectId:'math',total:100}],examTags}));
const studySessions=Array.from({length:120},(_,index)=>({id:`session-${index}`,
  date:new Date(Date.UTC(2026,9,1-index)).toISOString().slice(0,10),minutes:60,subjectId:'math'}));
const base={today:'2026-10-01',examDate:'2026-12-15',targetScore:80,coverage:83,adherence:88,
  consistency:{days:5,target:5},openHighImpactPriorities:0};

export const projectionScenarios={
  healthy:{...base,simulations:simulations([62,65,68,71,73,75,77,79]),expected:'on_track',studySessions},
  effortWithoutProgress:{...base,adherence:94,consistency:{days:6,target:6},simulations:simulations([62,63,61,64,63,63,62,63]),expected:'attention'},
  lowCoverage:{...base,coverage:31,simulations:simulations([84,85,86,87,88,89,89,90]),expected:'attention'},
  recentDecline:{...base,adherence:61,simulations:simulations([78,79,80,79,78,79,74,70]),expected:'attention'},
  longDeadline:{...base,examDate:'2026-12-30',simulations:simulations([70,71,72,73,74,74,74,74]),expected:'attention'},
  shortDeadline:{...base,examDate:'2026-10-11',simulations:simulations([70,71,72,73,74,74,74,74]),expected:'at_risk'},
  insufficient:{...base,simulations:simulations([74]),expected:'insufficient_data'}
};
