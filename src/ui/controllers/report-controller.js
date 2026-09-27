import {buildStrategicReport} from '../../reports/report-data.js';
import {renderStrategicReport} from '../../reports/report-template.js';
import {printStrategicReport} from '../../reports/print-report.js';

export function createReportController({document,window,getState,nowISO,isDemo,getCandidates,getDiagnosis,getReadiness,getForecast,buildReport=buildStrategicReport,renderReport=renderStrategicReport,printReport=printStrategicReport}){
  const byId=id=>document.getElementById(id);
  const period=()=>({preset:byId('reportPeriodSelect')?.value||'30',start:byId('reportPeriodStart')?.value||null,end:byId('reportPeriodEnd')?.value||null});
  const syncCustomPeriod=()=>{
    const custom=period().preset==='custom';
    const start=byId('reportPeriodStart'),end=byId('reportPeriodEnd');
    if(start)start.hidden=!custom;
    if(end)end.hidden=!custom;
  };
  const exportReport=()=>{
    const candidates=getCandidates();
    const report=buildReport({state:getState(),generatedAt:nowISO(),isDemo,readiness:getReadiness(),diagnosis:getDiagnosis(candidates),forecast:getForecast(),period:period(),candidates});
    return printReport({document,window,report,render:renderReport});
  };
  byId('exportReportBtn')?.addEventListener('click',exportReport);
  byId('reportPeriodSelect')?.addEventListener('change',syncCustomPeriod);
  return {exportReport,syncCustomPeriod};
}
