declare const __STUDYTRACK_BUILD_VERSION__: string;

let reportsLoadPromise: Promise<{
  buildStrategicReport: any;
  renderStrategicReport: any;
  printStrategicReport: any;
}> | null = null;

function loadReportEngine(doc: Document): Promise<{
  buildStrategicReport: any;
  renderStrategicReport: any;
  printStrategicReport: any;
}> {
  if ((globalThis as any).StudyTrackReports) {
    return Promise.resolve((globalThis as any).StudyTrackReports);
  }
  if (!reportsLoadPromise) {
    reportsLoadPromise = new Promise((resolve, reject) => {
      const script = doc.createElement('script');
      const version =
        typeof __STUDYTRACK_BUILD_VERSION__ !== 'undefined' ? __STUDYTRACK_BUILD_VERSION__ : 'dev';
      script.src = new URL(`src/report.bundle.js?v=${version}`, doc.baseURI).href;
      script.async = true;
      script.onload = () => {
        if ((globalThis as any).StudyTrackReports) {
          resolve((globalThis as any).StudyTrackReports);
        } else {
          reject(new Error('Módulo de relatórios não inicializado corretamente.'));
        }
      };
      script.onerror = () => {
        reportsLoadPromise = null;
        reject(new Error('Não foi possível carregar o módulo de relatórios.'));
      };
      doc.head.appendChild(script);
    });
  }
  return reportsLoadPromise;
}

export function createReportController({
  document,
  window,
  getState,
  nowISO,
  isDemo,
  getCandidates,
  getDiagnosis,
  getReadiness,
  getForecast,
  buildReport,
  renderReport,
  printReport,
}: any = {}) {
  const byId = (id: string) => document.getElementById(id);
  const period = () => ({
    preset: (byId('reportPeriodSelect') as HTMLSelectElement)?.value || '30',
    start: (byId('reportPeriodStart') as HTMLInputElement)?.value || null,
    end: (byId('reportPeriodEnd') as HTMLInputElement)?.value || null,
  });
  const syncCustomPeriod = () => {
    const custom = period().preset === 'custom';
    const start = byId('reportPeriodStart'),
      end = byId('reportPeriodEnd');
    if (start) start.hidden = !custom;
    if (end) end.hidden = !custom;
  };
  const exportReport = () => {
    const candidates = getCandidates();
    const periodData = period();
    const stateData = getState();
    const generatedAt = nowISO();
    const readinessData = getReadiness();
    const diagnosisData = getDiagnosis(candidates);
    const forecastData = getForecast();

    if (buildReport && renderReport && printReport) {
      const report = buildReport({
        state: stateData,
        generatedAt,
        isDemo,
        readiness: readinessData,
        diagnosis: diagnosisData,
        forecast: forecastData,
        period: periodData,
        candidates,
      });
      return printReport({ document, window, report, render: renderReport });
    }

    return loadReportEngine(document).then(engine => {
      const activeBuild = buildReport || engine.buildStrategicReport;
      const activeRender = renderReport || engine.renderStrategicReport;
      const activePrint = printReport || engine.printStrategicReport;

      const report = activeBuild({
        state: stateData,
        generatedAt,
        isDemo,
        readiness: readinessData,
        diagnosis: diagnosisData,
        forecast: forecastData,
        period: periodData,
        candidates,
      });
      return activePrint({ document, window, report, render: activeRender });
    });
  };
  byId('exportReportBtn')?.addEventListener('click', exportReport);
  byId('reportPeriodSelect')?.addEventListener('change', syncCustomPeriod);
  return { exportReport, syncCustomPeriod };
}
