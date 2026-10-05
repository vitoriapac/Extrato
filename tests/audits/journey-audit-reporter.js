import {writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';

export default class JourneyAuditReporter{
 rows=[];
 onTestEnd(test,result){
  const report=result.attachments.find(item=>item.name==='journey-audit');
  this.rows.push(report?.body?JSON.parse(report.body.toString()):{profile:test.title,status:result.status,errors:result.errors.map(error=>error.message)});
 }
 onEnd(result){
  const phase=process.env.AUDIT_PHASE==='after'?'after':'before';
  const report={schemaVersion:1,phase,sourceCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),clock:'2026-10-05T12:00:00-03:00',status:result.status,
   measurement:'Clicks are observed UI activations; choices are visible controls, not inferred mental decisions. Repeated headings are candidates, not proven semantic duplication.',
   profiles:this.rows};
  writeFileSync(`tests/audits/product-journey-audit${phase==='after'?'-after':''}.json`,JSON.stringify(report,null,2)+'\n');
 }
}
