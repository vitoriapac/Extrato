// Recorded plans deliberately distinguish volume from allocation credit.
export const adherenceScenarios=[
  {name:'high volume, neglected priority',minutes:[0,180],expected:'mixed'},
  {name:'adequate credit, underexecuted priority',minutes:[36,60],expected:'priority_gap'},
  {name:'lower volume, fully executed priority',minutes:[60,0],expected:'time_gap'},
  {name:'balanced execution',minutes:[60,60],expected:'aligned'},
  {name:'partial execution of both allocations',minutes:[30,30],expected:'mixed'},
];
