// A classification of existing accuracy and trend, never a second priority score.
export function buildStabilityMap(comparison){
  const groups={attention:[],maintain:[],intervene:[],evolving:[],insufficient:[]};
  for(const row of comparison?.rows||[]){
    let state='insufficient';
    if(row.state!=='insufficient'&&row.evolution!=null){
      const onTarget=row.accuracy>=row.target;
      state=onTarget?(row.evolution<=-3?'attention':'maintain'):(row.evolution>=3?'evolving':'intervene');
    }
    groups[state].push({...row,stabilityState:state});
  }
  return {groups,measured:Object.values(groups).reduce((sum,rows)=>sum+rows.length,0)-groups.insufficient.length,total:comparison?.rows?.length||0};
}
