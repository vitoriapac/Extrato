import { buildStrategicReport } from './report-data.js';
import { renderStrategicReport } from './report-template.js';
import { printStrategicReport } from './print-report.js';

(globalThis as any).StudyTrackReports = {
  buildStrategicReport,
  renderStrategicReport,
  printStrategicReport,
};

export { buildStrategicReport, renderStrategicReport, printStrategicReport };
