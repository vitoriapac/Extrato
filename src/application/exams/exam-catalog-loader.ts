import { CATALOG_VERSION } from '../../domain/exams/exam-constants.js';
import { EXAM_PRESET_OPTIONS } from '../../domain/exams/exam-preset-options.js';

export interface ExamCatalogLoaderOptions {
  document: Document;
  window: Window & { StudyTrackExamCatalog?: any };
  buildVersion: string;
}

export function createExamCatalogLoader(options: ExamCatalogLoaderOptions) {
  const { document, window, buildVersion } = options;

  const examPresets = EXAM_PRESET_OPTIONS.map(option => ({
    ...option,
    version: CATALOG_VERSION,
    examTags: [] as any[],
    sources: [] as any[],
    description: '',
    subjects: [] as any[],
  }));

  let examCatalogLoadPromise: Promise<any[]> | null = null;
  let examCatalogLoaded = false;

  async function ensureExamCatalog(): Promise<any> {
    if (examCatalogLoaded) return examPresets;
    if (!examCatalogLoadPromise) {
      examCatalogLoadPromise = new Promise<any[]>((resolve, reject) => {
        const accept = () => {
          const catalog = window.StudyTrackExamCatalog;
          if (!Array.isArray(catalog?.EXAM_PRESETS)) {
            reject(new Error('O catálogo de editais não carregou corretamente.'));
            return;
          }
          examPresets.splice(0, examPresets.length, ...catalog.EXAM_PRESETS);
          examCatalogLoaded = true;
          resolve(examPresets);
        };
        if (window.StudyTrackExamCatalog) {
          accept();
          return;
        }
        const script = document.createElement('script');
        script.src = new URL(
          `src/exam-catalog.bundle.js?v=${buildVersion}`,
          document.baseURI
        ).href;
        script.async = true;
        script.onload = accept;
        script.onerror = () =>
          reject(
            new Error(
              'Não foi possível carregar o catálogo. Conecte-se à internet e tente novamente.'
            )
          );
        document.head.appendChild(script);
      }).catch(error => {
        examCatalogLoadPromise = null;
        throw error;
      });
    }
    return examCatalogLoadPromise;
  }

  return {
    EXAM_PRESETS: examPresets,
    ensureExamCatalog,
  };
}
