export function resolveSubjectAccuracyTarget(subjectId,{subjects=[]}={},globalTarget=80){
 const value=subjects.find(item=>item.subjectId===subjectId)?.accuracyTarget;
 const inherited=value==null||value==='';
 const target=Number(inherited?globalTarget:value);
 return Number.isFinite(target)?Math.max(0,Math.min(100,target)):80;
}
