export const projectionComposition=item=>JSON.stringify([...(item.examTags||[])].sort())+'|'+JSON.stringify((item.breakdown||[]).filter(row=>row.subjectId&&Number(row.total)>0).map(row=>[row.subjectId,Number(row.total)]).sort((a,b)=>String(a[0]).localeCompare(String(b[0]))));
const scope=tags=>JSON.stringify([...(tags||[])].sort());
export function captureProjection({snapshots,model,simulations,date,issuedAt,id,activeExamTags=[]}){
 if(!model?.available)return false;
 const training=simulations.filter(item=>item.date<=date&&Number(item.total)>0&&Number(item.correct)>=0&&Number(item.correct)<=Number(item.total)&&model.observations.some(row=>row.date===item.date)).sort((a,b)=>a.date.localeCompare(b.date)||String(a.id).localeCompare(String(b.id)));
 if(!training.length)return false;
 const composition=projectionComposition(training.at(-1));
 const inputs=[...new Map(training.filter(item=>projectionComposition(item)===composition).map(item=>[item.date,item])).values()].map(item=>({id:item.id,date:item.date,correct:Number(item.correct),total:Number(item.total)}));
 const signature=JSON.stringify([scope(activeExamTags),composition,model.algorithmVersion,model.target,inputs]);
 if(snapshots.some(item=>item.signature===signature))return false;
 snapshots.push(structuredClone({id,date,issuedAt,activeExamTags,signature,composition,algorithmVersion:model.algorithmVersion,low:model.low,high:model.high,central:model.central,target:model.target,inputs,knownSimulationIds:simulations.map(item=>item.id)}));
 return true;
}
export function buildProjectionCalibration({snapshots=[],simulations=[],activeExamTags=[],today}){
 const seen=new Set();
 const rows=simulations.filter(item=>item.date<=today&&Number(item.total)>0&&Number(item.correct)>=0&&Number(item.correct)<=Number(item.total)&&!seen.has(item.id)&&seen.add(item.id)).map(item=>{
  const prior=snapshots.filter(snapshot=>snapshot.kind!=='achievement'&&scope(snapshot.activeExamTags)===scope(activeExamTags)&&snapshot.algorithmVersion===1&&snapshot.date<item.date&&snapshot.composition===projectionComposition(item)&&!(snapshot.knownSimulationIds||[]).includes(item.id)&&!snapshot.inputs.some(input=>input.id===item.id)).sort((a,b)=>Date.parse(b.issuedAt)-Date.parse(a.issuedAt))[0];
  if(!prior)return null;
  const observed=Math.round(Number(item.correct)/Number(item.total)*1000)/10;
  return {id:item.id,date:item.date,issuedAt:prior.issuedAt,issuedDate:prior.date,low:prior.low,high:prior.high,central:prior.central,observed,inside:observed>=prior.low&&observed<=prior.high,error:Math.round(Math.abs(observed-prior.central)*10)/10};
 }).filter(Boolean).sort((a,b)=>b.date.localeCompare(a.date));
 return {rows,inside:rows.filter(row=>row.inside).length,total:rows.length};
}
