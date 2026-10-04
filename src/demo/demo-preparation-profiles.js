import blueprint from './demo-scenario.json' with {type:'json'};

// Fixtures fictícias explícitas; nunca usadas para recalibrar o motor real.
export function buildDemoPreparationScenario(profile='standard'){
  const scenario=structuredClone(blueprint);
  if(profile==='standard')return scenario;
  const profiles={recovery:{days:45,scores:[60,64,68,72,65,66,70,74,77]},final_stretch:{days:10,scores:[68,70,72,74,73,68,64,61,60]},limited_evidence:{days:70,scores:null}};
  const selected=profiles[profile];
  if(!selected)throw new TypeError('Perfil de demonstração desconhecido.');
  scenario.profile.examInDays=selected.days;
  if(selected.scores){
    scenario.simulations=scenario.simulations.map((item,index)=>({...item,accuracyPct:selected.scores[index%selected.scores.length]}));
    scenario.simulationLatestComparison={};
  }else{
    // Conserva o volume da Demo, mas com apenas duas datas comparáveis recentes.
    scenario.simulations=scenario.simulations.map((item,index)=>({...item,dayOffset:index<scenario.simulations.length-2?-100-index:item.dayOffset}));
  }
  return scenario;
}

