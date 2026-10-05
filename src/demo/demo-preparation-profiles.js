import blueprint from './demo-scenario.json' with {type:'json'};

export const DEMO_EXPERIENCE_PROFILES=Object.freeze({
  beginner:Object.freeze({label:'Iniciante',historyDays:7,executionRatio:0.5}),
  regular:Object.freeze({label:'Regular',historyDays:60,executionRatio:0.88}),
  irregular:Object.freeze({label:'Irregular',historyDays:90,executionRatio:0.45}),
  high_performance:Object.freeze({label:'Alto desempenho',historyDays:100,executionRatio:0.95}),
  final_stretch:Object.freeze({label:'Reta final',historyDays:140,executionRatio:null})
});

// Fixtures fictícias explícitas; nunca usadas para recalibrar o motor real.
export function buildDemoPreparationScenario(profile='standard'){
  const scenario=structuredClone(blueprint);
  if(profile==='standard')return scenario;
  const profiles={beginner:{days:90,scores:[]},regular:{days:70,scores:[60,62,64,66,68,70,71,72,74]},irregular:{days:60,scores:[77,78,79,80,80,81,80,82,82]},high_performance:{days:50,scores:[86,87,88,88,89,90,90,91,92]},recovery:{days:45,scores:[60,64,68,72,65,66,70,74,77]},final_stretch:{days:10,scores:[68,70,72,74,73,68,64,61,60]},limited_evidence:{days:70,scores:null}};
  const selected=profiles[profile];
  if(!selected)throw new TypeError('Perfil de demonstração desconhecido.');
  scenario.profile.examInDays=selected.days;
  if(profile==='beginner')scenario.simulations=[];
  else if(selected.scores){
    scenario.simulations=scenario.simulations.map((item,index)=>({...item,accuracyPct:selected.scores[index%selected.scores.length]}));
    scenario.simulationLatestComparison={};
  }else{
    // Conserva o volume da Demo, mas com apenas duas datas comparáveis recentes.
    scenario.simulations=scenario.simulations.map((item,index)=>({...item,dayOffset:index<scenario.simulations.length-2?-100-index:item.dayOffset}));
  }
  if(['regular','irregular','high_performance'].includes(profile)){
    scenario.simulations=Array.from({length:14},(_,index)=>({...blueprint.simulations[index%blueprint.simulations.length],dayOffset:-(13-index)*4-1,accuracyPct:selected.scores[Math.min(selected.scores.length-1,Math.floor(index*selected.scores.length/14))]}));
    scenario.targets.simulations=scenario.simulations.length;
  }
  return scenario;
}

